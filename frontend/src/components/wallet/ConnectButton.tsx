import { usePrivy } from '@privy-io/react-auth'
import { motion } from 'framer-motion'
import { Wallet, LogOut, ChevronDown } from 'lucide-react'
import { shortenAddress } from '../../lib/utils'

export function ConnectButton() {
  const { ready, authenticated, login, logout, user } = usePrivy()

  const address = user?.wallet?.address

  if (!ready) {
    return (
      <div className="h-10 w-36 bg-surface border border-border rounded-xl animate-pulse" />
    )
  }

  if (!authenticated) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={login}
        className="btn-primary flex items-center gap-2 text-sm"
      >
        <Wallet size={16} />
        Connect Wallet
      </motion.button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
        <span className="text-sm text-slate-300 font-mono">
          {address ? shortenAddress(address) : 'Connected'}
        </span>
        <ChevronDown size={14} className="text-slate-500" />
      </div>
      <button
        onClick={logout}
        className="p-2 bg-surface border border-border rounded-xl text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
        title="Disconnect"
      >
        <LogOut size={16} />
      </button>
    </div>
  )
}
