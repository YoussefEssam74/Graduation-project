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
import './Progress.css'

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

// Icons - Modern Filled Style
const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
)

const TrendingDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z"/>
  </svg>
)

const ScaleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3C6.5 3 2 6.58 2 11c0 3.03 2.14 5.64 5.23 6.77-.24.88-.62 2.22-1.73 3.73 0 0 3.25-.86 5.28-2.27.73.1 1.47.15 2.22.15 5.5 0 10-3.58 10-8 0-4.42-4.5-8.38-11-8.38zm0 12c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1s1 .45 1 1v5c0 .55-.45 1-1 1z"/>
  </svg>
)

const BodyFatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2-15.86c1.03.13 2 .45 2.87.93H13v-.93zM13 7h5.24c.25.31.48.65.68 1H13V7zm0 3h6.74c.08.33.15.66.19 1H13v-1zm0 9.93V19h2.87c-.87.48-1.84.8-2.87.93zM18.24 17H13v-1h5.92c-.2.35-.43.69-.68 1zm1.5-3H13v-1h6.93c-.04.34-.11.67-.19 1z"/>
  </svg>
)

const MuscleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
  </svg>
)

const FlameIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
  </svg>
)

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
  </svg>
)

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
  </svg>
)

const AIIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1-2.73 2.71-2.73 7.08 0 9.79s7.15 2.71 9.88 0C18.32 15.65 19 14.08 19 12.1h2c0 1.98-.88 4.55-2.64 6.29-3.51 3.48-9.21 3.48-12.72 0-3.5-3.47-3.53-9.11-.02-12.58s9.14-3.47 12.65 0L21 3v7.12zM12.5 8v4.25l3.5 2.08-.72 1.21L11 13V8h1.5z"/>
  </svg>
)

const ChestIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
  </svg>
)

const WaistIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
  </svg>
)

const ArmIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
  </svg>
)

const AddIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
)

const DragIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
  </svg>
)

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>
)

const RunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
  </svg>
)

function Progress() {
  const { user } = useAuth()
  const [measurements, setMeasurements] = useState([])
  const [workoutSummary, setWorkoutSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('body-metrics')
  const [chartPeriod, setChartPeriod] = useState('6M')

  // Mock data for enhanced features
  const mockMeasurements = {
    chest: { value: 102, change: -1.5 },
    waist: { value: 85, change: -2.0 },
    arms: { value: 38, change: 0.5 }
  }

  const goals = [
    { id: 1, name: 'Reach 75kg Bodyweight', progress: 82, color: 'blue' },
    { id: 2, name: 'Run 5k under 25m', progress: 65, color: 'orange' },
    { id: 3, name: '30 Day Workout Streak', progress: 40, color: 'green' }
  ]

  const personalRecords = [
    { id: 1, name: 'Bench Press', value: '100 kg', isNew: true, icon: MuscleIcon },
    { id: 2, name: '5k Run', value: '24:30 min', isNew: false, icon: RunIcon }
  ]

  const workoutDays = 18
  const streakDays = 12

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

  // Modern blue theme colors
  const primaryBlue = '#3B82F6'
  const secondaryGreen = '#10B981'
  const accentOrange = '#F97316'
  const danger = '#EF4444'

  // Prepare chart data
  const weightChartData = {
    labels: [...measurements].reverse().slice(-8).map(m => 
      new Date(m.measurementDate || m.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    ),
    datasets: [{
      label: 'Weight (kg)',
      data: [...measurements].reverse().slice(-8).map(m => m.weight),
      borderColor: primaryBlue,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx
        const gradient = ctx.createLinearGradient(0, 0, 0, 200)
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)')
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
        return gradient
      },
      fill: true,
      tension: 0.4,
      pointBackgroundColor: primaryBlue,
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
      backgroundColor: [secondaryGreen, danger, primaryBlue],
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
        <div className="progress-page">
          <div className="progress-loading">
            <div className="loading-spinner"></div>
            <p>Loading your progress...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Member">
      <div className="progress-page">
        {/* Page Header */}
        <div className="progress-header">
          <div className="progress-header-content">
            <h1>Your Progress</h1>
            <p>
              Great job, {user?.name?.split(' ')[0] || 'there'}! You're <span className="highlight">12% closer</span> to your goal this week.
              <TrendingUpIcon className="trend-icon" />
            </p>
          </div>
          <div className="progress-header-actions">
            <button className="progress-btn secondary">
              <ShareIcon />
              Share
            </button>
            <button className="progress-btn primary">
              <DownloadIcon />
              Export Report (PDF)
            </button>
          </div>
        </div>

        {/* AI Insight */}
        <div className="progress-ai-insight">
          <div className="progress-ai-icon">
            <AIIcon />
          </div>
          <div className="progress-ai-content">
            <p>AI Coach Insight</p>
            <p>Based on your recent consistency, try increasing your cardio intensity by 5% next week to break through your current plateau. Your recovery metrics suggest you're ready for the push!</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="progress-tabs">
          <button 
            className={`progress-tab ${activeTab === 'body-metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('body-metrics')}
          >
            Body Metrics
          </button>
          <button 
            className={`progress-tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
          <button 
            className={`progress-tab ${activeTab === 'consistency' ? 'active' : ''}`}
            onClick={() => setActiveTab('consistency')}
          >
            Consistency
          </button>
        </div>

        {/* Main Grid */}
        <div className="progress-grid">
          {/* Left Column */}
          <div className="progress-main">
            {/* Stats Row */}
            <div className="progress-stats-row">
              <div className="progress-stat-card">
                <div className="bg-icon">
                  <ScaleIcon />
                </div>
                <p className="progress-stat-label">Current Weight</p>
                <div className="progress-stat-value">
                  <span className="number">{latest.weight || 78.5}</span>
                  <span className="unit">kg</span>
                </div>
                {weightChange && (
                  <div className={`progress-stat-trend ${parseFloat(weightChange) <= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(weightChange) <= 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
                    {Math.abs(weightChange)}% this month
                  </div>
                )}
              </div>

              <div className="progress-stat-card">
                <div className="bg-icon">
                  <BodyFatIcon />
                </div>
                <p className="progress-stat-label">Body Fat</p>
                <div className="progress-stat-value">
                  <span className="number">{latest.bodyFatPercentage || 15.2}</span>
                  <span className="unit">%</span>
                </div>
                {fatChange && (
                  <div className={`progress-stat-trend ${parseFloat(fatChange) <= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(fatChange) <= 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
                    {Math.abs(fatChange)}%
                  </div>
                )}
              </div>

              <div className="progress-stat-card">
                <div className="bg-icon">
                  <MuscleIcon />
                </div>
                <p className="progress-stat-label">Muscle Mass</p>
                <div className="progress-stat-value">
                  <span className="number">{latest.muscleMass || 62.1}</span>
                  <span className="unit">kg</span>
                </div>
                {muscleChange && (
                  <div className={`progress-stat-trend ${parseFloat(muscleChange) >= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(muscleChange) >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    +{Math.abs(muscleChange)}%
                  </div>
                )}
              </div>

              <div className="progress-stat-card">
                <div className="bg-icon">
                  <FlameIcon />
                </div>
                <p className="progress-stat-label">Streak</p>
                <div className="progress-stat-value">
                  <span className="number">{streakDays}</span>
                  <span className="unit">days</span>
                </div>
                <div className="progress-stat-trend fire">
                  <FlameIcon />
                  On Fire!
                </div>
              </div>
            </div>

            {/* Weight Chart */}
            <div className="progress-chart-card">
              <div className="progress-chart-header">
                <div>
                  <h3>Weight Trend</h3>
                  <p>Last 6 Months</p>
                </div>
                <div className="progress-chart-toggle">
                  <button 
                    className={chartPeriod === '6M' ? 'active' : ''}
                    onClick={() => setChartPeriod('6M')}
                  >
                    6M
                  </button>
                  <button 
                    className={chartPeriod === '1Y' ? 'active' : ''}
                    onClick={() => setChartPeriod('1Y')}
                  >
                    1Y
                  </button>
                  <button 
                    className={chartPeriod === 'All' ? 'active' : ''}
                    onClick={() => setChartPeriod('All')}
                  >
                    All
                  </button>
                </div>
              </div>
              <div className="progress-chart-area">
                {measurements.length < 2 ? (
                  <div className="progress-loading" style={{ minHeight: 280 }}>
                    <ScaleIcon style={{ width: 48, height: 48, opacity: 0.3 }} />
                    <p>Add more measurements to see your trend</p>
                  </div>
                ) : (
                  <Line data={weightChartData} options={chartOptions} />
                )}
              </div>
              <div className="progress-chart-labels">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>

            {/* Measurements & Goals Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Measurements */}
              <div className="progress-measurements">
                <div className="progress-section-header">
                  <h3>Measurements</h3>
                  <a href="#">View All</a>
                </div>
                <div className="progress-measurement-list">
                  <div className="progress-measurement-item">
                    <div className="progress-measurement-left">
                      <div className="progress-measurement-icon">
                        <ChestIcon />
                      </div>
                      <div className="progress-measurement-info">
                        <h4>Chest</h4>
                        <p>Last updated: 2 days ago</p>
                      </div>
                    </div>
                    <div className="progress-measurement-right">
                      <span className="value">{mockMeasurements.chest.value} cm</span>
                      <span className={`change ${mockMeasurements.chest.change <= 0 ? 'positive' : 'negative'}`}>
                        {mockMeasurements.chest.change} cm
                      </span>
                    </div>
                  </div>
                  <div className="progress-measurement-item">
                    <div className="progress-measurement-left">
                      <div className="progress-measurement-icon">
                        <WaistIcon />
                      </div>
                      <div className="progress-measurement-info">
                        <h4>Waist</h4>
                        <p>Last updated: 2 days ago</p>
                      </div>
                    </div>
                    <div className="progress-measurement-right">
                      <span className="value">{mockMeasurements.waist.value} cm</span>
                      <span className={`change ${mockMeasurements.waist.change <= 0 ? 'positive' : 'negative'}`}>
                        {mockMeasurements.waist.change} cm
                      </span>
                    </div>
                  </div>
                  <div className="progress-measurement-item">
                    <div className="progress-measurement-left">
                      <div className="progress-measurement-icon">
                        <ArmIcon />
                      </div>
                      <div className="progress-measurement-info">
                        <h4>Arms</h4>
                        <p>Last updated: 2 days ago</p>
                      </div>
                    </div>
                    <div className="progress-measurement-right">
                      <span className="value">{mockMeasurements.arms.value} cm</span>
                      <span className={`change ${mockMeasurements.arms.change >= 0 ? 'positive' : 'negative'}`}>
                        +{mockMeasurements.arms.change} cm
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goals */}
              <div className="progress-goals">
                <div className="progress-section-header">
                  <h3>Goals</h3>
                  <button style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <AddIcon /> Add New
                  </button>
                </div>
                {goals.map(goal => (
                  <div key={goal.id} className="progress-goal-item">
                    <div className="progress-goal-header">
                      <span>{goal.name}</span>
                      <span className={goal.color}>{goal.progress}%</span>
                    </div>
                    <div className="progress-goal-bar">
                      <div 
                        className={`progress-goal-fill ${goal.color}`}
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="progress-sidebar">
            {/* Photo Progress */}
            <div className="progress-photos">
              <div className="progress-section-header">
                <h3>Transformation</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%' }}>
                  <EditIcon style={{ color: '#64748b' }} />
                </button>
              </div>
              <div className="progress-photo-comparison">
                <div 
                  className="progress-photo-after"
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=500&fit=crop)' }}
                ></div>
                <div 
                  className="progress-photo-before"
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=500&fit=crop)' }}
                >
                  <span className="progress-photo-label before">BEFORE</span>
                </div>
                <span className="progress-photo-label after">AFTER</span>
                <div className="progress-photo-slider">
                  <div className="progress-photo-slider-handle">
                    <DragIcon />
                  </div>
                </div>
              </div>
              <div className="progress-photo-dates">
                <span>Jan 1, 2023</span>
                <span>Jun 15, 2023</span>
              </div>
              <button className="progress-photo-btn">Update Photos</button>
            </div>

            {/* Personal Records */}
            <div className="progress-records">
              <h3>Personal Records</h3>
              <div className="progress-record-list">
                {personalRecords.map(record => (
                  <div key={record.id} className="progress-record-item">
                    <div className="progress-record-icon">
                      <record.icon />
                    </div>
                    <div className="progress-record-info">
                      <p>{record.name}</p>
                      <p>{record.value}</p>
                    </div>
                    {record.isNew && <span className="progress-record-badge">NEW</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Consistency Heatmap */}
            <div className="progress-consistency">
              <h3>Consistency</h3>
              <div className="progress-heatmap">
                {/* Generate heatmap cells */}
                {Array.from({ length: 28 }, (_, i) => {
                  const levels = ['', 'level-1', 'level-2', 'level-3', 'level-4']
                  const randomLevel = levels[Math.floor(Math.random() * levels.length)]
                  return <div key={i} className={`progress-heatmap-cell ${randomLevel}`}></div>
                })}
              </div>
              <div className="progress-consistency-info">
                <InfoIcon />
                <p>You worked out {workoutDays} days this month.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Progress
