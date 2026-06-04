# Coach Pages — Full Analysis & Implementation Plan

## Executive Summary

I've analyzed all 7 coach pages, the backend controllers, domain models, and frontend API layer. Below is a full breakdown of what's working, what's broken (mock data, dead buttons), and what's missing — followed by a detailed plan for how the coach will **edit workout plans** and **nutrition plans** at a granular level.

---

## Page-by-Page Analysis

### 1. [coach-dashboard](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-dashboard/page.tsx) ✅ Mostly Connected

| Feature | Status | Details |
|---------|--------|---------|
| Bookings list | ✅ Real API | Uses `bookingsApi.getCoachBookings()` |
| Start/Complete/Cancel session | ✅ Real API | Uses `bookingsApi.checkIn/checkOut/cancelBooking` |
| Active clients count | ✅ Derived | From unique `userId` in bookings |
| Chat with member | ✅ Real | `ChatDialog` component works |
| **Rating (4.8)** | ❌ **Hardcoded** | Line 74: `rating: 4.8, totalReviews: 127` |
| Quick action links | ✅ Working | Navigate to coach sub-pages |

**Missing:**
- Rating & review count should come from `coachReviewsApi.getCoachAverageRating()` (already exists — just not wired here)
- No weekly/monthly earnings filter

---

### 2. [coach-clients](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-clients/page.tsx) ❌ Fully Mock

| Feature | Status | Details |
|---------|--------|---------|
| Client list | ❌ **100% Mock** | Lines 26-87: Hardcoded 5 fake clients |
| Search filter | ⚠️ UI Only | Filters mock data, not real |
| "View Profile" button | ❌ Dead | No navigation, no handler |
| "Track Progress" button | ❌ Dead | No navigation, no handler |
| Filter button | ❌ Dead | No dropdown, no handler |
| Progress bar | ❌ Mock | Hardcoded percentages |

**Missing (no backend API exists):**
- `GET /api/coaches/{coachId}/clients` — Needs a new endpoint to fetch members who have booked with this coach or have plans assigned to them
- Client detail view / profile view
- Real progress tracking per client

---

### 3. [coach-programs](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-programs/page.tsx) ⚠️ Partially Connected

| Feature | Status | Details |
|---------|--------|---------|
| AI Plans for Review | ✅ Real API | `getCoachReviewPlans()` works |
| Status filter (All/Under Review/Approved/Rejected) | ✅ Works | Filters real data |
| Approve plan | ✅ Real API | `updatePlanStatus(planId, "Approved")` |
| Reject plan with notes | ✅ Real API | `updatePlanStatus(planId, "Rejected", notes)` |
| Expand to view exercises | ✅ Works | Shows day/exercises from plan data |
| **"My Programs" section** | ❌ **100% Mock** | Lines 105-154: Hardcoded 4 fake programs |
| View/Edit/Delete buttons on programs | ❌ Dead | No handlers, no navigation |
| "Create Program" button | ❌ Dead | No handler |
| **EDIT WORKOUT PLAN** | ❌ **Completely Missing** | Coach can approve/reject but **cannot edit exercises, change muscle targets, swap exercises, adjust sets/reps** |

> [!CAUTION]
> **Critical Gap**: The coach can see the plan and approve/reject it, but has **zero ability to edit it**. The AI might assign a chest exercise to "upper chest" when the focus should include both upper and lower pec regions. The coach CANNOT fix this currently.

---

### 4. [coach-profile](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-profile/page.tsx) ⚠️ Partially Connected

| Feature | Status | Details |
|---------|--------|---------|
| Profile info (name, email, phone) | ✅ Real | From `useAuth()` user |
| Edit profile modal | ✅ Real API | `usersApi.updateProfile()` |
| Reviews list | ✅ Real API | `coachReviewsApi.getCoachReviews()` |
| Average rating | ✅ Real API | `coachReviewsApi.getCoachAverageRating()` |
| Total sessions | ✅ Derived | From completed bookings |
| **"98% Success Rate"** | ❌ **Hardcoded** | Line 253 |
| **Bio/About Me** | ❌ **Hardcoded fallback** | No backend field for coach bio |
| **Specializations** | ❌ **Hardcoded** | Lines 59-63: Fixed list `["Strength Training", "HIIT", "Recovery"]` |
| **Availability schedule** | ❌ **Hardcoded** | Lines 344-356: Fixed "Mon-Fri 9-6" |
| **"This Month" stats** | ❌ **Hardcoded** | Lines 387, 396: "24 sessions", "98%" |
| "Share Profile" button | ❌ Dead | No handler |

**Missing Backend Support:**
- Coach profile bio field (domain model `CoachProfile` exists but no bio field)
- Specializations CRUD
- Availability schedule CRUD

---

### 5. [coach-schedule](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-schedule/page.tsx) ❌ Fully Mock

| Feature | Status | Details |
|---------|--------|---------|
| Calendar | ⚠️ UI Only | Calendar renders but sessions are mock |
| Sessions list | ❌ **100% Mock** | Lines 27-93: 6 hardcoded sessions |
| Confirm/Cancel buttons | ❌ Dead | No handlers |
| "New Session" button | ❌ Dead | No handler |
| Today/Upcoming filtering | ⚠️ Filters mock | Works on fake data |

**Should Connect To:** `bookingsApi.getCoachBookings()` (already exists, used in dashboard)

---

### 6. [coach-analytics](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-analytics/page.tsx) ❌ Fully Mock

| Feature | Status | Details |
|---------|--------|---------|
| Key metrics (6 cards) | ❌ **100% Mock** | Lines 25-56: All hardcoded |
| Earnings chart | ❌ **Mock** | Lines 58-65: Fake monthly data |
| Top clients | ❌ **Mock** | Lines 67-73: Fake ranking |
| Session types breakdown | ❌ **Mock** | Lines 75-80: Fake distribution |
| Achievements | ❌ **Mock** | Lines 82-87: Fake badges |
| Time range dropdown | ❌ Dead | No handler, doesn't filter |
| Export PDF/CSV buttons | ❌ Dead | No handlers |
| "Generate Report" button | ❌ Dead | No handler |

**Should Connect To:** `statsApi.getCoachStats(coachId)` (API exists, returns real data)

---

### 7. [coach-review](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-review/page.tsx) ❌ Fully Mock (Legacy)

| Feature | Status | Details |
|---------|--------|---------|
| Plans list | ❌ **Mock** | Reads from `sessionStorage` (line 32) |
| Filter tabs | ⚠️ UI Only | Filters nothing real |
| PlanReviewModal | ⚠️ Partial | Editable fields exist but approve/reject call `TODO: Call API` (line 60-61) |

> [!NOTE]
> This page appears to be a **legacy duplicate** of the review functionality already in `coach-programs`. The `coach-programs` page has the REAL API integration. This page should either be **deleted** or **redirected** to `coach-programs`.

---

## CRITICAL MISSING FEATURES

### A. Coach Editing Workout Plans (Detailed Design)

The AI generates plans that need human correction. The coach needs to fix:

#### Workout Plan Edit Scenarios

| Scenario | Example | What Coach Needs to Do |
|----------|---------|----------------------|
| Wrong muscle sub-region | AI says "Chest" but exercise only hits upper chest, ignoring lower chest | Change exercise or add another targeting lower pec |
| Wrong primary muscle | Exercise says "Bench Press" targets "shoulders" | Fix the `targetMuscles` / `muscleGroup` field |
| Inappropriate exercise for level | Advanced exercise for beginner | Swap exercise entirely |
| Wrong sets/reps for goal | Hypertrophy goal but 3×3 scheme | Edit sets, reps, rest time |
| Missing warmup/cooldown | No warmup exercises on heavy days | Add new exercise to the day |
| Wrong day assignment | Two chest days in a row | Move exercise to different day |
| Exercise equipment mismatch | Exercise needs cable machine but user said "Home Gym" | Swap to alternative exercise |
| Redundant exercises | Same movement pattern repeated | Delete one exercise |
| Order wrong | Isolation before compound | Reorder exercises within day |
| Day focus wrong | Day labeled "Chest" but has 3 back exercises | Edit day focus/name |

#### Required Edit Operations for Workout Plan

```
Per Exercise:
├── Edit exercise name (swap to different exercise)
├── Edit sets (number)
├── Edit reps (number or range string "8-12")
├── Edit rest time (seconds)
├── Edit target muscles / muscle group
├── Edit notes (coach instructions)
├── Delete exercise from day
├── Reorder exercise within day (move up/down)
└── View & select alternative exercises (from DB)

Per Day:
├── Edit day name/label ("Upper A" → "Push Day")
├── Edit focus areas (["chest"] → ["chest", "triceps"])
├── Add new exercise to day
├── Delete entire day
└── Reorder exercises via drag & drop

Per Plan:
├── Edit plan name
├── Edit overall notes
├── Add new day
└── Save all changes → API call
```

---

### B. Coach Editing Nutrition Plans (Detailed Design)

The AI generates meal plans that need human correction. The coach needs to fix:

#### Nutrition Plan Edit Scenarios

| Scenario | Example | What Coach Needs to Do |
|----------|---------|----------------------|
| Allergen in food | "Om Ali" has **milk** → member is lactose intolerant | Flag the allergen, swap the food, or add warning |
| Wrong meal timing | Food suitable for lunch shown in breakfast | Change `mealType` from "Breakfast" to "Lunch" |
| Food conflicts with health condition | High-sugar food for diabetic member | Remove or swap food item |
| Wrong portion size | 500g rice for weight loss goal | Edit grams/portion |
| Missing food group | No protein source in a meal | Add food item to meal |
| Calorie imbalance | Breakfast = 800 kcal, Dinner = 200 kcal | Redistribute portions |
| Repeated food | Same food appears in all 7 days | Swap for variety |
| Cultural/religious restriction | Non-halal food for Muslim member | Remove and swap |
| Ingredient not available locally | Rare ingredient not in Egyptian market | Swap to local alternative |
| Wrong macros | Protein goal 150g but plan only provides 80g | Adjust food items |

#### Required Edit Operations for Nutrition Plan

```
Per Food Item:
├── Edit food name
├── Edit grams/portion
├── Edit calories (auto or manual)
├── Edit protein/carbs/fat grams
├── Flag allergens (milk, nuts, gluten, eggs, soy, fish, shellfish)
├── Add ingredient warnings ("Contains: milk, wheat")
├── Delete food from meal
└── Add coach notes for food

Per Meal (Breakfast/Lunch/Dinner/Snack):
├── Change meal type (move from breakfast → lunch)
├── Add new food item to meal
├── Delete food from meal
├── Reorder food items
└── View meal total macros (auto-calculated)

Per Day:
├── View daily total macros (auto-calculated)
├── Add/remove meal slot
├── View allergen warnings for the day
└── Copy meals from another day

Per Plan:
├── Edit plan name
├── Edit daily calorie target
├── Edit macro targets (protein/carbs/fat)
├── Edit dietary restrictions list
├── Add/remove foods to avoid list
├── Edit overall notes
├── Save all changes → API call
└── View all allergen flags across entire plan
```

#### Better Design Ideas (Proposed Improvements)

1. **Interactive Allergen & Health Conflict Scanner**: Real-time validation warning the coach if they add/edit a meal item containing known allergens matching the member's profile (e.g., dairy or gluten).
2. **Template-Based Day/Meal Copying**: A quick action letting coaches copy entire days or meals (e.g. copying Day 1 Breakfast to Days 2 through 7) to reduce repetitive editing work.
3. **Smart Nutrition Alternative Suggestions Panel**: A drawer/toggle showing locally available, Egyptian-market alternatives for rare or expensive AI-suggested ingredients.
4. **Member-Specific Caloric/Macro Bounds Check**: Real-time warnings (red/amber progress indicators) when coach edits shift the plan's daily totals significantly (e.g., >10%) away from the target bounds calculated from the member's InBody scan.
5. **PDF Export/Share with Notes**: Export the finalized nutrition plan as a clean PDF layout for sharing inside bookings or direct download.

---


## Proposed Changes

### Phase 1: Fix Existing Pages (Connect to Real APIs)

---

#### Coach Dashboard — Wire Rating

##### [MODIFY] [page.tsx](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-dashboard/page.tsx)
- Replace hardcoded `rating: 4.8, totalReviews: 127` with calls to `coachReviewsApi.getCoachAverageRating()` and `coachReviewsApi.getCoachReviews()`.length

---

#### Coach Clients — Full API Integration

##### [NEW] Backend endpoint: `GET /api/coaches/{coachId}/clients`
- Query distinct members who have bookings with this coach or AI plans assigned to this coach
- Return member profile + booking stats + plan stats

##### [MODIFY] [page.tsx](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-clients/page.tsx)
- Remove all mock data
- Fetch real clients from new API
- Wire "View Profile" and "Track Progress" buttons

---

#### Coach Schedule — Connect to Bookings API

##### [MODIFY] [page.tsx](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-schedule/page.tsx)
- Replace mock sessions with `bookingsApi.getCoachBookings()`
- Wire Confirm/Cancel buttons to `bookingsApi.checkIn/cancelBooking`
- Calendar dots should reflect real booking dates

---

#### Coach Analytics — Connect to Stats API

##### [MODIFY] [page.tsx](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-analytics/page.tsx)
- Replace all mock data with `statsApi.getCoachStats(coachId)`
- Wire time range dropdown to filter data
- Derive earnings chart from bookings data

---

#### Coach Profile — Fix Hardcoded Values

##### [MODIFY] [page.tsx](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-profile/page.tsx)
- Remove "98% Success Rate" hardcode
- Calculate from real booking completion rate
- Connect availability to booking schedule or new availability API

---

#### Coach Review — Remove or Redirect

##### [DELETE or REDIRECT] [page.tsx](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-review/page.tsx)
- Legacy duplicate of `coach-programs` review functionality
- Redirect to `/coach-programs` or delete

---

### Phase 2: Workout Plan Editing (Coach Programs Enhancement)

---

#### Backend: Add Coach Plan Edit Endpoint

##### [NEW] `PUT /api/workout-ai/plans/{planId}/edit` in [WorkoutAIController.cs](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/Infrastructure/Presentation/Controllers/WorkoutAIController.cs)
```
Request Body: CoachEditPlanRequest {
  planName?: string
  days: [{
    dayNumber: int
    dayName?: string
    focus?: string
    exercises: [{
      exerciseId?: int          // null for new/custom exercises
      exerciseName: string
      sets: int
      reps: string              // "8-12" range format
      restSeconds: int
      targetMuscles: string[]   // ["upper_chest", "lower_chest"]
      muscleGroup: string       // "Chest"
      notes?: string
      orderInDay: int
      equipment?: string
    }]
  }]
  coachNotes?: string
}
```
- Validates coach is assigned to this plan
- Updates `WorkoutPlanExercise` rows (delete old, insert new)
- Updates plan `PlanData` JSON
- Sets status to "Approved" automatically after edit
- Logs the edit in audit trail

##### [NEW] `GET /api/exercise/search?muscleGroup=chest&subRegion=upper` in [ExerciseController.cs](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/Infrastructure/Presentation/Controllers/ExerciseController.cs)
- For the exercise swap picker in the frontend
- Returns exercises filtered by muscle group with equipment info

---

#### Frontend: Workout Plan Edit Modal

##### [NEW] `codeflex-ai/src/components/coach/WorkoutPlanEditModal.tsx`
Full edit modal with:
- Inline editable exercise rows (sets, reps, rest, notes)
- Exercise swap dropdown (fetches from `/api/exercise/search`)
- Muscle group validation (shows which sub-regions are covered)
- Drag-and-drop reorder within day
- Add/remove exercise buttons
- Day focus editing
- "Save Changes" button that calls the new edit endpoint
- Visual indicators when exercise targets don't match day focus

##### [MODIFY] [page.tsx](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-programs/page.tsx)
- Add "Edit" button next to each plan (alongside Approve/Reject)
- Open `WorkoutPlanEditModal` when clicked
- After save, refresh the plan list

##### [NEW] `codeflex-ai/src/lib/api/workoutAI.ts` — Add edit function
```typescript
export async function editCoachPlan(
  planId: number,
  editData: CoachEditPlanRequest
): Promise<ApiResponse<{ success: boolean }>>
```

---

### Phase 3: Nutrition Plan Editing (New Coach Feature)

---

#### Backend: Coach Nutrition Plan Review & Edit

##### [NEW] `GET /api/nutrition-plans/coach-review` in [NutritionPlanController.cs](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/Infrastructure/Presentation/Controllers/NutritionPlanController.cs)
- Returns nutrition plans that need coach review
- Similar to workout `coach-review-plans` endpoint

##### [NEW] `PUT /api/nutrition-plans/{planId}/coach-edit`
```
Request Body: CoachEditNutritionPlanRequest {
  planName?: string
  dailyCalories?: int
  proteinGrams?: int
  carbsGrams?: int
  fatGrams?: int
  dietaryRestrictions?: string[]
  days: [{
    day: int
    meals: {
      breakfast: { items: [{ name, grams, calories, protein_g, carbs_g, fat_g, allergens?: string[], warnings?: string[] }] }
      lunch: { items: [...] }
      dinner: { items: [...] }
      snack: { items: [...] }
    }
  }]
  foodsToAvoid?: string[]
  coachNotes?: string
}
```
- Updates `AiPlanJson` field with edited plan
- Updates meals in the `Meal` table
- Sets status to approved
- Preserves edit history

##### [NEW] Add `Allergens` field to domain models
- Add `string[]? Allergens` to `Ingredient` model (e.g., `["dairy", "gluten"]`)
- Add `string[]? AllergenCategories` to `Meal` model
- This enables allergy cross-referencing

---

#### Frontend: Nutrition Plan Edit Modal

##### [NEW] `codeflex-ai/src/components/coach/NutritionPlanEditModal.tsx`
Full edit modal with:
- Per-food editing (name, grams, calories, macros)
- **Allergen flags** — each food shows warning badges (🥛 Dairy, 🥜 Nuts, 🌾 Gluten, etc.)
- **Meal type changer** — dropdown to move food between Breakfast/Lunch/Dinner/Snack
- Add/remove food items from meals
- Auto-recalculate meal and day totals
- "Foods to Avoid" list editor
- Dietary restrictions editor
- Visual macro progress bars (protein/carbs/fat vs targets)
- Warning banner when allergen detected vs member's allergy list
- "Save Changes" button

##### [NEW] `codeflex-ai/src/lib/api/nutritionPlans.ts` — Add coach review functions
```typescript
nutritionPlansApi.getCoachReviewPlans(): Promise<ApiResponse<NutritionPlanDto[]>>
nutritionPlansApi.coachEditPlan(planId: number, editData: CoachEditNutritionPlanRequest): Promise<ApiResponse<NutritionPlanDto>>
```

##### [MODIFY] [page.tsx](file:///d:/Youssef/Projects/_Graduation%20Project/Project%20Repo/Graduation-project/codeflex-ai/src/app/coach-programs/page.tsx)
- Add a "Nutrition Plans" tab/section alongside the existing "AI Plans for Review"
- Show nutrition plans pending review with similar Approve/Reject/Edit flow

---

## Open Questions

> [!IMPORTANT]
> **Q1**: Should the coach's edits create a **new version** of the plan (keeping the original AI-generated version for comparison), or **overwrite** the original?

> [!IMPORTANT]
> **Q2**: For the allergen system — should we predefine allergen categories in the database, or let the AI/coach free-text them? Predefined categories like `["dairy", "gluten", "nuts", "eggs", "soy", "fish", "shellfish", "sesame"]` are more reliable for auto-detection.

> [!IMPORTANT]
> **Q3**: The `coach-review` page is a legacy duplicate of `coach-programs`. Should I **delete** it entirely or **redirect** to `/coach-programs`?

> [!IMPORTANT]
> **Q4**: Should I implement all 3 phases in this task, or focus on specific phases first? Phase 1 (fix mock data) is prerequisite. Phase 2 (workout edit) and Phase 3 (nutrition edit) can be parallelized.

---

## Verification Plan

### Automated Tests
- Backend: Compile and run dotnet build to verify new endpoints
- Frontend: `npm run build` to verify TypeScript compilation
- API integration tests for new coach edit endpoints

### Manual Verification
- Log in as coach → navigate each page → verify no mock data remains
- Edit a workout plan → verify changes persist after refresh
- Edit a nutrition plan → verify allergen warnings appear
- Test exercise swap → verify filtered by muscle group
- Test meal type change → verify food moves between meals
