# API Changes and Updates Summary

This document summarizes all the API changes made to fix booking persistence and connect the member/receptionist systems.

## Backend Changes

### 1. BookingController - New Endpoints Added

| Endpoint                            | Method | Description                                                       |
| ----------------------------------- | ------ | ----------------------------------------------------------------- |
| `GET /api/bookings`                 | GET    | Get all bookings (for receptionist)                               |
| `GET /api/bookings/status/{status}` | GET    | Get bookings by status (Pending, Confirmed, Completed, Cancelled) |
| `GET /api/bookings/today`           | GET    | Get today's bookings                                              |
| `PUT /api/bookings/{id}/confirm`    | PUT    | Confirm a pending booking                                         |

### 2. IBookingService - New Methods

```csharp
Task<IEnumerable<BookingDto>> GetAllBookingsAsync();
Task<IEnumerable<BookingDto>> GetBookingsByStatusAsync(string status);
Task<IEnumerable<BookingDto>> GetTodaysBookingsAsync();
Task<BookingDto> ConfirmBookingAsync(int bookingId);
```

### 3. BookingTypes - Added InBody Type

```csharp
public const string InBody = "InBody";
```

The InBody booking type allows members to schedule body composition scans. Unlike Equipment and Session bookings, InBody bookings don't require an equipmentId or coachId.

### 4. BookingService Changes

- Added support for InBody bookings (no equipment/coach required)
- Bookings now start with `Pending` status for receptionist confirmation
- Added `ConfirmBookingAsync` method to confirm pending bookings

---

## Frontend Changes

### 1. bookings.ts API Client - New Methods

```typescript
// Get all bookings (for receptionist)
async getAllBookings(): Promise<ApiResponse<BookingDto[]>>

// Get bookings by status
async getBookingsByStatus(status: string): Promise<ApiResponse<BookingDto[]>>

// Get today's bookings
async getTodaysBookings(): Promise<ApiResponse<BookingDto[]>>

// Confirm a booking
async confirmBooking(id: number): Promise<ApiResponse<BookingDto>>
```

### 2. Member Bookings Page (`/bookings`)

**Before:** Bookings were only saved to local state using `Date.now()` as IDs. They disappeared on page refresh.

**After:**

- `handleBookEquipment()` now calls `bookingsApi.createBooking()`
- `handleBookSession()` now calls `bookingsApi.createBooking()`
- Bookings are fetched from the API on page load
- Loading states and error handling added

### 3. Reception Dashboard (`/reception-dashboard`)

**Before:** Used mock data for stats and bookings.

**After:**

- Fetches today's bookings from `bookingsApi.getTodaysBookings()`
- Real-time pending booking count
- Confirm/Reject buttons work with actual API
- Stats calculated from real booking data

### 4. Reception Bookings Page (`/reception-bookings`)

**Before:** Used mock data.

**After:**

- Fetches all bookings from `bookingsApi.getAllBookings()`
- Confirm booking uses `bookingsApi.confirmBooking()`
- Cancel booking uses `bookingsApi.cancelBooking()`
- Check-in/Check-out functionality works

### 5. InBody Page (`/inbody`)

**Before:** InBody scheduling was local-only.

**After:**

- Scheduling creates a real booking via `bookingsApi.createBooking()` with `bookingType: "InBody"`
- Existing InBody bookings are loaded on page visit
- Cancel booking functionality added
- Booking status is shown (Pending/Confirmed)

---

## Booking Flow (Updated)

```
Member creates booking → API saves with status "Pending"
                       ↓
Receptionist sees in dashboard → Can Confirm or Reject
                       ↓
If Confirmed → Status changes to "Confirmed"
If Rejected → Status changes to "Cancelled"
                       ↓
Member checks in → Status can be updated via check-in endpoint
                       ↓
Member checks out → Status changes to "Completed"
```

---

## Testing the Changes

1. **Restart the backend** to load the new endpoints:

   ```bash
   cd Graduation-Project
   dotnet run
   ```

2. **Restart the frontend**:

   ```bash
   cd codeflex-ai
   npm run dev
   ```

3. **Test booking flow:**
   - Login as a member
   - Go to `/bookings` and book equipment or a coach session
   - Refresh the page - the booking should still be there
   - Go to `/inbody` and schedule a scan
   - Login as receptionist
   - Go to `/reception-dashboard` - see the pending bookings
   - Confirm or reject bookings
   - Go to `/reception-bookings` - see all bookings with actions

---

## Notes

- All bookings now start with "Pending" status
- Receptionist must confirm bookings for them to become active
- InBody bookings are treated as a special type that doesn't require equipment or coach
- The `BookingDto` includes `checkInTime` and `checkOutTime` for tracking
