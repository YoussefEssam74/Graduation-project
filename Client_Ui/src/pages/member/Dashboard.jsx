import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { statsService } from '../../services/statsService'
import { bookingService } from '../../services/bookingService'
import { useToast } from '../../contexts/ToastContext'
import './Dashboard.css'

// Icons
const TokenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
  </svg>
)

const FireIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
  </svg>
)

const TimerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
  </svg>
)

const CalendarCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-7.5-5.23l-2.12-2.12-1.41 1.41L11.5 16.5l5.5-5.5-1.41-1.41z"/>
  </svg>
)

const RobotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z"/>
  </svg>
)

const PersonAddIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
)

const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
  </svg>
)

const ScaleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 8c-2.33 0-7 1.17-7 3.5V17h14v1.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
)

const AssignmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
)

const MagicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29c-.39-.39-1.02-.39-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05c.39-.39.39-1.02 0-1.41l-2.33-2.35zm-1.03 5.49l-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z"/>
  </svg>
)

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
)

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
)

const CalendarTodayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
  </svg>
)

const ChatBubbleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
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

  const quickActions = [
    { icon: RobotIcon, title: "AI Coach Chat", href: "/member/ai-coach", color: "primary" },
    { icon: PersonAddIcon, title: "Book Coach", href: "/member/bookings", color: "secondary" },
    { icon: DumbbellIcon, title: "Book Equipment", href: "/member/bookings", color: "accent" },
    { icon: ScaleIcon, title: "InBody Scan", href: "/member/progress", color: "purple" },
    { icon: AssignmentIcon, title: "View Programs", href: "/member/programs", color: "slate" },
    { icon: MagicIcon, title: "New Program", href: "/member/ai-coach", color: "pink" },
  ]

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { text: "Pending", class: "badge-pending" },
      1: { text: "Confirmed", class: "badge-confirmed" },
      2: { text: "Cancelled", class: "badge-cancelled" },
      3: { text: "Completed", class: "badge-completed" },
      4: { text: "No Show", class: "badge-noshow" },
    }
    return statusMap[status] || { text: "Unknown", class: "badge-pending" }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const isToday = date.toDateString() === now.toDateString()
    const isTomorrow = date.toDateString() === tomorrow.toDateString()
    
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    
    if (isToday) return `TODAY, ${timeStr}`
    if (isTomorrow) return `TOMORROW, ${timeStr}`
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase() + `, ${timeStr}`
  }

  const displayStats = {
    tokenBalance: user?.tokenBalance ?? 0,
    totalBookings: stats?.totalBookings ?? 0,
    completedWorkouts: stats?.totalWorkoutsCompleted ?? 0,
    streak: 14, // Mock streak data
    activityHours: 4.5,
    targetHours: 6,
  }

  return (
    <DashboardLayout role="Member">
      <div className="member-dashboard">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-background">
            <img 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200" 
              alt="Gym background"
            />
            <div className="hero-overlay"></div>
          </div>
          <div className="hero-content">
            <div className="hero-text">
              <h1>Good Morning, {user?.name?.split(' ')[0] || "Champion"}!</h1>
              <p>You're crushing it! You've hit a <span className="streak-highlight">{displayStats.streak}-day streak</span>. Let's keep the momentum going.</p>
              <div className="hero-actions">
                <Link to="/member/programs" className="btn-hero-primary">
                  <PlayIcon /> Resume Workout
                </Link>
                <Link to="/member/bookings" className="btn-hero-secondary">
                  <CalendarTodayIcon /> View Schedule
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper primary">
                <TokenIcon />
              </div>
              <span className="stat-badge">Wallet</span>
            </div>
            <p className="stat-label">Token Balance</p>
            <div className="stat-value-row">
              <h3 className="stat-value">{loading ? "..." : displayStats.tokenBalance}</h3>
              <Link to="/member/subscriptions" className="stat-link">Buy More</Link>
            </div>
          </div>

          <div className="stat-card stat-secondary">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper secondary">
                <FireIcon />
              </div>
              <span className="stat-badge">Streak</span>
            </div>
            <p className="stat-label">Current Streak</p>
            <div className="stat-value-row">
              <h3 className="stat-value">{displayStats.streak} <span className="stat-unit secondary">Days</span></h3>
            </div>
          </div>

          <div className="stat-card stat-accent">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper accent">
                <TimerIcon />
              </div>
              <span className="stat-badge">Weekly</span>
            </div>
            <p className="stat-label">Activity Hours</p>
            <div className="stat-value-row">
              <h3 className="stat-value">{displayStats.activityHours}<span className="stat-unit muted">/{displayStats.targetHours}h</span></h3>
              <div className="progress-ring">
                <svg viewBox="0 0 36 36">
                  <path className="progress-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path 
                    className="progress-fill accent" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    strokeDasharray={`${(displayStats.activityHours / displayStats.targetHours) * 100}, 100`}
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card stat-blue">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper blue">
                <CalendarCheckIcon />
              </div>
              <span className="stat-badge">Upcoming</span>
            </div>
            <p className="stat-label">Active Bookings</p>
            <div className="stat-value-row">
              <h3 className="stat-value">{loading ? "..." : displayStats.totalBookings} <span className="stat-unit muted">Sessions</span></h3>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="main-grid">
          {/* Left Column */}
          <div className="left-column">
            {/* Quick Actions */}
            <div className="section">
              <h3 className="section-title">
                <span className="section-icon">⚡</span> Quick Actions
              </h3>
              <div className="quick-actions-grid">
                {quickActions.map((action, index) => (
                  <Link key={index} to={action.href} className={`quick-action-btn ${action.color}`}>
                    <div className={`quick-action-icon ${action.color}`}>
                      <action.icon />
                    </div>
                    <span className="quick-action-label">{action.title}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Progress Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Progress Tracking</h3>
                  <p className="chart-subtitle">Weight & Body Fat %</p>
                </div>
                <div className="chart-tabs">
                  <button className="chart-tab active">1M</button>
                  <button className="chart-tab">3M</button>
                  <button className="chart-tab">6M</button>
                </div>
              </div>
              <div className="chart-container">
                <svg className="chart-svg" preserveAspectRatio="none" viewBox="0 0 600 200">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,180 C50,160 100,170 150,140 C200,100 250,120 300,80 C350,50 400,70 450,55 C500,40 550,50 600,30 L600,200 L0,200 Z" fill="url(#chartGradient)"/>
                  <path d="M0,180 C50,160 100,170 150,140 C200,100 250,120 300,80 C350,50 400,70 450,55 C500,40 550,50 600,30" fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="150" cy="140" r="4" fill="white" stroke="#3B82F6" strokeWidth="2"/>
                  <circle cx="300" cy="80" r="4" fill="white" stroke="#3B82F6" strokeWidth="2"/>
                  <circle cx="450" cy="55" r="4" fill="white" stroke="#3B82F6" strokeWidth="2"/>
                  <circle cx="600" cy="30" r="6" fill="#3B82F6" stroke="white" strokeWidth="2"/>
                </svg>
                <div className="chart-labels">
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Schedule */}
            <div className="schedule-card">
              <div className="schedule-header">
                <h3>Schedule</h3>
                <Link to="/member/bookings" className="view-all-link">View All</Link>
              </div>
              <div className="schedule-timeline">
                {loading ? (
                  <div className="schedule-loading">Loading...</div>
                ) : recentBookings.length === 0 ? (
                  <div className="schedule-empty">
                    <CalendarCheckIcon />
                    <p>No upcoming sessions</p>
                    <Link to="/member/bookings" className="btn-small-primary">Book Now</Link>
                  </div>
                ) : (
                  recentBookings.map((booking, index) => {
                    const status = getStatusBadge(booking.status)
                    const isFirst = index === 0
                    return (
                      <div key={booking.bookingId} className="schedule-item">
                        <div className={`timeline-dot ${isFirst ? 'active' : ''}`}></div>
                        <div className={`schedule-content ${isFirst ? 'highlight' : ''}`}>
                          <div className="schedule-top">
                            <span className="schedule-time">{formatDate(booking.startTime)}</span>
                            <span className={`schedule-badge ${status.class}`}>{status.text}</span>
                          </div>
                          <h4 className="schedule-title">{booking.equipmentName || booking.coachName || 'Session'}</h4>
                          <p className="schedule-subtitle">{booking.coachName ? `with ${booking.coachName}` : 'Main Floor'}</p>
                          {(booking.status === 0 || booking.status === 1) && (
                            <button 
                              className="cancel-btn"
                              onClick={() => handleCancelBooking(booking.bookingId, booking.equipmentName || booking.coachName)}
                            >
                              <XIcon /> Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Achievements */}
            <div className="achievements-card">
              <h3>Recent Achievements</h3>
              <div className="achievements-grid">
                <div className="achievement unlocked">
                  <div className="achievement-icon yellow">
                    <TrophyIcon />
                  </div>
                  <span className="achievement-label">Early Bird</span>
                </div>
                <div className="achievement unlocked">
                  <div className="achievement-icon red">
                    <DumbbellIcon />
                  </div>
                  <span className="achievement-label">Heavy Lifter</span>
                </div>
                <div className="achievement locked">
                  <div className="achievement-icon">
                    <PlayIcon />
                  </div>
                  <span className="achievement-label">Marathoner</span>
                </div>
                <div className="achievement locked">
                  <div className="achievement-icon">
                    <TrophyIcon />
                  </div>
                  <span className="achievement-label">Elite</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating AI Button */}
        <Link to="/member/ai-coach" className="floating-ai-btn">
          <span className="ai-ping"></span>
          <ChatBubbleIcon />
        </Link>
      </div>
    </DashboardLayout>
  )
}

export default MemberDashboard
