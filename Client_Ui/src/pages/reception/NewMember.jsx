import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useToast } from '../../contexts/ToastContext'
import { userService } from '../../services/userService'

// Icons
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
)

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
)

function NewMember() {
  const navigate = useNavigate()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    password: '',
    confirmPassword: '',
    subscriptionType: 'Monthly',
    fitnessGoal: 'General Fitness'
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      await userService.registerMember({
        ...formData,
        role: 'Member'
      })
      toast.success('Member registered successfully!')
      navigate('/reception/members')
    } catch (err) {
      toast.error(err.message || 'Failed to register member')
    } finally {
      setSaving(false)
    }
  }

  const subscriptionTypes = [
    { value: 'Monthly', label: 'Monthly', price: '500 EGP/month' },
    { value: 'Quarterly', label: 'Quarterly', price: '1,350 EGP/3 months' },
    { value: 'Annual', label: 'Annual', price: '4,800 EGP/year' }
  ]

  const fitnessGoals = [
    'General Fitness',
    'Weight Loss',
    'Build Muscle',
    'Strength Training',
    'Endurance',
    'Flexibility'
  ]

  return (
    <DashboardLayout role="Reception">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>
            <span className="text-foreground">Register New </span>
            <span className="text-primary">Member</span>
          </h1>
          <p>Add a new member to the gym</p>
        </div>
        <button 
          className="btn btn-outline"
          onClick={() => navigate('/reception/members')}
        >
          <ArrowLeftIcon />
          Back to Members
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
          {/* Personal Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="text-foreground">Personal </span>
                <span className="text-primary">Information</span>
              </h3>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label className="form-label">
                  <UserIcon />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  className="input-field"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <MailIcon />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <PhoneIcon />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="input-field"
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    <CalendarIcon />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    className="input-field"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    name="gender"
                    className="input-field"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Account & Subscription */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <span className="text-foreground">Account </span>
                  <span className="text-primary">Setup</span>
                </h3>
              </div>
              <div className="card-content">
                <div className="form-group">
                  <label className="form-label">
                    <LockIcon />
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="input-field"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <LockIcon />
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="input-field"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fitness Goal</label>
                  <select
                    name="fitnessGoal"
                    className="input-field"
                    value={formData.fitnessGoal}
                    onChange={handleChange}
                  >
                    {fitnessGoals.map(goal => (
                      <option key={goal} value={goal}>{goal}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <CreditCardIcon style={{ marginRight: '0.5rem' }} />
                  <span className="text-foreground">Subscription </span>
                  <span className="text-primary">Plan</span>
                </h3>
              </div>
              <div className="card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {subscriptionTypes.map(sub => (
                    <label
                      key={sub.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem',
                        background: formData.subscriptionType === sub.value ? 'rgba(24, 206, 242, 0.1)' : 'var(--card-darker)',
                        borderRadius: '0.5rem',
                        border: formData.subscriptionType === sub.value ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="subscriptionType"
                        value={sub.value}
                        checked={formData.subscriptionType === sub.value}
                        onChange={handleChange}
                        style={{ display: 'none' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{sub.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{sub.price}</div>
                      </div>
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: formData.subscriptionType === sub.value ? 'var(--primary)' : 'var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {formData.subscriptionType === sub.value && (
                          <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: 'var(--primary)'
                          }}></div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
              style={{ width: '100%' }}
            >
              {saving ? (
                <div className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
              ) : (
                <>
                  <SaveIcon />
                  Register Member
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}

export default NewMember
