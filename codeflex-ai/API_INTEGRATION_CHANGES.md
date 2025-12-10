# API Integration Changes - codeflex-ai

## Overview

Updated codeflex-ai to match backend API DTOs and removed role selection from registration (role is determined by backend).

## Changes Made

### 1. Type Definitions (`src/types/gym.ts`)

**User Interface:**

- ✅ Removed: `age` (number), `fitnessGoal` (string), `Gender` enum
- ✅ Added: `dateOfBirth` (string), `gender` (number: 0=Male, 1=Female), `isActive`, `emailVerified`, `lastLoginAt`
- ✅ Updated: `role` from `UserRole` enum to `string` (matches backend)

**Booking Interface:**

- ✅ Changed all IDs from PascalCase to camelCase:
  - `bookingID` → `bookingId`
  - `userID` → `userId`
  - `equipmentID` → `equipmentId`
  - `coachID` → `coachId`
- ✅ Added fields: `userName`, `equipmentName`, `coachName`, `bookingType`, `statusText`, `notes`, `createdAt`
- ✅ Removed: Nested `equipment` and `coach` objects

**BookingStatus Enum:**

- ✅ Changed from string values to numeric: `Pending=0`, `Confirmed=1`, `Completed=2`, `Cancelled=3`, `NoShow=4`

### 2. Authentication Service (`src/lib/api/auth.ts`)

- ✅ Removed `role` field from `RegisterRequest` interface
- ✅ Added comment: "role is NOT sent - backend determines from database"

### 3. Auth Context (`src/contexts/AuthContext.tsx`)

- ✅ Updated `register` signature: Removed `role` parameter, made `phone` optional
- ✅ Removed `MOCK_USERS` array (45+ lines of mock data)
- ✅ Updated `login` function: Map backend UserDto to frontend User type
- ✅ Updated `register` function: Removed role parameter from API call
- ✅ Both functions now convert backend `role` string to `UserRole` enum for routing

### 4. Signup Page (`src/app/signup/page.tsx`)

- ✅ Removed role selection UI (ROLE_CONFIG and role selector buttons)
- ✅ Updated `handleSubmit` to call `register(email, password, name, phone, gender)` without role
- ✅ Simplified branding section color (removed dynamic role colors)
- ✅ Updated form header text from "Choose your role and fill in your details" to "Fill in your details to get started"

### 5. Login Page (`src/app/login/page.tsx`)

- ✅ Removed unused ROLE_CONFIG imports
- ✅ Simplified branding section color
- ✅ Updated loading text from "Detecting role and signing in..." to "Signing in..."

## Backend API Endpoints

All endpoints use `http://localhost:5025/api` as base URL.

### Authentication

- `POST /auth/login` - Body: `{ email, password }` → Returns: `{ user: UserDto, token, expiresAt }`
- `POST /auth/register` - Body: `{ email, password, name, phone?, dateOfBirth?, gender? }` → Returns: `{ user: UserDto, token, expiresAt }`

### Users

- `GET /users/{id}` - Get user by ID
- `PUT /users/{id}` - Update user profile
- `GET /users/{id}/tokens` - Get token balance
- `DELETE /users/{id}` - Deactivate account

### Bookings

- `POST /bookings` - Create booking
- `GET /bookings/{id}` - Get booking by ID
- `GET /bookings/user/{userId}` - Get user's bookings
- `PUT /bookings/{id}/cancel` - Cancel booking
- `PUT /bookings/{id}/checkin` - Check in
- `PUT /bookings/{id}/checkout` - Check out

## Testing Credentials

Backend has test user:

- Email: `apitest.user@example.com`
- Password: `Test@1234`

## Notes

1. **Role Assignment**: Backend determines user role based on database configuration or defaults to "Member"
2. **Gender**: Backend uses numeric values (0=Male, 1=Female), not string enum
3. **Date of Birth**: Optional during registration, stored as string in ISO format
4. **Token Management**: JWT tokens stored in localStorage, automatically injected in API calls
5. **Authentication Flow**: Login/Register → Receive token → Store in localStorage → Auto-inject in subsequent requests
