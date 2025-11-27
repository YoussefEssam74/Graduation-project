# IntelliFit - Page Navigation Guide

## 🗺️ Complete Site Map

```
IntelliFit Smart Gym Management
│
├── 🏠 Home (/)
│   ├── Hero: "Smart Gym Management Powered By AI Technology"
│   ├── Stats: 500+ Members | 50+ Equipment | 24/7 AI Coach
│   ├── Features Grid (4 cards)
│   └── CTAs: "Generate AI Program" | "Go to Dashboard"
│
├── 📊 Dashboard (/dashboard)
│   ├── Welcome Header + Token Balance (250)
│   ├── Stats Grid (4 cards): Workouts, Body Fat, Bookings, Weight
│   ├── Quick Actions (4 cards): AI Chat, Programs, Book, InBody
│   ├── Active Plans (2 cards): Workout + Diet with progress bars
│   ├── Recent Activity Feed (4 items)
│   └── CTA Banner: Generate New AI Program
│
├── 📅 Bookings (/bookings)
│   ├── My Bookings
│   │   ├── Upcoming Tab (3 bookings)
│   │   └── Past Tab (3 history)
│   ├── Browse Equipment
│   │   ├── Search Bar + Category Filters
│   │   └── Equipment Grid (6 items with availability)
│   └── Browse Coaches
│       └── Coach Cards (3 coaches with ratings)
│
├── 📈 InBody (/inbody)
│   ├── Latest Measurement (4 metrics with trends)
│   ├── Detailed Metrics (Body Water, Bone, Visceral, BMR)
│   ├── Progress Insights (3 insight cards)
│   └── Measurement History Table (5 entries)
│
├── 🪙 Tokens (/tokens)
│   ├── Balance Card (250 tokens, +120 this month)
│   ├── Purchase Packages (3 tiers: 50, 120, 250)
│   ├── Usage Breakdown (4 categories with bars)
│   ├── Transaction History (7 transactions)
│   └── Token Costs Reference (4 services)
│
├── 🤖 AI Coach (/ai-coach)
│   ├── Stats Banner (Messages, Tokens, Cost)
│   ├── Chat Interface
│   │   ├── AI Greeting Message
│   │   ├── Suggested Prompts (6 options)
│   │   └── Chat Input (1 token/message)
│   └── CTA Banner: Generate Complete Program
│
├── 👤 Profile (/profile)
│   ├── User Info
│   ├── Saved Programs
│   │   ├── Workout Plans (with approval status)
│   │   └── Nutrition Plans (with approval status)
│   └── Settings
│
└── 🎯 Generate Program (/generate-program)
    ├── Voice AI Interface
    ├── Conversation Flow
    ├── Program Generation (50 tokens)
    └── Coach Approval Workflow
```

---

## 🎨 Page Features Matrix

| Page          | Primary Purpose        | Key Features                        | Token Cost      | Mock Data                 |
| ------------- | ---------------------- | ----------------------------------- | --------------- | ------------------------- |
| **Dashboard** | Member hub             | Stats, quick actions, activity feed | Free            | ✅ Complete               |
| **Bookings**  | Reserve resources      | Equipment + coach booking, history  | 5-35/booking    | ✅ 6 equipment, 3 coaches |
| **InBody**    | Track body composition | Measurements, trends, insights      | Free            | ✅ 5 measurements         |
| **Tokens**    | Manage currency        | Purchase, history, usage breakdown  | Package: 50-250 | ✅ 7 transactions         |
| **AI Coach**  | Get advice             | Text chat with AI                   | 1/message       | ✅ Chat simulation        |
| **Profile**   | View plans             | Saved programs, settings            | Free            | ✅ 2 plans                |
| **Generate**  | Create program         | Voice AI conversation               | 50              | 🔄 Existing               |

---

## 🎯 User Journey Examples

### 🆕 First-Time Member

```
1. Sign Up → Receive 25 bonus tokens
2. Land on Dashboard → See welcome message
3. Click "Generate Program" → Voice AI (50 tokens)
4. Program sent to coach → Approval pending
5. Check Tokens page → See transaction history
6. Book first equipment → Bench Press (10 tokens)
7. Take InBody scan → Baseline measurements
```

### 🏋️ Active Member

```
1. Dashboard → Check token balance (250)
2. AI Coach → Ask about form (1 token)
3. Bookings → Reserve Squat Rack tomorrow (10 tokens)
4. InBody → Review latest measurements
5. Tokens → Purchase 120-pack (EGP 199)
6. Dashboard → See updated balance
```

### 💪 Power User

```
1. Dashboard → Review weekly stats
2. Generate Program → New cutting phase (50 tokens)
3. AI Coach → 5 questions about diet (5 tokens)
4. Bookings → Book 3 sessions with Ahmed (30 tokens each)
5. InBody → Check progress vs 4 weeks ago
6. Tokens → Analyze usage breakdown
```

---

## 📱 Page Responsiveness

### Desktop (1920x1080)

- ✅ Full navigation bar with all links
- ✅ 3-4 column grids
- ✅ Sidebar layouts
- ✅ Large stat cards

### Tablet (768x1024)

- ✅ 2 column grids
- ✅ Collapsible navigation
- ✅ Stacked layouts
- ✅ Medium cards

### Mobile (375x667)

- 🔄 Single column
- 🔄 Hamburger menu
- 🔄 Full-width cards
- 🔄 Bottom navigation

_Note: Mobile optimization pending_

---

## 🔗 Navigation Links

### Main Navigation (Navbar)

```
Home → /
Dashboard → /dashboard
Bookings → /bookings
InBody → /inbody
AI Coach → /ai-coach
Tokens → /tokens
Profile → /profile
[Button] Generate Program → /generate-program
[Avatar] User Menu → Clerk dropdown
```

### Quick Actions (Dashboard)

```
AI Coach Chat → /ai-coach
View Programs → /profile
Book Equipment → /bookings
InBody Scan → /inbody
```

### Cross-Page CTAs

```
Dashboard → Generate Program → /generate-program
AI Coach → Generate Program → /generate-program
Bookings → View Tokens → /tokens
InBody → Schedule Scan → /bookings
Tokens → Purchase → (Modal or payment flow)
```

---

## 🎨 Design Tokens

### Colors

```css
--primary: hsl(var(--primary)) /* Blue/Purple */
  --secondary: hsl(var(--secondary)) /* Accent color */
  --muted: hsl(var(--muted)) /* Gray backgrounds */ --border: hsl(var(--border))
  /* Light borders */ --cyber-grid-color: rgba(0, 0, 0, 0.05) /* Grid overlay */;
```

### Status Colors

```css
--green-500:
  Available, Positive trend, Completed --yellow-500: In Use, Pending,
  Warning --red-500: Maintenance, Negative, Cancelled --blue-500: Confirmed,
  Info, Primary action --purple-500: AI features --orange-500: Activity, InBody;
```

### Typography

```css
--font-geist-sans: Geist (Primary) --font-geist-mono: Geist Mono (Logo);
```

---

## 📊 Data Flow Examples

### Token Transaction Flow

```
User Action → Frontend → Convex Mutation → Database → Real-time Update
│
├─ Purchase: Click "Buy 120 Pack"
│  └─ tokens.purchaseTokens(userId, packageId)
│     └─ UPDATE users.tokenBalance (+120)
│     └─ INSERT tokenTransactions (purchase, +120)
│
├─ Spend: Click "Book Equipment"
│  └─ bookings.createBooking(userId, equipmentId, ...)
│     └─ UPDATE users.tokenBalance (-10)
│     └─ INSERT tokenTransactions (spend, -10)
│     └─ INSERT bookings (...)
│
└─ AI Chat: Send message
   └─ ai.sendMessage(userId, message)
      └─ UPDATE users.tokenBalance (-1)
      └─ INSERT tokenTransactions (spend, -1)
      └─ INSERT aiQueryLogs (query, response)
```

### Booking Flow

```
1. User selects equipment/coach
2. Modal shows available time slots
3. User confirms booking
4. Frontend calls: bookings.createBooking()
5. Convex checks:
   ├─ User has enough tokens? ✅
   ├─ Resource available at time? ✅
   └─ No conflicting bookings? ✅
6. Database updates:
   ├─ INSERT booking record
   ├─ UPDATE equipment.status = "in_use"
   ├─ UPDATE user.tokenBalance -= cost
   └─ INSERT tokenTransaction
7. Real-time update:
   ├─ User sees booking in "Upcoming" tab
   ├─ Equipment shows "In Use" status
   └─ Token balance updates across all pages
```

---

## 🎯 Mock Data Seeds

### Users

```javascript
{
  clerkUserId: "user_123",
  firstName: "Youssef",
  role: "member",
  tokenBalance: 250,
  subscriptionPlanID: "premium"
}
```

### Equipment

```javascript
[
  {
    name: "Bench Press",
    category: "strength",
    status: "available",
    tokensCost: 10,
  },
  {
    name: "Treadmill #3",
    category: "cardio",
    status: "available",
    tokensCost: 5,
  },
  {
    name: "Squat Rack",
    category: "strength",
    status: "in_use",
    tokensCost: 10,
  },
  {
    name: "Cable Machine",
    category: "strength",
    status: "available",
    tokensCost: 8,
  },
  {
    name: "Rowing Machine",
    category: "cardio",
    status: "maintenance",
    tokensCost: 5,
  },
  {
    name: "Leg Press",
    category: "strength",
    status: "available",
    tokensCost: 8,
  },
];
```

### Coaches

```javascript
[
  {
    name: "Ahmed Hassan",
    specialization: "Strength & Conditioning",
    rating: 4.9,
    sessionsCompleted: 250,
    tokensCost: 30,
  },
  {
    name: "Sara Mohamed",
    specialization: "HIIT & Cardio",
    rating: 4.8,
    sessionsCompleted: 180,
    tokensCost: 25,
  },
  {
    name: "Omar Ali",
    specialization: "Bodybuilding",
    rating: 5.0,
    sessionsCompleted: 320,
    tokensCost: 35,
  },
];
```

### InBody Measurements

```javascript
[
  {
    date: "Dec 24, 2024",
    weight: 75.5,
    bodyFat: 18.2,
    muscleMass: 58.3,
    bmi: 23.8,
  },
  {
    date: "Dec 17, 2024",
    weight: 76.2,
    bodyFat: 19.1,
    muscleMass: 57.8,
    bmi: 24.0,
  },
  {
    date: "Dec 10, 2024",
    weight: 77.0,
    bodyFat: 20.0,
    muscleMass: 57.2,
    bmi: 24.3,
  },
  {
    date: "Dec 3, 2024",
    weight: 77.8,
    bodyFat: 20.8,
    muscleMass: 56.8,
    bmi: 24.5,
  },
  {
    date: "Nov 26, 2024",
    weight: 78.5,
    bodyFat: 21.5,
    muscleMass: 56.3,
    bmi: 24.8,
  },
];
```

---

## 🚀 Quick Start Commands

### Development

```bash
cd codeflex-ai
npm install
npm run dev
```

### Access Pages

```
http://localhost:3000/           # Home
http://localhost:3000/dashboard  # Dashboard
http://localhost:3000/bookings   # Bookings
http://localhost:3000/inbody     # InBody
http://localhost:3000/tokens     # Tokens
http://localhost:3000/ai-coach   # AI Coach
http://localhost:3000/profile    # Profile
```

---

## ✅ Checklist for Demo

### Before Showing Client:

- [x] All pages created
- [x] Mock data populated
- [x] Navigation working
- [x] Responsive on desktop
- [x] Icons consistent
- [x] Colors themed
- [ ] Fix any TypeScript errors
- [ ] Test all links
- [ ] Clear console warnings
- [ ] Screenshot all pages

### During Demo:

1. **Start at Home** - Show branding and features
2. **Sign In** - Demonstrate Clerk auth
3. **Dashboard** - Explain hub concept
4. **Bookings** - Show equipment + coach booking
5. **InBody** - Display progress tracking
6. **Tokens** - Explain economy system
7. **AI Coach** - Demo chat interface
8. **Profile** - Show saved programs
9. **Generate** - Walk through voice AI

### Talking Points:

- ✅ "Complete gym management in one platform"
- ✅ "Token-based economy for all services"
- ✅ "AI coaching available 24/7"
- ✅ "Real-time booking system"
- ✅ "Scientific body composition tracking"
- ✅ "Coach approval ensures quality"

---

**Ready to Demo! 🎉**

Navigate through all pages to see the full IntelliFit Smart Gym Management System in action!
