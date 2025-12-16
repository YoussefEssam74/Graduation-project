import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { statsService } from '../../services/statsService'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// Icons
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const DollarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
)

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>
  </svg>
)

const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const ArrowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="19" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
)

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>
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
    { icon: <UsersIcon />, label: 'Total Members', value: stats.totalMembers, change: '+12%', color: '#ff6b35' },
    { icon: <UserPlusIcon />, label: 'New This Month', value: stats.newMembersThisMonth, change: '+8%', color: '#22c55e' },
    { icon: <ActivityIcon />, label: 'Active Members', value: stats.activeMembers, change: '+5%', color: '#8b5cf6' },
    { icon: <DollarIcon />, label: 'Monthly Revenue', value: `${(stats.monthlyRevenue / 1000).toFixed(0)}K`, change: '+15%', color: '#f59e0b' }
  ]

  const getActivityColor = (type) => {
    switch (type) {
      case 'registration': return '#22c55e'
      case 'payment': return '#ff6b35'
      case 'booking': return '#3b82f6'
      case 'checkin': return '#8b5cf6'
      default: return '#666'
    }
  }

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
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Admin <span style={{ color: '#ff6b35' }}>Dashboard</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            System overview and analytics
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
            <CalendarIcon style={{ width: 18, height: 18, color: '#ff6b35' }} />
            <span style={{ color: 'white', fontWeight: '600' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {statCards.map((stat, idx) => (
          <div key={idx} className="card" style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '1rem',
            padding: '1.5rem',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color
              }}>
                {stat.icon}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: '#dcfce7',
                color: '#22c55e',
                padding: '0.25rem 0.5rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                <ArrowUpIcon />
                {stat.change}
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#333' }}>{stat.value}</p>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Revenue Chart */}
        <div className="card" style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '1rem',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333' }}>Revenue Overview</h3>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>Monthly revenue trends</p>
            </div>
            <div style={{
              background: 'rgba(255,107,53,0.1)',
              color: '#ff6b35',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}>
              Last 6 Months
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        {/* Membership Distribution */}
        <div className="card" style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '1rem',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '0.5rem' }}>
            Membership Plans
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>Distribution by plan</p>
          <div style={{ height: '250px' }}>
            <Doughnut data={membershipChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '1.5rem' 
      }}>
        {/* Weekly Check-ins */}
        <div className="card" style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '1rem',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '0.5rem' }}>
            Weekly Check-ins
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>Member attendance this week</p>
          <div style={{ height: '220px' }}>
            <Bar data={checkinsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '1rem',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '1rem' }}>
            Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivity.map(activity => (
              <div key={activity.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem',
                background: '#f9fafb',
                borderRadius: '0.75rem',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: getActivityColor(activity.type)
                }}></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', color: '#333', fontSize: '0.875rem' }}>{activity.message}</p>
                  <p style={{ fontSize: '0.75rem', color: '#999' }}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
