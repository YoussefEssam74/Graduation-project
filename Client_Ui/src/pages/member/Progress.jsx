import { useState, useEffect } from 'react'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { inBodyService } from '../../services/inBodyService'
import { userService } from '../../services/userService'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Icons
const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
)

const TrendingDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>
  </svg>
)

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
)

const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)

const FlameIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
)

const ScaleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
)

function Progress() {
  const { user } = useAuth()
  const [measurements, setMeasurements] = useState([])
  const [workoutSummary, setWorkoutSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [inBodyData, summaryData] = await Promise.all([
        inBodyService.getUserMeasurements(user.userId).catch(() => []),
        userService.getWorkoutSummary(user.userId).catch(() => null)
      ])
      setMeasurements(inBodyData || [])
      setWorkoutSummary(summaryData)
    } catch (err) {
      console.error('Error fetching progress data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate changes
  const latest = measurements[0] || {}
  const oldest = measurements[measurements.length - 1] || {}
  const weightChange = latest.weight && oldest.weight && measurements.length > 1 
    ? (latest.weight - oldest.weight).toFixed(1) 
    : null
  const fatChange = latest.bodyFatPercentage && oldest.bodyFatPercentage && measurements.length > 1
    ? (latest.bodyFatPercentage - oldest.bodyFatPercentage).toFixed(1)
    : null
  const muscleChange = latest.muscleMass && oldest.muscleMass && measurements.length > 1
    ? (latest.muscleMass - oldest.muscleMass).toFixed(1)
    : null

  // Bright theme colors
  const gymOrange = '#ff6b35'
  const gymOrangeLight = '#ff8c42'
  const success = '#22c55e'
  const danger = '#ef4444'
  const infoBlue = '#3b82f6'

  // Prepare chart data
  const weightChartData = {
    labels: [...measurements].reverse().slice(-8).map(m => 
      new Date(m.measurementDate || m.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    ),
    datasets: [{
      label: 'Weight (kg)',
      data: [...measurements].reverse().slice(-8).map(m => m.weight),
      borderColor: gymOrange,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx
        const gradient = ctx.createLinearGradient(0, 0, 0, 200)
        gradient.addColorStop(0, 'rgba(255, 107, 53, 0.3)')
        gradient.addColorStop(1, 'rgba(255, 107, 53, 0)')
        return gradient
      },
      fill: true,
      tension: 0.4,
      pointBackgroundColor: gymOrange,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    }]
  }

  const bodyCompData = {
    labels: ['Muscle Mass', 'Body Fat', 'Other'],
    datasets: [{
      data: measurements.length > 0 
        ? [
            latest.muscleMass || 34,
            (latest.weight * (latest.bodyFatPercentage / 100)) || 14,
            Math.max(0, latest.weight - (latest.muscleMass || 34) - ((latest.weight * (latest.bodyFatPercentage / 100)) || 14))
          ]
        : [34, 14, 30],
      backgroundColor: [success, danger, infoBlue],
      borderWidth: 3,
      borderColor: '#fff',
      hoverOffset: 8
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }
    },
    scales: {
      x: {
        grid: { color: '#f0f0f0' },
        ticks: { color: '#666', font: { weight: '500' } }
      },
      y: {
        grid: { color: '#f0f0f0' },
        ticks: { color: '#666', font: { weight: '500' } }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#333',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#e0e0e0',
        borderWidth: 1
      }
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Member">
        <div className="empty-state" style={{ minHeight: 400, background: '#fff' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading your progress...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Member">
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            My <span style={{ color: '#ff6b35' }}>Progress</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Track your fitness journey and celebrate your achievements
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
            <TrophyIcon style={{ width: 18, height: 18, color: '#ff6b35' }} />
            <span style={{ color: 'white', fontWeight: '600' }}>
              {measurements.length} measurements recorded
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Weight Card */}
        <div className="card" style={{ 
          border: '2px solid #ff6b35',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
            padding: '1rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <ScaleIcon style={{ width: 24, height: 24 }} />
              {weightChange && (
                <span style={{ 
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {parseFloat(weightChange) <= 0 ? <TrendingDownIcon style={{width:14,height:14}}/> : <TrendingUpIcon style={{width:14,height:14}}/>}
                  {Math.abs(weightChange)} kg
                </span>
              )}
            </div>
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>
              {latest.weight || '--'} 
              <span style={{ fontSize: '1rem', color: '#666' }}>kg</span>
            </div>
            <div style={{ color: '#666', fontWeight: '500' }}>Current Weight</div>
          </div>
        </div>

        {/* Muscle Mass Card */}
        <div className="card" style={{ 
          border: '2px solid #22c55e',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
            padding: '1rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <ActivityIcon style={{ width: 24, height: 24 }} />
              {muscleChange && (
                <span style={{ 
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {parseFloat(muscleChange) >= 0 ? '+' : ''}{muscleChange} kg
                </span>
              )}
            </div>
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>
              {latest.muscleMass || '--'} 
              <span style={{ fontSize: '1rem', color: '#666' }}>kg</span>
            </div>
            <div style={{ color: '#666', fontWeight: '500' }}>Muscle Mass</div>
          </div>
        </div>

        {/* Body Fat Card */}
        <div className="card" style={{ 
          border: '2px solid #ef4444',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
            padding: '1rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FlameIcon style={{ width: 24, height: 24 }} />
              {fatChange && (
                <span style={{ 
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {parseFloat(fatChange) > 0 ? '+' : ''}{fatChange}%
                </span>
              )}
            </div>
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>
              {latest.bodyFatPercentage || '--'} 
              <span style={{ fontSize: '1rem', color: '#666' }}>%</span>
            </div>
            <div style={{ color: '#666', fontWeight: '500' }}>Body Fat</div>
          </div>
        </div>

        {/* Measurements Card */}
        <div className="card" style={{ 
          border: '2px solid #3b82f6',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            padding: '1rem',
            color: 'white'
          }}>
            <CalendarIcon style={{ width: 24, height: 24 }} />
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>
              {workoutSummary?.totalWorkouts || measurements.length || 0}
            </div>
            <div style={{ color: '#666', fontWeight: '500' }}>Total Records</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        {/* Weight Trend Chart */}
        <div className="card" style={{ border: '1px solid #e0e0e0', borderRadius: '1rem' }}>
          <div className="card-header" style={{ 
            background: '#f8f9fa', 
            borderBottom: '2px solid #ff6b35',
            padding: '1rem 1.5rem'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUpIcon style={{ width: 20, height: 20, color: '#ff6b35' }} />
              Weight <span style={{ color: '#ff6b35' }}>Trend</span>
            </h3>
          </div>
          <div className="card-content" style={{ padding: '1.5rem' }}>
            {measurements.length < 2 ? (
              <div className="empty-state" style={{ padding: '3rem' }}>
                <TargetIcon style={{ width: 48, height: 48, color: '#ccc' }} />
                <p style={{ marginTop: '1rem', color: '#666', fontWeight: '600' }}>Not enough data</p>
                <p style={{ color: '#999' }}>Add more InBody measurements to see your trend</p>
              </div>
            ) : (
              <div style={{ height: 300 }}>
                <Line data={weightChartData} options={chartOptions} />
              </div>
            )}
          </div>
        </div>

        {/* Body Composition Chart */}
        <div className="card" style={{ border: '1px solid #e0e0e0', borderRadius: '1rem' }}>
          <div className="card-header" style={{ 
            background: '#f8f9fa', 
            borderBottom: '2px solid #ff6b35',
            padding: '1rem 1.5rem'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ScaleIcon style={{ width: 20, height: 20, color: '#ff6b35' }} />
              Body <span style={{ color: '#ff6b35' }}>Composition</span>
            </h3>
          </div>
          <div className="card-content" style={{ padding: '1.5rem' }}>
            {!latest.weight ? (
              <div className="empty-state" style={{ padding: '3rem' }}>
                <ScaleIcon style={{ width: 48, height: 48, color: '#ccc' }} />
                <p style={{ marginTop: '1rem', color: '#666', fontWeight: '600' }}>No data available</p>
                <p style={{ color: '#999' }}>Add an InBody measurement to see your body composition</p>
              </div>
            ) : (
              <div style={{ height: 300 }}>
                <Doughnut data={bodyCompData} options={doughnutOptions} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="card" style={{ border: '1px solid #e0e0e0', borderRadius: '1rem' }}>
        <div className="card-header" style={{ 
          background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '1rem 1rem 0 0'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrophyIcon style={{ width: 24, height: 24 }} />
            Progress Summary
          </h3>
        </div>
        <div className="card-content" style={{ padding: '1.5rem' }}>
          {measurements.length < 2 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <TrendingUpIcon style={{ width: 48, height: 48, color: '#ccc' }} />
              <p style={{ marginTop: '1rem', color: '#666', fontWeight: '600' }}>Keep tracking your progress</p>
              <p style={{ color: '#999' }}>Your progress summary will appear once you have more measurements</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1.5rem' 
            }}>
              <div style={{ 
                padding: '1.5rem', 
                background: parseFloat(weightChange) <= 0 ? '#f0fdf4' : '#fef2f2', 
                borderRadius: '1rem', 
                textAlign: 'center',
                border: `2px solid ${parseFloat(weightChange) <= 0 ? '#22c55e' : '#ef4444'}`
              }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '700', 
                  color: parseFloat(weightChange) <= 0 ? success : danger,
                  marginBottom: '0.5rem'
                }}>
                  {weightChange > 0 ? '+' : ''}{weightChange || '0'} kg
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
                  Weight Change
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                  {parseFloat(weightChange) <= 0 ? '🎉 Great progress!' : 'Keep pushing!'}
                </div>
              </div>

              <div style={{ 
                padding: '1.5rem', 
                background: parseFloat(muscleChange) >= 0 ? '#f0fdf4' : '#fef2f2', 
                borderRadius: '1rem', 
                textAlign: 'center',
                border: `2px solid ${parseFloat(muscleChange) >= 0 ? '#22c55e' : '#ef4444'}`
              }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '700', 
                  color: parseFloat(muscleChange) >= 0 ? success : danger,
                  marginBottom: '0.5rem'
                }}>
                  {muscleChange > 0 ? '+' : ''}{muscleChange || '0'} kg
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
                  Muscle Gain
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                  {parseFloat(muscleChange) >= 0 ? '💪 Getting stronger!' : 'Time to lift more!'}
                </div>
              </div>

              <div style={{ 
                padding: '1.5rem', 
                background: parseFloat(fatChange) <= 0 ? '#f0fdf4' : '#fef2f2', 
                borderRadius: '1rem', 
                textAlign: 'center',
                border: `2px solid ${parseFloat(fatChange) <= 0 ? '#22c55e' : '#ef4444'}`
              }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '700', 
                  color: parseFloat(fatChange) <= 0 ? success : danger,
                  marginBottom: '0.5rem'
                }}>
                  {fatChange > 0 ? '+' : ''}{fatChange || '0'}%
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
                  Body Fat Change
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                  {parseFloat(fatChange) <= 0 ? '🔥 Burning fat!' : 'Stay consistent!'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Progress
