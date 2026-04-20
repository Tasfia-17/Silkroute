// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Mock USDT0 for testnet — 6 decimals like real USDT
contract MockUSDT0 is ERC20 {
    constructor() ERC20("USD Tether Omnichain", "USDT0") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

/// @dev Mock AxCNH for testnet — 6 decimals
contract MockAxCNH is ERC20 {
    constructor() ERC20("Offshore Chinese Yuan", "AxCNH") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

/// @dev Mock Pyth oracle returning fixed prices for testnet
contract MockPyth {
    mapping(bytes32 => int64) public prices;
    mapping(bytes32 => int32) public expos;

    constructor() {
        // CFX/USD = $0.15 (price=15000000, expo=-8)
        prices[0x8879170230c9603342f3837cf9a8e76c61791198fb1271bb2552c9af7b33c933] = 15000000;
        expos[0x8879170230c9603342f3837cf9a8e76c61791198fb1271bb2552c9af7b33c933] = -8;
        // USDT/USD = $1.00
        prices[0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b] = 100000000;
        expos[0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b] = -8;
    }

    struct PythPrice { int64 price; uint64 conf; int32 expo; uint publishTime; }

    function getPrice(bytes32 id) external view returns (PythPrice memory) {
        return PythPrice(prices[id], 0, expos[id], block.timestamp);
    }

    function getPriceUnsafe(bytes32 id) external view returns (PythPrice memory) {
        return PythPrice(prices[id], 0, expos[id], block.timestamp);
    }

    function updatePriceFeeds(bytes[] calldata) external payable {}
    function getUpdateFee(bytes[] calldata) external pure returns (uint) { return 0; }

    function setPrice(bytes32 id, int64 price, int32 expo) external {
        prices[id] = price;
        expos[id] = expo;
    }
}

/// @dev Minimal Uniswap V2-style mock router for testnet
contract MockSwappiRouter {
    // Fixed exchange rate: 1 USDT0 = 7.25 AxCNH (approximate CNH/USD rate)
    uint256 public constant USDT0_TO_AXCNH_RATE = 725; // * 100 for precision
    uint256 public constant AXCNH_TO_USDT0_RATE = 100; // 1/7.25 * 725

    function getAmountsOut(uint amountIn, address[] calldata path)
        external pure returns (uint[] memory amounts)
    {
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        // Simple mock: apply fixed rate
        amounts[path.length - 1] = (amountIn * 725) / 100;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        deadline;
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        uint256 amountOut = (amountIn * 725) / 100;
        require(amountOut >= amountOutMin, "INSUFFICIENT_OUTPUT");

        // Transfer tokenIn from caller, transfer tokenOut to recipient
        // (In real tests, tokens must be pre-minted to this contract)
        ERC20Like(path[0]).transferFrom(msg.sender, address(this), amountIn);
        ERC20Like(path[path.length - 1]).transfer(to, amountOut);
        amounts[path.length - 1] = amountOut;
    }
}

interface ERC20Like {
    function transferFrom(address, address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
}
