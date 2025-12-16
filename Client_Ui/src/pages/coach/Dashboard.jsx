import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { statsService } from '../../services/statsService'
import { userService } from '../../services/userService'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Icons
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
)

const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
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
        sessionsThisWeek: 24,
        averageRating: 4.8
      })
      setClients(clientsData || [])
      setUpcomingSessions([
        { id: 1, clientName: 'Ahmed Hassan', time: '10:00 AM', type: 'Personal Training' },
        { id: 2, clientName: 'Sara Mohamed', time: '12:00 PM', type: 'Program Review' },
        { id: 3, clientName: 'Omar Ali', time: '3:00 PM', type: 'InBody Check' }
      ])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Chart colors - bright gym theme
  const primaryOrange = '#ff6b35'
  const primaryGreen = '#22c55e'

  const sessionsChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Sessions',
      data: [4, 6, 3, 5, 8, 4, 2],
      backgroundColor: (context) => {
        const ctx = context.chart.ctx
        const gradient = ctx.createLinearGradient(0, 0, 0, 200)
        gradient.addColorStop(0, primaryOrange)
        gradient.addColorStop(1, '#ff8c42')
        return gradient
      },
      borderRadius: 8,
      borderSkipped: false
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#333',
        titleColor: '#fff',
        bodyColor: '#ccc',
        borderColor: '#ff6b35',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: '#e0e0e0' },
        ticks: { color: '#666' }
      },
      x: {
        grid: { color: '#e0e0e0' },
        ticks: { color: '#666' }
      }
    }
  }

  const quickActions = [
    { icon: PlusIcon, title: "Create Plan", description: "New workout plan", href: "/coach/programs", color: '#ff6b35' },
    { icon: UsersIcon, title: "View Clients", description: "Manage clients", href: "/coach/clients", color: '#3b82f6' },
    { icon: CalendarIcon, title: "Schedule", description: "View sessions", href: "/coach/schedule", color: '#22c55e' },
    { icon: UserIcon, title: "Profile", description: "Edit profile", href: "/coach/profile", color: '#9333ea' }
  ]

  if (loading) {
    return (
      <DashboardLayout role="Coach">
        <div className="empty-state" style={{ minHeight: 400, background: 'white', borderRadius: '1rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Coach">
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Welcome back, <span style={{ color: '#ff6b35' }}>Coach {user?.name?.split(' ')[0] || 'Coach'}</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Here's your coaching overview for today
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ 
              background: 'rgba(255,193,7,0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              border: '1px solid rgba(255,193,7,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <StarIcon style={{ width: 18, height: 18, color: '#fbbf24' }} />
              <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>{stats?.averageRating || 4.8}</span>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ 
          border: '2px solid #ff6b35',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
            padding: '1rem',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <UsersIcon style={{ width: 24, height: 24 }} />
            <TrendingUpIcon style={{ width: 18, height: 18, opacity: 0.8 }} />
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>{stats?.totalClients || 0}</div>
            <div style={{ color: '#666', fontWeight: '500' }}>Total Clients</div>
          </div>
        </div>

        <div className="card" style={{ 
          border: '2px solid #22c55e',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #22c55e, #4ade80)',
            padding: '1rem',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <ClipboardIcon style={{ width: 24, height: 24 }} />
            <span style={{ 
              background: 'rgba(255,255,255,0.2)',
              padding: '0.2rem 0.5rem',
              borderRadius: '1rem',
              fontSize: '0.7rem',
              fontWeight: '600'
            }}>Active</span>
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>{stats?.activePlans || 0}</div>
            <div style={{ color: '#666', fontWeight: '500' }}>Active Plans</div>
          </div>
        </div>

        <div className="card" style={{ 
          border: '2px solid #3b82f6',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            padding: '1rem',
            color: 'white'
          }}>
            <CalendarIcon style={{ width: 24, height: 24 }} />
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>{stats?.sessionsThisWeek || 0}</div>
            <div style={{ color: '#666', fontWeight: '500' }}>Sessions This Week</div>
          </div>
        </div>

        <div className="card" style={{ 
          border: '2px solid #fbbf24',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #fbbf24, #fcd34d)',
            padding: '1rem',
            color: 'white'
          }}>
            <StarIcon style={{ width: 24, height: 24 }} />
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>{stats?.averageRating || 0}</div>
            <div style={{ color: '#666', fontWeight: '500' }}>Average Rating</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#333' }}>
          Quick <span style={{ color: '#ff6b35' }}>Actions</span>
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '1rem' 
        }}>
          {quickActions.map((action, idx) => (
            <Link 
              key={idx}
              to={action.href}
              style={{ textDecoration: 'none' }}
            >
              <div className="card" style={{ 
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '1rem',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = action.color
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 8px 25px ${action.color}20`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e0e0e0'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              >
                <div style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: `${action.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: action.color
                }}>
                  <action.icon />
                </div>
                <div>
                  <h4 style={{ fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>{action.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#666' }}>{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Sessions Chart */}
        <div className="card" style={{ 
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '1rem 1.5rem',
            borderBottom: '2px solid #ff6b35',
            background: '#f8f9fa'
          }}>
            <h3 style={{ fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon style={{ width: 20, height: 20, color: '#ff6b35' }} />
              Sessions <span style={{ color: '#ff6b35' }}>This Week</span>
            </h3>
          </div>
          <div style={{ padding: '1.5rem', height: '250px' }}>
            <Bar data={sessionsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Today's Sessions */}
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
              Today's <span style={{ color: '#22c55e' }}>Sessions</span>
            </h3>
            <span style={{ 
              background: '#22c55e',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '1rem',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>{upcomingSessions.length} scheduled</span>
          </div>
          <div style={{ padding: '1rem' }}>
            {upcomingSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <ClockIcon style={{ width: 40, height: 40, color: '#ccc', marginBottom: '0.5rem' }} />
                <p>No sessions scheduled for today</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcomingSessions.map((session, idx) => (
                  <div key={session.id} style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: idx === 0 ? '#fff8f5' : '#f8f9fa',
                    borderRadius: '0.75rem',
                    border: idx === 0 ? '1px solid #ffe0d5' : '1px solid #e0e0e0'
                  }}>
                    <div style={{ 
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#ff6b35' : '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: idx === 0 ? 'white' : '#666',
                      fontWeight: '700',
                      fontSize: '0.9rem'
                    }}>
                      {session.clientName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
                        {session.clientName}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: '#666' }}>{session.type}</p>
                    </div>
                    <div style={{ 
                      background: '#f0f0f0',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      color: '#555',
                      fontSize: '0.9rem'
                    }}>
                      {session.time}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Clients */}
      <div className="card" style={{ 
        marginTop: '2rem',
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '1rem',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '1rem 1.5rem',
          borderBottom: '2px solid #3b82f6',
          background: '#f8f9fa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UsersIcon style={{ width: 20, height: 20, color: '#3b82f6' }} />
            Recent <span style={{ color: '#3b82f6' }}>Clients</span>
          </h3>
          <Link to="/coach/clients" style={{ 
            color: '#3b82f6',
            fontWeight: '600',
            textDecoration: 'none',
            fontSize: '0.9rem'
          }}>View All →</Link>
        </div>
        <div style={{ padding: '1rem' }}>
          {clients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <UsersIcon style={{ width: 40, height: 40, color: '#ccc', marginBottom: '0.5rem' }} />
              <p>No clients yet</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '1rem' 
            }}>
              {clients.slice(0, 6).map((client, idx) => (
                <div key={client.userId || idx} style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '0.75rem',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ 
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {client.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>
                      {client.name || 'Client'}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>{client.email || 'No email'}</p>
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

export default CoachDashboard
