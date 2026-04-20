// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct PythPrice {
    int64 price;
    uint64 conf;
    int32 expo;
    uint publishTime;
}

struct PythPriceFeed {
    bytes32 id;
    PythPrice price;
    PythPrice emaPrice;
}

interface IPyth {
    function getPrice(bytes32 id) external view returns (PythPrice memory price);
    function getPriceUnsafe(bytes32 id) external view returns (PythPrice memory price);
    function updatePriceFeeds(bytes[] calldata updateData) external payable;
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint feeAmount);
}
