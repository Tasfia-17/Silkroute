import { useState, useEffect, useCallback } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { createWalletClient, createPublicClient, custom, http, parseUnits, formatUnits } from 'viem'
import { confluxESpaceTestnet } from 'wagmi/chains'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownUp, Send, ChevronDown, Info } from 'lucide-react'
import { CONTRACTS, SILKROUTE_ABI, ERC20_ABI } from '../../lib/contracts'
import { computeAIRouting, fetchPythPriceUpdateData, parseAmount, formatAmount } from '../../lib/utils'
import { useCfxPrice } from '../../hooks/useCfxPrice'
import type { Token, PaymentStep, AIRoutingDecision } from '../../lib/types'
import { AIRoutingPanel } from './AIRoutingPanel'
import { TransactionProgress } from './TransactionProgress'

const TOKENS: Token[] = [
  {
    symbol: 'USDT0',
    name: 'USD Tether Omnichain',
    address: CONTRACTS.testnet.USDT0,
    decimals: 6,
    flag: '🇺🇸',
    currency: 'USD',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    symbol: 'AxCNH',
    name: 'Offshore Chinese Yuan',
    address: CONTRACTS.testnet.AXCNH,
    decimals: 6,
    flag: '🇨🇳',
    currency: 'CNH',
    color: 'from-red-500 to-orange-500',
  },
]

export function PaymentForm() {
  const { authenticated, login } = usePrivy()
  const { wallets } = useWallets()

  const [tokenIn, setTokenIn] = useState<Token>(TOKENS[0])
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[1])
  const [amountIn, setAmountIn] = useState('')
  const [recipient, setRecipient] = useState('')
  const [step, setStep] = useState<PaymentStep>('idle')
  const [txHash, setTxHash] = useState<string>()
  const [paymentId, setPaymentId] = useState<bigint>()
  const [error, setError] = useState<string>()
  const [aiDecision, setAiDecision] = useState<AIRoutingDecision | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [quote, setQuote] = useState<{ amountOut: string; fee: string } | null>(null)
  const [showTokenSelector, setShowTokenSelector] = useState<'in' | 'out' | null>(null)

  const { price: cfxPrice } = useCfxPrice()

  // Compute AI routing whenever inputs change
  useEffect(() => {
    if (!amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) {
      setAiDecision(null)
      setQuote(null)
      return
    }

    setAiLoading(true)
    const timer = setTimeout(() => {
      const amount = Number(amountIn)
      const swapNeeded = tokenIn.symbol !== tokenOut.symbol
      const reasoning = computeAIRouting(amount, tokenIn.symbol, tokenOut.symbol, cfxPrice)
      const rate = tokenIn.symbol === 'USDT0' ? '1 USDT0 = 7.25 AxCNH' : '1 AxCNH = 0.138 USDT0'
      const swiftCost = amount * 0.035
      const silkCost = amount * 0.003
      const savings = `${((1 - silkCost / swiftCost) * 100).toFixed(0)}% cheaper`

      setAiDecision({
        direction: swapNeeded
          ? tokenIn.symbol === 'USDT0' ? 'usdt0-to-axcnh' : 'axcnh-to-usdt0'
          : tokenIn.symbol === 'USDT0' ? 'usdt0-direct' : 'axcnh-direct',
        reasoning,
        estimatedSavings: savings,
        swapNeeded,
        rate: swapNeeded ? rate : undefined,
      })

      // Mock quote
      const fee = amount * 0.003
      const amountAfterFee = amount - fee
      const out = swapNeeded
        ? tokenIn.symbol === 'USDT0' ? amountAfterFee * 7.25 : amountAfterFee / 7.25
        : amountAfterFee
      setQuote({
        amountOut: out.toFixed(2),
        fee: fee.toFixed(4),
      })

      setAiLoading(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [amountIn, tokenIn, tokenOut, cfxPrice])

  const swapTokens = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn('')
    setAiDecision(null)
    setQuote(null)
  }

  const handleSend = useCallback(async () => {
    if (!authenticated || !wallets[0]) { login(); return }
    if (!amountIn || !recipient) return

    setStep('approving')
    setError(undefined)
    setTxHash(undefined)
    setPaymentId(undefined)

    try {
      const wallet = wallets[0]
      const provider = await wallet.getEthereumProvider()
      const walletClient = createWalletClient({
        chain: confluxESpaceTestnet,
        transport: custom(provider),
      })
      const publicClient = createPublicClient({
        chain: confluxESpaceTestnet,
        transport: http('https://evmtestnet.confluxrpc.com'),
      })

      const [account] = await walletClient.getAddresses()
      const amount = parseAmount(amountIn, tokenIn.decimals)
      const silkRouteAddr = CONTRACTS.testnet.SILKROUTE

      // Step 1: Approve
      const approveTx = await walletClient.writeContract({
        address: tokenIn.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [silkRouteAddr, amount],
        account,
      })
      await publicClient.waitForTransactionReceipt({ hash: approveTx })

      setStep('sending')

      // Step 2: Fetch Pyth update data
      const pythData = await fetchPythPriceUpdateData()
      const reasoning = aiDecision?.reasoning ?? 'SilkRoute AI: optimal path selected.'
      const swapNeeded = tokenIn.symbol !== tokenOut.symbol

      // Step 3: Send payment
      let sendTx: `0x${string}`
      if (!swapNeeded && tokenIn.symbol === 'USDT0') {
        sendTx = await walletClient.writeContract({
          address: silkRouteAddr,
          abi: SILKROUTE_ABI,
          functionName: 'sendUsdt0',
          args: [recipient as `0x${string}`, amount, reasoning],
          account,
        })
      } else if (!swapNeeded && tokenIn.symbol === 'AxCNH') {
        sendTx = await walletClient.writeContract({
          address: silkRouteAddr,
          abi: SILKROUTE_ABI,
          functionName: 'sendAxCnh',
          args: [recipient as `0x${string}`, amount, reasoning],
          account,
        })
      } else if (tokenIn.symbol === 'USDT0') {
        sendTx = await walletClient.writeContract({
          address: silkRouteAddr,
          abi: SILKROUTE_ABI,
          functionName: 'sendUsdt0ReceiveAxCnh',
          args: [recipient as `0x${string}`, amount, pythData, reasoning],
          account,
          value: 0n,
        })
      } else {
        sendTx = await walletClient.writeContract({
          address: silkRouteAddr,
          abi: SILKROUTE_ABI,
          functionName: 'sendAxCnhReceiveUsdt0',
          args: [recipient as `0x${string}`, amount, pythData, reasoning],
          account,
          value: 0n,
        })
      }

      setTxHash(sendTx)
      setStep('confirming')

      const receipt = await publicClient.waitForTransactionReceipt({ hash: sendTx })

      // Extract paymentId from PaymentCreated event
      const log = receipt.logs[0]
      if (log?.topics[1]) {
        setPaymentId(BigInt(log.topics[1]))
      }

      setStep('done')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed'
      setError(msg.slice(0, 120))
      setStep('error')
    }
  }, [authenticated, wallets, amountIn, recipient, tokenIn, tokenOut, aiDecision, login])

  const isReady = authenticated && amountIn && Number(amountIn) > 0 && recipient.startsWith('0x')
  const buttonLabel = !authenticated
    ? 'Connect Wallet'
    : step === 'approving' ? 'Approving...'
    : step === 'sending' ? 'Sending...'
    : step === 'confirming' ? 'Confirming...'
    : step === 'done' ? 'Send Another'
    : 'Send Payment'

  const handleButtonClick = () => {
    if (step === 'done') {
      setStep('idle')
      setAmountIn('')
      setRecipient('')
      setAiDecision(null)
      setQuote(null)
    } else {
      handleSend()
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Send Payment</h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Info size={12} />
            0.3% fee
          </div>
        </div>

        {/* Token In */}
        <div className="bg-bg border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">You send</span>
            <span className="text-xs text-slate-500">Balance: —</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0.00"
              value={amountIn}
              onChange={e => setAmountIn(e.target.value)}
              className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder-slate-700 min-w-0"
            />
            <button
              onClick={() => setShowTokenSelector(showTokenSelector === 'in' ? null : 'in')}
              className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 hover:border-violet-500/50 transition-colors shrink-0"
            >
              <span className="text-lg">{tokenIn.flag}</span>
              <span className="font-semibold text-sm text-white">{tokenIn.symbol}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>
          {amountIn && (
            <p className="text-xs text-slate-500">
              ≈ ${tokenIn.symbol === 'USDT0' ? Number(amountIn).toFixed(2) : (Number(amountIn) / 7.25).toFixed(2)} USD
            </p>
          )}
        </div>

        {/* Token selector dropdown */}
        <AnimatePresence>
          {showTokenSelector === 'in' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="card p-2 -mt-2"
            >
              {TOKENS.map(t => (
                <button
                  key={t.symbol}
                  onClick={() => { setTokenIn(t); setShowTokenSelector(null) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors text-left"
                >
                  <span className="text-xl">{t.flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.symbol}</p>
                    <p className="text-xs text-slate-500">{t.name}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap direction button */}
        <div className="flex justify-center -my-1">
          <button
            onClick={swapTokens}
            className="w-9 h-9 bg-surface border border-border rounded-xl flex items-center justify-center hover:border-violet-500/50 hover:text-violet-400 transition-all text-slate-400"
          >
            <ArrowDownUp size={16} />
          </button>
        </div>

        {/* Token Out */}
        <div className="bg-bg border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Recipient receives</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-2xl font-semibold text-slate-400 min-w-0">
              {quote ? (
                <motion.span
                  key={quote.amountOut}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white"
                >
                  {quote.amountOut}
                </motion.span>
              ) : '—'}
            </div>
            <button
              onClick={() => setShowTokenSelector(showTokenSelector === 'out' ? null : 'out')}
              className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 hover:border-violet-500/50 transition-colors shrink-0"
            >
              <span className="text-lg">{tokenOut.flag}</span>
              <span className="font-semibold text-sm text-white">{tokenOut.symbol}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showTokenSelector === 'out' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="card p-2 -mt-2"
            >
              {TOKENS.map(t => (
                <button
                  key={t.symbol}
                  onClick={() => { setTokenOut(t); setShowTokenSelector(null) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors text-left"
                >
                  <span className="text-xl">{t.flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.symbol}</p>
                    <p className="text-xs text-slate-500">{t.name}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recipient */}
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Recipient address</label>
          <input
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            className="input-field font-mono text-sm"
          />
        </div>

        {/* AI Routing Panel */}
        <AIRoutingPanel decision={aiDecision} loading={aiLoading} />

        {/* Quote details */}
        {quote && !aiLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-1.5 text-xs"
          >
            <div className="flex justify-between text-slate-500">
              <span>Protocol fee (0.3%)</span>
              <span className="text-slate-300">{quote.fee} {tokenIn.symbol}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Settlement time</span>
              <span className="text-emerald-400">~3 seconds</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>SWIFT equivalent</span>
              <span className="text-red-400 line-through">3 days, ~3.5% fee</span>
            </div>
          </motion.div>
        )}

        {/* Send button */}
        <motion.button
          whileHover={{ scale: isReady ? 1.01 : 1 }}
          whileTap={{ scale: isReady ? 0.99 : 1 }}
          onClick={handleButtonClick}
          disabled={!!isReady === false && step === 'idle' || ['approving', 'sending', 'confirming'].includes(step)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {buttonLabel}
        </motion.button>
      </div>

      {/* Transaction progress */}
      <TransactionProgress step={step} txHash={txHash} paymentId={paymentId} error={error} />
    </div>
  )
}
