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
import './Dashboard.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// Icons - Modern Filled Style
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
)

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
)

const FitnessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
  </svg>
)

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
)

const AccessibilityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
  </svg>
)

const QrCodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"/>
  </svg>
)

const PersonAddIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
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

  const gymGreen = '#10B981'
  const gymGreenDark = '#059669'

  const hourlyChartData = {
    labels: ['8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'],
    datasets: [{
      label: 'Check-ins',
      data: [5, 12, 18, 8, 15, 25, 20],
      backgroundColor: (context) => {
        const ctx = context.chart.ctx
        const gradient = ctx.createLinearGradient(0, 0, 0, 200)
        gradient.addColorStop(0, gymGreen)
        gradient.addColorStop(1, gymGreenDark)
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
      backgroundColor: [gymGreen, '#3b82f6', '#8b5cf6', '#f59e0b'],
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
    { icon: QrCodeIcon, title: "Check-In", href: "/reception/checkin", primary: true },
    { icon: PersonAddIcon, title: "Register", href: "/reception/new-member" },
    { icon: CalendarIcon, title: "Bookings", href: "/reception/bookings" },
    { icon: CreditCardIcon, title: "Payment", href: "/reception/payments" }
  ]

  const statCards = [
    { icon: <UsersIcon />, label: 'Members Checked In', value: stats?.totalMembersToday || 0, change: '+12%', iconClass: 'blue' },
    { icon: <FitnessIcon />, label: 'Active Sessions', value: 8, change: '0%', iconClass: 'orange', neutral: true },
    { icon: <HeartIcon />, label: 'Equip. in Use', value: stats?.equipmentBookings || 42, change: '+5%', iconClass: 'purple' },
    { icon: <AccessibilityIcon />, label: 'Scans Scheduled', value: 14, change: '+2%', iconClass: 'teal' }
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
      <div className="reception-dashboard">
        {/* Header */}
        <div className="reception-header">
          <div className="reception-greeting">
            <h1>Good Morning, {user?.name?.split(' ')[0] || 'Sarah'} 👋</h1>
            <p>Here's what's happening at PulseGym today.</p>
          </div>
          <div className="reception-live-indicator">
            <span className="reception-live-dot"></span>
            <span className="reception-live-count">{stats?.currentlyInGym || 23}</span>
            <span className="reception-live-label">currently in gym</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="reception-stats-grid">
          {statCards.map((stat, idx) => (
            <div key={idx} className="reception-stat-card">
              <div className="reception-stat-top">
                <div className={`reception-stat-icon ${stat.iconClass}`}>
                  {stat.icon}
                </div>
                <span className={`reception-stat-badge ${stat.neutral ? 'neutral' : 'positive'}`}>
                  {!stat.neutral && <TrendingUpIcon />}
                  {stat.change}
                </span>
              </div>
              <div className="reception-stat-bottom">
                <p className="reception-stat-label">{stat.label}</p>
                <h2 className="reception-stat-value">{stat.value}</h2>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="reception-quick-actions">
          <h3 className="reception-section-title">Quick Actions</h3>
          <div className="reception-actions-grid">
            {quickActions.map((action, index) => (
              <Link 
                key={index} 
                to={action.href} 
                className={`reception-action-btn ${action.primary ? 'primary' : 'secondary'}`}
              >
                <div className="reception-action-icon">
                  <action.icon />
                </div>
                <span className="reception-action-label">{action.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="reception-cards-grid">
          {/* Live Activity Feed */}
          <div className="reception-card">
            <div className="reception-card-header">
              <h3 className="reception-card-title">Live Activity</h3>
              <Link to="/reception/checkin" className="reception-card-link">View All</Link>
            </div>
            <div className="reception-card-content">
              <div className="reception-activity-list">
                {recentCheckins.map(checkin => (
                  <div key={checkin.id} className="reception-activity-item">
                    <div className="reception-activity-avatar">
                      <div className={`reception-avatar ${checkin.status === 'in' ? 'checkin' : 'checkout'}`}>
                        {checkin.name.charAt(0)}
                      </div>
                      <div className={`reception-avatar-badge ${checkin.status === 'in' ? 'success' : 'info'}`}>
                        <CheckIcon />
                      </div>
                    </div>
                    <div className="reception-activity-content">
                      <p className="reception-activity-message">
                        <strong>{checkin.name}</strong> {checkin.status === 'in' ? 'checked in' : 'checked out'}
                      </p>
                    </div>
                    <span className="reception-activity-time">{checkin.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hourly Traffic Chart */}
          <div className="reception-card">
            <div className="reception-card-header">
              <h3 className="reception-card-title">Hourly Traffic</h3>
            </div>
            <div className="reception-card-content">
              <div className="reception-chart-container">
                <Bar data={hourlyChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Membership Distribution */}
        <div className="reception-card">
          <div className="reception-card-header">
            <h3 className="reception-card-title">Membership Distribution</h3>
          </div>
          <div className="reception-card-content">
            <div className="reception-chart-container">
              <Doughnut data={membershipChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ReceptionDashboard
