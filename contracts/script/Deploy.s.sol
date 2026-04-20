// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SilkRoutePayment} from "../src/SilkRoutePayment.sol";
import {MockUSDT0, MockAxCNH, MockPyth, MockSwappiRouter} from "../src/mocks/Mocks.sol";

contract DeployTestnet is Script {
    // Pyth feed IDs
    bytes32 constant CFX_USD_FEED = 0x8879170230c9603342f3837cf9a8e76c61791198fb1271bb2552c9af7b33c933;
    bytes32 constant USDT_USD_FEED = 0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // Deploy mocks for testnet
        MockUSDT0 usdt0 = new MockUSDT0();
        MockAxCNH axcnh = new MockAxCNH();
        MockPyth pyth = new MockPyth();
        MockSwappiRouter router = new MockSwappiRouter();

        // Mint initial liquidity to router for swaps
        usdt0.mint(address(router), 1_000_000 * 1e6);
        axcnh.mint(address(router), 7_250_000 * 1e6);

        // Mint test tokens to deployer
        usdt0.mint(deployer, 10_000 * 1e6);
        axcnh.mint(deployer, 72_500 * 1e6);

        // Deploy SilkRoute
        SilkRoutePayment silkRoute = new SilkRoutePayment(
            address(usdt0),
            address(axcnh),
            address(pyth),
            address(router),
            CFX_USD_FEED,
            USDT_USD_FEED,
            deployer // treasury = deployer for testnet
        );

        vm.stopBroadcast();

        console.log("=== SilkRoute Testnet Deployment ===");
        console.log("MockUSDT0:         ", address(usdt0));
        console.log("MockAxCNH:         ", address(axcnh));
        console.log("MockPyth:          ", address(pyth));
        console.log("MockSwappiRouter:  ", address(router));
        console.log("SilkRoutePayment:  ", address(silkRoute));
        console.log("Deployer:          ", deployer);
    }
}

contract DeployMainnet is Script {
    // Mainnet addresses
    address constant USDT0    = 0xaf37E8B6C9ED7f6318979f56Fc287d76c30847ff;
    address constant AXCNH    = 0x70BFD7F7eADF9b9827541272589A6B2Bb760aE2E;
    address constant PYTH     = 0xe9d69CdD6Fe41e7B621B4A688C5D1a68cB5c8ADc;
    address constant SWAPPI   = 0x62b0873055Bf896DD869e172119871ac24aEA305;

    bytes32 constant CFX_USD_FEED  = 0x8879170230c9603342f3837cf9a8e76c61791198fb1271bb2552c9af7b33c933;
    bytes32 constant USDT_USD_FEED = 0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);

        vm.startBroadcast(deployerKey);

        SilkRoutePayment silkRoute = new SilkRoutePayment(
            USDT0, AXCNH, PYTH, SWAPPI,
            CFX_USD_FEED, USDT_USD_FEED,
            treasury
        );

        vm.stopBroadcast();

        console.log("=== SilkRoute Mainnet Deployment ===");
        console.log("SilkRoutePayment: ", address(silkRoute));
        console.log("Treasury:         ", treasury);
    }
}
