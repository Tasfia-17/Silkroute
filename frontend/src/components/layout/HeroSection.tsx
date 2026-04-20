import { motion } from 'framer-motion'
import { Zap, Shield, Globe, TrendingDown } from 'lucide-react'

const stats = [
  { label: 'SWIFT cost', value: '~3.5%', sub: '+ 3 days', color: 'text-red-400', icon: '❌' },
  { label: 'SilkRoute fee', value: '0.3%', sub: '~3 seconds', color: 'text-emerald-400', icon: '✅' },
  { label: 'Savings', value: '91%', sub: 'cheaper', color: 'text-violet-400', icon: '💰' },
  { label: 'BRI countries', value: '150+', sub: 'supported', color: 'text-cyan-400', icon: '🌏' },
]

const features = [
  { icon: Zap, title: 'Instant Settlement', desc: '~3 second finality on Conflux eSpace' },
  { icon: Shield, title: 'AI-Verified Routes', desc: 'On-chain reasoning logged for every payment' },
  { icon: Globe, title: 'USDT0 ↔ AxCNH', desc: 'USD and offshore CNY in one protocol' },
  { icon: TrendingDown, title: '91% Cheaper', desc: 'vs SWIFT cross-border wire transfers' },
]

export function HeroSection() {
  return (
    <div className="text-center space-y-8 py-12">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm text-violet-300"
      >
        <span className="text-base">🏆</span>
        Built for Conflux Global Hackfest 2026
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
          Cross-Border Payments
          <br />
          <span className="gradient-text">for the Silk Road Era</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          AI-powered USDT0 ↔ AxCNH payments on Conflux.
          <br />
          <span className="text-white">3 seconds.</span> <span className="text-emerald-400">0.3% fee.</span> <span className="text-violet-400">Zero gas for users.</span>
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto"
      >
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="card p-4 text-center"
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
            <div className="text-xs text-slate-600 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
            className="card p-4 text-left"
          >
            <f.icon size={18} className="text-violet-400 mb-2" />
            <p className="text-sm font-semibold text-white">{f.title}</p>
            <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
