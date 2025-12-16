import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import './styles/index.css'
import './styles/layout.css'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Member Pages
import MemberDashboard from './pages/member/Dashboard'
import MemberAICoach from './pages/member/AICoach'
import MemberBookings from './pages/member/Bookings'
import MemberInBody from './pages/member/InBody'
import MemberProfile from './pages/member/Profile'
import MemberProgress from './pages/member/Progress'
import MemberPrograms from './pages/member/Programs'
import MemberTokens from './pages/member/Tokens'
import MemberSubscriptions from './pages/member/Subscriptions'

// Coach Pages
import CoachDashboard from './pages/coach/Dashboard'
import CoachClients from './pages/coach/Clients'
import CoachPrograms from './pages/coach/Programs'
import CoachSchedule from './pages/coach/Schedule'
import CoachProfile from './pages/coach/Profile'

// Reception Pages
import ReceptionDashboard from './pages/reception/Dashboard'
import ReceptionMembers from './pages/reception/Members'
import ReceptionCheckin from './pages/reception/Checkin'
import ReceptionBookings from './pages/reception/Bookings'
import ReceptionPayments from './pages/reception/Payments'
import ReceptionNewMember from './pages/reception/NewMember'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminEquipment from './pages/admin/Equipment'
import AdminAnalytics from './pages/admin/Analytics'

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardPaths = {
      Member: '/member',
      Coach: '/coach',
      Receptionist: '/reception',
      Admin: '/admin'
    }
    return <Navigate to={dashboardPaths[user?.role] || '/login'} replace />
  }

  return children
}

// Role-based redirect
function RoleRedirect() {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const dashboardPaths = {
    Member: '/member',
    Coach: '/coach',
    Receptionist: '/reception',
    Admin: '/admin'
  }

  return <Navigate to={dashboardPaths[user?.role] || '/login'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Root redirect */}
            <Route path="/" element={<RoleRedirect />} />

            {/* Member Routes */}
            <Route path="/member" element={
              <ProtectedRoute allowedRoles={['Member']}>
                <MemberDashboard />
              </ProtectedRoute>
            } />
            <Route path="/member/ai-coach" element={
              <ProtectedRoute allowedRoles={['Member']}>
                <MemberAICoach />
              </ProtectedRoute>
            } />
            <Route path="/member/bookings" element={
              <ProtectedRoute allowedRoles={['Member']}>
                <MemberBookings />
              </ProtectedRoute>
            } />
            <Route path="/member/inbody" element={
              <ProtectedRoute allowedRoles={['Member']}>
                <MemberInBody />
              </ProtectedRoute>
            } />
            <Route path="/member/profile" element={
              <ProtectedRoute allowedRoles={['Member']}>
                <MemberProfile />
              </ProtectedRoute>
            } />
            <Route path="/member/progress" element={
              <ProtectedRoute allowedRoles={['Member']}>
                <MemberProgress />
              </ProtectedRoute>
            } />
            <Route path="/member/programs" element={
              <ProtectedRoute allowedRoles={['Member']}>
                <MemberPrograms />
              </ProtectedRoute>
            } />
            <Route path="/member/tokens" element={
              <ProtectedRoute allowedRoles={['Member']}>
                <MemberTokens />
              </ProtectedRoute>
            } />
            <Route path="/member/subscriptions" element={
              <ProtectedRoute allowedRoles={['Member']}>
                <MemberSubscriptions />
              </ProtectedRoute>
            } />

            {/* Coach Routes */}
            <Route path="/coach" element={
              <ProtectedRoute allowedRoles={['Coach']}>
                <CoachDashboard />
              </ProtectedRoute>
            } />
            <Route path="/coach/clients" element={
              <ProtectedRoute allowedRoles={['Coach']}>
                <CoachClients />
              </ProtectedRoute>
            } />
            <Route path="/coach/programs" element={
              <ProtectedRoute allowedRoles={['Coach']}>
                <CoachPrograms />
              </ProtectedRoute>
            } />
            <Route path="/coach/schedule" element={
              <ProtectedRoute allowedRoles={['Coach']}>
                <CoachSchedule />
              </ProtectedRoute>
            } />
            <Route path="/coach/profile" element={
              <ProtectedRoute allowedRoles={['Coach']}>
                <CoachProfile />
              </ProtectedRoute>
            } />

            {/* Reception Routes */}
            <Route path="/reception" element={
              <ProtectedRoute allowedRoles={['Receptionist']}>
                <ReceptionDashboard />
              </ProtectedRoute>
            } />
            <Route path="/reception/members" element={
              <ProtectedRoute allowedRoles={['Receptionist']}>
                <ReceptionMembers />
              </ProtectedRoute>
            } />
            <Route path="/reception/checkin" element={
              <ProtectedRoute allowedRoles={['Receptionist']}>
                <ReceptionCheckin />
              </ProtectedRoute>
            } />
            <Route path="/reception/bookings" element={
              <ProtectedRoute allowedRoles={['Receptionist']}>
                <ReceptionBookings />
              </ProtectedRoute>
            } />
            <Route path="/reception/payments" element={
              <ProtectedRoute allowedRoles={['Receptionist']}>
                <ReceptionPayments />
              </ProtectedRoute>
            } />
            <Route path="/reception/new-member" element={
              <ProtectedRoute allowedRoles={['Receptionist']}>
                <ReceptionNewMember />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/equipment" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminEquipment />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            } />

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
