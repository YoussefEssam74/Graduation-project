import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Icons as SVG components
const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"/>
    <path d="m21 21-1-1"/>
    <path d="m3 3 1 1"/>
    <path d="m18 22 4-4"/>
    <path d="m2 6 4-4"/>
    <path d="m3 10 7-7"/>
    <path d="m14 21 7-7"/>
  </svg>
)

const LayoutDashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1"/>
    <rect width="7" height="5" x="14" y="3" rx="1"/>
    <rect width="7" height="9" x="14" y="12" rx="1"/>
    <rect width="7" height="5" x="3" y="16" rx="1"/>
  </svg>
)

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
)

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
)

const CoinsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/>
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
    <path d="M7 6h1v4"/>
    <path d="m16.71 13.88.7.71-2.82 2.82"/>
  </svg>
)

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" x2="19" y1="8" y2="14"/>
    <line x1="22" x2="16" y1="11" y2="11"/>
  </svg>
)

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/>
    <line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
)

const BarChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="20" y2="10"/>
    <line x1="18" x2="18" y1="20" y2="4"/>
    <line x1="6" x2="6" y1="20" y2="16"/>
  </svg>
)

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="12" y2="12"/>
    <line x1="4" x2="20" y1="6" y2="6"/>
    <line x1="4" x2="20" y1="18" y2="18"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
)

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
)

const ScaleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="M7 21h10"/>
    <path d="M12 3v18"/>
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
  </svg>
)

const CrownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
  </svg>
)

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
  </svg>
)

function DashboardLayout({ children, role }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = {
    Member: [
      { path: '/member', icon: LayoutDashboardIcon, label: 'Dashboard' },
      { path: '/member/ai-coach', icon: BrainIcon, label: 'AI Coach' },
      { path: '/member/bookings', icon: CalendarIcon, label: 'Bookings' },
      { path: '/member/programs', icon: DumbbellIcon, label: 'Programs' },
      { path: '/member/inbody', icon: ScaleIcon, label: 'InBody' },
      { path: '/member/progress', icon: TrendingUpIcon, label: 'Progress' },
      { path: '/member/tokens', icon: CoinsIcon, label: 'Tokens' },
      { path: '/member/subscriptions', icon: CrownIcon, label: 'Plans' }
    ],
    Coach: [
      { path: '/coach', icon: LayoutDashboardIcon, label: 'Dashboard' },
      { path: '/coach/clients', icon: UsersIcon, label: 'Clients' },
      { path: '/coach/programs', icon: DumbbellIcon, label: 'Programs' },
      { path: '/coach/schedule', icon: CalendarIcon, label: 'Schedule' }
    ],
    Receptionist: [
      { path: '/reception', icon: LayoutDashboardIcon, label: 'Dashboard' },
      { path: '/reception/checkin', icon: EyeIcon, label: 'Check-In' },
      { path: '/reception/members', icon: UsersIcon, label: 'Members' },
      { path: '/reception/new-member', icon: UserPlusIcon, label: 'Register' },
      { path: '/reception/bookings', icon: CalendarIcon, label: 'Bookings' },
      { path: '/reception/payments', icon: CreditCardIcon, label: 'Payments' }
    ],
    Admin: [
      { path: '/admin', icon: LayoutDashboardIcon, label: 'Dashboard' },
      { path: '/admin/users', icon: UsersIcon, label: 'Users' },
      { path: '/admin/equipment', icon: DumbbellIcon, label: 'Equipment' },
      { path: '/admin/analytics', icon: BarChartIcon, label: 'Analytics' }
    ]
  }

  const currentMenuItems = menuItems[role] || []

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'Member': return '#3b82f6'
      case 'Coach': return '#22c55e'
      case 'Receptionist': return '#a855f7'
      case 'Admin': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getRoleIcon = () => {
    switch (role) {
      case 'Admin': return <ShieldIcon />
      case 'Coach': return <DumbbellIcon />
      case 'Receptionist': return <UsersIcon />
      default: return <UserIcon />
    }
  }

  return (
    <div className="top-navbar-layout">
      {/* Top Navigation Bar */}
      <header className="top-navbar">
        <div className="navbar-container">
          {/* Logo */}
          <Link to={`/${role?.toLowerCase() || 'member'}`} className="navbar-logo">
            <div className="navbar-logo-icon">
              <DumbbellIcon />
            </div>
            <span className="navbar-logo-text">
              Pulse<span>Gym</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="navbar-nav desktop-nav">
            {currentMenuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`navbar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <item.icon />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="navbar-user-section">
            {/* Token Balance for Members */}
            {role === 'Member' && user?.tokenBalance !== undefined && (
              <div className="navbar-token-balance">
                <CoinsIcon />
                <span>{user.tokenBalance || 0}</span>
              </div>
            )}

            {/* User Avatar & Info - Clickable to Profile */}
            <Link 
              to={`/${role?.toLowerCase() || 'member'}/profile`} 
              className="navbar-user"
              title="Go to Profile"
            >
              <div className="navbar-avatar" style={{ backgroundColor: getRoleBadgeColor() }}>
                {getRoleIcon()}
              </div>
              <div className="navbar-user-info">
                <span className="navbar-user-name">{user?.name?.split(' ')[0] || 'User'}</span>
                <span className="navbar-user-role">{role}</span>
              </div>
            </Link>

            {/* Logout Button */}
            <button className="navbar-logout-btn" onClick={handleLogout} title="Logout">
              <LogOutIcon />
              <span>Logout</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              className="navbar-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="navbar-nav mobile-nav">
            {currentMenuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`navbar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay active" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="main-content-area">
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
