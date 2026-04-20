import { useState, useEffect, useCallback } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { createWalletClient, createPublicClient, custom, http } from 'viem'
import { confluxESpaceTestnet } from 'wagmi/chains'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownUp, Send, ChevronDown, Info } from 'lucide-react'
import { CONTRACTS, SILKROUTE_ABI, ERC20_ABI } from '../../lib/contracts'
import { computeAIRouting, fetchPythPriceUpdateData, parseAmount } from '../../lib/utils'
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
    flag: 'US',
    currency: 'USD',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    symbol: 'AxCNH',
    name: 'Offshore Chinese Yuan',
    address: CONTRACTS.testnet.AXCNH,
    decimals: 6,
    flag: 'CN',
    currency: 'CNH',
    color: 'from-red-500 to-orange-500',
  },
]

function TokenIcon({ symbol }: { symbol: string }) {
  if (symbol === 'USDT0') {
    return (
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#26A17B"/>
        <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V8.818H8.595v2.609h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.126 0 1.053 3.309 1.924 7.709 2.126v7.608h3.913v-7.61c4.393-.202 7.694-1.073 7.694-2.124 0-1.051-3.301-1.922-7.694-2.125" fill="white"/>
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#DE2910"/>
      <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">¥</text>
    </svg>
  )
}

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
      setAiDecision({
        direction: swapNeeded
          ? tokenIn.symbol === 'USDT0' ? 'usdt0-to-axcnh' : 'axcnh-to-usdt0'
          : tokenIn.symbol === 'USDT0' ? 'usdt0-direct' : 'axcnh-direct',
        reasoning,
        estimatedSavings: `${((1 - silkCost / swiftCost) * 100).toFixed(0)}%`,
        swapNeeded,
        rate: swapNeeded ? rate : undefined,
      })
      const fee = amount * 0.003
      const out = swapNeeded
        ? tokenIn.symbol === 'USDT0' ? (amount - fee) * 7.25 : (amount - fee) / 7.25
        : amount - fee
      setQuote({ amountOut: out.toFixed(2), fee: fee.toFixed(4) })
      setAiLoading(false)
    }, 500)
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
      const walletClient = createWalletClient({ chain: confluxESpaceTestnet, transport: custom(provider) })
      const publicClient = createPublicClient({ chain: confluxESpaceTestnet, transport: http('https://evmtestnet.confluxrpc.com') })
      const [account] = await walletClient.getAddresses()
      const amount = parseAmount(amountIn, tokenIn.decimals)
      const silkRouteAddr = CONTRACTS.testnet.SILKROUTE

      const approveTx = await walletClient.writeContract({
        address: tokenIn.address, abi: ERC20_ABI, functionName: 'approve',
        args: [silkRouteAddr, amount], account,
      })
      await publicClient.waitForTransactionReceipt({ hash: approveTx })
      setStep('sending')

      const pythData = await fetchPythPriceUpdateData()
      const reasoning = aiDecision?.reasoning ?? 'SilkRoute AI: optimal path selected.'
      const swapNeeded = tokenIn.symbol !== tokenOut.symbol

      let sendTx: `0x${string}`
      if (!swapNeeded && tokenIn.symbol === 'USDT0') {
        sendTx = await walletClient.writeContract({ address: silkRouteAddr, abi: SILKROUTE_ABI, functionName: 'sendUsdt0', args: [recipient as `0x${string}`, amount, reasoning], account })
      } else if (!swapNeeded && tokenIn.symbol === 'AxCNH') {
        sendTx = await walletClient.writeContract({ address: silkRouteAddr, abi: SILKROUTE_ABI, functionName: 'sendAxCnh', args: [recipient as `0x${string}`, amount, reasoning], account })
      } else if (tokenIn.symbol === 'USDT0') {
        sendTx = await walletClient.writeContract({ address: silkRouteAddr, abi: SILKROUTE_ABI, functionName: 'sendUsdt0ReceiveAxCnh', args: [recipient as `0x${string}`, amount, pythData, reasoning], account, value: 0n })
      } else {
        sendTx = await walletClient.writeContract({ address: silkRouteAddr, abi: SILKROUTE_ABI, functionName: 'sendAxCnhReceiveUsdt0', args: [recipient as `0x${string}`, amount, pythData, reasoning], account, value: 0n })
      }

      setTxHash(sendTx)
      setStep('confirming')
      const receipt = await publicClient.waitForTransactionReceipt({ hash: sendTx })
      const log = receipt.logs[0]
      if (log?.topics[1]) setPaymentId(BigInt(log.topics[1]))
      setStep('done')
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Transaction failed').slice(0, 120))
      setStep('error')
    }
  }, [authenticated, wallets, amountIn, recipient, tokenIn, tokenOut, aiDecision, login])

  const isReady = authenticated && amountIn && Number(amountIn) > 0 && recipient.startsWith('0x')
  const isBusy = ['approving', 'sending', 'confirming'].includes(step)

  const buttonLabel = !authenticated ? 'Connect Wallet'
    : step === 'approving' ? 'Approving...'
    : step === 'sending' ? 'Sending...'
    : step === 'confirming' ? 'Confirming...'
    : step === 'done' ? 'Send Another'
    : 'Send Payment'

  const handleButtonClick = () => {
    if (step === 'done') {
      setStep('idle'); setAmountIn(''); setRecipient(''); setAiDecision(null); setQuote(null)
    } else {
      handleSend()
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-strong p-6 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-white text-base">Send Payment</h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-full">
            <Info size={11} />
            0.3% fee
          </div>
        </div>

        {/* Token In */}
        <div className="swap-input-box">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">You send</span>
            <span className="text-xs text-slate-600">Balance: —</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0.00"
              value={amountIn}
              onChange={e => setAmountIn(e.target.value)}
              className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder-slate-700 min-w-0 tabular-nums"
            />
            <button onClick={() => setShowTokenSelector(showTokenSelector === 'in' ? null : 'in')} className="token-btn">
              <TokenIcon symbol={tokenIn.symbol} />
              <span className="font-semibold text-sm text-white">{tokenIn.symbol}</span>
              <ChevronDown size={13} className="text-slate-500" />
            </button>
          </div>
          {amountIn && (
            <p className="text-xs text-slate-600">
              approx. ${tokenIn.symbol === 'USDT0' ? Number(amountIn).toFixed(2) : (Number(amountIn) / 7.25).toFixed(2)} USD
            </p>
          )}
        </div>

        <AnimatePresence>
          {showTokenSelector === 'in' && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="glass p-2 -mt-2">
              {TOKENS.map(t => (
                <button key={t.symbol} onClick={() => { setTokenIn(t); setShowTokenSelector(null) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-left">
                  <TokenIcon symbol={t.symbol} />
                  <div>
                    <p className="text-sm font-semibold text-white">{t.symbol}</p>
                    <p className="text-xs text-slate-500">{t.name}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap button */}
        <div className="flex justify-center -my-1">
          <motion.button
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            onClick={swapTokens}
            className="w-9 h-9 bg-white/[0.05] border border-white/[0.10] rounded-xl flex items-center justify-center hover:border-violet-500/40 hover:bg-violet-500/10 transition-all text-slate-400 hover:text-violet-400"
          >
            <ArrowDownUp size={15} />
          </motion.button>
        </div>

        {/* Token Out */}
        <div className="swap-input-box">
          <span className="text-xs text-slate-500">Recipient receives</span>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-2xl font-semibold min-w-0 tabular-nums">
              {quote ? (
                <motion.span key={quote.amountOut} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white">
                  {quote.amountOut}
                </motion.span>
              ) : <span className="text-slate-700">0.00</span>}
            </div>
            <button onClick={() => setShowTokenSelector(showTokenSelector === 'out' ? null : 'out')} className="token-btn">
              <TokenIcon symbol={tokenOut.symbol} />
              <span className="font-semibold text-sm text-white">{tokenOut.symbol}</span>
              <ChevronDown size={13} className="text-slate-500" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showTokenSelector === 'out' && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="glass p-2 -mt-2">
              {TOKENS.map(t => (
                <button key={t.symbol} onClick={() => { setTokenOut(t); setShowTokenSelector(null) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-left">
                  <TokenIcon symbol={t.symbol} />
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
          <input type="text" placeholder="0x..." value={recipient} onChange={e => setRecipient(e.target.value)} className="input-field font-mono text-sm" />
        </div>

        <AIRoutingPanel decision={aiDecision} loading={aiLoading} />

        {/* Quote details */}
        <AnimatePresence>
          {quote && !aiLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2 text-xs border-t border-white/[0.05] pt-3">
              <div className="flex justify-between text-slate-500">
                <span>Protocol fee (0.3%)</span>
                <span className="text-slate-300">{quote.fee} {tokenIn.symbol}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Settlement time</span>
                <span className="text-emerald-400">approx. 3 seconds</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>SWIFT equivalent</span>
                <span className="text-red-400 line-through">3 days, 3.5% fee</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: isReady ? 1.01 : 1 }}
          whileTap={{ scale: isReady ? 0.98 : 1 }}
          onClick={handleButtonClick}
          disabled={(!isReady && step === 'idle') || isBusy}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
        >
          <Send size={15} />
          {buttonLabel}
        </motion.button>
      </div>

      <TransactionProgress step={step} txHash={txHash} paymentId={paymentId} error={error} />
    </div>
  )
}
