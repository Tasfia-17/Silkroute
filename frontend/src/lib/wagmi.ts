import { createConfig, http } from 'wagmi'
import { confluxESpace, confluxESpaceTestnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [confluxESpaceTestnet, confluxESpace],
  connectors: [injected()],
  transports: {
    [confluxESpaceTestnet.id]: http('https://evmtestnet.confluxrpc.com'),
    [confluxESpace.id]: http('https://evm.confluxrpc.com'),
  },
})

export { confluxESpace, confluxESpaceTestnet }
