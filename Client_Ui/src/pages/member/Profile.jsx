import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/userService'
import { useToast } from '../../contexts/ToastContext'

// Icons
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)

const RulerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>
  </svg>
)

const ScaleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
  </svg>
)

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
  </svg>
)

const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
  </svg>
)

function Profile() {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    fitnessGoal: '',
    height: '',
    weight: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await userService.getUserById(user.userId)
      setProfileData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        fitnessGoal: data.fitnessGoal || '',
        height: data.height || '',
        weight: data.weight || ''
      })
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        fitnessGoal: '',
        height: '',
        weight: ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updatedUser = await userService.updateProfile(user.userId, profileData)
      updateUser({ ...user, ...updatedUser })
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Member">
        <div className="empty-state" style={{ minHeight: 400, background: '#fff' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading your profile...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Member">
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            My <span style={{ color: '#ff6b35' }}>Profile</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Manage your personal information and fitness preferences
          </p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '350px 1fr', 
        gap: '2rem',
        '@media (max-width: 900px)': {
          gridTemplateColumns: '1fr'
        }
      }}>
        {/* Profile Card */}
        <div className="card" style={{ 
          border: '2px solid #ff6b35',
          borderRadius: '1rem',
          overflow: 'hidden',
          height: 'fit-content'
        }}>
          {/* Profile Header with Image */}
          <div style={{
            background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white'
          }}>
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '3rem', fontWeight: 700, color: '#ff6b35' }}>
                  {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
              <button 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#ff6b35',
                  border: '3px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                <CameraIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <h3 style={{ fontWeight: '700', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              {profileData.name}
            </h3>
            <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>{profileData.email}</p>
          </div>

          {/* Profile Stats */}
          <div style={{ padding: '1.5rem' }}>
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#f0fdf4',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              marginBottom: '1rem',
              border: '1px solid #22c55e'
            }}>
              <DumbbellIcon style={{ width: 16, height: 16, color: '#22c55e' }} />
              <span style={{ color: '#22c55e', fontWeight: '600' }}>{user.role || 'Member'}</span>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem',
              marginTop: '1rem'
            }}>
              <div style={{ 
                textAlign: 'center', 
                padding: '1rem',
                background: '#fff8f5',
                borderRadius: '0.75rem',
                border: '1px solid #ffe0d0'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff6b35' }}>
                  {profileData.height || '--'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>Height (cm)</div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: '1rem',
                background: '#fff8f5',
                borderRadius: '0.75rem',
                border: '1px solid #ffe0d0'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff6b35' }}>
                  {profileData.weight || '--'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>Weight (kg)</div>
              </div>
            </div>

            {profileData.fitnessGoal && (
              <div style={{ 
                marginTop: '1rem',
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '0.75rem',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <TargetIcon style={{ width: 16, height: 16, color: '#ff6b35' }} />
                  <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '600' }}>FITNESS GOAL</span>
                </div>
                <div style={{ fontWeight: '600', color: '#333' }}>{profileData.fitnessGoal}</div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="card" style={{ 
          border: '1px solid #e0e0e0',
          borderRadius: '1rem'
        }}>
          <div className="card-header" style={{ 
            background: '#f8f9fa', 
            borderBottom: '2px solid #ff6b35',
            padding: '1.25rem 1.5rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserIcon style={{ width: 24, height: 24, color: '#ff6b35' }} />
              Personal <span style={{ color: '#ff6b35' }}>Information</span>
            </h3>
          </div>
          <div className="card-content" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.25rem', 
                marginBottom: '1.5rem' 
              }}>
                <div className="form-group">
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '0.5rem'
                  }}>
                    <UserIcon style={{ width: 16, height: 16, color: '#ff6b35' }} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="input"
                    value={profileData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    style={{ 
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      width: '100%',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '0.5rem'
                  }}>
                    <MailIcon style={{ width: 16, height: 16, color: '#ff6b35' }} />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="input"
                    value={profileData.email}
                    disabled
                    style={{ 
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      width: '100%',
                      fontSize: '1rem',
                      background: '#f5f5f5',
                      color: '#999',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '0.5rem'
                  }}>
                    <PhoneIcon style={{ width: 16, height: 16, color: '#ff6b35' }} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="input"
                    value={profileData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    style={{ 
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      width: '100%',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '0.5rem'
                  }}>
                    <TargetIcon style={{ width: 16, height: 16, color: '#ff6b35' }} />
                    Fitness Goal
                  </label>
                  <select
                    name="fitnessGoal"
                    className="input"
                    value={profileData.fitnessGoal}
                    onChange={handleChange}
                    style={{ 
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      width: '100%',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    <option value="">Select a goal...</option>
                    <option value="Lose Weight">🏃 Lose Weight</option>
                    <option value="Build Muscle">💪 Build Muscle</option>
                    <option value="Improve Endurance">🚴 Improve Endurance</option>
                    <option value="Maintain Fitness">⚖️ Maintain Fitness</option>
                    <option value="Increase Flexibility">🧘 Increase Flexibility</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '0.5rem'
                  }}>
                    <RulerIcon style={{ width: 16, height: 16, color: '#ff6b35' }} />
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    className="input"
                    value={profileData.height}
                    onChange={handleChange}
                    placeholder="e.g., 175"
                    style={{ 
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      width: '100%',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '0.5rem'
                  }}>
                    <ScaleIcon style={{ width: 16, height: 16, color: '#ff6b35' }} />
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    className="input"
                    value={profileData.weight}
                    onChange={handleChange}
                    placeholder="e.g., 70"
                    style={{ 
                      padding: '0.75rem 1rem',
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
                disabled={saving}
                style={{ 
                  padding: '0.875rem 2rem',
                  background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '0.5rem'
                }}
              >
                {saving ? (
                  <>
                    <div className="loading-spinner" style={{ width: 18, height: 18 }}></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon style={{ width: 18, height: 18 }} />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Profile
