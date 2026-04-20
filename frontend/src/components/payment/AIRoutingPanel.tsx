import { motion } from 'framer-motion'
import { Brain, Zap, TrendingDown } from 'lucide-react'
import type { AIRoutingDecision } from '../../lib/types'

type Props = {
  decision: AIRoutingDecision | null
  loading: boolean
}

export function AIRoutingPanel({ decision, loading }: Props) {
  if (!decision && !loading) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="card p-4 mt-3 border-violet-500/20 bg-violet-500/5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Brain size={14} className="text-violet-400" />
        </div>
        <span className="text-sm font-semibold text-violet-300">AI Routing Decision</span>
        {loading && (
          <div className="ml-auto flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-violet-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}
      </div>

      {decision && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            {decision.reasoning}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {decision.swapNeeded && (
              <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-2.5 py-1">
                <Zap size={11} className="text-cyan-400" />
                <span className="text-xs text-cyan-300">Swappi DEX</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1">
              <TrendingDown size={11} className="text-emerald-400" />
              <span className="text-xs text-emerald-300">{decision.estimatedSavings} vs SWIFT</span>
            </div>
            {decision.rate && (
              <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1">
                <span className="text-xs text-slate-400">Rate: {decision.rate}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
