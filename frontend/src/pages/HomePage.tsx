import { Header } from '../components/layout/Header'
import { HeroSection } from '../components/layout/HeroSection'
import { PaymentForm } from '../components/payment/PaymentForm'
import { History } from 'lucide-react'

type Props = { onHistory: () => void }

export function HomePage({ onHistory }: Props) {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="relative max-w-6xl mx-auto px-6 py-8">
        <HeroSection />

        <div className="mt-8 flex justify-center">
          <PaymentForm />
        </div>

        <footer className="mt-20 text-center text-xs text-slate-600 space-y-3">
          <button
            onClick={onHistory}
            className="flex items-center gap-1.5 mx-auto text-slate-500 hover:text-violet-400 transition-colors duration-200"
          >
            <History size={12} />
            View payment history
          </button>
          <p>
            Built on <span className="text-violet-400">Conflux eSpace</span>
            {' · '}
            Powered by <span className="text-cyan-400">USDT0</span>
            {' + '}
            <span className="text-red-400">AxCNH</span>
            {' + '}
            <span className="text-violet-400">Pyth</span>
          </p>
          <p>SilkRoute — Global Hackfest 2026</p>
        </footer>
      </main>
    </div>
  )
}
