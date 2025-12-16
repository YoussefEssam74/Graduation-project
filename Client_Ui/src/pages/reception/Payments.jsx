import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useToast } from '../../contexts/ToastContext'
import { userService } from '../../services/userService'

// Icons
const DollarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
)

const BanknoteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const ReceiptIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>
  </svg>
)

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

function Payments() {
  const toast = useToast()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [members, setMembers] = useState([])
  const [memberSearch, setMemberSearch] = useState('')
  const [paymentData, setPaymentData] = useState({
    amount: '',
    type: 'subscription',
    method: 'cash',
    notes: ''
  })

  useEffect(() => {
    fetchTransactions()
    fetchMembers()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      // No payment service available yet - using mock data
      // const data = await paymentService.getAll()
      // setTransactions(data || [])
      throw new Error('Using mock data')
    } catch (err) {
      console.error('Error fetching transactions:', err)
      // Mock data
      setTransactions([
        { transactionId: 1, userName: 'Ahmed Hassan', amount: 500, type: 'Subscription', method: 'Cash', createdAt: '2024-01-20T10:00:00', status: 'Completed' },
        { transactionId: 2, userName: 'Sara Mohamed', amount: 200, type: 'Personal Training', method: 'Card', createdAt: '2024-01-20T11:30:00', status: 'Completed' },
        { transactionId: 3, userName: 'Omar Ali', amount: 100, type: 'Tokens', method: 'Cash', createdAt: '2024-01-20T14:00:00', status: 'Pending' },
        { transactionId: 4, userName: 'Nour Ahmed', amount: 750, type: 'Subscription', method: 'Card', createdAt: '2024-01-19T09:00:00', status: 'Completed' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      // No getAll method - using mock data for now
      // const data = await userService.getCoaches()
      // setMembers(data || [])
      throw new Error('Using mock data')
    } catch (err) {
      // Mock data
      setMembers([
        { userId: '1', name: 'Ahmed Hassan', email: 'ahmed@email.com' },
        { userId: '2', name: 'Sara Mohamed', email: 'sara@email.com' },
        { userId: '3', name: 'Omar Ali', email: 'omar@email.com' }
      ])
    }
  }

  const handleProcessPayment = async (e) => {
    e.preventDefault()
    if (!selectedMember) {
      toast.error('Please select a member')
      return
    }

    try {
      // No payment service available yet
      // await paymentService.create({
      //   userId: selectedMember.userId,
      //   ...paymentData,
      //   amount: parseFloat(paymentData.amount)
      // })
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      toast.success('Payment processed successfully!')
      setShowPaymentModal(false)
      setSelectedMember(null)
      setPaymentData({ amount: '', type: 'subscription', method: 'cash', notes: '' })
      fetchTransactions()
    } catch (err) {
      toast.error('Failed to process payment')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email?.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const filteredTransactions = transactions.filter(t =>
    t.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    todayTotal: transactions.filter(t => {
      const today = new Date().toDateString()
      return new Date(t.createdAt).toDateString() === today && t.status === 'Completed'
    }).reduce((sum, t) => sum + t.amount, 0),
    completed: transactions.filter(t => t.status === 'Completed').length,
    pending: transactions.filter(t => t.status === 'Pending').length
  }

  if (loading) {
    return (
      <DashboardLayout role="Reception">
        <div className="empty-state" style={{ minHeight: 400 }}>
          <div className="loading-spinner"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Reception">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>
            <span className="text-foreground">Payment </span>
            <span className="text-primary">Management</span>
          </h1>
          <p>Process payments and view transactions</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowPaymentModal(true)}
        >
          <DollarIcon style={{ width: 18, height: 18 }} />
          New Payment
        </button>
      </div>

      {/* Stats */}
      <div className="grid-cols-3 mb-6">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <DollarIcon />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.todayTotal} EGP</div>
            <div className="stat-label">Today's Revenue</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CheckIcon />
          </div>
          <div>
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'var(--warning)' }}>
            <ReceiptIcon />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="card-content" style={{ padding: '1rem' }}>
          <div className="input-with-icon">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <ReceiptIcon style={{ width: 20, height: 20, color: 'var(--primary)' }} />
            Recent Transactions
          </h2>
        </div>
        <div className="card-content" style={{ padding: 0 }}>
          {filteredTransactions.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <DollarIcon className="empty-state-icon" />
              <p className="empty-state-title">No transactions found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.transactionId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--card-darker)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)'
                        }}>
                          <UserIcon />
                        </div>
                        {transaction.userName}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{transaction.type}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                      {transaction.amount} EGP
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {transaction.method === 'Cash' ? <BanknoteIcon style={{ width: 16, height: 16 }} /> : <CreditCardIcon style={{ width: 16, height: 16 }} />}
                        {transaction.method}
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td>
                      <span className={`badge ${transaction.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <DollarIcon style={{ width: 20, height: 20, color: 'var(--primary)' }} />
                Process Payment
              </h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>
                <XIcon />
              </button>
            </div>
            <form onSubmit={handleProcessPayment}>
              <div className="modal-body">
                {/* Member Selection */}
                <div className="form-group">
                  <label className="form-label">Select Member</label>
                  {selectedMember ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: 'var(--card-darker)',
                      borderRadius: '0.5rem'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{selectedMember.name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{selectedMember.email}</div>
                      </div>
                      <button 
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedMember(null)}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Search members..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                      />
                      {memberSearch && (
                        <div style={{
                          marginTop: '0.5rem',
                          maxHeight: 150,
                          overflowY: 'auto',
                          background: 'var(--card-darker)',
                          borderRadius: '0.5rem'
                        }}>
                          {filteredMembers.map(member => (
                            <div
                              key={member.userId}
                              style={{
                                padding: '0.75rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border)'
                              }}
                              onClick={() => {
                                setSelectedMember(member)
                                setMemberSearch('')
                              }}
                            >
                              <div style={{ fontWeight: 500 }}>{member.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{member.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Type */}
                <div className="form-group">
                  <label className="form-label">Payment Type</label>
                  <select
                    className="input-field"
                    value={paymentData.type}
                    onChange={(e) => setPaymentData({ ...paymentData, type: e.target.value })}
                  >
                    <option value="subscription">Subscription</option>
                    <option value="personal_training">Personal Training</option>
                    <option value="tokens">Token Purchase</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label className="form-label">Amount (EGP)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                  />
                </div>

                {/* Payment Method */}
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentData({ ...paymentData, method: 'cash' })}
                      style={{
                        padding: '1rem',
                        background: paymentData.method === 'cash' ? 'var(--primary)' : 'var(--card-darker)',
                        color: paymentData.method === 'cash' ? 'var(--primary-foreground)' : 'var(--foreground)',
                        border: `2px solid ${paymentData.method === 'cash' ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 500
                      }}
                    >
                      <BanknoteIcon /> Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentData({ ...paymentData, method: 'card' })}
                      style={{
                        padding: '1rem',
                        background: paymentData.method === 'card' ? 'var(--primary)' : 'var(--card-darker)',
                        color: paymentData.method === 'card' ? 'var(--primary-foreground)' : 'var(--foreground)',
                        border: `2px solid ${paymentData.method === 'card' ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 500
                      }}
                    >
                      <CreditCardIcon /> Card
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="input-field"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    placeholder="Add notes..."
                    rows={2}
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckIcon style={{ width: 18, height: 18 }} />
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Payments
