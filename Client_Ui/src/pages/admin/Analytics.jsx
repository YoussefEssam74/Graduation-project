import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2'
import DashboardLayout from '../../components/layouts/DashboardLayout'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// Icons
const BarChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>
  </svg>
)

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
)

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

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>
  </svg>
)

const ArrowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="19" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
)

const ArrowDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="5" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
)

function Analytics() {
  const [timeRange, setTimeRange] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)
  }, [])

  // KPI Cards
  const kpiData = [
    { icon: <UsersIcon />, label: 'Total Members', value: '2,450', change: '+12.5%', isUp: true, color: '#ff6b35' },
    { icon: <DollarIcon />, label: 'Monthly Revenue', value: '125K EGP', change: '+8.3%', isUp: true, color: '#22c55e' },
    { icon: <ActivityIcon />, label: 'Active Subscriptions', value: '1,892', change: '+15.2%', isUp: true, color: '#8b5cf6' },
    { icon: <CalendarIcon />, label: 'Avg. Sessions/Week', value: '4.2', change: '-2.1%', isUp: false, color: '#f59e0b' }
  ]

  // Revenue Trend
  const revenueTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Revenue (EGP)',
      data: [85000, 92000, 98000, 95000, 105000, 112000, 108000, 115000, 120000, 118000, 125000, 130000],
      fill: true,
      borderColor: '#ff6b35',
      backgroundColor: 'rgba(255, 107, 53, 0.1)',
      tension: 0.4,
      pointBackgroundColor: '#ff6b35',
      pointBorderColor: '#ff6b35',
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  }

  // Membership Growth
  const membershipGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Members',
        data: [45, 52, 38, 64, 58, 72],
        backgroundColor: '#ff6b35'
      },
      {
        label: 'Churned',
        data: [12, 8, 15, 10, 14, 9],
        backgroundColor: '#ef4444'
      }
    ]
  }

  // Plan Distribution
  const planDistributionData = {
    labels: ['Basic', 'Premium', 'Elite'],
    datasets: [{
      data: [1200, 850, 400],
      backgroundColor: ['#22c55e', '#ff6b35', '#8b5cf6'],
      borderColor: ['#fff', '#fff', '#fff'],
      borderWidth: 3
    }]
  }

  // Age Demographics
  const ageDemographicsData = {
    labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
    datasets: [{
      data: [350, 680, 520, 280, 120],
      backgroundColor: ['#ff6b35', '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'],
      borderWidth: 0
    }]
  }

  // Peak Hours
  const peakHoursData = {
    labels: ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'],
    datasets: [{
      label: 'Check-ins',
      data: [45, 120, 85, 95, 65, 110, 180, 150, 40],
      backgroundColor: '#ff6b35',
      borderRadius: 8
    }]
  }

  // Equipment Usage
  const equipmentUsageData = {
    labels: ['Treadmill', 'Bench Press', 'Cable Machine', 'Leg Press', 'Spin Bike', 'Rowing'],
    datasets: [{
      label: 'Usage %',
      data: [85, 72, 68, 55, 78, 45],
      backgroundColor: [
        'rgba(255, 107, 53, 0.8)',
        'rgba(255, 107, 53, 0.7)',
        'rgba(255, 107, 53, 0.6)',
        'rgba(255, 107, 53, 0.5)',
        'rgba(255, 107, 53, 0.7)',
        'rgba(255, 107, 53, 0.4)'
      ],
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
        labels: { color: '#333', padding: 15, font: { weight: '600' } }
      }
    }
  }

  const horizontalBarOptions = {
    ...chartOptions,
    indexAxis: 'y'
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
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Analytics <span style={{ color: '#ff6b35' }}>Dashboard</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Comprehensive insights and performance metrics
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
            <BarChartIcon style={{ width: 18, height: 18, color: '#ff6b35' }} />
            <span style={{ color: 'white', fontWeight: '600' }}>
              Real-time Data
            </span>
          </div>
        </div>
      </div>

      {/* Time Range Filter */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          background: 'white',
          padding: '0.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #e0e0e0'
        }}>
          {['week', 'month', 'quarter', 'year'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '0.5rem 1rem',
                background: timeRange === range ? 'linear-gradient(135deg, #ff6b35, #ff8c42)' : 'transparent',
                color: timeRange === range ? 'white' : '#666',
                border: 'none',
                borderRadius: '0.25rem',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {kpiData.map((kpi, idx) => (
          <div key={idx} className="card" style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '1rem',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${kpi.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: kpi.color
              }}>
                {kpi.icon}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: kpi.isUp ? '#dcfce7' : '#fecaca',
                color: kpi.isUp ? '#22c55e' : '#ef4444',
                padding: '0.25rem 0.5rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {kpi.isUp ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {kpi.change}
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#333' }}>{kpi.value}</p>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Trend */}
      <div className="card" style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333' }}>Revenue Trend</h3>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>Monthly revenue over the year</p>
          </div>
          <div style={{
            background: 'rgba(255,107,53,0.1)',
            color: '#ff6b35',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <TrendingUpIcon style={{ width: 16, height: 16 }} />
            +15.2% YoY
          </div>
        </div>
        <div style={{ height: '300px' }}>
          <Line data={revenueTrendData} options={chartOptions} />
        </div>
      </div>

      {/* Middle Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Membership Growth */}
        <div className="card" style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '1rem',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '0.5rem' }}>
            Membership Growth
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>New members vs churned</p>
          <div style={{ height: '250px' }}>
            <Bar data={membershipGrowthData} options={{
              ...chartOptions,
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  labels: { color: '#333', font: { weight: '600' } }
                }
              }
            }} />
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="card" style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '1rem',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '0.5rem' }}>
            Plan Distribution
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>Members by subscription plan</p>
          <div style={{ height: '250px' }}>
            <Doughnut data={planDistributionData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '1.5rem' 
      }}>
        {/* Age Demographics */}
        <div className="card" style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '1rem',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '0.5rem' }}>
            Age Demographics
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>Member age distribution</p>
          <div style={{ height: '200px' }}>
            <Pie data={ageDemographicsData} options={doughnutOptions} />
          </div>
        </div>

        {/* Peak Hours */}
        <div className="card" style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '1rem',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '0.5rem' }}>
            Peak Hours
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>Busiest times of day</p>
          <div style={{ height: '200px' }}>
            <Bar data={peakHoursData} options={chartOptions} />
          </div>
        </div>

        {/* Equipment Usage */}
        <div className="card" style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '1rem',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '0.5rem' }}>
            Equipment Usage
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>Most used equipment</p>
          <div style={{ height: '200px' }}>
            <Bar data={equipmentUsageData} options={horizontalBarOptions} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Analytics
