import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { statsService } from '../../services/statsService'
import { userService } from '../../services/userService'
import './Dashboard.css'

// Icons
const GroupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58A2.01 2.01 0 000 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85A6.95 6.95 0 0020 14c-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
  </svg>
)

const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
  </svg>
)

const PaymentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
  </svg>
)

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
)

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
)

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
  </svg>
)

const CalendarTodayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
  </svg>
)

const AddCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
  </svg>
)

const ScaleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
  </svg>
)

const CampaignIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z"/>
  </svg>
)

const AnalyticsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
  </svg>
)

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
)

const CalendarMonthIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
  </svg>
)

function CoachDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [clients, setClients] = useState([])
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, clientsData] = await Promise.all([
        statsService.getCoachStats(user.userId).catch(() => null),
        userService.getCoachClients(user.userId).catch(() => [])
      ])
      
      setStats(statsData || {
        totalClients: 12,
        activePlans: 8,
        sessionsThisMonth: 38,
        averageRating: 4.9,
        tokensEarned: 1250
      })
      setClients(clientsData || [])
      setUpcomingSessions([
        { id: 1, clientName: 'Sarah Jenkins', time: '09:00', type: 'HIIT', location: 'Gym Floor A', status: 'completed', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
        { id: 2, clientName: 'Mike Thompson', time: '11:00', type: 'Strength Training', location: 'Weight Room', status: 'active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', focus: ['Deadlifts 5x5', 'OHP 4x8', 'Pullups 3xMax'] },
        { id: 3, clientName: 'Emma Watson', time: '14:00', type: 'Video Consultation', location: 'Zoom', status: 'upcoming', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' }
      ])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const upcomingWeek = [
    { day: 'Tomorrow', sessions: 6 },
    { day: 'Wednesday', sessions: 4 },
    { day: 'Thursday', sessions: 8 }
  ]

  const recentMessages = [
    { name: 'Mike T.', message: "Running late! Can we start at 11:15?", time: '2m ago', online: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { name: 'Sarah L.', message: "Loved the new leg day routine! 🔥", time: '1h ago', online: false, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { name: 'David K.', message: "Is protein powder necessary for...", time: '3h ago', online: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }
  ]

  if (loading) {
    return (
      <DashboardLayout role="Coach">
        <div className="coach-dashboard">
          <div className="coach-schedule-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Coach">
      <div className="coach-dashboard">
        {/* Header */}
        <div className="coach-header">
          <div className="coach-greeting">
            <h1>Good Morning, Coach {user?.name?.split(' ')[0] || 'Coach'}! <span className="emoji">⚡</span></h1>
            <p>You have <span className="highlight">{upcomingSessions.length} sessions</span> today. Let's crush it!</p>
          </div>
          <div className="coach-header-right">
            <div className="rating-badge">
              <StarIcon />
              <span className="rating-value">{stats?.averageRating || 4.9}</span>
              <span className="rating-count">(128 reviews)</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="coach-stats-grid">
          <div className="coach-stat-card">
            <div className="coach-stat-header">
              <div className="coach-stat-icon blue">
                <GroupIcon />
              </div>
              <span className="coach-stat-badge green">
                <TrendingUpIcon /> +2 this week
              </span>
            </div>
            <p className="coach-stat-label">Total Clients</p>
            <h3 className="coach-stat-value">{stats?.totalClients || 42}</h3>
          </div>

          <div className="coach-stat-card">
            <div className="coach-stat-header">
              <div className="coach-stat-icon orange">
                <DumbbellIcon />
              </div>
              <span className="coach-stat-badge slate">On track</span>
            </div>
            <p className="coach-stat-label">Sessions (Oct)</p>
            <h3 className="coach-stat-value">{stats?.sessionsThisMonth || 38}</h3>
          </div>

          <div className="coach-stat-card">
            <div className="coach-stat-header">
              <div className="coach-stat-icon green">
                <PaymentsIcon />
              </div>
              <span className="coach-stat-badge green">
                <TrendingUpIcon /> 12%
              </span>
            </div>
            <p className="coach-stat-label">Earnings (Tokens)</p>
            <h3 className="coach-stat-value">{stats?.tokensEarned || '1,250'}</h3>
          </div>

          <div className="coach-stat-card">
            <div className="coach-stat-header">
              <div className="coach-stat-icon purple">
                <StarIcon />
              </div>
              <span className="coach-stat-badge purple">Top 5%</span>
            </div>
            <p className="coach-stat-label">Avg Rating</p>
            <h3 className="coach-stat-value">{stats?.averageRating || 4.9}</h3>
          </div>
        </div>

        {/* Alert Banner */}
        <div className="alert-banner">
          <div className="alert-content">
            <div className="alert-icon">
              <WarningIcon />
            </div>
            <div className="alert-text">
              <h4>Action Required</h4>
              <p>You have <span className="accent">3 Program Reviews</span> pending.</p>
            </div>
          </div>
          <Link to="/coach/programs" className="alert-btn">Review Now</Link>
        </div>

        {/* Main Grid */}
        <div className="coach-main-grid">
          {/* Left Column - Schedule */}
          <div className="coach-schedule-card">
            <div className="coach-schedule-header">
              <h3>
                <CalendarTodayIcon />
                Today's Schedule
              </h3>
              <Link to="/coach/schedule">View Calendar</Link>
            </div>
            <div className="coach-timeline">
              {upcomingSessions.map((session, index) => (
                <div key={session.id} className="coach-timeline-item">
                  <div className={`coach-timeline-time ${session.status === 'active' ? 'active' : ''}`}>
                    <span>{session.time}</span>
                    <div className="coach-timeline-line">
                      <div className={`coach-timeline-dot ${session.status}`}></div>
                    </div>
                  </div>
                  <div className="coach-timeline-content">
                    <div className={`coach-session-card ${session.status}`}>
                      <div className="coach-session-header">
                        <div className="coach-session-client">
                          <div 
                            className="coach-client-avatar"
                            style={{ backgroundImage: `url(${session.avatar})` }}
                          ></div>
                          <div className="coach-client-info">
                            <h4>{session.clientName}</h4>
                            <p className={session.status === 'active' ? 'primary' : 'muted'}>
                              {session.type} • {session.location}
                            </p>
                          </div>
                        </div>
                        {session.status === 'completed' && (
                          <span className="coach-session-status completed">Completed</span>
                        )}
                      </div>
                      
                      {session.status === 'active' && (
                        <>
                          <div className="coach-session-actions">
                            <button className="btn-check-in">Check In</button>
                            <button className="btn-no-show" title="Mark No Show">
                              <CloseIcon />
                            </button>
                          </div>
                          {session.focus && (
                            <div className="coach-session-focus">
                              <p>Focus Today</p>
                              <div className="coach-focus-tags">
                                {session.focus.map((item, i) => (
                                  <span key={i} className="coach-focus-tag">{item}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Quick Actions */}
            <div className="coach-quick-actions">
              <Link to="/coach/programs" className="coach-quick-action primary">
                <AddCircleIcon />
                <span>New Plan</span>
              </Link>
              <Link to="/coach/clients" className="coach-quick-action secondary">
                <ScaleIcon className="green" />
                <span>Log Metrics</span>
              </Link>
              <Link to="/coach/messages" className="coach-quick-action secondary">
                <CampaignIcon className="orange" />
                <span>Broadcast</span>
              </Link>
              <Link to="/coach/analytics" className="coach-quick-action secondary">
                <AnalyticsIcon className="purple" />
                <span>Analytics</span>
              </Link>
            </div>

            {/* Messages Widget */}
            <div className="coach-messages-card">
              <div className="coach-messages-header">
                <h3>Recent Messages</h3>
                <Link to="/coach/messages">See All</Link>
              </div>
              <div className="coach-message-list">
                {recentMessages.map((msg, index) => (
                  <div key={index} className="coach-message-item">
                    <div className="coach-message-avatar">
                      <img src={msg.avatar} alt={msg.name} />
                      {msg.online && <div className="online-dot"></div>}
                    </div>
                    <div className="coach-message-content">
                      <div className="coach-message-top">
                        <h4>{msg.name}</h4>
                        <span>{msg.time}</span>
                      </div>
                      <p>{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="coach-message-input">
                <input type="text" placeholder="Quick reply..." />
              </div>
            </div>

            {/* Upcoming Week */}
            <div className="coach-upcoming-card">
              <h3>Next 7 Days</h3>
              <div className="coach-upcoming-list">
                {upcomingWeek.map((item, index) => (
                  <div key={index} className="coach-upcoming-item">
                    <div className="coach-upcoming-day">
                      <CalendarMonthIcon />
                      <span>{item.day}</span>
                    </div>
                    <span className="coach-upcoming-count">{item.sessions} Sessions</span>
                  </div>
                ))}
              </div>
              <button className="coach-availability-btn">Manage Availability</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CoachDashboard
