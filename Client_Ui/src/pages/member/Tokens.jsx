import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { tokenService } from '../../services/tokenService'
import './Tokens.css'

// Modern Filled Icons
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
)

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="m16 6 2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
)

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
  </svg>
)

const GiftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
  </svg>
)

const ShoppingBagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
)

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
)

const HelpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
  </svg>
)

const TokenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
  </svg>
)

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
  </svg>
)

function Tokens() {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [balance, setBalance] = useState(user?.tokenBalance || 0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    fetchTokenData()
  }, [user])

  const fetchTokenData = async () => {
    try {
      setLoading(true)
      const [balanceData, historyData] = await Promise.all([
        tokenService.getUserBalance(user.userId).catch(() => null),
        tokenService.getUserTransactions(user.userId).catch(() => [])
      ])
      if (balanceData !== null) {
        setBalance(balanceData?.balance || balanceData || user?.tokenBalance || 0)
      }
      setTransactions(Array.isArray(historyData) ? historyData : [])
    } catch (err) {
      console.error('Error fetching token data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!selectedPackage) return
    
    setPurchasing(true)
    try {
      await tokenService.createTransaction({
        userId: user.userId,
        amount: selectedPackage.amount,
        type: 'Purchase',
        description: `Purchased ${selectedPackage.amount} tokens - ${selectedPackage.name} Package`
      })
      
      const newBalance = (balance || 0) + selectedPackage.amount
      setBalance(newBalance)
      
      if (updateUser) {
        updateUser({ ...user, tokenBalance: newBalance })
      }
      
      toast.success(`Successfully purchased ${selectedPackage.amount} tokens!`)
      setShowPurchaseModal(false)
      setSelectedPackage(null)
      fetchTokenData()
    } catch (err) {
      console.error('Purchase error:', err)
      toast.error(err.response?.data?.message || 'Failed to purchase tokens. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }

  const getTransactionIcon = (type) => {
    const typeLC = type?.toLowerCase() || ''
    if (typeLC.includes('purchase')) return { icon: PlusIcon, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' }
    if (typeLC.includes('booking') || typeLC.includes('debit')) return { icon: CalendarIcon, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
    if (typeLC.includes('reward') || typeLC.includes('bonus')) return { icon: GiftIcon, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }
    if (typeLC.includes('refund')) return { icon: RotateCcwIcon, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' }
    return { icon: ZapIcon, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' }
  }

  const tokenPackages = [
    { id: 1, name: 'Starter', amount: 100, price: 10, priceFormatted: '$10.00', features: ['Valid for 30 days', 'Access to gym floor'], style: 'outline' },
    { id: 2, name: 'Fit Pro', amount: 500, price: 45, priceFormatted: '$45.00', originalPrice: '$50.00', features: ['Valid for 60 days', 'Save 10% instantly', 'Priority Booking'], popular: true, style: 'accent' },
    { id: 3, name: 'Premium', amount: 1000, price: 85, priceFormatted: '$85.00', originalPrice: '$100.00', features: ['No expiry date', 'Save 15% instantly', '1 Free Guest Pass'], style: 'primary' },
    { id: 4, name: 'Elite', amount: 2500, price: 200, priceFormatted: '$200.00', features: ['Save 20% + Free Merch', 'VIP Locker Access', 'AI Nutrition Plan'], elite: true, style: 'elite' }
  ]

  const exchangeRates = [
    { name: 'Towel Rental', cost: '2 Tokens' },
    { name: 'Protein Shake', cost: '12 Tokens' },
    { name: 'Guest Pass', cost: '30 Tokens' },
    { name: 'Personal Coach (1hr)', cost: '50 Tokens' }
  ]

  const monthlySpending = [
    { month: 'May', value: 200, height: '40%' },
    { month: 'Jun', value: 350, height: '60%' },
    { month: 'Jul', value: 280, height: '50%' },
    { month: 'Aug', value: 520, height: '80%' },
    { month: 'Sep', value: 150, height: '30%', current: true }
  ]

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <DashboardLayout role="Member">
      <div className="tokens-page">
        {/* Hero Section */}
        <div className="tokens-hero">
          <div className="tokens-hero-content">
            <h1>My Wallet</h1>
            <p>Manage your tokens, top up, and track your fitness investment.</p>
          </div>
          <button className="tokens-refer-btn">
            <GiftIcon />
            Refer a Friend & Earn 50
          </button>
        </div>

        {/* Wallet Overview Grid */}
        <div className="tokens-wallet-grid">
          {/* Balance Card */}
          <div className="tokens-balance-card">
            <div className="tokens-balance-bg-icon">
              <WalletIcon />
            </div>
            <div className="tokens-balance-content">
              <div className="tokens-balance-header">
                <div>
                  <p className="tokens-balance-label">Current Balance</p>
                  <div className="tokens-balance-value">
                    <span className="tokens-balance-amount">{loading ? '...' : balance.toLocaleString()}</span>
                    <span className="tokens-balance-unit">Tokens</span>
                  </div>
                  <p className="tokens-balance-usd">≈ ${(balance * 0.1).toFixed(2)} USD value</p>
                </div>
                <div className="tokens-balance-trend">
                  <TrendingUpIcon />
                  +500 this month
                </div>
              </div>

              {/* Auto Refill */}
              <div className="tokens-auto-refill">
                <div className="tokens-auto-refill-header">
                  <div className="tokens-auto-refill-label">
                    <RefreshIcon />
                    <span>Auto-Refill</span>
                  </div>
                  <label className="tokens-toggle">
                    <input type="checkbox" />
                    <span className="tokens-toggle-slider"></span>
                  </label>
                </div>
                <div className="tokens-slider-info">
                  <span>Threshold: 100 Tokens</span>
                  <span>Refill Amount: 500</span>
                </div>
                <div className="tokens-slider-track">
                  <div className="tokens-slider-fill" style={{ width: '32%' }}>
                    <div className="tokens-slider-thumb"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Spending Analysis */}
          <div className="tokens-spending-card">
            <h3>Spending Analysis</h3>
            <div className="tokens-spending-content">
              <div className="tokens-pie-chart">
                <div className="tokens-pie-center">
                  <span className="tokens-pie-center-label">Total</span>
                  <span className="tokens-pie-center-value">850</span>
                </div>
              </div>
              <div className="tokens-spending-legend">
                <div className="tokens-legend-item">
                  <div className="tokens-legend-label">
                    <div className="tokens-legend-dot classes"></div>
                    <span>Classes</span>
                  </div>
                  <span className="tokens-legend-value">45%</span>
                </div>
                <div className="tokens-legend-item">
                  <div className="tokens-legend-label">
                    <div className="tokens-legend-dot coaching"></div>
                    <span>Coaching</span>
                  </div>
                  <span className="tokens-legend-value">25%</span>
                </div>
                <div className="tokens-legend-item">
                  <div className="tokens-legend-label">
                    <div className="tokens-legend-dot goods"></div>
                    <span>Goods</span>
                  </div>
                  <span className="tokens-legend-value">30%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Packages */}
        <div className="tokens-packages-section">
          <h3>
            <ShoppingBagIcon />
            Purchase Packages
          </h3>
          <div className="tokens-packages-grid">
            {tokenPackages.map(pkg => (
              <div 
                key={pkg.id}
                className={`tokens-package-card ${pkg.popular ? 'popular' : ''} ${pkg.elite ? 'elite' : ''}`}
                onClick={() => {
                  setSelectedPackage(pkg)
                  setShowPurchaseModal(true)
                }}
              >
                {pkg.popular && <div className="tokens-package-badge">Most Popular</div>}
                <div>
                  <div className="tokens-package-name">
                    {pkg.elite && <StarIcon />}
                    {pkg.name}
                  </div>
                  <div className="tokens-package-amount">
                    <span className="tokens-package-amount-value">{pkg.amount}</span>
                    <span className="tokens-package-amount-unit">Tokens</span>
                  </div>
                  <div className="tokens-package-price">
                    {pkg.priceFormatted}
                    {pkg.originalPrice && <span className="tokens-package-original">{pkg.originalPrice}</span>}
                  </div>
                </div>
                <ul className="tokens-package-features">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="tokens-package-feature">
                      <CheckCircleIcon />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`tokens-package-btn ${pkg.style}`}>
                  {pkg.elite ? 'Join Elite' : pkg.popular ? 'Purchase' : 'Select'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="tokens-stats-grid">
          {/* Transaction Table */}
          <div className="tokens-transactions-card">
            <div className="tokens-transactions-header">
              <h3>Transaction History</h3>
              <button>View All</button>
            </div>
            {loading ? (
              <div className="tokens-empty">
                <div className="loading-spinner"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="tokens-empty">
                <HistoryIcon />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tokens-transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map((tx, idx) => {
                      const isPositive = tx.amount > 0 || tx.type?.toLowerCase().includes('purchase') || tx.type?.toLowerCase().includes('deposit')
                      const typeClass = tx.type?.toLowerCase().includes('service') ? 'service' 
                        : tx.type?.toLowerCase().includes('goods') ? 'goods'
                        : tx.type?.toLowerCase().includes('deposit') || tx.type?.toLowerCase().includes('purchase') ? 'deposit'
                        : tx.type?.toLowerCase().includes('reward') ? 'reward' : 'service'
                      return (
                        <tr key={tx.transactionId || idx}>
                          <td className="date">{formatDate(tx.createdAt || tx.transactionDate)}</td>
                          <td className="description">{tx.description || tx.type}</td>
                          <td>
                            <span className={`tokens-transaction-type ${typeClass}`}>{tx.type || 'Transaction'}</span>
                          </td>
                          <td className={`tokens-transaction-amount ${isPositive ? 'positive' : 'negative'}`}>
                            {isPositive ? '+' : ''}{tx.amount}
                          </td>
                          <td className="tokens-transaction-balance">{tx.balanceAfter?.toLocaleString() || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="tokens-side-column">
            {/* Monthly Spending Chart */}
            <div className="tokens-monthly-card">
              <h3>Monthly Spending</h3>
              <div className="tokens-monthly-bars">
                {monthlySpending.map((month, idx) => (
                  <div key={idx} className={`tokens-monthly-bar ${month.current ? 'current' : ''}`}>
                    <div className="tokens-monthly-bar-fill" style={{ height: month.height }}></div>
                    <span className="tokens-monthly-bar-label">{month.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Exchange Guide */}
            <div className="tokens-guide-card">
              <h3>
                <HelpIcon />
                Quick Exchange Guide
              </h3>
              <div className="tokens-guide-list">
                {exchangeRates.map((item, idx) => (
                  <div key={idx} className="tokens-guide-item">
                    <span className="tokens-guide-item-name">{item.name}</span>
                    <span className="tokens-guide-item-cost">{item.cost}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="tokens-modal-overlay" onClick={() => { setShowPurchaseModal(false); setSelectedPackage(null) }}>
          <div className="tokens-modal" onClick={e => e.stopPropagation()}>
            <div className="tokens-modal-header">
              <div className="tokens-modal-header-content">
                <TokenIcon />
                <h3>Purchase Tokens</h3>
              </div>
              <button className="tokens-modal-close" onClick={() => { setShowPurchaseModal(false); setSelectedPackage(null) }}>
                <XIcon />
              </button>
            </div>
            <div className="tokens-modal-body">
              {selectedPackage ? (
                <>
                  <div className="tokens-modal-package-preview">
                    <div className="tokens-modal-package-name">{selectedPackage.name} Package</div>
                    <div className="tokens-modal-package-amount">
                      <TokenIcon />
                      <span>{selectedPackage.amount}</span>
                    </div>
                    <div className="tokens-modal-package-price">{selectedPackage.priceFormatted}</div>
                  </div>

                  <div>
                    <div className="tokens-modal-info-row">
                      <span className="tokens-modal-info-label">Current Balance</span>
                      <span className="tokens-modal-info-value">{balance.toLocaleString()} tokens</span>
                    </div>
                    <div className="tokens-modal-info-row">
                      <span className="tokens-modal-info-label">After Purchase</span>
                      <span className="tokens-modal-info-value success">{(balance + selectedPackage.amount).toLocaleString()} tokens</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="tokens-packages-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {tokenPackages.map(pkg => (
                    <div 
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      style={{
                        padding: '1.25rem',
                        background: '#f8fafc',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {pkg.amount} <TokenIcon style={{ width: 20, height: 20, color: '#F97316' }} />
                      </div>
                      <div style={{ color: '#6b7280' }}>{pkg.priceFormatted}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="tokens-modal-footer">
              <button className="tokens-modal-btn-cancel" onClick={() => { setShowPurchaseModal(false); setSelectedPackage(null) }}>
                Cancel
              </button>
              {selectedPackage && (
                <button className="tokens-modal-btn-confirm" onClick={handlePurchase} disabled={purchasing}>
                  {purchasing ? (
                    <>
                      <div className="loading-spinner" style={{ width: 16, height: 16 }}></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCardIcon />
                      Pay {selectedPackage.priceFormatted}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Tokens
