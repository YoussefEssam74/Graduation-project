# Missing APIs Report for IntelliFit Frontend

## Summary

This document identifies the APIs that are either **missing** or **need modifications** to fully support all the implemented frontend features.

---

## 🔴 Missing APIs (Need to be Created)

### 1. **Coach Listing API** (CRITICAL)

**Purpose:** Allow members to browse and book available coaches

**Current State:** No endpoint exists to list coaches

**Suggested Endpoints:**

```
GET /api/coaches                    - List all active coaches
GET /api/coaches/{id}               - Get single coach details
GET /api/coaches/{id}/availability  - Get coach availability slots
GET /api/coaches/{id}/reviews       - Get reviews for a coach (exists in CoachReviewController)
```

**Required DTO:**

```csharp
public class CoachDto
{
    public int CoachId { get; set; }
    public string Name { get; set; }
    public string Specialization { get; set; }
    public decimal Rating { get; set; }
    public int SessionsCompleted { get; set; }
    public int TokensCost { get; set; }
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
    public List<string> Certifications { get; set; }
}
```

**Controller needed:** `CoachController.cs`

---

### 2. **Stats/Analytics API** (PARTIAL)

**Purpose:** Provide comprehensive member statistics

**Current State:** `StatsController` exists but may need enhancement

**Missing endpoints (if not implemented):**

```
GET /api/stats/member/{userId}/summary     - Complete stats summary
GET /api/stats/member/{userId}/trends      - Weight/body fat trends over time
GET /api/stats/member/{userId}/streaks     - Workout streaks data
```

**Required DTO enhancement:**

```csharp
public class MemberStatsDto
{
    // Current fields +
    public int WorkoutStreak { get; set; }
    public int TotalCaloriesBurned { get; set; }
    public int TotalWorkoutsCompleted { get; set; }
    public decimal AverageWorkoutDuration { get; set; }
}
```

---

### 3. **Activity Feed Enhancement**

**Purpose:** Rich activity feed with workout details

**Current endpoints may need:**

```
GET /api/activity-feed/user/{userId}/recent?limit=10  - Recent activities with limit
```

---

## 🟡 APIs That Need Modifications

### 1. **WorkoutPlanController**

**File:** `WorkoutPlanController.cs`

**Current issue:** Need to verify endpoints for:

- `GET /api/workout-plans/member/{memberId}` - Get member's assigned plans
- `GET /api/workout-plans/member/{memberId}/details/{planId}` - Plan with days/exercises

**Required fields in response:**

```csharp
public class MemberWorkoutPlanDto
{
    public int MemberPlanId { get; set; }
    public string TemplateName { get; set; }
    public string Description { get; set; }
    public bool IsActive { get; set; }
    public decimal CompletionPercentage { get; set; }
    public List<WorkoutDayDto> WorkoutDays { get; set; } // Include exercises
}
```

---

### 2. **NutritionPlanController**

**File:** `NutritionPlanController.cs`

**Verify endpoints exist:**

```
GET /api/nutrition-plans/member/{memberId}  - Get member's nutrition plans
```

**Required fields:**

```csharp
public class NutritionPlanDto
{
    public int PlanId { get; set; }
    public string PlanName { get; set; }
    public int DailyCalories { get; set; }
    public int ProteinGrams { get; set; }
    public int CarbsGrams { get; set; }
    public int FatGrams { get; set; }
    public bool IsActive { get; set; }
    public List<MealDto> Meals { get; set; }
}
```

---

### 3. **UserController Enhancement**

**File:** `UserController.cs`

**Additional fields needed in `UserDto`:**

```csharp
// Ensure these are included in the response:
public string Phone { get; set; }
public DateTime? DateOfBirth { get; set; }
public int Gender { get; set; }  // 0=Not specified, 1=Male, 2=Female
public string Address { get; set; }
public string ProfileImageUrl { get; set; }
```

---

### 4. **BookingController Enhancement**

**File:** `BookingController.cs`

**Additional endpoints needed:**

```
GET /api/bookings/coach/{coachId}/slots?date=2024-01-15  - Get available time slots
POST /api/bookings/coach                                   - Book coach session
```

**Booking DTO should include:**

```csharp
public class BookingDto
{
    // Current fields +
    public string CoachName { get; set; }
    public string EquipmentName { get; set; }
    public int SessionType { get; set; }  // 1=InPerson, 2=Online
}
```

---

### 5. **InBodyController**

**File:** `InBodyController.cs`

**Verify endpoints:**

```
GET /api/inbody/user/{userId}          - Get all measurements
GET /api/inbody/user/{userId}/latest   - Get latest measurement
```

---

## 🟢 APIs Already Implemented (Verified)

| Controller                 | Status     | Notes                         |
| -------------------------- | ---------- | ----------------------------- |
| AuthController             | ✅ Working | Login/Register/Token refresh  |
| NotificationController     | ✅ Working | CRUD, mark read, unread count |
| ActivityFeedController     | ✅ Working | User activities               |
| UserMilestoneController    | ✅ Working | Achievements/badges           |
| CoachReviewController      | ✅ Working | Reviews CRUD                  |
| WorkoutLogController       | ✅ Working | Workout logging               |
| EquipmentController        | ✅ Working | Equipment CRUD                |
| TokenTransactionController | ✅ Working | Token management              |

---

## Implementation Priority

### High Priority (Block core features)

1. **Coach Listing API** - Without this, members can't browse/book coaches
2. **WorkoutPlan member endpoints** - Profile page depends on this
3. **NutritionPlan member endpoints** - Profile page depends on this

### Medium Priority (Enhanced UX)

4. **Stats trends/streaks** - Progress page enrichment
5. **Booking coach slots** - Better booking experience

### Low Priority (Nice to have)

6. **Activity feed enhancements** - Better social features

---

## Frontend API Client Location

All frontend API clients are located at:

```
codeflex-ai/src/lib/api/
├── auth.ts           - Authentication
├── bookings.ts       - Bookings
├── equipment.ts      - Equipment
├── inbody.ts         - InBody measurements
├── stats.ts          - Statistics
├── users.ts          - User management
├── workoutPlans.ts   - Workout plans ⚠️ (needs backend verification)
├── nutritionPlans.ts - Nutrition plans ⚠️ (needs backend verification)
├── workoutLogs.ts    - Workout logs
├── notifications.ts  - Notifications
├── activityFeed.ts   - Activity feed
├── milestones.ts     - Achievements
├── coachReviews.ts   - Coach reviews
└── index.ts          - Exports all modules
```

---

## Recommended Next Steps

1. **Create `CoachController.cs`** with coach listing and availability endpoints
2. **Verify/Update `WorkoutPlanController`** to include member-specific endpoints with full details
3. **Verify/Update `NutritionPlanController`** for member plans with meals
4. **Update DTOs** to include all required fields as documented above
5. **Test all endpoints** with the frontend to ensure compatibility

---

## Notes

- All frontend API calls include proper error handling and loading states
- Toast notifications are used for user feedback
- Profile editing uses `UpdateProfileDto` which should work with existing backend
- The frontend gracefully handles API failures with fallback UI states
