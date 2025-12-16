import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { statsService } from '../../services/statsService'
import { bookingService } from '../../services/bookingService'
import { useToast } from '../../contexts/ToastContext'

// Icons
const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
)

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
)

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
)

const UserCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
)

function MemberDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.userId) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsData, bookingsData] = await Promise.all([
        statsService.getMemberStats(user.userId).catch(() => null),
        bookingService.getUserBookings(user.userId).catch(() => [])
      ])
      setStats(statsData)
      setRecentBookings(Array.isArray(bookingsData) ? bookingsData.slice(0, 4) : [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId, bookingName) => {
    if (!confirm(`Are you sure you want to cancel booking for ${bookingName}?`)) {
      return
    }

    try {
      await bookingService.cancelBooking(bookingId, "Cancelled by user")
      toast.success("Booking cancelled successfully")
      fetchData()
    } catch (error) {
      toast.error("Failed to cancel booking")
    }
  }

  const displayStats = {
    tokenBalance: user?.tokenBalance ?? 0,
    totalBookings: stats?.totalBookings ?? 0,
    completedWorkouts: stats?.totalWorkoutsCompleted ?? 0,
    currentWeight: stats?.currentWeight ?? 0,
    bodyFatPercentage: stats?.currentBodyFat ?? 0,
  }

  const quickActions = [
    {
      icon: BrainIcon,
      title: "AI Coach",
      description: "Get workout & nutrition plans",
      href: "/member/ai-coach",
      color: "#8b5cf6",
      bgImage: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400"
    },
    {
      icon: UserCheckIcon,
      title: "Book Coach",
      description: "Personal training sessions",
      href: "/member/bookings",
      color: "#22c55e",
      bgImage: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400"
    },
    {
      icon: DumbbellIcon,
      title: "My Programs",
      description: "View workout plans",
      href: "/member/programs",
      color: "#3b82f6",
      bgImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400"
    },
    {
      icon: CreditCardIcon,
      title: "Subscriptions",
      description: "Manage your plan",
      href: "/member/subscriptions",
      color: "#f59e0b",
      bgImage: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400"
    },
  ]

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { text: "Pending", class: "badge-warning" },
      1: { text: "Confirmed", class: "badge-success" },
      2: { text: "Cancelled", class: "badge-danger" },
      3: { text: "Completed", class: "badge-info" },
      4: { text: "No Show", class: "badge-secondary" },
    }
    return statusMap[status] || { text: "Unknown", class: "badge-secondary" }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <DashboardLayout role="Member">
      {/* Hero Banner with Gym Background */}
      <div className="hero-banner" style={{
        background: 'linear-gradient(135deg, #ff6b35 0%, #dc2626 100%)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '2rem'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
          maskImage: 'linear-gradient(to left, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to left, black, transparent)'
        }} />
        <div className="hero-content" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="hero-title" style={{ color: 'white', fontSize: '2rem' }}>
            Welcome back, {user?.name?.split(' ')[0] || "Champion"}! 💪
          </h1>
          <p className="hero-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Ready to crush your fitness goals today?
          </p>
        </div>
        {/* Token Balance Badge */}
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          padding: '0.75rem 1.25rem',
          borderRadius: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'white'
        }}>
          <ZapIcon style={{ width: 20, height: 20 }} />
          <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{user?.tokenBalance ?? 0}</span>
          <span style={{ opacity: 0.9 }}>tokens</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-cols-4 mb-8">
        <div className="stat-card orange">
          <div className="stat-icon" style={{ background: 'rgba(255, 107, 53, 0.1)', color: '#ff6b35' }}>
            <DumbbellIcon />
          </div>
          <div>
            <div className="stat-value">{loading ? "..." : displayStats.completedWorkouts}</div>
            <div className="stat-label">Workouts Completed</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <ActivityIcon />
          </div>
          <div>
            <div className="stat-value">
              {loading ? "..." : displayStats.bodyFatPercentage > 0 ? `${displayStats.bodyFatPercentage}%` : "N/A"}
            </div>
            <div className="stat-label">Body Fat</div>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <CalendarIcon />
          </div>
          <div>
            <div className="stat-value">{loading ? "..." : displayStats.totalBookings}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <TrophyIcon />
          </div>
          <div>
            <div className="stat-value">
              {loading ? "..." : displayStats.currentWeight > 0 ? `${displayStats.currentWeight}kg` : "N/A"}
            </div>
            <div className="stat-label">Current Weight</div>
          </div>
        </div>
      </div>

      {/* Quick Actions with Gym Images */}
      <div className="mb-8">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--foreground)' }}>
          Quick Actions
        </h2>
        <div className="grid-cols-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href} style={{ textDecoration: 'none' }}>
              <div className="quick-action-card" style={{
                position: 'relative',
                overflow: 'hidden',
                minHeight: '160px'
              }}>
                {/* Background Image */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url(${action.bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.15
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div className="quick-action-icon" style={{ background: `${action.color}15`, color: action.color }}>
                    <action.icon />
                  </div>
                  <h3 className="quick-action-title">{action.title}</h3>
                  <p className="quick-action-subtitle">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid-cols-2">
        {/* Recent Bookings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Bookings</h3>
            <Link to="/member/bookings" className="btn btn-ghost btn-sm">
              View All <ArrowRightIcon style={{ width: 16, height: 16 }} />
            </Link>
          </div>
          <div className="card-content" style={{ padding: 0 }}>
            {loading ? (
              <div className="empty-state">
                <div className="loading-spinner"></div>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="empty-state">
                <CalendarIcon style={{ width: 48, height: 48, opacity: 0.3 }} />
                <p className="empty-state-title">No bookings yet</p>
                <p className="empty-state-description">Start by booking equipment or a coach session</p>
                <Link to="/member/bookings" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                  Make a Booking
                </Link>
              </div>
            ) : (
              <div>
                {recentBookings.map((booking) => {
                  const status = getStatusBadge(booking.status)
                  return (
                    <div key={booking.bookingId} style={{
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                          {booking.equipmentName || booking.coachName || 'Session'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)' }}>
                          {formatDate(booking.startTime)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge ${status.class}`}>{status.text}</span>
                        {(booking.status === 0 || booking.status === 1) && (
                          <button 
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => {
                              e.preventDefault()
                              handleCancelBooking(booking.bookingId, booking.equipmentName || booking.coachName)
                            }}
                            title="Cancel booking"
                            style={{ padding: '0.25rem' }}
                          >
                            <XIcon style={{ width: 16, height: 16 }} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Fitness Progress */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Fitness Progress</h3>
            <Link to="/member/progress" className="btn btn-ghost btn-sm">
              Details <ArrowRightIcon style={{ width: 16, height: 16 }} />
            </Link>
          </div>
          <div className="card-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--foreground-muted)' }}>Active Workout Plans</span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{stats?.activeWorkoutPlans || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--foreground-muted)' }}>Active Nutrition Plans</span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{stats?.activeNutritionPlans || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--foreground-muted)' }}>InBody Measurements</span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{stats?.inBodyMeasurements || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--foreground-muted)' }}>Latest BMI</span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{stats?.latestBmi?.toFixed(1) || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0' }}>
                <span style={{ color: 'var(--foreground-muted)' }}>Subscription Status</span>
                <span className={`badge ${stats?.activeSubscriptionId ? 'badge-success' : 'badge-warning'}`}>
                  {stats?.activeSubscriptionId ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default MemberDashboard
