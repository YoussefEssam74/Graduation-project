import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { statsService } from '../../services/statsService'
import './Dashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// Icons - Filled modern style
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
)

const DollarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
  </svg>
)

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
)

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
)

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalCoaches: 0,
    monthlyRevenue: 0,
    newMembersThisMonth: 0,
    equipmentCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setStats({
        totalMembers: 245,
        activeMembers: 189,
        totalCoaches: 12,
        monthlyRevenue: 125000,
        newMembersThisMonth: 34,
        equipmentCount: 48
      })
      setRecentActivity([
        { id: 1, type: 'registration', message: 'New member registered: Ahmed Hassan', time: '10 mins ago' },
        { id: 2, type: 'payment', message: 'Payment received: 500 EGP from Sara Mohamed', time: '25 mins ago' },
        { id: 3, type: 'booking', message: 'Equipment booked: Treadmill #3 by Omar Ali', time: '1 hour ago' },
        { id: 4, type: 'checkin', message: 'Member checked in: Nour Ahmed', time: '2 hours ago' }
      ])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Revenue Chart - Bright orange theme
  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue (EGP)',
      data: [95000, 102000, 98000, 115000, 120000, 125000],
      fill: true,
      borderColor: '#ff6b35',
      backgroundColor: 'rgba(255, 107, 53, 0.1)',
      tension: 0.4,
      pointBackgroundColor: '#ff6b35',
      pointBorderColor: '#ff6b35',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#ff6b35'
    }]
  }

  // Membership Distribution - Bright colors
  const membershipChartData = {
    labels: ['Basic', 'Premium', 'Elite'],
    datasets: [{
      data: [120, 85, 40],
      backgroundColor: ['#22c55e', '#ff6b35', '#8b5cf6'],
      borderColor: ['#fff', '#fff', '#fff'],
      borderWidth: 3
    }]
  }

  // Weekly Check-ins - Gradient orange
  const checkinsChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Check-ins',
      data: [145, 132, 158, 142, 175, 198, 89],
      backgroundColor: '#ff6b35',
      borderRadius: 8
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#666' }
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#666' }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#333', padding: 20, font: { weight: '600' } }
      }
    }
  }

  const statCards = [
    { icon: <UsersIcon />, label: 'Total Members', value: stats.totalMembers, change: '+12%', hint: 'All registered members' },
    { icon: <TrendingUpIcon />, label: 'New This Month', value: stats.newMembersThisMonth, change: '+8%', hint: 'New registrations' },
    { icon: <ActivityIcon />, label: 'Active Now', value: stats.activeMembers, change: 'Live', hint: 'Currently in gym', isLive: true },
    { icon: <DollarIcon />, label: 'Monthly Revenue', value: `${(stats.monthlyRevenue / 1000).toFixed(0)}K EGP`, change: '+15%', hint: 'This month' }
  ]

  if (loading) {
    return (
      <DashboardLayout role="Admin">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="loading-spinner"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Admin">
      <div className="admin-dashboard">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-greeting">
            <h1>Admin Dashboard</h1>
            <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="admin-header-actions">
            <button className="btn-export">
              <DownloadIcon />
              Export Report
            </button>
            <Link to="/admin/members/add" className="btn-add-member">
              <PlusIcon />
              Add Member
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          {statCards.map((stat, idx) => (
            <div key={idx} className="admin-stat-card">
              <div className="admin-stat-bg-icon">{stat.icon}</div>
              <div className="admin-stat-content">
                <p className="admin-stat-label">{stat.label}</p>
                <div className="admin-stat-value-row">
                  <h2 className="admin-stat-value">
                    {stat.value}
                    {stat.isLive && <span className="admin-live-dot"></span>}
                  </h2>
                  <span className={`admin-stat-badge ${stat.isLive ? 'stable' : 'positive'}`}>
                    {!stat.isLive && <TrendingUpIcon />}
                    {stat.change}
                  </span>
                </div>
                <p className="admin-stat-hint">{stat.hint}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="admin-charts-grid">
          {/* Revenue Chart */}
          <div className="admin-chart-card">
            <div className="admin-chart-header">
              <div>
                <h3 className="admin-chart-title">Revenue Overview</h3>
                <p className="admin-chart-subtitle">Monthly revenue trends</p>
              </div>
              <span className="admin-chart-period">Last 6 Months</span>
            </div>
            <div className="admin-chart-container">
              <Line data={revenueChartData} options={chartOptions} />
            </div>
          </div>

          {/* Membership Distribution */}
          <div className="admin-chart-card">
            <div className="admin-chart-header">
              <div>
                <h3 className="admin-chart-title">Membership Plans</h3>
                <p className="admin-chart-subtitle">Distribution by plan</p>
              </div>
            </div>
            <div className="admin-chart-container">
              <Doughnut data={membershipChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="admin-bottom-grid">
          {/* Weekly Check-ins */}
          <div className="admin-chart-card">
            <div className="admin-chart-header">
              <div>
                <h3 className="admin-chart-title">Weekly Check-ins</h3>
                <p className="admin-chart-subtitle">Member attendance this week</p>
              </div>
            </div>
            <div className="admin-chart-container" style={{ height: '220px' }}>
              <Bar data={checkinsChartData} options={chartOptions} />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-chart-card">
            <div className="admin-chart-header">
              <div>
                <h3 className="admin-chart-title">Recent Activity</h3>
                <p className="admin-chart-subtitle">Latest system events</p>
              </div>
            </div>
            <div className="admin-activity-list">
              {recentActivity.map(activity => (
                <div key={activity.id} className="admin-activity-item">
                  <div className={`admin-activity-dot ${activity.type}`}></div>
                  <div className="admin-activity-content">
                    <p className="admin-activity-message">{activity.message}</p>
                    <p className="admin-activity-time">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
