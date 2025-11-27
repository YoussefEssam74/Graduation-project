# IntelliFit Frontend - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1️⃣ Install Dependencies
```bash
cd intellifit-frontend
npm install
```

### 2️⃣ Configure Environment
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local if needed (default settings work for local development)
```

### 3️⃣ Run Development Server
```bash
npm run dev
```

**That's it! Open http://localhost:3000 in your browser! 🎉**

---

## 🔐 Test Accounts (Once Backend is Running)

### Member Account
- Role: Member
- Email: member@intellifit.com
- Password: [Your test password]

### Coach Account
- Role: Coach
- Email: coach@intellifit.com
- Password: [Your test password]

### Reception Account
- Role: Reception
- Email: reception@intellifit.com
- Password: [Your test password]

---

## 📱 Available Routes

### Public Routes
- `/` - Home (redirects to login)
- `/login` - Login with role selection

### Member Routes
- `/member` - Member dashboard
- `/member/booking` - Book sessions (coming soon)
- `/member/ai-coach` - AI coach chat (coming soon)
- `/member/inbody` - InBody measurements (coming soon)
- `/member/subscription` - Manage subscription (coming soon)

### Coach Routes
- `/coach` - Coach dashboard
- `/coach/clients` - Manage clients (coming soon)
- `/coach/plans` - Training plans (coming soon)
- `/coach/schedule` - View schedule (coming soon)

### Reception Routes
- `/reception` - Reception dashboard
- `/reception/checkins` - Check-ins (coming soon)
- `/reception/inbody` - InBody tests (coming soon)
- `/reception/equipment` - Equipment management (coming soon)

---

## 🛠️ Common Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint

# Clean Install
rm -rf node_modules package-lock.json
npm install
```

---

## 🎨 Component Examples

### Using Button
```tsx
import Button from '@/components/ui/Button';

// Primary button
<Button variant="primary">Save</Button>

// Outline button
<Button variant="outline">Cancel</Button>

// Danger button
<Button variant="danger">Delete</Button>

// Small size
<Button size="sm">Small Button</Button>
```

### Using Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Your content here
  </CardContent>
</Card>
```

### Using Input
```tsx
import Input from '@/components/ui/Input';

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Using Badge
```tsx
import Badge from '@/components/ui/Badge';

<Badge variant="success">Active</Badge>
<Badge variant="danger">Inactive</Badge>
<Badge variant="warning">Pending</Badge>
```

---

## 📡 API Usage Examples

### Authentication
```tsx
import { authApi } from '@/lib/api/services';
import { useAuthStore } from '@/hooks/useAuth';

const { setAuth } = useAuthStore();

// Login
const response = await authApi.login('email@example.com', 'password', UserRole.Member);

if (response.success && response.data) {
  setAuth(response.data.user, response.data.token);
}
```

### Fetching Data
```tsx
import { exerciseApi, bookingApi } from '@/lib/api/services';

// Get all exercises
const exercises = await exerciseApi.getAll();

// Get my bookings
const bookings = await bookingApi.getMyBookings();

// Get user stats
const stats = await statsApi.getMemberStats();
```

---

## 🎯 Folder Structure Quick Reference

```
intellifit-frontend/
├── app/                    # Next.js pages and routes
│   ├── (auth)/            # Auth pages (login, register)
│   └── (dashboard)/       # Dashboard pages (member, coach, reception)
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── auth/             # Auth-specific components
├── lib/                  # Utilities and API
│   ├── api/             # API client and services
│   └── utils.ts         # Helper functions
├── types/               # TypeScript definitions
├── hooks/               # Custom React hooks
└── public/              # Static assets
```

---

## 🐛 Troubleshooting

### Port 3000 is already in use
```bash
# Kill the process using port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Or use a different port
npm run dev -- -p 3001
```

### Cannot find module errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Restart TypeScript server in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

## 📚 Documentation

- **README.md** - Full documentation
- **BUILD_SUMMARY.md** - Complete build details
- **QUICK_START.md** - This file

---

## 🆘 Need Help?

1. Check the **README.md** for detailed documentation
2. Check **BUILD_SUMMARY.md** for what was built
3. Review the TypeScript types in `types/index.ts`
4. Check the API services in `lib/api/services.ts`

---

**Happy Coding! 🚀**
