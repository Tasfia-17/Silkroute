import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import type { PaymentStep } from '../../lib/types'

type Props = {
  step: PaymentStep
  txHash?: string
  paymentId?: bigint
  error?: string
}

const steps = [
  { key: 'approving', label: 'Approving token' },
  { key: 'sending', label: 'Sending payment' },
  { key: 'confirming', label: 'Confirming on-chain' },
  { key: 'done', label: 'Payment complete' },
]

export function TransactionProgress({ step, txHash, paymentId, error }: Props) {
  if (step === 'idle') return null

  const currentIdx = steps.findIndex(s => s.key === step)
  const isError = step === 'error'
  const isDone = step === 'done'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="card p-4 mt-4"
      >
        {isError ? (
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-400 font-medium text-sm">Transaction failed</p>
              {error && <p className="text-slate-500 text-xs mt-1">{error}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((s, idx) => {
              const isActive = s.key === step
              const isPast = isDone || idx < currentIdx
              const isFuture = !isDone && idx > currentIdx

              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                    {isPast ? (
                      <CheckCircle size={18} className="text-emerald-400" />
                    ) : isActive ? (
                      <Loader2 size={18} className="text-violet-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-border" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    isPast ? 'text-emerald-400' :
                    isActive ? 'text-white' :
                    isFuture ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
              )
            })}

            {isDone && txHash && (
              <motion.a
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                href={`https://evmtestnet.confluxscan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 mt-2"
              >
                <ExternalLink size={12} />
                View on ConfluxScan
                {paymentId !== undefined && (
                  <span className="text-slate-500 ml-1">· Payment #{paymentId.toString()}</span>
                )}
              </motion.a>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
