import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { equipmentService } from '../../services/equipmentService'
import { bookingService } from '../../services/bookingService'
import { useToast } from '../../contexts/ToastContext'
import './Bookings.css'

// Modern Filled Icons
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
  </svg>
)

const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
  </svg>
)

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)

const QrCodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM19 19h2v2h-2zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM15 19h2v2h-2zM17 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2z"/>
  </svg>
)

const SyncIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
  </svg>
)

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
)

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
  </svg>
)

const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
)

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
  </svg>
)

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
)

function Bookings() {
  const { user } = useAuth()
  const toast = useToast()
  const [equipment, setEquipment] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingModal, setBookingModal] = useState({ show: false, equipment: null })
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')

  // Equipment images for gym vibes
  const equipmentImages = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=400&h=300&fit=crop'
  ]

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [equipmentData, bookingsData] = await Promise.all([
        equipmentService.getAvailableEquipment(),
        bookingService.getUserBookings(user.userId)
      ])
      setEquipment(equipmentData?.data || equipmentData || [])
      setMyBookings(bookingsData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      toast.error('Failed to load equipment')
    } finally {
      setLoading(false)
    }
  }

  const handleBook = async () => {
    if (!bookingDate || !bookingTime) {
      toast.error('Please select date and time')
      return
    }

    setSubmitting(true)
    try {
      const startTime = new Date(`${bookingDate}T${bookingTime}`)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

      await bookingService.createBooking({
        userId: user.userId,
        equipmentId: bookingModal.equipment.equipmentId,
        bookingDate: startTime.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      })
      toast.success('Booking successful!')
      setBookingModal({ show: false, equipment: null })
      setBookingDate('')
      setBookingTime('')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (bookingId, bookingName) => {
    if (!confirm(`Cancel booking for ${bookingName}?`)) return

    try {
      await bookingService.cancelBooking(bookingId, 'User cancelled')
      toast.success('Booking cancelled')
      fetchData()
    } catch (err) {
      toast.error('Failed to cancel booking')
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { text: "Pending", class: "badge-warning" },
      1: { text: "Confirmed", class: "badge-success" },
      2: { text: "Cancelled", class: "badge-danger" },
      3: { text: "Completed", class: "badge-info" },
      4: { text: "No Show", class: "badge-muted" },
      'Pending': { text: "Pending", class: "badge-warning" },
      'Confirmed': { text: "Confirmed", class: "badge-success" },
      'Cancelled': { text: "Cancelled", class: "badge-danger" },
      'Completed': { text: "Completed", class: "badge-info" },
    }
    return statusMap[status] || { text: status || "Unknown", class: "badge-muted" }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <DashboardLayout role="Member">
      <div className="bookings-page">
        {/* Hero Section */}
        <section className="bookings-hero">
          <div className="bookings-hero-content">
            <h1 className="bookings-hero-title">
              Ready to crush it, {user?.name?.split(' ')[0] || 'there'}? <span>⚡</span>
            </h1>
            <p className="bookings-hero-subtitle">
              You have <strong>{myBookings.filter(b => b.status === 1 || b.status === 'Confirmed').length} upcoming sessions</strong> this week. 
              Your consistency streak is <span className="streak">🔥 12 days</span>!
            </p>
            <div className="bookings-hero-tags">
              <span className="bookings-hero-tag blue">
                <ZapIcon style={{ width: 14, height: 14 }} /> High Intensity
              </span>
              <span className="bookings-hero-tag purple">
                <ChartIcon style={{ width: 14, height: 14 }} /> AI Recommended
              </span>
            </div>
          </div>
          <div className="bookings-hero-actions">
            <button className="bookings-hero-btn primary">
              <QrCodeIcon style={{ width: 18, height: 18 }} />
              Scan to Check-In
            </button>
            <button className="bookings-hero-btn secondary">
              <SyncIcon style={{ width: 18, height: 18 }} />
              Sync Calendar
            </button>
          </div>
        </section>

        {/* Tabs & Filters */}
        <section className="bookings-controls">
          <div className="bookings-tabs">
            <button 
              className={`bookings-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`bookings-tab ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past
            </button>
            <button 
              className={`bookings-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
              onClick={() => setActiveTab('cancelled')}
            >
              Cancelled
            </button>
          </div>
          <div className="bookings-filters">
            <div className="bookings-search">
              <SearchIcon className="bookings-search-icon" style={{ width: 18, height: 18 }} />
              <input 
                type="text" 
                placeholder="Search coach, equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="bookings-filter-btn">
              <FilterIcon style={{ width: 18, height: 18 }} />
              Filters
            </button>
            <button className="bookings-filter-btn">
              <CalendarIcon style={{ width: 18, height: 18 }} />
              Date
            </button>
          </div>
        </section>

        {/* Bookings Grid */}
        {loading ? (
          <div className="bookings-loading">
            <div className="bookings-loading-spinner"></div>
            <p style={{ color: '#64748b' }}>Loading your bookings...</p>
          </div>
        ) : myBookings.length === 0 && equipment.length === 0 ? (
          <div className="bookings-empty">
            <CalendarIcon />
            <h3 className="bookings-empty-title">No bookings yet</h3>
            <p className="bookings-empty-text">Start your fitness journey by booking a session</p>
            <button className="bookings-empty-btn">
              <PlusIcon style={{ width: 18, height: 18 }} />
              Book New Session
            </button>
          </div>
        ) : (
          <div className="bookings-grid">
            {/* My Bookings */}
            {myBookings.map((booking, index) => {
              const status = getStatusBadge(booking.status)
              return (
                <article key={booking.bookingId} className="booking-card">
                  <div className="booking-card-image">
                    <img 
                      src={equipmentImages[index % equipmentImages.length]} 
                      alt={booking.equipmentName || 'Booking'}
                    />
                    <span className="booking-card-type equipment">
                      <DumbbellIcon style={{ width: 14, height: 14 }} />
                      Equipment
                    </span>
                    <span className={`booking-card-status ${status.text.toLowerCase()}`}>
                      <CheckIcon style={{ width: 12, height: 12 }} />
                      {status.text}
                    </span>
                  </div>
                  <div className="booking-card-content">
                    <div className="booking-card-header">
                      <div>
                        <h3 className="booking-card-title">{booking.equipmentName || 'Equipment Session'}</h3>
                        <p className="booking-card-subtitle">Fitness Area</p>
                      </div>
                      <div className={`booking-card-time ${booking.status === 1 ? '' : 'default'}`}>
                        <span className="booking-card-time-day">{formatDate(booking.startTime).split(',')[0]}</span>
                        <span className="booking-card-time-hour">{formatTime(booking.startTime)}</span>
                      </div>
                    </div>
                    <div className="booking-card-details">
                      <div className="booking-card-detail">
                        <ClockIcon />
                        <span>60 min session</span>
                      </div>
                      <div className="booking-card-detail">
                        <ZapIcon />
                        <span>5 Tokens</span>
                      </div>
                    </div>
                    <div className="booking-card-actions">
                      <button className="booking-card-btn primary">View</button>
                      <button className="booking-card-btn outline">
                        <EditIcon style={{ width: 16, height: 16 }} />
                      </button>
                      {(booking.status === 0 || booking.status === 1 || booking.status === 'Pending' || booking.status === 'Confirmed') && (
                        <button 
                          className="booking-card-btn outline danger"
                          onClick={() => handleCancel(booking.bookingId, booking.equipmentName)}
                        >
                          <XIcon style={{ width: 16, height: 16 }} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}

            {/* Available Equipment for Booking */}
            {equipment.filter(item => item.status === 0).map((item, index) => (
              <article key={item.equipmentId} className="booking-card">
                <div className="booking-card-image">
                  <img 
                    src={equipmentImages[(index + myBookings.length) % equipmentImages.length]} 
                    alt={item.name}
                  />
                  <span className="booking-card-type equipment">
                    <DumbbellIcon style={{ width: 14, height: 14 }} />
                    Equipment
                  </span>
                  <span className="booking-card-status confirmed">
                    <CheckIcon style={{ width: 12, height: 12 }} />
                    Available
                  </span>
                </div>
                <div className="booking-card-content">
                  <div className="booking-card-header">
                    <div>
                      <h3 className="booking-card-title">{item.name}</h3>
                      <p className="booking-card-subtitle">{item.category || 'General Equipment'}</p>
                    </div>
                    <div className="booking-card-time default">
                      <span className="booking-card-time-day">Book</span>
                      <span className="booking-card-time-hour" style={{ color: '#10B981' }}>Now</span>
                    </div>
                  </div>
                  <div className="booking-card-details">
                    <div className="booking-card-detail">
                      <ClockIcon />
                      <span>60 min session</span>
                    </div>
                    <div className="booking-card-detail">
                      <ZapIcon />
                      <span>5 Tokens</span>
                    </div>
                  </div>
                  <div className="booking-card-actions">
                    <button 
                      className="booking-card-btn primary"
                      onClick={() => setBookingModal({ show: true, equipment: item })}
                      style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                    >
                      <PlusIcon style={{ width: 16, height: 16 }} />
                      Book Now
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {bookingModal.show && (
          <div className="bookings-modal-overlay" onClick={() => setBookingModal({ show: false, equipment: null })}>
            <div className="bookings-modal" onClick={e => e.stopPropagation()}>
              <div className="bookings-modal-header">
                <h3 className="bookings-modal-title">Book {bookingModal.equipment?.name}</h3>
                <button 
                  className="bookings-modal-close"
                  onClick={() => setBookingModal({ show: false, equipment: null })}
                >
                  <XIcon style={{ width: 18, height: 18 }} />
                </button>
              </div>
              <div className="bookings-modal-body">
                <p>Select your preferred date and time for the booking.</p>
                
                <div className="bookings-form-group">
                  <label className="bookings-form-label">
                    <CalendarIcon />
                    Date
                  </label>
                  <input
                    type="date"
                    className="bookings-form-input"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="bookings-form-group">
                  <label className="bookings-form-label">
                    <ClockIcon />
                    Time
                  </label>
                  <input
                    type="time"
                    className="bookings-form-input"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                  />
                </div>

                <div className="bookings-modal-cost">
                  <div className="bookings-modal-cost-title">
                    <ZapIcon style={{ width: 18, height: 18 }} />
                    Cost: 5 tokens
                  </div>
                  <p className="bookings-modal-cost-text">⏱️ Duration: 1 hour session</p>
                </div>
              </div>
              <div className="bookings-modal-footer">
                <button 
                  className="bookings-modal-btn cancel"
                  onClick={() => setBookingModal({ show: false, equipment: null })}
                >
                  Cancel
                </button>
                <button 
                  className="bookings-modal-btn confirm"
                  onClick={handleBook}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="bookings-loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                      Booking...
                    </>
                  ) : (
                    <>
                      <CheckIcon style={{ width: 18, height: 18 }} />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Bookings
