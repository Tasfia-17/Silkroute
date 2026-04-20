// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {SilkRoutePayment} from "../src/SilkRoutePayment.sol";
import {MockUSDT0, MockAxCNH, MockPyth, MockSwappiRouter} from "../src/mocks/Mocks.sol";
import {Payment, PaymentStatus} from "../src/types/SilkRouteTypes.sol";

contract SilkRoutePaymentTest is Test {
    SilkRoutePayment public silkRoute;
    MockUSDT0 public usdt0;
    MockAxCNH public axcnh;
    MockPyth public pyth;
    MockSwappiRouter public router;

    address alice = makeAddr("alice");   // sender
    address bob   = makeAddr("bob");     // recipient
    address owner = makeAddr("owner");

    bytes32 constant CFX_USD_FEED  = 0x8879170230c9603342f3837cf9a8e76c61791198fb1271bb2552c9af7b33c933;
    bytes32 constant USDT_USD_FEED = 0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b;

    function setUp() public {
        vm.startPrank(owner);

        usdt0 = new MockUSDT0();
        axcnh = new MockAxCNH();
        pyth = new MockPyth();
        router = new MockSwappiRouter();

        // Seed router with liquidity
        usdt0.mint(address(router), 1_000_000 * 1e6);
        axcnh.mint(address(router), 7_250_000 * 1e6);

        silkRoute = new SilkRoutePayment(
            address(usdt0), address(axcnh), address(pyth),
            address(router), CFX_USD_FEED, USDT_USD_FEED, owner
        );

        vm.stopPrank();

        // Fund alice
        usdt0.mint(alice, 10_000 * 1e6);
        axcnh.mint(alice, 72_500 * 1e6);
    }

    function test_sendUsdt0_direct() public {
        uint256 amount = 100 * 1e6; // 100 USDT0
        string memory reasoning = "Direct USDT0 transfer, no swap needed. Recipient accepts USDT0.";

        vm.startPrank(alice);
        usdt0.approve(address(silkRoute), amount);
        uint256 paymentId = silkRoute.sendUsdt0(bob, amount, reasoning);
        vm.stopPrank();

        Payment memory p = silkRoute.getPayment(paymentId);
        assertEq(p.status == PaymentStatus.Completed, true);
        assertEq(p.sender, alice);
        assertEq(p.recipient, bob);
        assertEq(p.swapped, false);

        uint256 expectedFee = (amount * 30) / 10_000; // 0.3%
        uint256 expectedOut = amount - expectedFee;
        assertEq(usdt0.balanceOf(bob), expectedOut);
        assertEq(p.amountOut, expectedOut);
    }

    function test_sendUsdt0_receiveAxCnh_swap() public {
        uint256 amountIn = 100 * 1e6; // 100 USDT0
        string memory reasoning = "AI routing: recipient prefers AxCNH. Rate: 1 USDT0 = 7.25 AxCNH. Executing swap via Swappi.";

        vm.startPrank(alice);
        usdt0.approve(address(silkRoute), amountIn);
        uint256 paymentId = silkRoute.sendUsdt0ReceiveAxCnh(bob, amountIn, new bytes[](0), reasoning);
        vm.stopPrank();

        Payment memory p = silkRoute.getPayment(paymentId);
        assertEq(p.status == PaymentStatus.Completed, true);
        assertEq(p.swapped, true);
        assertEq(p.tokenIn, address(usdt0));
        assertEq(p.tokenOut, address(axcnh));
        assertGt(axcnh.balanceOf(bob), 0);
        assertEq(p.aiReasoning, reasoning);
    }

    function test_sendAxCnh_receiveUsdt0_swap() public {
        uint256 amountIn = 725 * 1e6; // 725 AxCNH ≈ 100 USDT0
        string memory reasoning = "AI routing: sender has AxCNH, recipient needs USDT0 for international settlement.";

        vm.startPrank(alice);
        axcnh.approve(address(silkRoute), amountIn);
        uint256 paymentId = silkRoute.sendAxCnhReceiveUsdt0(bob, amountIn, new bytes[](0), reasoning);
        vm.stopPrank();

        Payment memory p = silkRoute.getPayment(paymentId);
        assertEq(p.status == PaymentStatus.Completed, true);
        assertEq(p.swapped, true);
    }

    function test_quote_usdt0_to_axcnh() public view {
        (uint256 amountOut, uint256 fee) = silkRoute.quoteUsdt0ToAxCnh(100 * 1e6);
        assertGt(amountOut, 0);
        assertGt(fee, 0);
        console.log("100 USDT0 -> AxCNH:", amountOut / 1e6, "AxCNH, fee:", fee);
    }

    function test_payment_history() public {
        uint256 amount = 50 * 1e6;
        vm.startPrank(alice);
        usdt0.approve(address(silkRoute), amount * 3);
        silkRoute.sendUsdt0(bob, amount, "payment 1");
        silkRoute.sendUsdt0(bob, amount, "payment 2");
        silkRoute.sendUsdt0(bob, amount, "payment 3");
        vm.stopPrank();

        uint256[] memory sent = silkRoute.getPaymentsBySender(alice);
        uint256[] memory received = silkRoute.getPaymentsByRecipient(bob);
        assertEq(sent.length, 3);
        assertEq(received.length, 3);
    }

    function test_fee_update() public {
        vm.prank(owner);
        silkRoute.setFeeBps(50); // 0.5%
        assertEq(silkRoute.feeBps(), 50);
    }

    function test_fee_too_high_reverts() public {
        vm.prank(owner);
        vm.expectRevert(SilkRoutePayment.FeeTooHigh.selector);
        silkRoute.setFeeBps(300); // 3% > 2% max
    }

    function test_zero_amount_reverts() public {
        vm.prank(alice);
        vm.expectRevert(SilkRoutePayment.ZeroAmount.selector);
        silkRoute.sendUsdt0(bob, 0, "");
    }

    function test_zero_recipient_reverts() public {
        vm.prank(alice);
        usdt0.approve(address(silkRoute), 100 * 1e6);
        vm.expectRevert(SilkRoutePayment.ZeroAddress.selector);
        silkRoute.sendUsdt0(address(0), 100 * 1e6, "");
    }
}
