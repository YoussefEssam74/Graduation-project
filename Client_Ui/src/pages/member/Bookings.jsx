import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { equipmentService } from '../../services/equipmentService'
import { bookingService } from '../../services/bookingService'
import { useToast } from '../../contexts/ToastContext'

// Icons
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
  </svg>
)

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
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
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Equipment <span style={{ color: '#ff6b35' }}>Booking</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Reserve gym equipment for your workout sessions
          </p>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: 'rgba(255,107,53,0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '2rem',
            marginTop: '1rem',
            border: '1px solid rgba(255,107,53,0.5)'
          }}>
            <ZapIcon style={{ width: 18, height: 18, color: '#ff6b35' }} />
            <span style={{ color: 'white', fontWeight: '600' }}>5 tokens per booking</span>
          </div>
        </div>
      </div>

      {/* My Bookings Section */}
      {myBookings.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid #ff6b35' }}>
          <div className="card-header" style={{ 
            background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
            color: 'white',
            borderRadius: '0.5rem 0.5rem 0 0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarIcon style={{ width: 24, height: 24 }} />
                My Bookings
              </h3>
              <span className="badge" style={{ background: 'white', color: '#ff6b35', fontWeight: '600' }}>
                {myBookings.length} total
              </span>
            </div>
          </div>
          <div className="card-content" style={{ padding: 0 }}>
            <table className="data-table" style={{ marginBottom: 0 }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ color: '#333', fontWeight: '600' }}>Equipment</th>
                  <th style={{ color: '#333', fontWeight: '600' }}>Date</th>
                  <th style={{ color: '#333', fontWeight: '600' }}>Time</th>
                  <th style={{ color: '#333', fontWeight: '600' }}>Status</th>
                  <th style={{ color: '#333', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.slice(0, 5).map(booking => {
                  const status = getStatusBadge(booking.status)
                  return (
                    <tr key={booking.bookingId} style={{ borderBottom: '1px solid #eee' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '0.5rem', 
                            background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <DumbbellIcon style={{ width: 20, height: 20, color: 'white' }} />
                          </div>
                          <span style={{ fontWeight: '600', color: '#333' }}>{booking.equipmentName || 'Equipment'}</span>
                        </div>
                      </td>
                      <td style={{ color: '#555' }}>{formatDate(booking.startTime)}</td>
                      <td style={{ color: '#555' }}>{formatTime(booking.startTime)}</td>
                      <td><span className={`badge ${status.class}`}>{status.text}</span></td>
                      <td>
                        {(booking.status === 0 || booking.status === 1 || booking.status === 'Pending' || booking.status === 'Confirmed') && (
                          <button 
                            className="btn btn-sm"
                            onClick={() => handleCancel(booking.bookingId, booking.equipmentName)}
                            style={{ 
                              background: '#ff4444', 
                              color: 'white',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <XIcon style={{ width: 14, height: 14 }} />
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Available Equipment Section */}
      <div className="card" style={{ border: '1px solid #e0e0e0' }}>
        <div className="card-header" style={{ background: '#f8f9fa', borderBottom: '2px solid #ff6b35' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DumbbellIcon style={{ width: 24, height: 24, color: '#ff6b35' }} />
            Available <span style={{ color: '#ff6b35' }}>Equipment</span>
          </h3>
        </div>
        <div className="card-content" style={{ padding: '1.5rem' }}>
          {loading ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '1rem', color: '#666' }}>Loading equipment...</p>
            </div>
          ) : equipment.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <DumbbellIcon style={{ width: 48, height: 48, color: '#ccc' }} />
              <p style={{ marginTop: '1rem', color: '#666', fontWeight: '600' }}>No equipment available</p>
              <p style={{ color: '#999' }}>Check back later for available equipment</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {equipment.map((item, index) => (
                <div 
                  key={item.equipmentId} 
                  className="card equipment-card"
                  style={{ 
                    border: '1px solid #e0e0e0',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  {/* Equipment Image */}
                  <div style={{
                    height: '160px',
                    background: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${equipmentImages[index % equipmentImages.length]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '1rem'
                  }}>
                    <span className={`badge ${item.status === 0 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.75rem' }}>
                      {item.status === 0 ? '✓ Available' : '⏳ In Use'}
                    </span>
                  </div>

                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <h4 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '0.25rem' }}>
                        {item.name}
                      </h4>
                      <p style={{ 
                        fontSize: '0.8rem', 
                        color: '#ff6b35',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {item.category || 'General Equipment'}
                      </p>
                    </div>
                    
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem', lineHeight: 1.5 }}>
                      {item.description || 'Professional gym equipment for your workout sessions.'}
                    </p>

                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      marginBottom: '1rem',
                      padding: '0.5rem',
                      background: '#fff8f5',
                      borderRadius: '0.5rem',
                      border: '1px solid #ffe0d0'
                    }}>
                      <ZapIcon style={{ width: 16, height: 16, color: '#ff6b35' }} />
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>
                        <strong style={{ color: '#ff6b35' }}>5 tokens</strong> per session
                      </span>
                    </div>
                    
                    <button 
                      className="btn btn-primary"
                      style={{ 
                        width: '100%',
                        background: item.status === 0 ? 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)' : '#ccc',
                        border: 'none',
                        padding: '0.75rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                      onClick={() => setBookingModal({ show: true, equipment: item })}
                      disabled={item.status !== 0}
                    >
                      <PlusIcon style={{ width: 18, height: 18 }} />
                      {item.status === 0 ? 'Book Now' : 'Not Available'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModal.show && (
        <div className="modal-overlay" onClick={() => setBookingModal({ show: false, equipment: null })}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ 
            maxWidth: '450px',
            borderRadius: '1rem',
            overflow: 'hidden'
          }}>
            <div className="modal-header" style={{ 
              background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
              color: 'white',
              padding: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                Book {bookingModal.equipment?.name}
              </h3>
              <button 
                className="modal-close"
                onClick={() => setBookingModal({ show: false, equipment: null })}
                style={{ color: 'white' }}
              >
                <XIcon />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Select your preferred date and time for the booking.
              </p>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                  <CalendarIcon style={{ width: 16, height: 16, display: 'inline', marginRight: '0.5rem' }} />
                  Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                  <ClockIcon style={{ width: 16, height: 16, display: 'inline', marginRight: '0.5rem' }} />
                  Time
                </label>
                <input
                  type="time"
                  className="input"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ 
                padding: '1rem', 
                background: '#fff8f5',
                borderRadius: '0.75rem',
                border: '1px solid #ffe0d0',
                marginTop: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <ZapIcon style={{ width: 18, height: 18, color: '#ff6b35' }} />
                  <span style={{ fontWeight: '700', color: '#ff6b35', fontSize: '1.1rem' }}>Cost: 5 tokens</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>
                  ⏱️ Duration: 1 hour session
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ 
              padding: '1rem 1.5rem', 
              background: '#f8f9fa',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button 
                className="btn"
                onClick={() => setBookingModal({ show: false, equipment: null })}
                style={{ 
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  background: 'white',
                  color: '#666',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleBook}
                disabled={submitting}
                style={{ 
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
                  border: 'none',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {submitting ? (
                  <>
                    <div className="loading-spinner" style={{ width: 18, height: 18 }}></div>
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
    </DashboardLayout>
  )
}

export default Bookings
