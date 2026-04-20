import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig, confluxESpaceTestnet } from '../lib/wagmi'

const queryClient = new QueryClient()

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'clpispdty00ycl80fpueukbhl'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        defaultChain: confluxESpaceTestnet,
        supportedChains: [confluxESpaceTestnet],
        embeddedWallets: {
          createOnLogin: 'all-users',
        },
        appearance: {
          theme: 'dark',
          accentColor: '#7c3aed',
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  )
}
