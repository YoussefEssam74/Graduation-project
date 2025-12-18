import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { inBodyService } from '../../services/inBodyService'
import { useToast } from '../../contexts/ToastContext'
import './InBody.css'

// Modern Filled Icons
const ScaleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
)

const MuscleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
  </svg>
)

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="m16 6 2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
)

const TrendingDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="m16 18 2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z"/>
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
)

const FlameIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
  </svg>
)

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
  </svg>
)

const AddCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
  </svg>
)

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
  </svg>
)

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
  </svg>
)

const WaterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/>
  </svg>
)

const ProteinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.0001 3C13.8001 6 18 8.00001 18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12C6 8.00001 10.2001 6 12.0001 3ZM8.5 12C8.5 14.4853 10.5147 16.5 13 16.5H11C8.51472 16.5 6.5 14.4853 6.5 12C6.5 9.5 9.00012 7.5 11.0001 5.5C9.00012 7.5 8.5 9.51472 8.5 12ZM12 21C12.5523 21 13 20.5523 13 20V19H11V20C11 20.5523 11.4477 21 12 21Z"/>
  </svg>
)

const MineralsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
  </svg>
)

const VisceralIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm1-10c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
  </svg>
)

const BMRIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5zM19 19.09H5V4.91h14v14.18zM6 15h12v2H6zm0-4h12v2H6zm0-4h12v2H6z"/>
  </svg>
)

const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
)

const VisibilityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
)

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
  </svg>
)

function InBody() {
  const { user } = useAuth()
  const toast = useToast()
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    weight: '',
    muscleMass: '',
    bodyFatPercentage: '',
    visceralFatLevel: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchMeasurements()
  }, [user])

  const fetchMeasurements = async () => {
    try {
      setLoading(true)
      const data = await inBodyService.getUserMeasurements(user.userId)
      setMeasurements(data || [])
    } catch (err) {
      console.error('Error fetching measurements:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.weight || !formData.muscleMass || !formData.bodyFatPercentage) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      await inBodyService.createMeasurement({
        userId: user.userId,
        weight: parseFloat(formData.weight),
        muscleMass: parseFloat(formData.muscleMass),
        bodyFatPercentage: parseFloat(formData.bodyFatPercentage),
        visceralFatLevel: formData.visceralFatLevel ? parseInt(formData.visceralFatLevel) : null
      })
      toast.success('InBody data submitted successfully!')
      setFormData({ weight: '', muscleMass: '', bodyFatPercentage: '', visceralFatLevel: '' })
      fetchMeasurements()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit data')
    } finally {
      setSubmitting(false)
    }
  }

  // Get latest measurement for stat cards
  const latest = measurements[0] || {}
  const previous = measurements[1] || {}

  // Calculate changes
  const weightChange = latest.weight && previous.weight ? (latest.weight - previous.weight).toFixed(1) : null
  const fatChange = latest.bodyFatPercentage && previous.bodyFatPercentage ? (latest.bodyFatPercentage - previous.bodyFatPercentage).toFixed(1) : null
  const muscleChange = latest.muscleMass && previous.muscleMass ? (latest.muscleMass - previous.muscleMass).toFixed(1) : null

  // Calculate score based on metrics
  const calculateScore = (m) => {
    if (!m.weight || !m.bodyFatPercentage || !m.muscleMass) return null
    let score = 70
    if (m.bodyFatPercentage < 20) score += 10
    if (m.bodyFatPercentage < 15) score += 5
    if (m.muscleMass > 30) score += 10
    if (m.visceralFatLevel && m.visceralFatLevel < 10) score += 5
    return Math.min(score, 100)
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const latestScanDate = latest.measurementDate || latest.createdAt

  return (
    <DashboardLayout role="Member">
      <div className="inbody-page">
        {/* Hero Section */}
        <div className="inbody-hero">
          <div className="inbody-hero-content">
            <h1>
              My Body Composition
              <span className="inbody-hero-badge">HEALTHY RANGE</span>
            </h1>
            <p className="inbody-hero-meta">
              Latest Scan: <span>{latestScanDate ? formatDate(latestScanDate) : 'No scans yet'}</span>
            </p>
          </div>
          <div className="inbody-hero-actions">
            <button className="inbody-btn-export">
              <DownloadIcon />
              Export Report
            </button>
            <button className="inbody-btn-scan" onClick={() => document.getElementById('add-form')?.scrollIntoView({ behavior: 'smooth' })}>
              <AddCircleIcon />
              Add New Scan
            </button>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="inbody-stats-grid">
          {/* Weight Card */}
          <div className="inbody-stat-card weight">
            <div className="inbody-stat-bg-circle"></div>
            <div className="inbody-stat-header">
              <div>
                <p className="inbody-stat-label">Total Weight</p>
                <h3 className="inbody-stat-value">
                  {latest.weight || '--'} <span>kg</span>
                </h3>
              </div>
              <div className={`inbody-stat-trend ${weightChange && parseFloat(weightChange) <= 0 ? 'down' : 'up'}`}>
                {weightChange && parseFloat(weightChange) <= 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
              </div>
            </div>
            {weightChange && (
              <div className="inbody-stat-change">
                <span className={`inbody-stat-change-badge ${parseFloat(weightChange) <= 0 ? 'down' : 'up'}`}>
                  {parseFloat(weightChange) <= 0 ? '' : '+'}{weightChange}%
                </span>
                <span>vs last scan</span>
              </div>
            )}
          </div>

          {/* Muscle Card */}
          <div className="inbody-stat-card muscle">
            <div className="inbody-stat-bg-circle"></div>
            <div className="inbody-stat-header">
              <div>
                <p className="inbody-stat-label">Skeletal Muscle Mass</p>
                <h3 className="inbody-stat-value">
                  {latest.muscleMass || '--'} <span>kg</span>
                </h3>
              </div>
              <div className={`inbody-stat-trend ${muscleChange && parseFloat(muscleChange) >= 0 ? 'up' : 'down'}`}>
                {muscleChange && parseFloat(muscleChange) >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              </div>
            </div>
            {muscleChange && (
              <div className="inbody-stat-change">
                <span className={`inbody-stat-change-badge ${parseFloat(muscleChange) >= 0 ? 'up' : 'down'}`}>
                  {parseFloat(muscleChange) >= 0 ? '+' : ''}{muscleChange}%
                </span>
                <span>{parseFloat(muscleChange) >= 0 ? 'Great progress!' : 'Keep working!'}</span>
              </div>
            )}
          </div>

          {/* Body Fat Card */}
          <div className="inbody-stat-card fat">
            <div className="inbody-stat-bg-circle"></div>
            <div className="inbody-stat-header">
              <div>
                <p className="inbody-stat-label">Percent Body Fat</p>
                <h3 className="inbody-stat-value">
                  {latest.bodyFatPercentage || '--'} <span>%</span>
                </h3>
              </div>
              <div className={`inbody-stat-trend ${fatChange && parseFloat(fatChange) <= 0 ? 'down' : 'up'}`}>
                {fatChange && parseFloat(fatChange) <= 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
              </div>
            </div>
            {fatChange && (
              <div className="inbody-stat-change">
                <span className={`inbody-stat-change-badge ${parseFloat(fatChange) <= 0 ? 'down' : 'up'}`}>
                  {parseFloat(fatChange) <= 0 ? '' : '+'}{fatChange}%
                </span>
                <span>{parseFloat(fatChange) <= 0 ? 'Getting leaner' : 'Needs attention'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Charts Section */}
        <div className="inbody-main-grid">
          {/* Chart Card */}
          <div className="inbody-chart-card">
            <div className="inbody-chart-header">
              <div>
                <h3>Composition History</h3>
                <p>Last 6 Months Trend</p>
              </div>
              <div className="inbody-chart-tabs">
                <button className="inbody-chart-tab active">Weight</button>
                <button className="inbody-chart-tab">Muscle</button>
                <button className="inbody-chart-tab">Fat %</button>
              </div>
            </div>
            <div className="inbody-chart-area">
              <svg className="inbody-chart-svg" viewBox="0 0 800 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradientPrimary" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                <line x1="0" x2="800" y1="50" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" x2="800" y1="125" y2="125" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" x2="800" y1="200" y2="200" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" x2="800" y1="275" y2="275" stroke="#f1f5f9" strokeWidth="1" />
                {/* Chart Line */}
                <path 
                  d="M0 200 C 100 190, 150 220, 200 180 S 300 150, 400 160 S 550 140, 650 100 S 750 80, 800 60" 
                  fill="none" 
                  stroke="#3B82F6" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                />
                {/* Fill area */}
                <path 
                  d="M0 200 C 100 190, 150 220, 200 180 S 300 150, 400 160 S 550 140, 650 100 S 750 80, 800 60 V 300 H 0 Z" 
                  fill="url(#gradientPrimary)" 
                />
                {/* Data Points */}
                <circle cx="200" cy="180" r="4" fill="white" stroke="#3B82F6" strokeWidth="3" />
                <circle cx="400" cy="160" r="4" fill="white" stroke="#3B82F6" strokeWidth="3" />
                <circle cx="650" cy="100" r="6" fill="#3B82F6" stroke="white" strokeWidth="3" />
                <circle cx="650" cy="100" r="12" fill="#3B82F6" opacity="0.2" />
              </svg>
              {latest.weight && (
                <div className="inbody-chart-tooltip">{latest.weight} kg</div>
              )}
            </div>
            <div className="inbody-chart-labels">
              {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map(m => <span key={m}>{m}</span>)}
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="inbody-ai-card">
            <div className="inbody-ai-pattern"></div>
            <div className="inbody-ai-content">
              <div className="inbody-ai-label">
                <SparklesIcon />
                <span>Pulse AI Insight</span>
              </div>
              <h3>Progress Analysis</h3>
              <p>
                {muscleChange && parseFloat(muscleChange) > 0 
                  ? <>Your skeletal muscle mass has increased by <strong>{muscleChange}%</strong> since your last scan. Keep up the great work!</>
                  : <>Track your body composition regularly to see your progress and get personalized insights.</>
                }
              </p>
              {latest.visceralFatLevel && latest.visceralFatLevel > 9 && (
                <div className="inbody-ai-alert">
                  <WarningIcon />
                  <div>
                    <p className="inbody-ai-alert-title">Attention Needed</p>
                    <p>Visceral fat is elevated. Consider increasing cardio and reducing processed foods.</p>
                  </div>
                </div>
              )}
            </div>
            <button className="inbody-ai-btn">View Recommendations</button>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="inbody-secondary-grid">
          {/* Detailed Metrics Grid */}
          <div className="inbody-metrics-grid">
            <div className="inbody-metric-card">
              <div className="inbody-metric-header">
                <PersonIcon />
                <span>BMI</span>
              </div>
              <p className="inbody-metric-value">
                {latest.weight && latest.height 
                  ? (latest.weight / Math.pow(latest.height / 100, 2)).toFixed(1) 
                  : '23.4'}
              </p>
              <span className="inbody-metric-status success">Normal</span>
            </div>

            <div className="inbody-metric-card">
              <div className="inbody-metric-header">
                <WaterIcon />
                <span>Body Water</span>
              </div>
              <p className="inbody-metric-value">46.2 L</p>
              <span className="inbody-metric-status warning">-0.5 L</span>
            </div>

            <div className="inbody-metric-card">
              <div className="inbody-metric-header">
                <ProteinIcon />
                <span>Protein</span>
              </div>
              <p className="inbody-metric-value">12.8 kg</p>
              <span className="inbody-metric-status success">Optimal</span>
            </div>

            <div className="inbody-metric-card">
              <div className="inbody-metric-header">
                <MineralsIcon />
                <span>Minerals</span>
              </div>
              <p className="inbody-metric-value">4.3 kg</p>
              <span className="inbody-metric-status neutral">Stable</span>
            </div>

            <div className="inbody-metric-card">
              <div className="inbody-metric-header">
                <VisceralIcon />
                <span>Visceral Fat</span>
              </div>
              <p className="inbody-metric-value">Level {latest.visceralFatLevel || 4}</p>
              <span className="inbody-metric-status success">Low Risk</span>
            </div>

            <div className="inbody-metric-card">
              <div className="inbody-metric-header">
                <BMRIcon />
                <span>BMR</span>
              </div>
              <p className="inbody-metric-value">1740 <span>kcal</span></p>
            </div>
          </div>

          {/* Segmental Analysis */}
          <div className="inbody-segmental-card">
            <div className="inbody-segmental-header">
              <h3>Segmental Lean Analysis</h3>
              <button>View Details</button>
            </div>
            <div className="inbody-segmental-content">
              <div className="inbody-body-figure">
                <div className="inbody-body-parts">
                  <div className="inbody-body-head"></div>
                  <div className="inbody-body-main">
                    <div className="inbody-body-arm">
                      <div className="inbody-body-arm-dot"></div>
                    </div>
                    <div className="inbody-body-trunk">
                      <div className="inbody-body-trunk-inner"></div>
                    </div>
                    <div className="inbody-body-arm">
                      <div className="inbody-body-arm-dot"></div>
                    </div>
                  </div>
                  <div className="inbody-body-legs">
                    <div className="inbody-body-leg"></div>
                    <div className="inbody-body-leg"></div>
                  </div>
                </div>
                <div className="inbody-body-label left-arm"><div className="inbody-body-label-dot"></div>3.4kg</div>
                <div className="inbody-body-label right-arm">3.5kg<div className="inbody-body-label-dot"></div></div>
                <div className="inbody-body-label left-leg"><div className="inbody-body-label-dot"></div>9.8kg</div>
                <div className="inbody-body-label right-leg">9.7kg<div className="inbody-body-label-dot"></div></div>
              </div>

              <div className="inbody-segmental-table">
                <div className="inbody-segmental-table-header">
                  <span>Segment</span>
                  <span>Lean Mass</span>
                  <span>Fat Mass</span>
                </div>
                {[
                  { segment: 'Right Arm', lean: '3.5 kg', fat: '0.4 kg' },
                  { segment: 'Left Arm', lean: '3.4 kg', fat: '0.4 kg' },
                  { segment: 'Trunk', lean: '26.4 kg', fat: '4.2 kg' },
                  { segment: 'Right Leg', lean: '9.7 kg', fat: '1.8 kg' },
                  { segment: 'Left Leg', lean: '9.8 kg', fat: '1.8 kg' },
                ].map((row, idx) => (
                  <div key={idx} className="inbody-segmental-row">
                    <span>{row.segment}</span>
                    <span>{row.lean}</span>
                    <span>{row.fat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add Measurement Form */}
        <div id="add-form" className="inbody-form-card">
          <div className="inbody-form-header">
            <PlusIcon />
            <h3>Add New Measurement</h3>
          </div>
          <div className="inbody-form-content">
            <form onSubmit={handleSubmit}>
              <div className="inbody-form-grid">
                <div className="inbody-form-group">
                  <label>
                    <ScaleIcon style={{ color: '#3B82F6' }} />
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    name="weight"
                    step="0.1"
                    placeholder="e.g., 78.5"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="inbody-form-group">
                  <label>
                    <MuscleIcon style={{ color: '#10B981' }} />
                    Muscle Mass (kg) *
                  </label>
                  <input
                    type="number"
                    name="muscleMass"
                    step="0.1"
                    placeholder="e.g., 34.2"
                    value={formData.muscleMass}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="inbody-form-group">
                  <label>
                    <FlameIcon style={{ color: '#F97316' }} />
                    Body Fat (%) *
                  </label>
                  <input
                    type="number"
                    name="bodyFatPercentage"
                    step="0.1"
                    placeholder="e.g., 18.5"
                    value={formData.bodyFatPercentage}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="inbody-form-group">
                  <label>
                    <HeartIcon style={{ color: '#ef4444' }} />
                    Visceral Fat Level
                  </label>
                  <input
                    type="number"
                    name="visceralFatLevel"
                    placeholder="e.g., 8"
                    value={formData.visceralFatLevel}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <button type="submit" className="inbody-form-submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="loading-spinner" style={{ width: 18, height: 18 }}></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <PlusIcon />
                    Add Measurement
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Scan History */}
        <div className="inbody-history-card">
          <div className="inbody-history-header">
            <h3>Scan History</h3>
            <button disabled>Compare Selected (0)</button>
          </div>
          {loading ? (
            <div className="inbody-empty">
              <div className="loading-spinner"></div>
              <p>Loading history...</p>
            </div>
          ) : measurements.length === 0 ? (
            <div className="inbody-empty">
              <HistoryIcon />
              <p>No measurements yet</p>
              <p>Add your first InBody measurement to start tracking</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="inbody-history-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" />
                    </th>
                    <th>Date</th>
                    <th>Weight</th>
                    <th>SMM</th>
                    <th>PBF</th>
                    <th>Score</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.slice(0, 8).map((m, idx) => {
                    const score = calculateScore(m)
                    return (
                      <tr key={m.measurementId || idx}>
                        <td>
                          <input type="checkbox" />
                        </td>
                        <td className="inbody-history-date">
                          {formatDate(m.measurementDate || m.createdAt)}
                        </td>
                        <td>{m.weight} kg</td>
                        <td className="inbody-history-smm">{m.muscleMass} kg</td>
                        <td className="inbody-history-pbf">{m.bodyFatPercentage}%</td>
                        <td>
                          {score && (
                            <span className={`inbody-history-score ${score >= 85 ? 'excellent' : 'good'}`}>
                              {score}/100
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="inbody-history-view-btn">
                            <VisibilityIcon />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default InBody
