import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle, Clock, ChevronDown, ChevronUp, ExternalLink, Brain, History } from 'lucide-react'
import type { Payment } from '../../lib/types'
import { formatAmount, shortenAddress } from '../../lib/utils'

// Token symbol lookup by address (testnet mocks)
function tokenSymbol(addr: string): string {
  const a = addr.toLowerCase()
  if (a.endsWith('0001')) return 'USDT0'
  if (a.endsWith('0002')) return 'AxCNH'
  if (a.includes('af37')) return 'USDT0'
  if (a.includes('70bf')) return 'AxCNH'
  return addr.slice(0, 6) + '…'
}

function tokenFlag(addr: string): string {
  const sym = tokenSymbol(addr)
  return sym === 'USDT0' ? 'USD' : 'CNH'
}

function TokenBadge({ addr }: { addr: string }) {
  const sym = tokenSymbol(addr)
  const isUSD = sym === 'USDT0'
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isUSD ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
      {sym}
    </span>
  )
}

type Props = {
  payments: Payment[]
  loading?: boolean
}

function PaymentRow({ payment }: { payment: Payment }) {
  const [expanded, setExpanded] = useState(false)
  const isSameToken = payment.tokenIn.toLowerCase() === payment.tokenOut.toLowerCase()
  const statusDone = payment.status === 1 // PaymentStatus.Completed

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 space-y-3"
    >
      {/* Row summary */}
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div className="shrink-0">
          {statusDone
            ? <CheckCircle size={18} className="text-emerald-400" />
            : <Clock size={18} className="text-yellow-400" />}
        </div>

        {/* Currency flow */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TokenBadge addr={payment.tokenIn} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white tabular-nums">
              {formatAmount(payment.amountIn, 6)} {tokenSymbol(payment.tokenIn)}
            </p>
            <p className="text-xs text-slate-500">from {shortenAddress(payment.sender)}</p>
          </div>

          {!isSameToken && (
            <>
              <ArrowRight size={13} className="text-violet-400 shrink-0" />
              <TokenBadge addr={payment.tokenOut} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white tabular-nums">
                  {formatAmount(payment.amountOut, 6)} {tokenSymbol(payment.tokenOut)}
                </p>
                <p className="text-xs text-slate-500">to {shortenAddress(payment.recipient)}</p>
              </div>
            </>
          )}
          {isSameToken && (
            <div className="min-w-0">
              <p className="text-xs text-slate-500">to {shortenAddress(payment.recipient)}</p>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            statusDone
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
          }`}>
            {statusDone ? 'Completed' : 'Pending'}
          </span>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border pt-3 space-y-2"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">Payment ID</p>
                <p className="text-white font-mono">#{payment.id.toString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Fee</p>
                <p className="text-white">{formatAmount(payment.feeAmount, 6)} {tokenSymbol(payment.tokenIn)}</p>
              </div>
              <div>
                <p className="text-slate-500">Swapped</p>
                <p className={payment.swapped ? 'text-violet-400' : 'text-slate-400'}>
                  {payment.swapped ? 'Yes (Swappi DEX)' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Settled</p>
                <p className="text-white">
                  {payment.settledAt > 0n
                    ? new Date(Number(payment.settledAt) * 1000).toLocaleString()
                    : '—'}
                </p>
              </div>
            </div>

            {payment.aiReasoning && (
              <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain size={12} className="text-violet-400" />
                  <span className="text-xs font-medium text-violet-300">AI Routing Log</span>
                </div>
                <p className="text-xs text-slate-400 font-mono leading-relaxed">{payment.aiReasoning}</p>
              </div>
            )}

            <a
              href={`https://evmtestnet.confluxscan.org`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"
            >
              <ExternalLink size={11} />
              View on ConfluxScan
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function PaymentHistory({ payments, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-4 h-16 animate-pulse" />
        ))}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
          <History size={20} className="text-slate-600" />
        </div>
        <p className="text-slate-400 text-sm font-medium">No payments yet</p>
        <p className="text-slate-600 text-xs mt-1">Your payment history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {payments.map(p => (
        <PaymentRow key={p.id.toString()} payment={p} />
      ))}
    </div>
  )
}
