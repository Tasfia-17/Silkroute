import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Providers } from './components/Providers'
import { HomePage } from './pages/HomePage'
import { HistoryPage } from './pages/HistoryPage'
import './index.css'

function App() {
  const [page, setPage] = useState<'home' | 'history'>('home')
  return page === 'home'
    ? <HomePage onHistory={() => setPage('history')} />
    : <HistoryPage onBack={() => setPage('home')} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
)
