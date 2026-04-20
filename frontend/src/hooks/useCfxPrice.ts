import { useState, useEffect } from 'react'
import { fetchCfxUsdPrice } from '../lib/utils'

export function useCfxPrice() {
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      const p = await fetchCfxUsdPrice()
      if (mounted) { setPrice(p); setLoading(false) }
    }
    fetch()
    const interval = setInterval(fetch, 30_000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  return { price, loading }
}
