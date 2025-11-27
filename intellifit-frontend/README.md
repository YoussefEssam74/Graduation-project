# IntelliFit Frontend

Modern, responsive gym management system built with Next.js 14, TypeScript, and TailwindCSS.

## 🚀 Features

- **Role-Based Access Control**: Separate dashboards for Members, Coaches, and Reception staff
- **Modern UI Components**: Reusable components built with TailwindCSS
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **State Management**: Zustand for global state with persistence
- **API Integration**: Axios-based API client with authentication interceptors
- **Responsive Design**: Mobile-first approach with IntelliFit branding

## 📁 Project Structure

```
intellifit-frontend/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx           # Auth layout wrapper
│   │   └── login/
│   │       └── page.tsx         # Login page with role selection
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Dashboard layout (Sidebar + Navbar)
│   │   ├── member/
│   │   │   └── page.tsx         # Member dashboard
│   │   ├── coach/
│   │   │   └── page.tsx         # Coach dashboard
│   │   └── reception/
│   │       └── page.tsx         # Reception dashboard
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page (redirects to login)
│   └── globals.css              # Global styles
├── components/
│   ├── ui/
│   │   ├── Button.tsx           # Button component with variants
│   │   ├── Card.tsx             # Card with subcomponents
│   │   ├── Input.tsx            # Input with label and error support
│   │   ├── Badge.tsx            # Status badges
│   │   ├── Modal.tsx            # Modal dialog
│   │   └── Table.tsx            # Table components
│   ├── dashboard/
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   ├── Navbar.tsx           # Top navbar with search
│   │   └── StatsCard.tsx        # Statistics card component
│   └── auth/
│       ├── LoginForm.tsx        # Login form with validation
│       └── RoleSelector.tsx     # Role selection component
├── lib/
│   ├── api/
│   │   ├── client.ts            # Axios instance with interceptors
│   │   └── services.ts          # API service functions
│   └── utils.ts                 # Utility functions
├── types/
│   └── index.ts                 # TypeScript type definitions
├── hooks/
│   └── useAuth.ts               # Auth state management (Zustand)
└── .env.local                   # Environment variables
```

## 🎨 Design System

### Colors

- **Primary Blue**: `#0b4fd4` - Main brand color
- **Primary Lime**: `#a3e221` - Secondary accent
- **Secondary Pale Green**: `#dcee7e` - Tertiary accent
- **Success**: `#22c55e` - Success states
- **Danger**: `#ef4444` - Error states
- **Warning**: `#f59e0b` - Warning states

### Typography

- **Font Family**: Montserrat
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Border Radius

- **Medium (md)**: 12px
- **Large (lg)**: 20px

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS 3.x
- **State Management**: Zustand 4.4.x
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **UI Components**: Custom components with TailwindCSS

## 📦 Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5025/api
   NODE_ENV=development
   ```

3. **Run development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication Flow

1. User lands on `/` → redirects to `/login`
2. User selects role (Member, Coach, or Reception)
3. User enters email and password
4. On successful login:
   - JWT token stored in localStorage
   - User data persisted in Zustand store
   - Redirects to role-specific dashboard

## 🎯 User Roles

### Member

- View workout statistics
- Book gym sessions
- Chat with AI coach
- Track InBody measurements
- Manage subscription

### Coach

- Manage client roster
- Create training plans
- View schedule
- Track client progress

### Reception

- Process check-ins
- Conduct InBody tests
- Monitor equipment status
- Handle payments

## 📡 API Integration

All API calls are made through the service layer (`lib/api/services.ts`):

```typescript
import { authApi, userApi, exerciseApi } from "@/lib/api/services";

// Login
const response = await authApi.login(email, password, role);

// Get user profile
const profile = await userApi.getProfile();

// Get all exercises
const exercises = await exerciseApi.getAll();
```

## 🧩 Component Usage

### Button

```tsx
import Button from "@/components/ui/Button";

<Button variant="primary" size="md">
  Click me
</Button>;
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content goes here</CardContent>
</Card>;
```

### Input

```tsx
import Input from "@/components/ui/Input";

<Input label="Email" type="email" placeholder="Enter email" />;
```

## 🚧 Development

### Run development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm start
```

## 📝 Environment Variables

| Variable              | Description          | Default                     |
| --------------------- | -------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5025/api` |
| `NODE_ENV`            | Environment mode     | `development`               |

## 🔄 State Management

Auth state is managed using Zustand with persistence:

```typescript
import { useAuthStore } from "@/hooks/useAuth";

const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();
```

---

**Built with ❤️ using Next.js, TypeScript, and TailwindCSS**
