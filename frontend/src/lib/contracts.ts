// Contract addresses — update after deployment
export const CONTRACTS = {
  // Testnet (Chain ID 71)
  testnet: {
    SILKROUTE: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    USDT0: '0x0000000000000000000000000000000000000001' as `0x${string}`,
    AXCNH: '0x0000000000000000000000000000000000000002' as `0x${string}`,
    PYTH: '0xDd24F84d36BF92C65F92307595335bdFab5Bbd21' as `0x${string}`,
  },
  // Mainnet (Chain ID 1030)
  mainnet: {
    SILKROUTE: '0x0000000000000000000000000000000000000000' as `0x${string}`, // set after deploy
    USDT0: '0xaf37E8B6C9ED7f6318979f56Fc287d76c30847ff' as `0x${string}`,
    AXCNH: '0x70BFD7F7eADF9b9827541272589A6B2Bb760aE2E' as `0x${string}`,
    PYTH: '0xe9d69CdD6Fe41e7B621B4A688C5D1a68cB5c8ADc' as `0x${string}`,
  },
} as const

export const PYTH_FEEDS = {
  CFX_USD: '0x8879170230c9603342f3837cf9a8e76c61791198fb1271bb2552c9af7b33c933' as `0x${string}`,
  USDT_USD: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b' as `0x${string}`,
}

export const HERMES_URL = 'https://hermes.pyth.network'

export const SILKROUTE_ABI = [
  {
    name: 'sendUsdt0',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'aiReasoning', type: 'string' },
    ],
    outputs: [{ name: 'paymentId', type: 'uint256' }],
  },
  {
    name: 'sendAxCnh',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'aiReasoning', type: 'string' },
    ],
    outputs: [{ name: 'paymentId', type: 'uint256' }],
  },
  {
    name: 'sendUsdt0ReceiveAxCnh',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'pythUpdateData', type: 'bytes[]' },
      { name: 'aiReasoning', type: 'string' },
    ],
    outputs: [{ name: 'paymentId', type: 'uint256' }],
  },
  {
    name: 'sendAxCnhReceiveUsdt0',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'pythUpdateData', type: 'bytes[]' },
      { name: 'aiReasoning', type: 'string' },
    ],
    outputs: [{ name: 'paymentId', type: 'uint256' }],
  },
  {
    name: 'quoteUsdt0ToAxCnh',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'amountIn', type: 'uint256' }],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
    ],
  },
  {
    name: 'quoteAxCnhToUsdt0',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'amountIn', type: 'uint256' }],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
    ],
  },
  {
    name: 'getPayment',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'paymentId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'sender', type: 'address' },
          { name: 'recipient', type: 'address' },
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOut', type: 'uint256' },
          { name: 'feeAmount', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint64' },
          { name: 'settledAt', type: 'uint64' },
          { name: 'aiReasoning', type: 'string' },
          { name: 'swapped', type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'getPaymentsBySender',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'sender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'feeBps',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'PaymentCreated',
    type: 'event',
    inputs: [
      { name: 'paymentId', type: 'uint256', indexed: true },
      { name: 'sender', type: 'address', indexed: true },
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'tokenIn', type: 'address', indexed: false },
      { name: 'tokenOut', type: 'address', indexed: false },
      { name: 'amountIn', type: 'uint256', indexed: false },
      { name: 'willSwap', type: 'bool', indexed: false },
    ],
  },
  {
    name: 'PaymentCompleted',
    type: 'event',
    inputs: [
      { name: 'paymentId', type: 'uint256', indexed: true },
      { name: 'amountOut', type: 'uint256', indexed: false },
      { name: 'feeAmount', type: 'uint256', indexed: false },
      { name: 'swapped', type: 'bool', indexed: false },
      { name: 'aiReasoning', type: 'string', indexed: false },
    ],
  },
] as const

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const
