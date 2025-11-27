# IntelliFit Authentication System

## Overview

Complete role-based authentication system for the IntelliFit Smart Gym Management System with 4 user roles: **Member**, **Coach**, **Receptionist**, and **Admin**.

## Features Implemented

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)

- **Mock-based authentication** with localStorage persistence
- **Role-based access control** with `hasRole()` helper
- **Auto-redirect** based on user role after login
- **Logout functionality** with cleanup

### 2. Login Page (`src/app/login/page.tsx`)

- **Modern split-screen design** with animated branding
- **Role selector** with 4 role cards (Member, Coach, Receptionist, Admin)
- **Color-coded roles**:
  - Member: Blue
  - Coach: Green
  - Receptionist: Purple
  - Admin: Red
- **Demo credentials** displayed for easy testing
- **Form validation** and error handling

### 3. Protected Route Component (`src/components/ProtectedRoute.tsx`)

- **Role-based access control** - only allows specified roles
- **Auto-redirect** unauthorized users to their appropriate dashboard
- **Loading state** with spinner during auth check

### 4. Role-Specific Dashboards

#### Member Dashboard (`/dashboard`)

- Token balance display
- Workout completion stats
- Body composition metrics
- Booking overview
- Quick actions (AI Coach, Programs, Bookings, InBody)
- Recent activity feed

#### Coach Dashboard (`/coach-dashboard`)

- **Client management** (24 active clients)
- **Pending program approvals** (AI-generated plans requiring review)
- **Today's schedule** with session details
- **Performance stats** (rating, earnings, clients)
- **Recent activity log**
- Quick actions (Clients, Programs, Analytics)

#### Receptionist Dashboard (`/reception-dashboard`)

- **Real-time check-ins** with member tracking
- **Pending bookings** management
- **Subscription expiry alerts** (color-coded by urgency)
- **Today's revenue** tracking
- **Member search** functionality
- Quick actions (New Member, Bookings, Payments, Notifications)

#### Admin Dashboard (`/admin-dashboard`)

- **System-wide analytics** (members, revenue, coaches, equipment)
- **System alerts** (maintenance, payment issues, capacity warnings)
- **Top performing coaches** with earnings
- **Revenue trends** (3-month overview)
- **System uptime** monitoring
- **Pending issues** tracker
- Quick actions (Members, Coaches, Equipment, Analytics, Settings, Bookings)

### 5. Role-Aware Navigation (`src/components/Navbar.tsx`)

- **Dynamic navigation** based on user role
- **Role badge** with color-coded icon
- **User info display** (name + role)
- **Logout button**
- **Different menu items per role**:
  - **Member**: Dashboard, Bookings, InBody, AI Coach, Tokens, Profile + Generate Program button
  - **Coach**: Dashboard, Clients, Programs, Schedule
  - **Receptionist**: Dashboard, Members, Bookings, Check-In
  - **Admin**: Dashboard, Members, Coaches, Equipment, Analytics

### 6. Updated Layout (`src/app/layout.tsx`)

- Replaced `ConvexClerkProvider` with `AuthProvider`
- Proper context hierarchy for authentication

### 7. Homepage Auto-Redirect (`src/app/page.tsx`)

- Redirects authenticated users to their role-specific dashboard
- Shows landing page for unauthenticated visitors
- Updated CTAs to point to login page

## Mock Users for Testing

```typescript
// Member Account
Email: member@intellifit.com
Password: password
Features: Full member features (workouts, bookings, AI coach, tokens, InBody)

// Coach Account
Email: coach@intellifit.com
Password: password
Features: Client management, program approvals, schedule, analytics

// Receptionist Account
Email: receptionist@intellifit.com
Password: password
Features: Member check-in, booking management, payments, subscriptions

// Admin Account
Email: admin@intellifit.com
Password: password
Features: Full system control, analytics, user management, settings
```

## User Flow

### 1. **Login Flow**

1. Visit `/login`
2. Select role (Member/Coach/Receptionist/Admin)
3. Enter credentials
4. Auto-redirect to role-specific dashboard

### 2. **Protected Pages**

- All dashboards use `<ProtectedRoute>` wrapper
- Unauthorized access attempts redirect to appropriate dashboard
- Unauthenticated users redirect to `/login`

### 3. **Logout Flow**

1. Click "Logout" button in navbar
2. Clear auth state from localStorage
3. Redirect to `/login`

### 4. **Role-Based Features**

#### **Member-Only Features:**

- AI-powered program generation (workout + nutrition)
- Equipment and coach booking system
- InBody measurement tracking
- Token economy (purchase, spend, track)
- AI chat coach
- Personal profile with active programs

#### **Coach-Only Features:**

- Review and approve AI-generated programs
- Manage client roster (24+ clients)
- View client progress and measurements
- Schedule management (sessions, consultations)
- Earnings tracking
- Performance analytics

#### **Receptionist-Only Features:**

- Member check-in/check-out
- Booking confirmation/rejection
- Payment processing
- Subscription management
- Expiry alerts (urgent notifications)
- New member registration
- Quick member search

#### **Admin-Only Features:**

- System-wide analytics dashboard
- Member and coach management
- Equipment inventory and maintenance tracking
- Revenue reports and trends
- System health monitoring (uptime, alerts)
- Issue resolution tracking
- All CRUD operations
- Settings and configuration

## Technical Implementation

### Authentication State Management

```typescript
interface AuthContextType {
  user: User | null; // Current user object
  token: string | null; // Auth token
  isAuthenticated: boolean; // Auth status
  isLoading: boolean; // Loading state
  login: (email, password, role) => Promise<void>;
  logout: () => void;
  hasRole: (roles) => boolean; // Check user role
}
```

### User Type Definition

```typescript
interface User {
  userId: number;
  email: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  fitnessGoal: string;
  tokenBalance: number;
  role: UserRole; // Member | Coach | Reception | Admin
  createdAt: string;
}
```

### Protected Route Usage

```typescript
// Protect a page for specific roles
export default function SomePage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach]}>
      <PageContent />
    </ProtectedRoute>
  );
}
```

## Next Steps for Production

### 1. **Backend Integration**

- Replace mock authentication with real API calls
- Implement JWT token management
- Add refresh token logic
- Set up secure HttpOnly cookies

### 2. **Database Setup**

- Create users table with role column
- Add authentication logs
- Implement session management
- Set up role-permissions mapping

### 3. **Enhanced Security**

- Add CSRF protection
- Implement rate limiting on login
- Add 2FA/MFA support
- Password reset flow
- Email verification

### 4. **Additional Features**

- Remember me functionality (currently placeholder)
- Password strength indicator
- Social login (Google, Facebook)
- Account activation emails
- Audit logs for admin actions

### 5. **Real-time Features**

- WebSocket for live notifications
- Real-time booking updates
- Live check-in status
- Coach-client messaging

## File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Auth provider & hooks
├── components/
│   ├── Navbar.tsx              # Role-aware navigation
│   └── ProtectedRoute.tsx      # Route guard component
├── app/
│   ├── login/
│   │   └── page.tsx            # Unified login page
│   ├── dashboard/
│   │   └── page.tsx            # Member dashboard
│   ├── coach-dashboard/
│   │   └── page.tsx            # Coach dashboard
│   ├── reception-dashboard/
│   │   └── page.tsx            # Receptionist dashboard
│   ├── admin-dashboard/
│   │   └── page.tsx            # Admin dashboard
│   └── layout.tsx              # Root layout with AuthProvider
└── types/
    └── gym.ts                  # UserRole enum & User interface
```

## Color Scheme by Role

- **Member**: Blue (#3B82F6) - Represents fitness journey
- **Coach**: Green (#10B981) - Represents growth & expertise
- **Receptionist**: Purple (#8B5CF6) - Represents service & support
- **Admin**: Red (#EF4444) - Represents authority & control

## Testing Checklist

- [x] Login with all 4 roles
- [x] Role-based dashboard access
- [x] Navigation changes per role
- [x] Logout functionality
- [x] Auto-redirect on homepage
- [x] Protected route guards
- [x] Persistent auth state (localStorage)
- [x] Error handling for invalid credentials
- [ ] Session timeout (to be implemented)
- [ ] Concurrent login handling (to be implemented)

## Known Limitations (Demo Mode)

1. **No real backend** - uses mock data and localStorage
2. **No password encryption** - plaintext in mock users
3. **No session management** - relies on localStorage only
4. **No token expiration** - tokens don't expire
5. **No role permissions granularity** - binary role check only

## Migration Path to Production

1. Replace `AuthContext` with real API integration
2. Implement backend auth endpoints (login, logout, refresh, verify)
3. Add JWT handling with HttpOnly cookies
4. Implement real database user management
5. Add permission system (role-based + granular permissions)
6. Set up authentication middleware in API routes
7. Add session management and timeout
8. Implement security features (CSRF, rate limiting, 2FA)
