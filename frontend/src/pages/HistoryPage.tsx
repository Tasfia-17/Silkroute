import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Header } from '../components/layout/Header'
import { PaymentHistory } from '../components/payment/PaymentHistory'
import { motion } from 'framer-motion'
import { History, ArrowLeft } from 'lucide-react'
import type { Payment } from '../lib/types'

// Demo payments for UI preview when not connected
const DEMO_PAYMENTS: Payment[] = [
  {
    id: 1n,
    sender: '0xAbCd1234567890AbCd1234567890AbCd12345678',
    recipient: '0xDeFg9876543210DeFg9876543210DeFg98765432',
    tokenIn: '0x0000000000000000000000000000000000000001',
    tokenOut: '0x0000000000000000000000000000000000000002',
    amountIn: 100_000_000n,
    amountOut: 724_782_500n,
    feeAmount: 300_000n,
    status: 1,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 3600),
    settledAt: BigInt(Math.floor(Date.now() / 1000) - 3597),
    aiReasoning: 'Cross-currency swap via Swappi DEX. Rate: 1 USDT0 = 7.25 AxCNH (Pyth oracle verified). Expected output: 724.78 AxCNH. Total fee: 0.3% ($0.30). SWIFT equivalent cost: $3.50. Savings: 91%.',
    swapped: true,
  },
  {
    id: 2n,
    sender: '0xAbCd1234567890AbCd1234567890AbCd12345678',
    recipient: '0x1111222233334444555566667777888899990000',
    tokenIn: '0x0000000000000000000000000000000000000001',
    tokenOut: '0x0000000000000000000000000000000000000001',
    amountIn: 500_000_000n,
    amountOut: 498_500_000n,
    feeAmount: 1_500_000n,
    status: 1,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 7200),
    settledAt: BigInt(Math.floor(Date.now() / 1000) - 7197),
    aiReasoning: 'Direct USDT0 transfer, no swap needed. Recipient accepts USDT0. Fee: 0.3% ($1.50). Savings vs SWIFT: $16.00 (91% cheaper). Settlement: ~3 seconds on Conflux eSpace.',
    swapped: false,
  },
]

type Props = { onBack: () => void }

export function HistoryPage({ onBack }: Props) {
  const { authenticated } = usePrivy()
  const [payments] = useState<Payment[]>(DEMO_PAYMENTS)

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <main className="relative max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Page header */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-surface border border-border rounded-xl text-slate-400 hover:text-white hover:border-violet-500/50 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <History size={20} className="text-violet-400" />
              <h1 className="text-xl font-bold text-white">Payment History</h1>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Sent', value: '$600.00', color: 'text-white' },
              { label: 'Total Fees', value: '$1.80', color: 'text-emerald-400' },
              { label: 'SWIFT Savings', value: '$19.20', color: 'text-violet-400' },
            ].map(s => (
              <div key={s.label} className="card p-3 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {!authenticated && (
            <div className="card p-3 border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-400 text-center">
              Connect wallet to see your real payment history. Showing demo data.
            </div>
          )}

          <PaymentHistory payments={payments} />
        </motion.div>
      </main>
    </div>
  )
}
