import { ConnectButton } from '../wallet/ConnectButton'
import { useCfxPrice } from '../../hooks/useCfxPrice'
import { motion } from 'framer-motion'
import { Activity, Zap } from 'lucide-react'

export function Header() {
  const { price, loading } = useCfxPrice()

  return (
    <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <Zap size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-white text-lg tracking-tight">SilkRoute</span>
            <span className="text-slate-500 text-xs hidden sm:inline">BRI Payments</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="network-badge">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Conflux eSpace
          </div>
          {!loading && price && (
            <motion.div
              key={price}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/[0.04] border border-white/[0.07] px-3 py-1.5 rounded-full"
            >
              <Activity size={11} className="text-violet-400" />
              CFX <span className="text-white font-mono font-medium">${price.toFixed(4)}</span>
            </motion.div>
          )}
        </div>

        <ConnectButton />
      </div>
    </header>
  )
}
