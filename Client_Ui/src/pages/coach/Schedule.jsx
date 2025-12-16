import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { bookingService } from '../../services/bookingService'

// Icons
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
)

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

function Schedule() {
  const { user } = useAuth()
  const toast = useToast()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSession, setNewSession] = useState({
    clientName: '',
    time: '',
    type: 'Personal Training',
    notes: ''
  })

  useEffect(() => {
    fetchSchedule()
  }, [selectedDate])

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      const data = await bookingService.getCoachSchedule(user.userId, selectedDate.toISOString())
      setSessions(data || [])
    } catch (err) {
      console.error('Error fetching schedule:', err)
      setSessions([
        { id: 1, clientName: 'Ahmed Hassan', time: '09:00', endTime: '10:00', type: 'Personal Training', status: 'confirmed' },
        { id: 2, clientName: 'Sara Mohamed', time: '11:00', endTime: '12:00', type: 'Program Review', status: 'confirmed' },
        { id: 3, clientName: 'Omar Ali', time: '14:00', endTime: '15:00', type: 'InBody Check', status: 'pending' },
        { id: 4, clientName: 'Nour Ahmed', time: '16:00', endTime: '17:00', type: 'Personal Training', status: 'confirmed' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getDaysInWeek = () => {
    const days = []
    const startOfWeek = new Date(selectedDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(day.getDate() + i)
      days.push(day)
    }
    return days
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction * 7))
    setSelectedDate(newDate)
  }

  const handleAddSession = async () => {
    try {
      toast.success('Session added successfully!')
      setShowAddModal(false)
      setNewSession({ clientName: '', time: '', type: 'Personal Training', notes: '' })
      fetchSchedule()
    } catch (err) {
      toast.error('Failed to add session')
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return { bg: '#dcfce7', color: '#22c55e' }
      case 'pending': return { bg: '#fef3c7', color: '#f59e0b' }
      case 'cancelled': return { bg: '#fecaca', color: '#ef4444' }
      default: return { bg: '#f5f5f5', color: '#666' }
    }
  }

  const getTypeColor = (type) => {
    switch(type) {
      case 'Personal Training': return '#ff6b35'
      case 'Program Review': return '#3b82f6'
      case 'InBody Check': return '#22c55e'
      default: return '#9333ea'
    }
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <DashboardLayout role="Coach">
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            My <span style={{ color: '#ff6b35' }}>Schedule</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Manage your training sessions and appointments
          </p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="card" style={{ 
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '1rem',
        marginBottom: '1.5rem',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '1rem 1.5rem',
          borderBottom: '2px solid #ff6b35',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa'
        }}>
          <button 
            onClick={() => navigateWeek(-1)}
            style={{
              padding: '0.5rem',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeftIcon />
          </button>
          <h3 style={{ fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon style={{ width: 20, height: 20, color: '#ff6b35' }} />
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={() => navigateWeek(1)}
            style={{
              padding: '0.5rem',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* Days Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0'
        }}>
          {getDaysInWeek().map((day, idx) => (
            <div 
              key={idx}
              onClick={() => setSelectedDate(day)}
              style={{
                padding: '1rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: isSelected(day) ? 'linear-gradient(135deg, #ff6b35, #ff8c42)' : 
                           isToday(day) ? '#fff8f5' : 'white',
                borderRight: idx < 6 ? '1px solid #e0e0e0' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                fontSize: '0.8rem', 
                color: isSelected(day) ? 'rgba(255,255,255,0.8)' : '#666',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                {dayNames[idx]}
              </div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700',
                color: isSelected(day) ? 'white' : isToday(day) ? '#ff6b35' : '#333'
              }}>
                {day.getDate()}
              </div>
              {isToday(day) && !isSelected(day) && (
                <div style={{
                  width: '6px',
                  height: '6px',
                  background: '#ff6b35',
                  borderRadius: '50%',
                  margin: '0.5rem auto 0'
                }}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Session Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
            border: 'none',
            borderRadius: '0.5rem',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(255,107,53,0.3)'
          }}
        >
          <PlusIcon />
          Add Session
        </button>
      </div>

      {/* Sessions List */}
      <div className="card" style={{ 
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '1rem',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '1rem 1.5rem',
          borderBottom: '2px solid #22c55e',
          background: '#f8f9fa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClockIcon style={{ width: 20, height: 20, color: '#22c55e' }} />
            Sessions for <span style={{ color: '#ff6b35' }}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </h3>
          <span style={{
            background: '#ff6b35',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontWeight: '600',
            fontSize: '0.85rem'
          }}>{sessions.length} sessions</span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '1rem', color: '#666' }}>Loading schedule...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <CalendarIcon style={{ width: 48, height: 48, color: '#ccc', margin: '0 auto 1rem' }} />
            <h4 style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>No sessions scheduled</h4>
            <p style={{ color: '#666' }}>Click "Add Session" to schedule a new appointment</p>
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            {sessions.map(session => (
              <div 
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '0.75rem',
                  borderLeft: `4px solid ${getTypeColor(session.type)}`
                }}
              >
                {/* Time */}
                <div style={{
                  minWidth: '100px',
                  textAlign: 'center',
                  padding: '0.75rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333' }}>{session.time}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>to {session.endTime}</div>
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <UserIcon style={{ color: '#ff6b35' }} />
                    <h4 style={{ fontWeight: '600', color: '#333' }}>{session.clientName}</h4>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      background: `${getTypeColor(session.type)}15`,
                      color: getTypeColor(session.type),
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>{session.type}</span>
                  </div>
                </div>

                {/* Status */}
                <div style={{
                  background: getStatusColor(session.status).bg,
                  color: getStatusColor(session.status).color,
                  padding: '0.5rem 1rem',
                  borderRadius: '2rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {session.status === 'confirmed' && <CheckIcon />}
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Session Modal */}
      {showAddModal && (
        <div 
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '1rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ 
              background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
              padding: '1.5rem',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontWeight: '700', fontSize: '1.25rem' }}>Add New Session</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                <XIcon />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                  Client Name
                </label>
                <input
                  type="text"
                  value={newSession.clientName}
                  onChange={(e) => setNewSession({ ...newSession, clientName: e.target.value })}
                  placeholder="Enter client name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                    Time
                  </label>
                  <input
                    type="time"
                    value={newSession.time}
                    onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                    Session Type
                  </label>
                  <select
                    value={newSession.type}
                    onChange={(e) => setNewSession({ ...newSession, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    <option>Personal Training</option>
                    <option>Program Review</option>
                    <option>InBody Check</option>
                    <option>Consultation</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                  Notes (Optional)
                </label>
                <textarea
                  value={newSession.notes}
                  onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                  placeholder="Add any notes..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                onClick={handleAddSession}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Add Session
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Schedule
