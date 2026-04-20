import { motion } from 'framer-motion'
import { Zap, Shield, Globe, TrendingDown } from 'lucide-react'

const stats = [
  { label: 'SWIFT cost', value: '~3.5%', sub: '+ 3 days', color: 'text-red-400' },
  { label: 'SilkRoute fee', value: '0.3%', sub: '~3 seconds', color: 'text-emerald-400' },
  { label: 'Savings', value: '91%', sub: 'cheaper', color: 'text-violet-400' },
  { label: 'BRI countries', value: '150+', sub: 'supported', color: 'text-cyan-400' },
]

const features = [
  { icon: Zap, title: 'Instant Settlement', desc: '3 second finality on Conflux eSpace' },
  { icon: Shield, title: 'AI-Verified Routes', desc: 'On-chain reasoning logged per payment' },
  { icon: Globe, title: 'USDT0 and AxCNH', desc: 'USD and offshore CNY in one protocol' },
  { icon: TrendingDown, title: '91% Cheaper', desc: 'vs SWIFT cross-border wire transfers' },
]

export function HeroSection() {
  return (
    <div className="text-center space-y-10 py-16">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm text-violet-300 backdrop-blur-sm"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
        Built for Conflux Global Hackfest 2026
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-[1.1] tracking-tight">
          Cross-Border Payments
          <br />
          <span className="gradient-text">for the Silk Road Era</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
          AI-powered USDT0 and AxCNH payments on Conflux.{' '}
          <span className="text-white font-medium">3 seconds.</span>{' '}
          <span className="text-emerald-400 font-medium">0.3% fee.</span>{' '}
          <span className="text-violet-400 font-medium">Zero gas.</span>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto"
      >
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.06 }}
            className="stat-card"
          >
            <div className={`text-2xl font-bold ${s.color} tabular-nums`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
            <div className="text-xs text-slate-600 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.06 }}
            className="card p-4 text-left hover:bg-white/[0.05] transition-all duration-300 group"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3 group-hover:bg-violet-500/20 transition-colors duration-300">
              <f.icon size={15} className="text-violet-400" />
            </div>
            <p className="text-sm font-semibold text-white">{f.title}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
