import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useToast } from '../../contexts/ToastContext'
import { bookingService } from '../../services/bookingService'

// Icons
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
)

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
  </svg>
)

function Bookings() {
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchBookings()
  }, [selectedDate])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const data = await bookingService.getBookingsByDate(selectedDate)
      setBookings(data || [])
    } catch (err) {
      console.error('Error fetching bookings:', err)
      // Mock data
      setBookings([
        { bookingId: 1, userName: 'Ahmed Hassan', equipmentName: 'Treadmill #1', startTime: '2024-01-20T09:00:00', endTime: '2024-01-20T10:00:00', status: 'Confirmed' },
        { bookingId: 2, userName: 'Sara Mohamed', equipmentName: 'Smith Machine', startTime: '2024-01-20T10:00:00', endTime: '2024-01-20T11:00:00', status: 'Pending' },
        { bookingId: 3, userName: 'Omar Ali', equipmentName: 'Bench Press', startTime: '2024-01-20T11:00:00', endTime: '2024-01-20T12:00:00', status: 'Confirmed' },
        { bookingId: 4, userName: 'Nour Ahmed', equipmentName: 'Cable Machine', startTime: '2024-01-20T14:00:00', endTime: '2024-01-20T15:00:00', status: 'Cancelled' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (bookingId) => {
    try {
      await bookingService.confirmBooking(bookingId)
      toast.success('Booking confirmed!')
      setBookings(prev => prev.map(b => 
        b.bookingId === bookingId ? { ...b, status: 'Confirmed' } : b
      ))
    } catch (err) {
      toast.error('Failed to confirm booking')
    }
  }

  const handleCancel = async (bookingId) => {
    try {
      await bookingService.cancelBooking(bookingId)
      toast.success('Booking cancelled')
      setBookings(prev => prev.map(b => 
        b.bookingId === bookingId ? { ...b, status: 'Cancelled' } : b
      ))
    } catch (err) {
      toast.error('Failed to cancel booking')
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed': return 'badge-success'
      case 'Pending': return 'badge-warning'
      case 'Cancelled': return 'badge-danger'
      default: return 'badge-secondary'
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'Confirmed').length,
    pending: bookings.filter(b => b.status === 'Pending').length
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
            <span className="text-foreground">Equipment </span>
            <span className="text-primary">Bookings</span>
          </h1>
          <p>Manage equipment reservations</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon style={{ color: 'var(--primary)' }} />
          <input
            type="date"
            className="input-field"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: 'auto' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid-cols-3 mb-6">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.confirmed}</div>
          <div className="stat-label">Confirmed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-content" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="input-with-icon" style={{ flex: '1 1 300px' }}>
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by member or equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <FilterIcon style={{ color: 'var(--muted-foreground)' }} />
              <select 
                className="input-field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: 'auto', minWidth: 140 }}
              >
                <option value="all">All Status</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="card">
        <div className="card-content">
          {filteredBookings.length === 0 ? (
            <div className="empty-state">
              <CalendarIcon className="empty-state-icon" />
              <p className="empty-state-title">No bookings found</p>
              <p className="empty-state-description">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No equipment bookings for this date'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredBookings.map(booking => (
                <div key={booking.bookingId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'var(--card-darker)',
                  borderRadius: '0.75rem',
                  borderLeft: `4px solid ${
                    booking.status === 'Confirmed' ? 'var(--success)' :
                    booking.status === 'Pending' ? 'var(--warning)' : 'var(--danger)'
                  }`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'var(--card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)'
                    }}>
                      <DumbbellIcon />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{booking.userName}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        {booking.equipmentName}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
                      <ClockIcon />
                      <span style={{ fontSize: '0.875rem' }}>
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </span>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                    {booking.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleConfirm(booking.bookingId)}
                        >
                          <CheckIcon />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleCancel(booking.bookingId)}
                        >
                          <XIcon />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Bookings
