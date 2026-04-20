import { Header } from '../components/layout/Header'
import { HeroSection } from '../components/layout/HeroSection'
import { PaymentForm } from '../components/payment/PaymentForm'
import { History } from 'lucide-react'

type Props = { onHistory: () => void }

export function HomePage({ onHistory }: Props) {
  return (
    <div className="min-h-screen bg-bg">
      <Header />

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      <main className="relative max-w-6xl mx-auto px-4 py-8">
        <HeroSection />

        <div className="mt-8 flex justify-center">
          <PaymentForm />
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-xs text-slate-600 space-y-2">
          <button
            onClick={onHistory}
            className="flex items-center gap-1.5 mx-auto text-slate-500 hover:text-violet-400 transition-colors"
          >
            <History size={13} />
            View payment history
          </button>
          <p>Built on <span className="text-violet-400">Conflux eSpace</span> · Powered by <span className="text-cyan-400">USDT0</span> + <span className="text-red-400">AxCNH</span> + <span className="text-violet-400">Pyth</span></p>
          <p>SilkRoute — Global Hackfest 2026 Submission</p>
        </footer>
      </main>
    </div>
  )
}
