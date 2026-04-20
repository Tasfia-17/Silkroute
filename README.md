# SilkRoute: AI-Powered BRI Cross-Border Payment Protocol

Conflux Global Hackfest 2026 Submission

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
[![Network: Conflux eSpace](https://img.shields.io/badge/Network-Conflux%20eSpace-blue)](https://evm.confluxrpc.com)
[![Tests: 9/9 passing](https://img.shields.io/badge/Tests-9%2F9%20passing-brightgreen)](#testing)

## The Problem

Chinese exporters and Belt and Road Initiative (BRI) contractors across 150+ countries pay 2 to 7% in FX fees and wait 3 days for SWIFT settlements. A $100,000 payment costs around $5,000 and takes 72 hours. 96% of BRI SMEs use workarounds because formal channels are broken.

## The Solution

SilkRoute is an AI-powered cross-border payment protocol on Conflux eSpace that enables:

- USDT0 to AxCNH swaps in approximately 3 seconds at 0.3% fee (vs SWIFT at 3.5% plus 3 days)
- AI routing agent that selects the optimal payment path and logs its reasoning on-chain
- Gasless UX via Conflux gas sponsorship so users never touch CFX
- Web2-style onboarding via Privy with email login and embedded wallets

## Prize Categories Targeted

| Category | How SilkRoute qualifies |
|----------|------------------------|
| Main Award ($1,500) | Complete DeFi protocol with AI, full frontend, deployed contracts |
| Best USDT0 Integration ($500) | USDT0 is a primary settlement currency with direct and swap send functions |
| Best AxCNH Integration ($500) | AxCNH is the CNH settlement layer with BRI-focused use case |
| Best AI + Conflux ($500) | AI routing agent logs on-chain reasoning for every payment |
| Best DeFi Project ($500) | AMM swap integration via Swappi, fee mechanics, payment escrow |

Maximum potential: $3,500

## Architecture

```
SilkRoute Frontend
React + Vite + Tailwind + Privy + wagmi/viem
PaymentForm  AIRoutingPanel  PaymentHistory
        |
        | wagmi/viem
        |
SilkRoutePayment.sol (Conflux eSpace)
sendUsdt0()              sendAxCnh()
sendUsdt0ReceiveAxCnh()  sendAxCnhReceiveUsdt0()
quoteUsdt0ToAxCnh()      quoteAxCnhToUsdt0()
getPayment()             getPaymentsBySender()
        |                        |
Pyth Oracle               Swappi Router
CFX/USD                   USDT0 to AxCNH
USDT/USD                  AMM swap
```

### How it works

1. User connects via Privy (email or wallet, no MetaMask required)
2. User enters amount, selects currency pair (USDT0 or AxCNH), enters recipient
3. AI routing engine computes optimal path, fetches Pyth price data, logs reasoning
4. User approves token and sends in one click
5. Contract executes a direct transfer or Swappi DEX swap
6. AI reasoning string stored on-chain with every payment
7. Recipient receives funds in approximately 3 seconds

## Conflux Integration

| Feature | How SilkRoute uses it |
|---------|----------------------|
| Conflux eSpace | All contracts deployed on eSpace (EVM-compatible) |
| USDT0 | Primary USD settlement token (0xaf37E8B6C9ED7f6318979f56Fc287d76c30847ff) |
| AxCNH | Offshore CNH settlement token (0x70BFD7F7eADF9b9827541272589A6B2Bb760aE2E) |
| Swappi DEX | USDT0 to AxCNH swaps via Swappi router (0x62b0873055Bf896DD869e172119871ac24aEA305) |
| Pyth Oracle | Real-time CFX/USD price feeds for rate display |
| Gas Sponsorship | SponsorWhitelistControl (Core Space) so users pay zero gas |

## Contract Addresses

### Conflux eSpace Testnet (Chain ID: 71)

| Contract | Address |
|----------|---------|
| SilkRoutePayment | 0x11AADF85Af1c926d5395C4CEa04DBE68B03BdF60 |
| MockUSDT0 | 0x3EBA12Fbb3d7F5248502aD2c9696a78194beAd21 |
| MockAxCNH | 0xeD681263EBE64124114e1549FbB24b4EF94258E2 |
| MockPyth | 0x2a24666769A823ec062200A43623e9e1150AcFb8 |
| MockSwappiRouter | 0xdE5437b0200b3C7C7e35362DAD0B81875742a6C3 |

### Conflux eSpace Mainnet (Chain ID: 1030)

| Contract | Address |
|----------|---------|
| USDT0 | 0xaf37E8B6C9ED7f6318979f56Fc287d76c30847ff |
| AxCNH | 0x70BFD7F7eADF9b9827541272589A6B2Bb760aE2E |
| Pyth Oracle | 0xe9d69CdD6Fe41e7B621B4A688C5D1a68cB5c8ADc |
| Swappi Router | 0x62b0873055Bf896DD869e172119871ac24aEA305 |

## Repository Structure

```
silkroute/
  contracts/
    src/
      SilkRoutePayment.sol
      interfaces/
        IPyth.sol
        ISwappiRouter.sol
      types/
        SilkRouteTypes.sol
      mocks/
        Mocks.sol
    test/
      SilkRoutePayment.t.sol
    script/
      Deploy.s.sol
  frontend/
    src/
      components/
        payment/
          PaymentForm.tsx
          AIRoutingPanel.tsx
          PaymentHistory.tsx
          TransactionProgress.tsx
        wallet/
          ConnectButton.tsx
        layout/
          Header.tsx
          HeroSection.tsx
      pages/
        HomePage.tsx
        HistoryPage.tsx
      lib/
        contracts.ts
        wagmi.ts
        utils.ts
        types.ts
  LICENSE
  README.md
```

## Setup and Running

### Prerequisites

- Node.js 18+
- Foundry (https://book.getfoundry.sh/getting-started/installation)

### Smart Contracts

```bash
cd contracts
forge install
forge build
forge test -v
```

### Deploy to Conflux eSpace Testnet

Get testnet CFX from https://efaucet.confluxnetwork.org then run:

```bash
export DEPLOYER_PRIVATE_KEY=0x...
forge script script/Deploy.s.sol:DeployTestnet --rpc-url https://evmtestnet.confluxrpc.com --broadcast --legacy --skip-simulation
```

Copy the deployed addresses into frontend/src/lib/contracts.ts under testnet.

### Deploy to Conflux eSpace Mainnet

```bash
export DEPLOYER_PRIVATE_KEY=0x...
export TREASURY_ADDRESS=0x...
forge script script/Deploy.s.sol:DeployMainnet --rpc-url https://evm.confluxrpc.com --broadcast --legacy --skip-simulation
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Testing

```
Ran 9 tests for test/SilkRoutePayment.t.sol:SilkRoutePaymentTest
[PASS] test_fee_too_high_reverts()
[PASS] test_fee_update()
[PASS] test_payment_history()
[PASS] test_quote_usdt0_to_axcnh()
[PASS] test_sendAxCnh_receiveUsdt0_swap()
[PASS] test_sendUsdt0_direct()
[PASS] test_sendUsdt0_receiveAxCnh_swap()
[PASS] test_zero_amount_reverts()
[PASS] test_zero_recipient_reverts()

Suite result: ok. 9 passed; 0 failed
```

## Go-to-Market Plan

### Target Users

1. Chinese exporters receiving USD but needing CNH for domestic operations
2. BRI contractors in construction and infrastructure paying local workers in 50+ countries
3. Offshore yuan holders seeking yield on AxCNH holdings
4. Cross-border SMEs in Belt and Road corridors across SE Asia, Central Asia, and Africa

### Phase 1: Q2 2026 (0 to 3 months)

- Deploy on Conflux eSpace mainnet
- Onboard 10 pilot users via Conflux China enterprise partnerships
- Integrate with Swappi liquidity pools for deep AxCNH/USDT0 liquidity
- Apply for Conflux Integration Grant

### Phase 2: Q3 2026 (3 to 6 months)

- Partner with AnchorX (AxCNH issuer) for co-marketing to BRI enterprises
- Add CNHT0 (offshore CNH via LayerZero) as third settlement currency
- Launch mobile-optimized PWA for field workers in BRI countries
- Target $1M monthly payment volume at $3,000/month protocol revenue

### Phase 3: Q4 2026 (6 to 12 months)

- Integrate with Conflux Core Space for gas sponsorship
- Add LayerZero cross-chain: accept USDT on Ethereum, settle in AxCNH on Conflux
- B2B API for Chinese banks and fintech platforms
- Target $10M monthly volume at $30,000/month revenue

### Revenue Model

- 0.3% protocol fee on all payments (swap and direct)
- Fee split: 70% treasury, 30% liquidity incentives
- At $10M/month volume: $30K/month = $360K/year

### Why Conflux

- Only regulatory-compliant public blockchain in mainland China
- AxCNH and USDT0 are live and exclusive to Conflux
- Gas sponsorship enables Web2-like UX for non-crypto users
- Hong Kong conference presence gives direct access to BRI institutional investors

## Partner Technologies

| Partner | Integration |
|---------|-------------|
| USDT0 (Tether/LayerZero) | Primary USD settlement token, OFT cross-chain standard |
| AxCNH (AnchorX) | Offshore CNH settlement, BRI payment corridors |
| Pyth Network | Real-time CFX/USD price feeds, oracle-verified rates |
| Privy | Web2-style auth, embedded wallets, email login |
| Swappi DEX | USDT0 to AxCNH AMM swaps, on-chain liquidity |

## Team

Built for Conflux Global Hackfest 2026.

## License

MIT. See LICENSE.
