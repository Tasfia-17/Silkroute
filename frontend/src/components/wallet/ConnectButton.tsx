import { usePrivy } from '@privy-io/react-auth'
import { motion } from 'framer-motion'
import { Wallet, LogOut } from 'lucide-react'
import { shortenAddress } from '../../lib/utils'

export function ConnectButton() {
  const { ready, authenticated, login, logout, user } = usePrivy()
  const address = user?.wallet?.address

  if (!ready) {
    return <div className="h-9 w-32 bg-white/[0.04] border border-white/[0.07] rounded-xl animate-pulse" />
  }

  if (!authenticated) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={login}
        className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5"
      >
        <Wallet size={15} />
        Connect Wallet
      </motion.button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm text-slate-300 font-mono">
          {address ? shortenAddress(address) : 'Connected'}
        </span>
      </div>
      <button
        onClick={logout}
        className="p-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-200"
        title="Disconnect"
      >
        <LogOut size={15} />
      </button>
    </div>
  )
}
