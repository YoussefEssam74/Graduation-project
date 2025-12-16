import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

// Icons as SVG components
const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"/>
    <path d="m21 21-1-1"/>
    <path d="m3 3 1 1"/>
    <path d="m18 22 4-4"/>
    <path d="m2 6 4-4"/>
    <path d="m3 10 7-7"/>
    <path d="m14 21 7-7"/>
  </svg>
)

const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
)

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const AlertCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
)

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const response = await login(email, password)
      toast.success('Login successful!')
      
      // Redirect based on role
      const dashboardPaths = {
        Member: '/member',
        Coach: '/coach',
        Receptionist: '/reception',
        Admin: '/admin'
      }
      navigate(dashboardPaths[response.user.role] || '/member')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      {/* Background Animation */}
      <div className="auth-background">
        <div className="auth-background-blob"></div>
        <div className="auth-background-blob"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          {/* Left Side - Branding */}
          <div className="auth-branding">
            <div className="auth-branding-bg">
              <div className="auth-branding-bg-circle"></div>
              <div className="auth-branding-bg-circle"></div>
            </div>

            <div className="auth-branding-content">
              <div className="auth-branding-logo">
                <div className="auth-branding-logo-icon">
                  <DumbbellIcon />
                </div>
                <h1 className="auth-branding-logo-text">
                  Pulse<span>Gym</span>
                </h1>
              </div>

              <h2 className="auth-branding-title">
                Your Fitness Journey Starts Here
              </h2>
              <p className="auth-branding-description">
                Smart Gym Management powered by AI Technology. Transform your fitness with personalized training, intelligent coaching, and seamless facility management.
              </p>
            </div>

            <div className="auth-branding-features">
              <div className="auth-branding-feature">
                <div className="auth-branding-feature-icon">
                  <ZapIcon />
                </div>
                <div>
                  <h3 className="auth-branding-feature-title">AI-Powered Coaching</h3>
                  <p className="auth-branding-feature-description">Personalized workout and nutrition plans generated by advanced AI</p>
                </div>
              </div>
              <div className="auth-branding-feature">
                <div className="auth-branding-feature-icon">
                  <DumbbellIcon />
                </div>
                <div>
                  <h3 className="auth-branding-feature-title">Smart Equipment Booking</h3>
                  <p className="auth-branding-feature-description">Reserve equipment and coaches with real-time availability</p>
                </div>
              </div>
              <div className="auth-branding-feature">
                <div className="auth-branding-feature-icon">
                  <ShieldCheckIcon />
                </div>
                <div>
                  <h3 className="auth-branding-feature-title">InBody Tracking</h3>
                  <p className="auth-branding-feature-description">Comprehensive body composition analysis and progress monitoring</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="auth-form-container">
            <div className="auth-form-header">
              <h2 className="auth-form-title">Sign In</h2>
              <p className="auth-form-subtitle">Enter your credentials to access your account</p>
            </div>

            {error && (
              <div className="auth-error">
                <AlertCircleIcon />
                <span>{error}</span>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Email</label>
                <div style={{ position: 'relative' }}>
                  <div className="input-icon">
                    <MailIcon />
                  </div>
                  <input
                    type="email"
                    className="input input-with-icon"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <div className="input-icon">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    className="input input-with-icon"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-form-options">
                <label className="auth-form-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="auth-form-forgot">
                  Forgot password?
                </Link>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary auth-form-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="auth-form-divider">
                <span>or continue with</span>
              </div>

              <p className="auth-form-footer">
                Don't have an account?{' '}
                <Link to="/register">Sign up</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
