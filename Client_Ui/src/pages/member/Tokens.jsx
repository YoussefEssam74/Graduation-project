import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { tokenService } from '../../services/tokenService'

// Icons
const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const GiftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
)

const RotateCcwIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
)

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
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
    { id: 1, name: 'Starter', amount: 10, price: 100, popular: false },
    { id: 2, name: 'Basic', amount: 25, price: 225, popular: true, savings: 10 },
    { id: 3, name: 'Pro', amount: 50, price: 400, popular: false, savings: 20 },
    { id: 4, name: 'Elite', amount: 100, price: 750, popular: false, savings: 25 }
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
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          backgroundImage: 'url(https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.2,
          maskImage: 'linear-gradient(to left, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to left, black, transparent)'
        }} />
        <div className="hero-content" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="hero-title" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ZapIcon style={{ width: 32, height: 32 }} />
            Token Wallet
          </h1>
          <p className="hero-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Manage your tokens for bookings and AI services
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="token-card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="token-label">Available Balance</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ZapIcon style={{ width: 32, height: 32 }} />
            </div>
            <div className="token-balance">{loading ? '...' : balance}</div>
          </div>
          <button 
            className="btn btn-lg"
            onClick={() => setShowPurchaseModal(true)}
            style={{ 
              background: 'white', 
              color: '#ff6b35',
              fontWeight: 700
            }}
          >
            <PlusIcon style={{ width: 20, height: 20 }} />
            Buy More Tokens
          </button>
        </div>
      </div>

      {/* Token Packages */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Token Packages</h3>
        </div>
        <div className="card-content">
          <div className="grid-cols-4" style={{ gap: '1rem' }}>
            {tokenPackages.map(pkg => (
              <div 
                key={pkg.id}
                onClick={() => {
                  setSelectedPackage(pkg)
                  setShowPurchaseModal(true)
                }}
                className="pricing-card"
                style={{
                  cursor: 'pointer',
                  borderColor: pkg.popular ? '#ff6b35' : 'var(--border)',
                  transform: pkg.popular ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                {pkg.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'linear-gradient(135deg, #ff6b35, #dc2626)',
                    color: 'white',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    textTransform: 'uppercase'
                  }}>
                    Popular
                  </div>
                )}
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '0.5rem' }}>
                  {pkg.name}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <ZapIcon style={{ width: 28, height: 28, color: '#ff6b35' }} />
                  <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--foreground)' }}>{pkg.amount}</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                  {pkg.price} EGP
                </div>
                {pkg.savings && (
                  <span className="badge badge-success">Save {pkg.savings}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Token Uses Info */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">What Can You Do With Tokens?</h3>
        </div>
        <div className="card-content">
          <div className="grid-cols-3" style={{ gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '1rem', 
                background: 'rgba(139, 92, 246, 0.1)', 
                color: '#8b5cf6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <ZapIcon />
              </div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>AI Chat</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)' }}>1 token per message</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '1rem', 
                background: 'rgba(59, 130, 246, 0.1)', 
                color: '#3b82f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <CalendarIcon />
              </div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Workout Plans</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)' }}>50 tokens per plan</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '1rem', 
                background: 'rgba(34, 197, 94, 0.1)', 
                color: '#22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <GiftIcon />
              </div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Nutrition Plans</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)' }}>50 tokens per plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <HistoryIcon style={{ marginRight: '0.5rem' }} />
            Transaction History
          </h3>
          <span className="badge badge-info">{transactions.length} transactions</span>
        </div>
        <div className="card-content" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <HistoryIcon style={{ width: 48, height: 48, opacity: 0.3 }} />
              <p className="empty-state-title">No transactions yet</p>
              <p className="empty-state-description">Your token transactions will appear here</p>
            </div>
          ) : (
            <div>
              {transactions.slice(0, 10).map((tx, idx) => {
                const { icon: Icon, color, bg } = getTransactionIcon(tx.type)
                const isPositive = tx.amount > 0 || tx.type?.toLowerCase().includes('purchase')
                return (
                  <div 
                    key={tx.transactionId || idx} 
                    style={{ 
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '0.75rem',
                        background: bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon style={{ width: 22, height: 22, color }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                          {tx.description || tx.type}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                          {formatDate(tx.createdAt || tx.transactionDate)}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: '1.1rem',
                      color: isPositive ? '#22c55e' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {isPositive ? '+' : '-'}{Math.abs(tx.amount)}
                      <ZapIcon style={{ width: 16, height: 16 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="modal-overlay" onClick={() => { setShowPurchaseModal(false); setSelectedPackage(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #ff6b35, #dc2626)' }}>
              <h3 className="modal-title" style={{ color: 'white' }}>
                <ZapIcon style={{ marginRight: '0.5rem' }} />
                Purchase Tokens
              </h3>
              <button 
                className="modal-close"
                onClick={() => { setShowPurchaseModal(false); setSelectedPackage(null) }}
                style={{ color: 'white' }}
              >
                <XIcon />
              </button>
            </div>
            <div className="modal-body">
              {selectedPackage ? (
                <div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    background: 'var(--background-secondary)', 
                    borderRadius: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)', marginBottom: '0.5rem' }}>
                      {selectedPackage.name} Package
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <ZapIcon style={{ width: 36, height: 36, color: '#ff6b35' }} />
                      <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--foreground)' }}>{selectedPackage.amount}</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--foreground)' }}>{selectedPackage.price} EGP</div>
                    {selectedPackage.savings && (
                      <span className="badge badge-success" style={{ marginTop: '0.5rem' }}>
                        Save {selectedPackage.savings}%
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--foreground-muted)' }}>Current Balance</span>
                      <span style={{ fontWeight: 600 }}>{balance} tokens</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
                      <span style={{ color: 'var(--foreground-muted)' }}>After Purchase</span>
                      <span style={{ fontWeight: 600, color: '#22c55e' }}>
                        {balance + selectedPackage.amount} tokens
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', textAlign: 'center' }}>
                    Tokens will be added to your account immediately
                  </p>
                </div>
              ) : (
                <div className="grid-cols-2" style={{ gap: '1rem' }}>
                  {tokenPackages.map(pkg => (
                    <div 
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      style={{
                        padding: '1.25rem',
                        background: 'var(--background-secondary)',
                        border: '2px solid var(--border)',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {pkg.amount} <ZapIcon style={{ width: 20, height: 20, color: '#ff6b35' }} />
                      </div>
                      <div style={{ color: 'var(--foreground-muted)' }}>{pkg.price} EGP</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => { setShowPurchaseModal(false); setSelectedPackage(null) }}
              >
                Cancel
              </button>
              {selectedPackage && (
                <button 
                  className="btn btn-primary"
                  onClick={handlePurchase}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <>
                      <div className="loading-spinner" style={{ width: 16, height: 16 }}></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCardIcon style={{ width: 18, height: 18 }} />
                      Pay {selectedPackage.price} EGP
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
