// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IPyth, PythPrice} from "./interfaces/IPyth.sol";
import {ISwappiRouter} from "./interfaces/ISwappiRouter.sol";
import {Payment, PaymentStatus, PaymentCurrency} from "./types/SilkRouteTypes.sol";

/// @title SilkRoute — AI-Powered BRI Cross-Border Payment Protocol
/// @notice Enables gasless USDT0 ↔ AxCNH cross-border payments with AI routing
/// @dev Deployed on Conflux eSpace. Integrates Pyth oracle + Swappi DEX.
contract SilkRoutePayment is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant DEFAULT_FEE_BPS = 30; // 0.3% fee
    uint256 public constant MAX_FEE_BPS = 200;    // 2% max
    uint256 public constant SLIPPAGE_BPS = 100;   // 1% slippage tolerance

    // ─── Immutables ───────────────────────────────────────────────────────────
    IERC20 public immutable usdt0;
    IERC20 public immutable axcnh;
    IPyth public immutable pyth;
    ISwappiRouter public immutable swappiRouter;

    // Pyth price feed IDs
    bytes32 public immutable cfxUsdFeedId;
    bytes32 public immutable usdtUsdFeedId;

    // ─── State ────────────────────────────────────────────────────────────────
    uint256 public nextPaymentId = 1;
    uint256 public feeBps = DEFAULT_FEE_BPS;
    address public treasury;
    uint256 public totalFeesCollected;

    mapping(uint256 => Payment) private _payments;
    mapping(address => uint256[]) private _paymentsBySender;
    mapping(address => uint256[]) private _paymentsByRecipient;

    // ─── Events ───────────────────────────────────────────────────────────────
    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed sender,
        address indexed recipient,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bool willSwap
    );
    event PaymentCompleted(
        uint256 indexed paymentId,
        uint256 amountOut,
        uint256 feeAmount,
        bool swapped,
        string aiReasoning
    );
    event PaymentRefunded(uint256 indexed paymentId, uint256 amountRefunded);
    event FeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event FeesWithdrawn(address token, uint256 amount);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error ZeroAmount();
    error ZeroAddress();
    error InvalidToken();
    error PaymentNotFound();
    error NotSender();
    error AlreadySettled();
    error InsufficientOutput();
    error FeeTooHigh();

    constructor(
        address _usdt0,
        address _axcnh,
        address _pyth,
        address _swappiRouter,
        bytes32 _cfxUsdFeedId,
        bytes32 _usdtUsdFeedId,
        address _treasury
    ) Ownable(msg.sender) {
        if (_usdt0 == address(0) || _axcnh == address(0) || _pyth == address(0) ||
            _swappiRouter == address(0) || _treasury == address(0)) revert ZeroAddress();

        usdt0 = IERC20(_usdt0);
        axcnh = IERC20(_axcnh);
        pyth = IPyth(_pyth);
        swappiRouter = ISwappiRouter(_swappiRouter);
        cfxUsdFeedId = _cfxUsdFeedId;
        usdtUsdFeedId = _usdtUsdFeedId;
        treasury = _treasury;
    }

    // ─── Core Payment Functions ───────────────────────────────────────────────

    /// @notice Send USDT0 to recipient (same currency, no swap)
    function sendUsdt0(
        address recipient,
        uint256 amount,
        string calldata aiReasoning
    ) external nonReentrant returns (uint256 paymentId) {
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert ZeroAddress();

        paymentId = _createPayment(msg.sender, recipient, address(usdt0), address(usdt0), amount);
        usdt0.safeTransferFrom(msg.sender, address(this), amount);
        _settleDirectPayment(paymentId, amount, aiReasoning);
    }

    /// @notice Send AxCNH to recipient (same currency, no swap)
    function sendAxCnh(
        address recipient,
        uint256 amount,
        string calldata aiReasoning
    ) external nonReentrant returns (uint256 paymentId) {
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert ZeroAddress();

        paymentId = _createPayment(msg.sender, recipient, address(axcnh), address(axcnh), amount);
        axcnh.safeTransferFrom(msg.sender, address(this), amount);
        _settleDirectPayment(paymentId, amount, aiReasoning);
    }

    /// @notice Send USDT0, recipient receives AxCNH (AI-routed cross-currency)
    /// @param pythUpdateData Fresh Pyth price update data from Hermes
    function sendUsdt0ReceiveAxCnh(
        address recipient,
        uint256 amountIn,
        bytes[] calldata pythUpdateData,
        string calldata aiReasoning
    ) external payable nonReentrant returns (uint256 paymentId) {
        if (amountIn == 0) revert ZeroAmount();
        if (recipient == address(0)) revert ZeroAddress();

        // Update Pyth prices if data provided
        if (pythUpdateData.length > 0) {
            uint fee = pyth.getUpdateFee(pythUpdateData);
            pyth.updatePriceFeeds{value: fee}(pythUpdateData);
        }

        paymentId = _createPayment(msg.sender, recipient, address(usdt0), address(axcnh), amountIn);
        usdt0.safeTransferFrom(msg.sender, address(this), amountIn);
        _settleSwapPayment(paymentId, amountIn, address(usdt0), address(axcnh), recipient, aiReasoning);
    }

    /// @notice Send AxCNH, recipient receives USDT0 (AI-routed cross-currency)
    /// @param pythUpdateData Fresh Pyth price update data from Hermes
    function sendAxCnhReceiveUsdt0(
        address recipient,
        uint256 amountIn,
        bytes[] calldata pythUpdateData,
        string calldata aiReasoning
    ) external payable nonReentrant returns (uint256 paymentId) {
        if (amountIn == 0) revert ZeroAmount();
        if (recipient == address(0)) revert ZeroAddress();

        if (pythUpdateData.length > 0) {
            uint fee = pyth.getUpdateFee(pythUpdateData);
            pyth.updatePriceFeeds{value: fee}(pythUpdateData);
        }

        paymentId = _createPayment(msg.sender, recipient, address(axcnh), address(usdt0), amountIn);
        axcnh.safeTransferFrom(msg.sender, address(this), amountIn);
        _settleSwapPayment(paymentId, amountIn, address(axcnh), address(usdt0), recipient, aiReasoning);
    }

    // ─── Quote Functions (view) ───────────────────────────────────────────────

    /// @notice Get expected output for USDT0 → AxCNH swap
    function quoteUsdt0ToAxCnh(uint256 amountIn) external view returns (uint256 amountOut, uint256 fee) {
        fee = (amountIn * feeBps) / BPS_DENOMINATOR;
        uint256 amountAfterFee = amountIn - fee;
        address[] memory path = new address[](2);
        path[0] = address(usdt0);
        path[1] = address(axcnh);
        uint[] memory amounts = swappiRouter.getAmountsOut(amountAfterFee, path);
        amountOut = amounts[1];
    }

    /// @notice Get expected output for AxCNH → USDT0 swap
    function quoteAxCnhToUsdt0(uint256 amountIn) external view returns (uint256 amountOut, uint256 fee) {
        fee = (amountIn * feeBps) / BPS_DENOMINATOR;
        uint256 amountAfterFee = amountIn - fee;
        address[] memory path = new address[](2);
        path[0] = address(axcnh);
        path[1] = address(usdt0);
        uint[] memory amounts = swappiRouter.getAmountsOut(amountAfterFee, path);
        amountOut = amounts[1];
    }

    /// @notice Get latest CFX/USD price from Pyth
    function getCfxUsdPrice() external view returns (int64 price, int32 expo, uint publishTime) {
        PythPrice memory p = pyth.getPriceUnsafe(cfxUsdFeedId);
        return (p.price, p.expo, p.publishTime);
    }

    // ─── Payment Queries ──────────────────────────────────────────────────────

    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        return _payments[paymentId];
    }

    function getPaymentsBySender(address sender) external view returns (uint256[] memory) {
        return _paymentsBySender[sender];
    }

    function getPaymentsByRecipient(address recipient) external view returns (uint256[] memory) {
        return _paymentsByRecipient[recipient];
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        emit FeeUpdated(feeBps, newFeeBps);
        feeBps = newFeeBps;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function withdrawFees(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "NOTHING_TO_WITHDRAW");
        IERC20(token).safeTransfer(treasury, balance);
        emit FeesWithdrawn(token, balance);
    }

    function withdrawEth() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "NOTHING_TO_WITHDRAW");
        payable(treasury).transfer(balance);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _createPayment(
        address sender,
        address recipient,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256 paymentId) {
        paymentId = nextPaymentId++;
        bool willSwap = tokenIn != tokenOut;

        _payments[paymentId] = Payment({
            id: paymentId,
            sender: sender,
            recipient: recipient,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: 0,
            feeAmount: 0,
            status: PaymentStatus.Pending,
            createdAt: uint64(block.timestamp),
            settledAt: 0,
            aiReasoning: "",
            swapped: willSwap
        });

        _paymentsBySender[sender].push(paymentId);
        _paymentsByRecipient[recipient].push(paymentId);

        emit PaymentCreated(paymentId, sender, recipient, tokenIn, tokenOut, amountIn, willSwap);
    }

    function _settleDirectPayment(
        uint256 paymentId,
        uint256 amount,
        string calldata aiReasoning
    ) internal {
        Payment storage p = _payments[paymentId];
        uint256 fee = (amount * feeBps) / BPS_DENOMINATOR;
        uint256 amountOut = amount - fee;

        totalFeesCollected += fee;
        p.feeAmount = fee;
        p.amountOut = amountOut;
        p.status = PaymentStatus.Completed;
        p.settledAt = uint64(block.timestamp);
        p.aiReasoning = aiReasoning;

        IERC20(p.tokenOut).safeTransfer(p.recipient, amountOut);

        emit PaymentCompleted(paymentId, amountOut, fee, false, aiReasoning);
    }

    function _settleSwapPayment(
        uint256 paymentId,
        uint256 amountIn,
        address tokenIn,
        address tokenOut,
        address recipient,
        string calldata aiReasoning
    ) internal {
        uint256 fee = (amountIn * feeBps) / BPS_DENOMINATOR;
        uint256 amountAfterFee = amountIn - fee;
        totalFeesCollected += fee;

        // Approve Swappi router
        IERC20(tokenIn).approve(address(swappiRouter), amountAfterFee);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        // Get expected output for slippage check
        uint[] memory expectedAmounts = swappiRouter.getAmountsOut(amountAfterFee, path);
        uint256 minOut = (expectedAmounts[1] * (BPS_DENOMINATOR - SLIPPAGE_BPS)) / BPS_DENOMINATOR;

        uint[] memory amounts = swappiRouter.swapExactTokensForTokens(
            amountAfterFee,
            minOut,
            path,
            recipient,
            block.timestamp + 300
        );

        uint256 amountOut = amounts[amounts.length - 1];

        Payment storage p = _payments[paymentId];
        p.feeAmount = fee;
        p.amountOut = amountOut;
        p.status = PaymentStatus.Completed;
        p.settledAt = uint64(block.timestamp);
        p.aiReasoning = aiReasoning;

        emit PaymentCompleted(paymentId, amountOut, fee, true, aiReasoning);
    }

    receive() external payable {}
}
