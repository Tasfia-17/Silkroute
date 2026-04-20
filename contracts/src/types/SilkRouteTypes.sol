// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SilkRoute Payment Types
enum PaymentStatus { Pending, Completed, Refunded, Cancelled }
enum PaymentCurrency { USDT0, AxCNH }

struct Payment {
    uint256 id;
    address sender;
    address recipient;
    address tokenIn;
    address tokenOut;
    uint256 amountIn;
    uint256 amountOut;
    uint256 feeAmount;
    PaymentStatus status;
    uint64 createdAt;
    uint64 settledAt;
    string aiReasoning;   // AI routing decision logged on-chain
    bool swapped;         // true if cross-currency swap was performed
}
