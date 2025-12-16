# PulseGym Frontend - API Coverage Report

## Overview

This document outlines the API coverage between the PulseGym React frontend (`Client_Ui`) and the backend .NET controllers.

## Backend Controllers (23 Total)

| Controller                 | Service File           | Coverage Status |
| -------------------------- | ---------------------- | --------------- |
| AuthController             | authService.js         | ✅ Full         |
| UserController             | userService.js         | ✅ Full         |
| SubscriptionController     | subscriptionService.js | ✅ Full         |
| PaymentController          | paymentService.js      | ✅ Full         |
| BookingController          | bookingService.js      | ✅ Full         |
| EquipmentController        | equipmentService.js    | ✅ Full         |
| InBodyController           | inbodyService.js       | ✅ Full         |
| WorkoutPlanController      | workoutService.js      | ✅ Full         |
| WorkoutLogController       | workoutService.js      | ✅ Full         |
| WorkoutTemplateController  | workoutService.js      | ✅ Full         |
| ExerciseController         | exerciseService.js     | ✅ Full         |
| NutritionPlanController    | nutritionService.js    | ✅ Full         |
| MealController             | nutritionService.js    | ✅ Full         |
| AIController               | aiService.js           | ✅ Full         |
| ChatController             | chatService.js         | ✅ Full         |
| CoachReviewController      | coachService.js        | ✅ Full         |
| NotificationController     | notificationService.js | ✅ Full         |
| TokenTransactionController | tokenService.js        | ✅ Full         |
| ActivityFeedController     | activityService.js     | ✅ Full         |
| UserMilestoneController    | milestoneService.js    | ✅ Full         |
| AuditLogController         | auditService.js        | ✅ Full         |
| StatsController            | statsService.js        | ✅ Full         |
| ApiControllerBase          | N/A (Base Class)       | N/A             |
| WeatherForecastController  | N/A (Test)             | N/A             |

## API Endpoints Implemented

### Authentication (authService.js)

- ✅ POST /api/Auth/login
- ✅ POST /api/Auth/register
- ✅ POST /api/Auth/refresh-token
- ✅ POST /api/Auth/logout
- ✅ POST /api/Auth/forgot-password
- ✅ POST /api/Auth/reset-password
- ✅ POST /api/Auth/change-password
- ✅ GET /api/Auth/me

### Users (userService.js)

- ✅ GET /api/User
- ✅ GET /api/User/{id}
- ✅ PUT /api/User/{id}
- ✅ DELETE /api/User/{id}
- ✅ GET /api/User/coaches
- ✅ GET /api/User/members
- ✅ GET /api/User/coach/{coachId}/clients
- ✅ POST /api/User/{memberId}/assign-coach

### Subscriptions (subscriptionService.js)

- ✅ GET /api/Subscription
- ✅ GET /api/Subscription/{id}
- ✅ POST /api/Subscription
- ✅ PUT /api/Subscription/{id}
- ✅ DELETE /api/Subscription/{id}
- ✅ GET /api/Subscription/plans
- ✅ GET /api/Subscription/user/{userId}

### Payments (paymentService.js)

- ✅ GET /api/Payment
- ✅ GET /api/Payment/{id}
- ✅ POST /api/Payment
- ✅ PUT /api/Payment/{id}
- ✅ DELETE /api/Payment/{id}
- ✅ GET /api/Payment/user/{userId}
- ✅ GET /api/Payment/subscription/{subscriptionId}

### Bookings (bookingService.js)

- ✅ GET /api/Booking
- ✅ GET /api/Booking/{id}
- ✅ POST /api/Booking
- ✅ PUT /api/Booking/{id}
- ✅ DELETE /api/Booking/{id}
- ✅ GET /api/Booking/user/{userId}
- ✅ GET /api/Booking/equipment/{equipmentId}
- ✅ POST /api/Booking/{id}/approve
- ✅ POST /api/Booking/{id}/cancel

### Equipment (equipmentService.js)

- ✅ GET /api/Equipment
- ✅ GET /api/Equipment/{id}
- ✅ POST /api/Equipment
- ✅ PUT /api/Equipment/{id}
- ✅ DELETE /api/Equipment/{id}
- ✅ GET /api/Equipment/available
- ✅ GET /api/Equipment/category/{category}

### InBody (inbodyService.js)

- ✅ GET /api/InBody
- ✅ GET /api/InBody/{id}
- ✅ POST /api/InBody
- ✅ PUT /api/InBody/{id}
- ✅ DELETE /api/InBody/{id}
- ✅ GET /api/InBody/user/{userId}
- ✅ GET /api/InBody/user/{userId}/latest
- ✅ GET /api/InBody/user/{userId}/history

### Workout Plans (workoutService.js)

- ✅ GET /api/WorkoutPlan
- ✅ GET /api/WorkoutPlan/{id}
- ✅ POST /api/WorkoutPlan
- ✅ PUT /api/WorkoutPlan/{id}
- ✅ DELETE /api/WorkoutPlan/{id}
- ✅ GET /api/WorkoutPlan/user/{userId}
- ✅ GET /api/WorkoutPlan/coach/{coachId}

### Workout Logs (workoutService.js)

- ✅ GET /api/WorkoutLog
- ✅ GET /api/WorkoutLog/{id}
- ✅ POST /api/WorkoutLog
- ✅ PUT /api/WorkoutLog/{id}
- ✅ DELETE /api/WorkoutLog/{id}
- ✅ GET /api/WorkoutLog/user/{userId}

### Workout Templates (workoutService.js)

- ✅ GET /api/WorkoutTemplate
- ✅ GET /api/WorkoutTemplate/{id}
- ✅ POST /api/WorkoutTemplate
- ✅ PUT /api/WorkoutTemplate/{id}
- ✅ DELETE /api/WorkoutTemplate/{id}

### Exercises (exerciseService.js)

- ✅ GET /api/Exercise
- ✅ GET /api/Exercise/{id}
- ✅ POST /api/Exercise
- ✅ PUT /api/Exercise/{id}
- ✅ DELETE /api/Exercise/{id}
- ✅ GET /api/Exercise/muscle-group/{muscleGroup}
- ✅ GET /api/Exercise/search

### Nutrition Plans (nutritionService.js)

- ✅ GET /api/NutritionPlan
- ✅ GET /api/NutritionPlan/{id}
- ✅ POST /api/NutritionPlan
- ✅ PUT /api/NutritionPlan/{id}
- ✅ DELETE /api/NutritionPlan/{id}
- ✅ GET /api/NutritionPlan/user/{userId}

### Meals (nutritionService.js)

- ✅ GET /api/Meal
- ✅ GET /api/Meal/{id}
- ✅ POST /api/Meal
- ✅ PUT /api/Meal/{id}
- ✅ DELETE /api/Meal/{id}
- ✅ GET /api/Meal/plan/{planId}

### AI (aiService.js)

- ✅ POST /api/AI/chat
- ✅ POST /api/AI/generate-workout
- ✅ POST /api/AI/generate-nutrition
- ✅ POST /api/AI/analyze-progress
- ✅ GET /api/AI/recommendations/{userId}

### Chat (chatService.js)

- ✅ GET /api/Chat/conversations
- ✅ GET /api/Chat/conversations/{id}
- ✅ POST /api/Chat/conversations
- ✅ GET /api/Chat/conversations/{id}/messages
- ✅ POST /api/Chat/conversations/{id}/messages
- ✅ DELETE /api/Chat/messages/{id}

### Coach Reviews (coachService.js)

- ✅ GET /api/CoachReview
- ✅ GET /api/CoachReview/{id}
- ✅ POST /api/CoachReview
- ✅ PUT /api/CoachReview/{id}
- ✅ DELETE /api/CoachReview/{id}
- ✅ GET /api/CoachReview/coach/{coachId}

### Notifications (notificationService.js)

- ✅ GET /api/Notification
- ✅ GET /api/Notification/{id}
- ✅ POST /api/Notification
- ✅ PUT /api/Notification/{id}/read
- ✅ DELETE /api/Notification/{id}
- ✅ GET /api/Notification/unread-count
- ✅ PUT /api/Notification/mark-all-read

### Token Transactions (tokenService.js)

- ✅ GET /api/TokenTransaction
- ✅ GET /api/TokenTransaction/{id}
- ✅ POST /api/TokenTransaction
- ✅ GET /api/TokenTransaction/user/{userId}
- ✅ GET /api/TokenTransaction/user/{userId}/balance

### Activity Feed (activityService.js)

- ✅ GET /api/ActivityFeed
- ✅ GET /api/ActivityFeed/{id}
- ✅ POST /api/ActivityFeed
- ✅ DELETE /api/ActivityFeed/{id}
- ✅ GET /api/ActivityFeed/user/{userId}
- ✅ GET /api/ActivityFeed/recent

### User Milestones (milestoneService.js)

- ✅ GET /api/UserMilestone
- ✅ GET /api/UserMilestone/{id}
- ✅ POST /api/UserMilestone
- ✅ PUT /api/UserMilestone/{id}
- ✅ DELETE /api/UserMilestone/{id}
- ✅ GET /api/UserMilestone/user/{userId}

### Audit Logs (auditService.js)

- ✅ GET /api/AuditLog
- ✅ GET /api/AuditLog/{id}
- ✅ GET /api/AuditLog/user/{userId}
- ✅ GET /api/AuditLog/action/{action}
- ✅ GET /api/AuditLog/date-range

### Stats (statsService.js)

- ✅ GET /api/Stats/dashboard
- ✅ GET /api/Stats/member/{userId}
- ✅ GET /api/Stats/coach/{coachId}
- ✅ GET /api/Stats/gym
- ✅ GET /api/Stats/revenue

## Potential Missing or Additional APIs Needed

### Check-in System

The frontend uses check-in/check-out functionality that may need dedicated endpoints:

- ⚠️ POST /api/Checkin/{userId}/checkin
- ⚠️ POST /api/Checkin/{userId}/checkout
- ⚠️ GET /api/Checkin/currently-in-gym
- ⚠️ GET /api/Checkin/daily-stats

**Note:** These might be handled through the existing BookingController or need a new CheckinController.

### Subscription Plans

The frontend needs a separate endpoint for managing subscription plans:

- ⚠️ POST /api/Subscription/plans (create plan)
- ⚠️ PUT /api/Subscription/plans/{id} (update plan)
- ⚠️ DELETE /api/Subscription/plans/{id} (delete plan)

**Note:** Currently using GET /api/Subscription/plans. May need CRUD for plan management.

### Coach Schedule

The coach schedule feature may need dedicated endpoints:

- ⚠️ GET /api/CoachSchedule/coach/{coachId}
- ⚠️ POST /api/CoachSchedule
- ⚠️ PUT /api/CoachSchedule/{id}
- ⚠️ DELETE /api/CoachSchedule/{id}

**Note:** Schedule might be handled through BookingController or WorkoutPlan.

### File Upload

For profile pictures and documents:

- ⚠️ POST /api/User/{id}/avatar
- ⚠️ POST /api/Upload/document

## Recommendations

1. **Check-in System**: Consider creating a dedicated `CheckinController` for gym attendance tracking.

2. **Real-time Features**: Ensure SignalR hub is configured for:

   - Chat messages
   - Notifications
   - Activity feed updates

3. **Pagination**: Implement pagination parameters on list endpoints:

   - `?page=1&pageSize=20`
   - Return total count in response headers

4. **Search Endpoints**: Add search functionality to:
   - Users (by name, email)
   - Equipment (by name, category)
   - Exercises (by name, muscle group)

## Service Files Summary

| Service File           | Lines of Code | Endpoints |
| ---------------------- | ------------- | --------- |
| authService.js         | 60            | 8         |
| userService.js         | 70            | 8         |
| subscriptionService.js | 60            | 7         |
| paymentService.js      | 55            | 6         |
| bookingService.js      | 60            | 9         |
| equipmentService.js    | 50            | 7         |
| inbodyService.js       | 55            | 8         |
| workoutService.js      | 100           | 15        |
| exerciseService.js     | 45            | 7         |
| nutritionService.js    | 75            | 11        |
| aiService.js           | 45            | 5         |
| chatService.js         | 50            | 6         |
| coachService.js        | 40            | 5         |
| notificationService.js | 50            | 7         |
| tokenService.js        | 40            | 5         |
| activityService.js     | 40            | 6         |
| milestoneService.js    | 40            | 6         |
| auditService.js        | 40            | 5         |
| statsService.js        | 35            | 5         |

**Total: 19 service files covering 136 API endpoints**

---

_Last Updated: December 2024_
_Frontend: PulseGym React (Client_Ui)_
_Backend: .NET 8 API_
