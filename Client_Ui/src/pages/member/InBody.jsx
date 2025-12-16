import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { inBodyService } from '../../services/inBodyService'
import { useToast } from '../../contexts/ToastContext'

// Icons
const ScaleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
  </svg>
)

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
)

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

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
)

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
)

const FlameIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
)

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
  </svg>
)

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
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

  return (
    <DashboardLayout role="Member">
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            InBody <span style={{ color: '#ff6b35' }}>Analysis</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Track your body composition and monitor your transformation
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
            <ClipboardIcon style={{ width: 18, height: 18, color: '#ff6b35' }} />
            <span style={{ color: 'white', fontWeight: '600' }}>
              {measurements.length} measurements recorded
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
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
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
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
                {parseFloat(weightChange) <= 0 ? <TrendingDownIcon style={{width:12,height:12}}/> : <TrendingUpIcon style={{width:12,height:12}}/>}
                {Math.abs(weightChange)} kg
              </span>
            )}
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#333' }}>
              {latest.weight || '--'} <span style={{ fontSize: '0.9rem', color: '#666' }}>kg</span>
            </div>
            <div style={{ color: '#666', fontWeight: '500', fontSize: '0.9rem' }}>Current Weight</div>
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
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <FlameIcon style={{ width: 24, height: 24 }} />
            {fatChange && (
              <span style={{ 
                background: 'rgba(255,255,255,0.2)',
                padding: '0.25rem 0.5rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {parseFloat(fatChange) <= 0 ? '-' : '+'}{Math.abs(fatChange)}%
              </span>
            )}
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#333' }}>
              {latest.bodyFatPercentage || '--'} <span style={{ fontSize: '0.9rem', color: '#666' }}>%</span>
            </div>
            <div style={{ color: '#666', fontWeight: '500', fontSize: '0.9rem' }}>Body Fat</div>
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
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
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
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#333' }}>
              {latest.muscleMass || '--'} <span style={{ fontSize: '0.9rem', color: '#666' }}>kg</span>
            </div>
            <div style={{ color: '#666', fontWeight: '500', fontSize: '0.9rem' }}>Muscle Mass</div>
          </div>
        </div>

        {/* Visceral Fat Card */}
        <div className="card" style={{ 
          border: '2px solid #f59e0b',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            padding: '1rem',
            color: 'white'
          }}>
            <HeartIcon style={{ width: 24, height: 24 }} />
          </div>
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#333' }}>
              {latest.visceralFatLevel || '--'}
            </div>
            <div style={{ color: '#666', fontWeight: '500', fontSize: '0.9rem' }}>Visceral Fat Level</div>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {/* Update Form */}
        <div className="card" style={{ border: '1px solid #e0e0e0', borderRadius: '1rem' }}>
          <div className="card-header" style={{ 
            background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
            color: 'white',
            padding: '1.25rem 1.5rem',
            borderRadius: '1rem 1rem 0 0'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusIcon style={{ width: 24, height: 24 }} />
              Add New Measurement
            </h3>
          </div>
          <div className="card-content" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <div className="form-group">
                  <label style={{ 
                    fontWeight: '600', 
                    color: '#333', 
                    marginBottom: '0.5rem', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <ScaleIcon style={{ width: 16, height: 16, color: '#ff6b35' }} />
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    name="weight"
                    className="input"
                    step="0.1"
                    placeholder="e.g., 78.5"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                    style={{ 
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      width: '100%',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ 
                    fontWeight: '600', 
                    color: '#333', 
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <ActivityIcon style={{ width: 16, height: 16, color: '#22c55e' }} />
                    Muscle Mass (kg) *
                  </label>
                  <input
                    type="number"
                    name="muscleMass"
                    className="input"
                    step="0.1"
                    placeholder="e.g., 34.2"
                    value={formData.muscleMass}
                    onChange={handleChange}
                    required
                    style={{ 
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      width: '100%',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ 
                    fontWeight: '600', 
                    color: '#333', 
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FlameIcon style={{ width: 16, height: 16, color: '#ef4444' }} />
                    Body Fat (%) *
                  </label>
                  <input
                    type="number"
                    name="bodyFatPercentage"
                    className="input"
                    step="0.1"
                    placeholder="e.g., 18.5"
                    value={formData.bodyFatPercentage}
                    onChange={handleChange}
                    required
                    style={{ 
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      width: '100%',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ 
                    fontWeight: '600', 
                    color: '#333', 
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <HeartIcon style={{ width: 16, height: 16, color: '#f59e0b' }} />
                    Visceral Fat Level
                  </label>
                  <input
                    type="number"
                    name="visceralFatLevel"
                    className="input"
                    placeholder="e.g., 8"
                    value={formData.visceralFatLevel}
                    onChange={handleChange}
                    style={{ 
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      width: '100%',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
                style={{ 
                  width: '100%',
                  padding: '0.875rem',
                  background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  borderRadius: '0.5rem'
                }}
              >
                {submitting ? (
                  <>
                    <div className="loading-spinner" style={{ width: 18, height: 18 }}></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <PlusIcon style={{ width: 18, height: 18 }} />
                    Add Measurement
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="card" style={{ border: '1px solid #e0e0e0', borderRadius: '1rem' }}>
          <div className="card-header" style={{ 
            background: '#f8f9fa', 
            borderBottom: '2px solid #ff6b35',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HistoryIcon style={{ width: 20, height: 20, color: '#ff6b35' }} />
              Measurement <span style={{ color: '#ff6b35' }}>History</span>
            </h3>
            <span className="badge" style={{ 
              background: '#ff6b35', 
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '1rem',
              fontWeight: '600'
            }}>
              {measurements.length} records
            </span>
          </div>
          <div className="card-content" style={{ padding: 0 }}>
            {loading ? (
              <div className="empty-state" style={{ padding: '3rem' }}>
                <div className="loading-spinner"></div>
                <p style={{ marginTop: '1rem', color: '#666' }}>Loading history...</p>
              </div>
            ) : measurements.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem' }}>
                <HistoryIcon style={{ width: 48, height: 48, color: '#ccc' }} />
                <p style={{ marginTop: '1rem', color: '#666', fontWeight: '600' }}>No measurements yet</p>
                <p style={{ color: '#999' }}>Add your first InBody measurement to start tracking</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ color: '#333', fontWeight: '600', padding: '1rem' }}>Date</th>
                      <th style={{ color: '#333', fontWeight: '600', padding: '1rem' }}>Weight</th>
                      <th style={{ color: '#333', fontWeight: '600', padding: '1rem' }}>Muscle</th>
                      <th style={{ color: '#333', fontWeight: '600', padding: '1rem' }}>Fat %</th>
                      <th style={{ color: '#333', fontWeight: '600', padding: '1rem' }}>VF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.slice(0, 8).map((m, idx) => (
                      <tr key={m.measurementId || idx} style={{ 
                        borderBottom: '1px solid #eee',
                        background: idx === 0 ? '#fff8f5' : 'white'
                      }}>
                        <td style={{ 
                          fontWeight: idx === 0 ? 600 : 400, 
                          color: idx === 0 ? '#ff6b35' : '#555',
                          padding: '1rem'
                        }}>
                          {new Date(m.measurementDate || m.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                          {idx === 0 && <span style={{ 
                            marginLeft: '0.5rem',
                            fontSize: '0.7rem',
                            background: '#ff6b35',
                            color: 'white',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '0.25rem'
                          }}>Latest</span>}
                        </td>
                        <td style={{ padding: '1rem', color: '#555' }}>{m.weight} kg</td>
                        <td style={{ padding: '1rem', color: '#555' }}>{m.muscleMass} kg</td>
                        <td style={{ padding: '1rem', color: '#555' }}>{m.bodyFatPercentage}%</td>
                        <td style={{ padding: '1rem', color: '#555' }}>{m.visceralFatLevel || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default InBody
