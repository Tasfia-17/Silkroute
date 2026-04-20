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
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-violet-500/[0.06] border border-violet-500/20 rounded-2xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Brain size={13} className="text-violet-400" />
          </div>
          <span className="text-sm font-semibold text-violet-300">AI Routing Decision</span>
          {loading && (
            <div className="ml-auto flex gap-1 items-center">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-1 h-1 rounded-full bg-violet-400 inline-block"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          )}
        </div>

        {decision && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              {decision.reasoning}
            </p>
            <div className="flex flex-wrap gap-2">
              {decision.swapNeeded && (
                <span className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-2.5 py-1 text-xs text-cyan-300">
                  <Zap size={10} />
                  Swappi DEX
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1 text-xs text-emerald-300">
                <TrendingDown size={10} />
                {decision.estimatedSavings} vs SWIFT
              </span>
              {decision.rate && (
                <span className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-slate-400">
                  {decision.rate}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
