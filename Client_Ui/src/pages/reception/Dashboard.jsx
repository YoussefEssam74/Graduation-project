import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { statsService } from '../../services/statsService'
import { bookingService } from '../../services/bookingService'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
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

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
)

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const LogInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>
  </svg>
)

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
)

function ReceptionDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentCheckins, setRecentCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, checkinsData] = await Promise.all([
        statsService.getReceptionStats().catch(() => null),
        bookingService.getTodayCheckins().catch(() => [])
      ])
      
      setStats(statsData || {
        totalMembersToday: 45,
        currentlyInGym: 23,
        newRegistrations: 5,
        pendingPayments: 8,
        equipmentBookings: 12,
        expiringSubscriptions: 3
      })
      setRecentCheckins(checkinsData || [
        { id: 1, name: 'Ahmed Hassan', time: '10:30 AM', type: 'Check In', status: 'in' },
        { id: 2, name: 'Sara Mohamed', time: '10:25 AM', type: 'Check Out', status: 'out' },
        { id: 3, name: 'Omar Ali', time: '10:15 AM', type: 'Check In', status: 'in' },
        { id: 4, name: 'Nour Ahmed', time: '10:00 AM', type: 'Check In', status: 'in' }
      ])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const gymOrange = '#ff6b35'
  const gymOrangeDark = '#e55a2b'

  const hourlyChartData = {
    labels: ['8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'],
    datasets: [{
      label: 'Check-ins',
      data: [5, 12, 18, 8, 15, 25, 20],
      backgroundColor: (context) => {
        const ctx = context.chart.ctx
        const gradient = ctx.createLinearGradient(0, 0, 0, 200)
        gradient.addColorStop(0, gymOrange)
        gradient.addColorStop(1, gymOrangeDark)
        return gradient
      },
      borderRadius: 6,
      borderSkipped: false
    }]
  }

  const membershipChartData = {
    labels: ['Monthly', 'Quarterly', 'Annual', 'Pay-per-visit'],
    datasets: [{
      data: [45, 25, 20, 10],
      backgroundColor: [gymOrange, '#3b82f6', '#22c55e', '#f59e0b'],
      borderWidth: 0
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1e293b',
        bodyColor: '#64748b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b' }
      },
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b' }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#64748b',
          padding: 20,
          usePointStyle: true
        }
      }
    },
    cutout: '70%'
  }

  const quickActions = [
    { icon: LogInIcon, title: "Check-in", description: "Member check-in", href: "/reception/checkin", iconClass: "icon-blue" },
    { icon: UserPlusIcon, title: "New Member", description: "Register member", href: "/reception/new-member", iconClass: "icon-purple" },
    { icon: CalendarIcon, title: "Bookings", description: "View bookings", href: "/reception/bookings", iconClass: "icon-green" },
    { icon: CreditCardIcon, title: "Payments", description: "Process payments", href: "/reception/payments", iconClass: "icon-emerald" }
  ]

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
            <span className="text-foreground">Reception </span>
            <span className="text-primary">Dashboard</span>
          </h1>
          <p>Welcome back, {user?.name?.split(' ')[0] || 'Receptionist'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ActivityIcon style={{ width: 20, height: 20, color: 'var(--success)' }} />
          <span style={{ fontWeight: 600, color: 'var(--success)' }}>{stats?.currentlyInGym || 0}</span>
          <span style={{ color: 'var(--muted-foreground)' }}>currently in gym</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-cols-4 mb-6">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <UsersIcon />
            </div>
          </div>
          <div className="stat-value">{stats?.totalMembersToday || 0}</div>
          <div className="stat-label">Members Today</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ color: 'var(--success)' }}>
              <UserPlusIcon />
            </div>
            <span className="badge badge-success">New</span>
          </div>
          <div className="stat-value">{stats?.newRegistrations || 0}</div>
          <div className="stat-label">New Registrations</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ color: 'var(--warning)' }}>
              <CreditCardIcon />
            </div>
            {stats?.pendingPayments > 0 && <span className="badge badge-warning">Pending</span>}
          </div>
          <div className="stat-value">{stats?.pendingPayments || 0}</div>
          <div className="stat-label">Pending Payments</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ color: 'var(--danger)' }}>
              <AlertIcon />
            </div>
            {stats?.expiringSubscriptions > 0 && <span className="badge badge-danger">Alert</span>}
          </div>
          <div className="stat-value">{stats?.expiringSubscriptions || 0}</div>
          <div className="stat-label">Expiring Soon</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="mb-4">
          <span className="text-foreground">Quick </span>
          <span className="text-primary">Actions</span>
        </h2>
        <div className="grid-cols-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href}>
              <div className="quick-action-card">
                <div className={`quick-action-icon ${action.iconClass}`}>
                  <action.icon />
                </div>
                <h3 className="quick-action-title">{action.title}</h3>
                <p className="quick-action-description">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
        {/* Hourly Check-ins Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="text-foreground">Hourly </span>
              <span className="text-primary">Traffic</span>
            </h3>
          </div>
          <div className="card-content">
            <div style={{ height: 250 }}>
              <Bar data={hourlyChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Membership Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="text-foreground">Membership </span>
              <span className="text-primary">Types</span>
            </h3>
          </div>
          <div className="card-content">
            <div style={{ height: 250 }}>
              <Doughnut data={membershipChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Check-ins */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">
            <span className="text-foreground">Recent </span>
            <span className="text-primary">Activity</span>
          </h3>
          <Link to="/reception/checkin" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        <div className="card-content">
          {recentCheckins.length === 0 ? (
            <div className="empty-state">
              <UsersIcon className="empty-state-icon" />
              <p className="empty-state-title">No activity yet</p>
              <p className="empty-state-description">Check-ins will appear here</p>
            </div>
          ) : (
            <div className="data-list">
              {recentCheckins.map(checkin => (
                <div key={checkin.id} className="data-list-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: checkin.status === 'in' 
                        ? 'linear-gradient(135deg, #ff6b35, #e55a2b)'
                        : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: checkin.status === 'in' ? '#ffffff' : '#64748b'
                    }}>
                      {checkin.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{checkin.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        <ClockIcon />
                        {checkin.time}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {checkin.status === 'in' ? (
                      <LogInIcon style={{ color: 'var(--success)' }} />
                    ) : (
                      <LogOutIcon style={{ color: 'var(--muted-foreground)' }} />
                    )}
                    <span className={`badge ${checkin.status === 'in' ? 'badge-success' : 'badge-secondary'}`}>
                      {checkin.type}
                    </span>
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

export default ReceptionDashboard
