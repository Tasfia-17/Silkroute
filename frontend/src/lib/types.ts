export type Token = {
  symbol: string
  name: string
  address: `0x${string}`
  decimals: number
  flag: string
  currency: string
  color: string
}

export type PaymentDirection = 'usdt0-to-axcnh' | 'axcnh-to-usdt0' | 'usdt0-direct' | 'axcnh-direct'

export type PaymentStep = 'idle' | 'approving' | 'sending' | 'confirming' | 'done' | 'error'

export type AIRoutingDecision = {
  direction: PaymentDirection
  reasoning: string
  estimatedSavings: string
  swapNeeded: boolean
  rate?: string
}

export type Payment = {
  id: bigint
  sender: `0x${string}`
  recipient: `0x${string}`
  tokenIn: `0x${string}`
  tokenOut: `0x${string}`
  amountIn: bigint
  amountOut: bigint
  feeAmount: bigint
  status: number
  createdAt: bigint
  settledAt: bigint
  aiReasoning: string
  swapped: boolean
}
