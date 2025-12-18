import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/userService'
import { useToast } from '../../contexts/ToastContext'
import './Profile.css'

// Icons - Modern Filled Style
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
  </svg>
)

const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
)

const BarChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
  </svg>
)

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
  </svg>
)

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
  </svg>
)

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="3.2"/>
    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
  </svg>
)

const FitnessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
  </svg>
)

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
  </svg>
)

const CoachIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
  </svg>
)

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
)

const PremiumIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
  </svg>
)

const ArrowForwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
  </svg>
)

const RestaurantIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
  </svg>
)

// Fitness Goals Options
const fitnessGoals = [
  { id: 'weight-loss', label: 'Weight Loss', icon: '🏃' },
  { id: 'muscle-gain', label: 'Muscle Gain', icon: '💪' },
  { id: 'flexibility', label: 'Flexibility', icon: '🧘' },
  { id: 'endurance', label: 'Endurance', icon: '🚴' },
  { id: 'strength', label: 'Strength', icon: '🏋️' },
  { id: 'general-fitness', label: 'General Fitness', icon: '⚡' }
]

// Navigation Items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/member/dashboard' },
  { id: 'profile', label: 'My Profile', icon: PersonIcon, path: '/member/profile', active: true },
  { id: 'progress', label: 'Progress', icon: BarChartIcon, path: '/member/progress' },
  { id: 'subscription', label: 'Subscription', icon: CreditCardIcon, path: '/member/subscriptions' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/member/settings' }
]

function Profile() {
  const { user, updateUser, logout } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeGoals, setActiveGoals] = useState(['weight-loss', 'muscle-gain'])
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    progressUpdates: true,
    promotions: false
  })
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    fitnessGoal: '',
    height: '',
    weight: '',
    targetWeight: ''
  })

  // Mock stats data
  const stats = {
    totalWorkouts: 127,
    programsDone: 8,
    activeCoaches: 3
  }

  // Mock active programs
  const activePrograms = [
    { id: 1, name: 'HIIT Masterclass', coach: 'Coach Mike', progress: 75, icon: FitnessIcon },
    { id: 2, name: 'Nutrition Planning', coach: 'Coach Sarah', progress: 40, icon: RestaurantIcon }
  ]

  // Mock subscription data
  const subscription = {
    plan: 'Gold Tier',
    status: 'Active',
    renewalDate: 'Jan 15, 2025',
    price: '$49.99/month'
  }

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
        dateOfBirth: data.dateOfBirth || '',
        gender: data.gender || 'male',
        fitnessGoal: data.fitnessGoal || '',
        height: data.height || '',
        weight: data.weight || '',
        targetWeight: data.targetWeight || ''
      })
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: '',
        gender: 'male',
        fitnessGoal: '',
        height: '',
        weight: '',
        targetWeight: ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const toggleGoal = (goalId) => {
    setActiveGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    )
  }

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
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
        <div className="profile-page">
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Member">
      <div className="profile-page">
        <div className="profile-layout">
          {/* Sidebar */}
          <aside className="profile-sidebar">
            {/* User Card */}
            <div className="profile-user-card">
              <div className="profile-avatar">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Profile" />
                ) : (
                  <span>{profileData.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
                <button className="profile-avatar-edit">
                  <CameraIcon />
                </button>
              </div>
              <h3 className="profile-user-name">{profileData.name}</h3>
              <p className="profile-user-email">{profileData.email}</p>
              <span className="profile-user-badge">
                <CheckCircleIcon />
                Active Member
              </span>
            </div>

            {/* Navigation */}
            <nav className="profile-nav">
              {navItems.map(item => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`profile-nav-item ${item.active ? 'active' : ''}`}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              ))}
              <button className="profile-nav-item logout" onClick={logout}>
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="profile-main">
            {/* Stats Row */}
            <div className="profile-stats-row">
              <div className="profile-stat-card">
                <div className="profile-stat-icon blue">
                  <FitnessIcon />
                </div>
                <div className="profile-stat-info">
                  <span className="profile-stat-value">{stats.totalWorkouts}</span>
                  <span className="profile-stat-label">Total Workouts</span>
                </div>
                <div className="profile-stat-trend positive">
                  <TrendingUpIcon />
                  +12%
                </div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-icon green">
                  <TrophyIcon />
                </div>
                <div className="profile-stat-info">
                  <span className="profile-stat-value">{stats.programsDone}</span>
                  <span className="profile-stat-label">Programs Done</span>
                </div>
                <div className="profile-stat-trend positive">
                  <TrendingUpIcon />
                  +3
                </div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-icon orange">
                  <CoachIcon />
                </div>
                <div className="profile-stat-info">
                  <span className="profile-stat-value">{stats.activeCoaches}</span>
                  <span className="profile-stat-label">Active Coaches</span>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <section className="profile-section">
              <div className="profile-section-header">
                <h2>Personal Information</h2>
                <p>Update your personal details here</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="profile-form-grid">
                  <div className="profile-form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      disabled
                      className="disabled"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={profileData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="profile-form-group full-width">
                    <label>Gender</label>
                    <div className="profile-gender-options">
                      <label className={`profile-gender-option ${profileData.gender === 'male' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={profileData.gender === 'male'}
                          onChange={handleChange}
                        />
                        <span>Male</span>
                      </label>
                      <label className={`profile-gender-option ${profileData.gender === 'female' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={profileData.gender === 'female'}
                          onChange={handleChange}
                        />
                        <span>Female</span>
                      </label>
                      <label className={`profile-gender-option ${profileData.gender === 'other' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="gender"
                          value="other"
                          checked={profileData.gender === 'other'}
                          onChange={handleChange}
                        />
                        <span>Other</span>
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            </section>

            {/* Physical Stats */}
            <section className="profile-section">
              <div className="profile-section-header">
                <h2>Physical Stats</h2>
                <p>Track your body measurements</p>
              </div>
              <div className="profile-physical-grid">
                <div className="profile-physical-card">
                  <div className="profile-physical-icon">📏</div>
                  <div className="profile-physical-info">
                    <span className="profile-physical-label">Height</span>
                    <input
                      type="number"
                      name="height"
                      value={profileData.height}
                      onChange={handleChange}
                      placeholder="175"
                      className="profile-physical-input"
                    />
                    <span className="profile-physical-unit">cm</span>
                  </div>
                </div>
                <div className="profile-physical-card">
                  <div className="profile-physical-icon">⚖️</div>
                  <div className="profile-physical-info">
                    <span className="profile-physical-label">Current Weight</span>
                    <input
                      type="number"
                      name="weight"
                      value={profileData.weight}
                      onChange={handleChange}
                      placeholder="70"
                      className="profile-physical-input"
                    />
                    <span className="profile-physical-unit">kg</span>
                  </div>
                </div>
                <div className="profile-physical-card">
                  <div className="profile-physical-icon">🎯</div>
                  <div className="profile-physical-info">
                    <span className="profile-physical-label">Goal Weight</span>
                    <input
                      type="number"
                      name="targetWeight"
                      value={profileData.targetWeight}
                      onChange={handleChange}
                      placeholder="65"
                      className="profile-physical-input"
                    />
                    <span className="profile-physical-unit">kg</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Fitness Goals */}
            <section className="profile-section">
              <div className="profile-section-header">
                <h2>Fitness Goals</h2>
                <p>Select your fitness objectives</p>
              </div>
              <div className="profile-goals-grid">
                {fitnessGoals.map(goal => (
                  <button
                    key={goal.id}
                    type="button"
                    className={`profile-goal-tag ${activeGoals.includes(goal.id) ? 'active' : ''}`}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    <span className="profile-goal-icon">{goal.icon}</span>
                    <span>{goal.label}</span>
                    {activeGoals.includes(goal.id) && <CheckCircleIcon />}
                  </button>
                ))}
              </div>
            </section>

            {/* Notification Preferences */}
            <section className="profile-section">
              <div className="profile-section-header">
                <h2>Notification Preferences</h2>
                <p>Manage your notification settings</p>
              </div>
              <div className="profile-notifications">
                <div className="profile-notification-item">
                  <div className="profile-notification-info">
                    <span className="profile-notification-label">Workout Reminders</span>
                    <span className="profile-notification-desc">Get reminded about your scheduled workouts</span>
                  </div>
                  <label className="profile-toggle">
                    <input
                      type="checkbox"
                      checked={notifications.workoutReminders}
                      onChange={() => toggleNotification('workoutReminders')}
                    />
                    <span className="profile-toggle-slider"></span>
                  </label>
                </div>
                <div className="profile-notification-item">
                  <div className="profile-notification-info">
                    <span className="profile-notification-label">Progress Updates</span>
                    <span className="profile-notification-desc">Weekly progress reports and insights</span>
                  </div>
                  <label className="profile-toggle">
                    <input
                      type="checkbox"
                      checked={notifications.progressUpdates}
                      onChange={() => toggleNotification('progressUpdates')}
                    />
                    <span className="profile-toggle-slider"></span>
                  </label>
                </div>
                <div className="profile-notification-item">
                  <div className="profile-notification-info">
                    <span className="profile-notification-label">Promotional Emails</span>
                    <span className="profile-notification-desc">Special offers and new features</span>
                  </div>
                  <label className="profile-toggle">
                    <input
                      type="checkbox"
                      checked={notifications.promotions}
                      onChange={() => toggleNotification('promotions')}
                    />
                    <span className="profile-toggle-slider"></span>
                  </label>
                </div>
              </div>
            </section>

            {/* Subscription Card */}
            <section className="profile-section">
              <div className="profile-section-header">
                <h2>Current Subscription</h2>
                <p>Manage your membership plan</p>
              </div>
              <div className="profile-subscription-card">
                <div className="profile-subscription-badge">
                  <PremiumIcon />
                </div>
                <div className="profile-subscription-info">
                  <h3>{subscription.plan}</h3>
                  <p>Renews on {subscription.renewalDate}</p>
                  <span className="profile-subscription-price">{subscription.price}</span>
                </div>
                <div className="profile-subscription-actions">
                  <Link to="/member/subscriptions" className="profile-btn primary">
                    Manage Plan
                    <ArrowForwardIcon />
                  </Link>
                </div>
              </div>
            </section>

            {/* Active Programs */}
            <section className="profile-section">
              <div className="profile-section-header">
                <h2>Active Programs</h2>
                <p>Your current training programs</p>
              </div>
              <div className="profile-programs-grid">
                {activePrograms.map(program => (
                  <div key={program.id} className="profile-program-card">
                    <div className="profile-program-icon">
                      <program.icon />
                    </div>
                    <div className="profile-program-info">
                      <h4>{program.name}</h4>
                      <p>{program.coach}</p>
                    </div>
                    <div className="profile-program-progress">
                      <div className="profile-progress-bar">
                        <div 
                          className="profile-progress-fill"
                          style={{ width: `${program.progress}%` }}
                        ></div>
                      </div>
                      <span className="profile-progress-text">{program.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Security Section */}
            <section className="profile-section">
              <div className="profile-section-header">
                <h2>Security</h2>
                <p>Manage your account security</p>
              </div>
              <div className="profile-security-options">
                <button className="profile-security-btn">
                  <span>🔐</span>
                  Change Password
                </button>
                <button className="profile-security-btn">
                  <span>📱</span>
                  Two-Factor Authentication
                </button>
                <button className="profile-security-btn">
                  <span>📋</span>
                  Login History
                </button>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="profile-section danger">
              <div className="profile-section-header">
                <h2>Danger Zone</h2>
                <p>Irreversible actions for your account</p>
              </div>
              <div className="profile-danger-actions">
                <button className="profile-danger-btn">
                  <span>🚫</span>
                  Deactivate Account
                </button>
                <button className="profile-danger-btn delete">
                  <span>🗑️</span>
                  Delete Account Permanently
                </button>
              </div>
            </section>
          </main>
        </div>

        {/* Sticky Action Bar */}
        <div className="profile-action-bar">
          <button type="button" className="profile-btn secondary" onClick={fetchProfile}>
            Discard Changes
          </button>
          <button 
            type="button" 
            className="profile-btn primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="loading-spinner small"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Profile
