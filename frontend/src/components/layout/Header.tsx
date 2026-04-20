import { ConnectButton } from '../wallet/ConnectButton'
import { useCfxPrice } from '../../hooks/useCfxPrice'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'

export function Header() {
  const { price, loading } = useCfxPrice()

  return (
    <header className="border-b border-border bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">丝</span>
          </div>
          <div>
            <span className="font-bold text-white text-lg">SilkRoute</span>
            <span className="text-slate-500 text-xs ml-2 hidden sm:inline">BRI Payments</span>
          </div>
        </div>

        {/* Center — network + price */}
        <div className="hidden md:flex items-center gap-3">
          <div className="network-badge">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
            Conflux eSpace
          </div>
          {!loading && price && (
            <motion.div
              key={price}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-xs text-slate-400"
            >
              <Activity size={12} className="text-violet-400" />
              CFX <span className="text-white font-mono">${price.toFixed(4)}</span>
            </motion.div>
          )}
        </div>

        <ConnectButton />
      </div>
    </header>
  )
}
