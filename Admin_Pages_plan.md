# Admin Pages — Full Analysis & Implementation Plan

## Executive Summary

The admin module has 7 pages. Only 2 are connected to real APIs (`admin-users` fully, `admin-equipment` partially). The remaining 5 use 100% mock data. Several critical backend APIs are missing entirely (plan CRUD, coupons, equipment CRUD, admin stats). This plan covers all gaps across frontend pages, API client layer, backend controllers/services, and domain models.

---

## Page-by-Page Analysis

### 1. Admin Dashboard (`/admin-dashboard`) ❌ Fully Mock

| Feature | Status | Details |
|---------|--------|---------|
| Stat cards (members, revenue, coaches, equipment) | ❌ **100% Mock** | Lines 29-38: All hardcoded numbers |
| System alerts | ❌ **100% Mock** | Lines 46-50: Hardcoded alert items |
| Top coaches list | ❌ **100% Mock** | Lines 52-56: Fake coach ratings/earnings |
| Recent activities feed | ❌ **100% Mock** | Lines 58-63: Fake activity items |
| Revenue overview chart | ❌ **100% Mock** | Lines 40-44: Fake monthly data |
| Quick actions | ✅ Working | Navigate to admin sub-pages |
| "View All Alerts" | ❌ Dead | No handler |
| "View Full Log" link | ❌ **Broken** | Links to `/admin-activity-log` (404) |
| "Resolve" button on alerts | ❌ Dead | No handler |

**Missing Backend:**
- `GET /api/stats/admin` — Aggregated admin dashboard stats (total members, monthly revenue, active coaches, equipment counts, today check-ins, tokens sold)
- `GET /api/activity-feed` — Recent system-wide activity feed
- `GET /api/alerts` — System alerts list

---

### 2. Create Staff (`/admin-users`) ✅ Fully Functional

| Feature | Status | Details |
|---------|--------|---------|
| Role selection (Coach/Receptionist) | ✅ Works | Toggle between roles |
| Form fields (name, email, phone, gender) | ✅ Works | Validation included |
| Temporary password generation | ✅ Works | Client-side generation |
| Create account | ✅ **Real API** | Calls `authApi.createUserWithRole()` → `POST /api/auth/create-with-role` |
| Success display with copy | ✅ Works | Copy email/password to clipboard |

**No issues.** This is the only fully working admin page.

---

### 3. Manage Staff / Coaches (`/admin-coaches`) ❌ Fully Mock

| Feature | Status | Details |
|---------|--------|---------|
| Coach list | ❌ **100% Mock** | Lines 28-99: 5 hardcoded coaches |
| Stats cards (total, active, rating, sessions) | ❌ **100% Mock** | Lines 101-106: Hardcoded numbers |
| Search filter | ⚠️ UI Only | Filters mock data only |
| "Edit" button | ❌ Dead | No handler |
| "Delete" button | ❌ Dead | No handler |
| "Create New Staff" link | ✅ Works | Navigates to `/admin-users` |

**Missing Backend:**
- `GET /api/users` — List all users (with role filter for coaches)
- `PUT /api/users/{id}` — Update user profile/role (already exists but not wired for admin)

**API Client Already Exists (not used):**
- `usersApi.getCoachesWithProfiles()` → `GET /api/users/coaches/details`
- `usersApi.deactivateUser(id)` → `DELETE /api/users/{id}`

---

### 4. Equipment Management (`/admin-equipment`) ⚠️ Partially Connected

| Feature | Status | Details |
|---------|--------|---------|
| Equipment list | ✅ **Real API** | `equipmentApi.getAllEquipment(true)` |
| Stats cards (total, available, maintenance, out) | ✅ **Derived from API** | Dynamic calculation |
| Search filter | ✅ Works | Client-side on real data |
| Status filter buttons | ✅ Works | Filters by operational status |
| "Add Equipment" button | ❌ Dead | No handler |
| "Edit" button per card | ❌ Dead | No handler |
| "Maintain" button per card | ❌ Dead | No handler |
| "Delete" button per card | ❌ Dead | No handler |

**Missing Backend:**
- `POST /api/equipment` — Add new equipment
- `PUT /api/equipment/{id}` — Update equipment details (name, category, location, cost)
- `DELETE /api/equipment/{id}` — Remove equipment
- `POST /api/equipment/{id}/maintenance` — Log maintenance activity

**API Client Already Exists:**
- `equipmentApi.updateEquipmentStatus(id, status)` → `PUT /api/equipment/{id}/status` (exists but not wired to Maintain/Status buttons)

---

### 5. Packages & Plans Hub (`/admin-packages`) ❌ Fully Mock

| Feature | Status | Details |
|---------|--------|---------|
| Subscription plan cards | ❌ **100% Mock** | Lines 23-57: 3 hardcoded plans |
| Stats cards (revenue, coupons, churn, recovery) | ❌ **100% Mock** | Lines 89-110: Fake numbers |
| Revenue recovery table | ❌ **100% Mock** | Lines 112-137: Fake failed payments |
| Active coupons list | ❌ **100% Mock** | Lines 59-87: Fake coupon codes |
| "Create New Plan" button | ❌ Dead | No handler |
| "Modify Plan" button | ⚠️ Navigates | Goes to `/admin-packages/edit` but with no real data |
| "Add Coupon" button | ❌ Dead | No handler |
| "+" button on coupons | ❌ Dead | No handler |

**Missing Backend — Plans:**
- `POST /api/subscription/plans` — Create subscription plan
- `PUT /api/subscription/plans/{id}` — Update subscription plan
- `DELETE /api/subscription/plans/{id}` — Deactivate/delete subscription plan

**Missing Backend — Coupons (Entirely Missing):**
- No `Coupon` domain model, DTOs, service, or controller exists anywhere
- `GET /api/coupons` — List all coupons
- `POST /api/coupons` — Create coupon
- `PUT /api/coupons/{id}` — Update coupon
- `DELETE /api/coupons/{id}` — Delete coupon
- `POST /api/coupons/validate` — Validate/apply coupon code

**Missing Backend — Revenue Recovery:**
- No failed payment tracking or retry mechanism exposed via API

**Frontend API Client Status:**
- `subscriptionApi.getAllPlans()` → `GET /api/subscription/plans` (exists, not used by page)
- No API client for coupons exists at all

---

### 6. Plan Configuration / Edit Package (`/admin-packages/edit`) ❌ Fully Mock

| Feature | Status | Details |
|---------|--------|---------|
| Plan name field | ❌ **Mock** | Hardcoded "Elite Plan" |
| Monthly/annual pricing | ❌ **Mock** | Hardcoded values |
| Token allocation slider | ❌ **Mock** | Local state only |
| Feature toggles (AI, Nutrition, Access, PT) | ❌ **Mock** | Local state only |
| "Save Draft" button | ❌ Dead | `console.log` only |
| "Publish Changes" button | ❌ Dead | `console.log` + router push |
| "Delete Plan" button | ❌ Dead | `console.log` + confirm |

**Missing:**
- No route parameter for plan ID (always shows "Elite Plan")
- No API integration for fetching or saving plan data

---

### 7. Analytics & Reports (`/admin-analytics`) ❌ Fully Mock

| Feature | Status | Details |
|---------|--------|---------|
| Key metrics cards (revenue, members, sessions, retention) | ❌ **100% Mock** | Lines 20-57: Hardcoded |
| Revenue trend bars (6 months) | ❌ **100% Mock** | Lines 59-66: Fake monthly data |
| Membership distribution bars | ❌ **100% Mock** | Lines 68-72: Fake breakdown |
| Top performing coaches | ❌ **100% Mock** | Lines 74-78: Fake ranking |
| Peak usage hours chart | ❌ **100% Mock** | Lines 80-89: Fake percentages |
| "Last 30 Days" filter | ❌ Dead | No handler |
| "Export Report" button | ❌ Dead | No handler |

**Missing Backend:**
- `GET /api/stats/admin/revenue?period=30d` — Revenue data with date range
- `GET /api/stats/admin/membership-distribution` — Membership plan breakdown
- `GET /api/stats/admin/peak-hours` — Peak usage hour analysis
- `GET /api/stats/admin/retention` — Retention/churn metrics

---

### 8. Activity Log (`/admin-activity-log`) ❌ Page Does Not Exist

- Referenced in dashboard at line 318: `<Link href="/admin-activity-log">`
- Results in **404 Page Not Found**
- Backend has `AuditLogController` with:
  - `GET /api/audit-logs/{id}` — Get single log
  - `GET /api/audit-logs/user/{userId}` — Logs by user
  - `GET /api/audit-logs/table/{tableName}` — Logs by table
  - `POST /api/audit-logs` — Create log entry
- **Missing:** `GET /api/audit-logs` with pagination, search, date range, action type filters

---

## Backend API Gap Summary

| Missing Endpoint | Needed By | Priority |
|---|---|---|
| `GET /api/stats/admin` | Admin Dashboard | High |
| `GET /api/stats/admin/revenue?period=` | Admin Analytics | High |
| `GET /api/stats/admin/membership-distribution` | Admin Analytics | Medium |
| `GET /api/stats/admin/peak-hours` | Admin Analytics | Medium |
| `GET /api/stats/admin/retention` | Admin Analytics | Medium |
| `POST /api/subscription/plans` | Admin Packages | High |
| `PUT /api/subscription/plans/{id}` | Admin Packages Edit | High |
| `DELETE /api/subscription/plans/{id}` | Admin Packages | High |
| `GET /api/coupons` | Admin Packages | High |
| `POST /api/coupons` | Admin Packages | High |
| `PUT /api/coupons/{id}` | Admin Packages | High |
| `DELETE /api/coupons/{id}` | Admin Packages | High |
| `POST /api/coupons/validate` | Checkout (general) | Medium |
| `POST /api/equipment` | Admin Equipment | High |
| `PUT /api/equipment/{id}` | Admin Equipment | High |
| `DELETE /api/equipment/{id}` | Admin Equipment | High |
| `POST /api/equipment/{id}/maintenance` | Admin Equipment | Medium |
| `GET /api/audit-logs` (paginated, filtered) | Activity Log Page | Medium |
| `GET /api/activity-feed` | Admin Dashboard | Medium |
| `GET /api/users` (with role filter) | Admin Coaches | Medium |
| `GET /api/payments` (admin all, paginated) | Admin Payments (new) | Medium |

---

## Proposed Implementation Plan

The work is organized into **4 phases** with a clear dependency order.

---

### Phase 1: Connect Existing Pages to Real APIs

These changes require **no new backend endpoints** — only wiring frontend pages to existing APIs.

---

#### 1.1 Admin Coaches — Wire to Real API

**`GET /api/users/coaches/details`** already exists and returns `CoachDto[]`. The page just needs to call it.

##### [MODIFY] `codeflex-ai/src/app/admin-coaches/page.tsx`
- Remove all mock coach data
- Add `useEffect` to fetch `usersApi.getCoachesWithProfiles()`
- Replace stats cards with computed values from real data
- Wire "Edit" button → navigate to a coach edit form or open modal
- Wire "Delete" button → call `usersApi.deactivateUser(id)` with confirmation

---

#### 1.2 Admin Equipment — Wire Action Buttons

**APIs that exist but are not wired:**
- `PUT /api/equipment/{id}/status` — exists in `equipmentApi.updateEquipmentStatus()`
- No create/update/delete endpoints exist yet (handled in Phase 3)

##### [MODIFY] `codeflex-ai/src/app/admin-equipment/page.tsx`
- Wire "Maintain" button → `equipmentApi.updateEquipmentStatus(id, 2)` (set to UnderMaintenance)
- Wire status change on card → dropdown/click to cycle through statuses
- Keep "Add"/"Edit"/"Delete" buttons as placeholders for Phase 3

---

#### 1.3 Admin Packages — Wire Plan List to API

**`GET /api/subscription/plans`** already exists. The page just needs to call it.

##### [MODIFY] `codeflex-ai/src/app/admin-packages/page.tsx`
- Replace mock plans list with `subscriptionApi.getAllPlans()`
- Keep coupons and recovery as placeholders (no backend exists yet)
- Wire "Modify Plan" → navigate to `/admin-packages/edit?id={planId}` with real data

##### [MODIFY] `codeflex-ai/src/app/admin-packages/edit/page.tsx`
- Accept `planId` from URL search params
- Fetch plan data with `subscriptionApi.getPlan(planId)`
- Pre-fill form fields from real data
- Wire "Publish Changes" (backend endpoint created in Phase 2)
- Wire "Delete Plan" (backend endpoint created in Phase 2)

---

#### 1.4 Admin Dashboard — Create API Client & Wire

**No admin stats endpoint exists yet.** Need to create it first (done in Phase 2), but prepare the frontend now.

##### [MODIFY] `codeflex-ai/src/app/admin-dashboard/page.tsx`
- Add `useEffect` to load data from new endpoints (prepared for Phase 2)
- Replace mock stats with loading state (`isLoading`) and error handling
- Keep mock data as **fallback** during development

##### [NEW] `codeflex-ai/src/lib/api/admin.ts`
```typescript
export interface AdminDashboardStats {
  totalMembers: number;
  monthlyRevenue: number;
  activeCoaches: number;
  equipmentCount: number;
  todayCheckIns: number;
  tokensSold: number;
  pendingIssues: number;
  systemUptime: number;
  membersChange: number;
  revenueChange: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  members: number;
}

export interface SystemAlert {
  id: number;
  type: string;
  message: string;
  severity: "critical" | "warning" | "info";
  time: string;
  createdAt: string;
}

export interface RecentActivity {
  id: number;
  type: string;
  text: string;
  time: string;
  createdAt: string;
}

export const adminApi = {
  async getDashboardStats(): Promise<ApiResponse<AdminDashboardStats>> {
    return apiFetch<AdminDashboardStats>('/stats/admin');
  },

  async getRevenueOverview(months: number = 3): Promise<ApiResponse<RevenueDataPoint[]>> {
    return apiFetch<RevenueDataPoint[]>(`/stats/admin/revenue?months=${months}`);
  },

  async getSystemAlerts(): Promise<ApiResponse<SystemAlert[]>> {
    return apiFetch<SystemAlert[]>('/alerts');
  },

  async getRecentActivities(limit: number = 10): Promise<ApiResponse<RecentActivity[]>> {
    return apiFetch<RecentActivity[]>(`/activity-feed?limit=${limit}`);
  },

  async resolveAlert(alertId: number): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/alerts/${alertId}/resolve`, { method: 'POST' });
  },
};
```

---

### Phase 2: New Backend Endpoints (Admin Stats, Plan CRUD, Coupons)

---

#### 2.1 Admin Stats Service & Controller

##### [NEW] `Core/ServiceAbstraction/Services/IAdminService.cs`
```csharp
public interface IAdminService
{
    Task<AdminDashboardStatsDto> GetDashboardStatsAsync();
    Task<IEnumerable<RevenueDataPointDto>> GetRevenueOverviewAsync(int months);
    Task<MembershipDistributionDto> GetMembershipDistributionAsync();
    Task<IEnumerable<PeakHourDto>> GetPeakHoursAsync();
    Task<RetentionMetricsDto> GetRetentionMetricsAsync();
}
```

##### [NEW] `Core/Service/AdminService.cs`
- Queries `User` table for total/active members, coaches count
- Queries `Payment` table for monthly revenue
- Queries `Equipment` table for counts by status
- Queries `CheckIn` table for today's check-ins
- Queries `TokenTransaction` for tokens sold
- Aggregates all into `AdminDashboardStatsDto`

##### [NEW] `Shared/DTOs/Admin/AdminDashboardDtos.cs`
```csharp
public class AdminDashboardStatsDto
{
    public int TotalMembers { get; set; }
    public int ActiveMembers { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public int ActiveCoaches { get; set; }
    public int EquipmentCount { get; set; }
    public int AvailableEquipment { get; set; }
    public int TodayCheckIns { get; set; }
    public int TokensSold { get; set; }
    public int PendingIssues { get; set; }
    public double SystemUptime { get; set; }
    public double MembersChangePercent { get; set; }
    public double RevenueChangePercent { get; set; }
}

public class RevenueDataPointDto
{
    public string Month { get; set; }
    public decimal Revenue { get; set; }
    public int Members { get; set; }
}

public class MembershipDistributionDto
{
    public int TotalMembers { get; set; }
    public List<PlanDistributionDto> Plans { get; set; }
}

public class PlanDistributionDto
{
    public string PlanName { get; set; }
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class PeakHourDto
{
    public string TimeSlot { get; set; }
    public double UsagePercent { get; set; }
}

public class RetentionMetricsDto
{
    public double RetentionRate { get; set; }
    public double ChurnRate { get; set; }
    public int ActiveSubscriptions { get; set; }
    public int ExpiringSubscriptions { get; set; }
}
```

##### [NEW] `Infrastructure/Presentation/Controllers/AdminStatsController.cs`
```csharp
[Authorize(Roles = "Admin")]
[Route("api/stats/admin")]
public class AdminStatsController(IServiceManager _serviceManager) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetDashboardStats()
    {
        var stats = await _serviceManager.AdminService.GetDashboardStatsAsync();
        return Ok(ApiResponse<AdminDashboardStatsDto>.SuccessResponse(stats));
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> GetRevenueOverview([FromQuery] int months = 3)
    {
        var data = await _serviceManager.AdminService.GetRevenueOverviewAsync(months);
        return Ok(ApiResponse<IEnumerable<RevenueDataPointDto>>.SuccessResponse(data));
    }

    [HttpGet("membership-distribution")]
    public async Task<IActionResult> GetMembershipDistribution()
    {
        var data = await _serviceManager.AdminService.GetMembershipDistributionAsync();
        return Ok(ApiResponse<MembershipDistributionDto>.SuccessResponse(data));
    }

    [HttpGet("peak-hours")]
    public async Task<IActionResult> GetPeakHours()
    {
        var data = await _serviceManager.AdminService.GetPeakHoursAsync();
        return Ok(ApiResponse<IEnumerable<PeakHourDto>>.SuccessResponse(data));
    }

    [HttpGet("retention")]
    public async Task<IActionResult> GetRetentionMetrics()
    {
        var data = await _serviceManager.AdminService.GetRetentionMetricsAsync();
        return Ok(ApiResponse<RetentionMetricsDto>.SuccessResponse(data));
    }
}
```

##### [MODIFY] `Core/ServiceAbstraction/IServiceManager.cs` — Add `AdminService` property
##### [MODIFY] `Core/Service/ServiceManager.cs` — Implement `AdminService` registration

---

#### 2.2 Subscription Plan CRUD

##### [MODIFY] `Core/ServiceAbstraction/Services/ISubscriptionService.cs` — Add:
```csharp
Task<SubscriptionPlanDto> CreatePlanAsync(CreateSubscriptionPlanDto dto);
Task<SubscriptionPlanDto> UpdatePlanAsync(int planId, UpdateSubscriptionPlanDto dto);
Task<bool> DeletePlanAsync(int planId);
```

##### [NEW] `Shared/DTOs/Subscription/CreateSubscriptionPlanDto.cs`
```csharp
public class CreateSubscriptionPlanDto
{
    public string PlanName { get; set; } = null!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int DurationDays { get; set; }
    public int TokensIncluded { get; set; }
    public string? Features { get; set; }
    public int? MaxBookingsPerDay { get; set; }
    public int MaxFreezeDays { get; set; }
    public bool IsPopular { get; set; }
}
```

##### [NEW] `Shared/DTOs/Subscription/UpdateSubscriptionPlanDto.cs`
```csharp
public class UpdateSubscriptionPlanDto
{
    public string? PlanName { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public int? DurationDays { get; set; }
    public int? TokensIncluded { get; set; }
    public string? Features { get; set; }
    public int? MaxBookingsPerDay { get; set; }
    public int? MaxFreezeDays { get; set; }
    public bool? IsPopular { get; set; }
    public bool? IsActive { get; set; }
}
```

##### [MODIFY] `Infrastructure/Presentation/Controllers/SubscriptionController.cs` — Add:
```csharp
[HttpPost("plans")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<ApiResponse<SubscriptionPlanDto>>> CreatePlan([FromBody] CreateSubscriptionPlanDto dto)

[HttpPut("plans/{id}")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<ApiResponse<SubscriptionPlanDto>>> UpdatePlan(int id, [FromBody] UpdateSubscriptionPlanDto dto)

[HttpDelete("plans/{id}")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<ApiResponse<bool>>> DeletePlan(int id)
```

---

#### 2.3 Coupon / Discount System (Full Feature)

##### [NEW] `Core/DomainLayer/Models/DiscountCoupon.cs`
```csharp
public class DiscountCoupon
{
    public int CouponId { get; set; }
    public string Code { get; set; } = null!;
    public string Description { get; set; } = null!;
    public DiscountType DiscountType { get; set; }  // Percentage, FixedAmount
    public decimal DiscountValue { get; set; }
    public decimal? MinPurchaseAmount { get; set; }
    public int? MaxUsageCount { get; set; }
    public int CurrentUsageCount { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? CreatedByUserId { get; set; }

    public virtual User? CreatedBy { get; set; }
}
```

##### [NEW] `Core/DomainLayer/Enums/DiscountType.cs`
```csharp
public enum DiscountType { Percentage, FixedAmount }
```

##### [NEW] `Shared/DTOs/Coupon/CouponDtos.cs`
```csharp
public class CouponDto
{
    public int CouponId { get; set; }
    public string Code { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string DiscountType { get; set; } = null!;
    public decimal DiscountValue { get; set; }
    public decimal? MinPurchaseAmount { get; set; }
    public int? MaxUsageCount { get; set; }
    public int CurrentUsageCount { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCouponDto
{
    public string Code { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string DiscountType { get; set; } = null!;
    public decimal DiscountValue { get; set; }
    public decimal? MinPurchaseAmount { get; set; }
    public int? MaxUsageCount { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
}

public class UpdateCouponDto
{
    public string? Description { get; set; }
    public decimal? DiscountValue { get; set; }
    public decimal? MinPurchaseAmount { get; set; }
    public int? MaxUsageCount { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public bool? IsActive { get; set; }
}

public class ValidateCouponDto
{
    public string Code { get; set; } = null!;
    public decimal? OrderAmount { get; set; }
}

public class ValidateCouponResultDto
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public CouponDto? Coupon { get; set; }
    public decimal? DiscountAmount { get; set; }
}
```

##### [NEW] `Core/ServiceAbstraction/Services/ICouponService.cs`
```csharp
public interface ICouponService
{
    Task<IEnumerable<CouponDto>> GetAllCouponsAsync();
    Task<CouponDto?> GetCouponByIdAsync(int couponId);
    Task<CouponDto?> GetCouponByCodeAsync(string code);
    Task<CouponDto> CreateCouponAsync(CreateCouponDto dto, int createdByUserId);
    Task<CouponDto> UpdateCouponAsync(int couponId, UpdateCouponDto dto);
    Task<bool> DeleteCouponAsync(int couponId);
    Task<ValidateCouponResultDto> ValidateCouponAsync(ValidateCouponDto dto);
    Task<bool> IncrementUsageAsync(int couponId);
}
```

##### [NEW] `Core/Service/CouponService.cs` — Implement all methods

##### [NEW] `Infrastructure/Presentation/Controllers/CouponController.cs`
```csharp
[Authorize(Roles = "Admin")]
[Route("api/coupons")]
public class CouponController(IServiceManager _serviceManager) : ApiControllerBase
{
    [HttpGet] public async Task<IActionResult> GetAll()
    [HttpGet("{id}")] public async Task<IActionResult> GetById(int id)
    [HttpGet("code/{code}")] public async Task<IActionResult> GetByCode(string code)
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateCouponDto dto)
    [HttpPut("{id}")] public async Task<IActionResult> Update(int id, [FromBody] UpdateCouponDto dto)
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(int id)
    
    [AllowAnonymous]  // Called during checkout
    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] ValidateCouponDto dto)
}
```

##### [NEW DB Migration] — `CreateDiscountCouponTable`
- Add `DiscountCoupons` table to DbContext

---

#### 2.4 Equipment CRUD Endpoints

##### [MODIFY] `Infrastructure/Presentation/Controllers/EquipmentController.cs` — Add:
```csharp
[HttpPost]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<ApiResponse<EquipmentDto>>> CreateEquipment([FromBody] CreateEquipmentDto dto)

[HttpPut("{id}")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<ApiResponse<EquipmentDto>>> UpdateEquipment(int id, [FromBody] UpdateEquipmentDto dto)

[HttpDelete("{id}")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<ApiResponse<bool>>> DeleteEquipment(int id)
```

##### [NEW] `Shared/DTOs/Equipment/CreateEquipmentDto.cs`
```csharp
public class CreateEquipmentDto
{
    public string Name { get; set; } = null!;
    public int? CategoryId { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public int Status { get; set; }
    public decimal? TokensCostPerHour { get; set; }
    public string? MaintenanceSchedule { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
}
```

##### [NEW] `Shared/DTOs/Equipment/UpdateEquipmentDto.cs` — Same fields as Create but all optional

---

#### 2.5 Audit Log — Paginated List Endpoint

##### [MODIFY] `Infrastructure/Presentation/Controllers/AuditLogController.cs` — Add:
```csharp
[HttpGet]
public async Task<ActionResult<PaginatedResult<AuditLogDto>>> GetAll(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20,
    [FromQuery] int? userId = null,
    [FromQuery] string? tableName = null,
    [FromQuery] string? actionType = null,
    [FromQuery] DateTime? startDate = null,
    [FromQuery] DateTime? endDate = null)
```

---

### Phase 3: Frontend Feature Implementation

---

#### 3.1 Admin Dashboard — Connect to Real API

##### [MODIFY] `codeflex-ai/src/app/admin-dashboard/page.tsx`
- Add imports for `adminApi`, `useEffect`, `useState`
- Create loading/error/empty states
- Load dashboard stats from `adminApi.getDashboardStats()`
- Load revenue data from `adminApi.getRevenueOverview()`
- Load alerts from `adminApi.getSystemAlerts()`
- Load activities from `adminApi.getRecentActivities()`
- Wire "Resolve" alert button → `adminApi.resolveAlert(id)`
- Wire "View Full Log" → `/admin-activity-log` (created in 3.6)
- Keep loading skeleton while data fetches
- Keep current mock data as initial/fallback state

---

#### 3.2 Admin Coaches — Connect to Real API

##### [MODIFY] `codeflex-ai/src/app/admin-coaches/page.tsx`
- Add `useEffect` + `useState` for loading/error/data
- Fetch `usersApi.getCoachesWithProfiles()`
- Compute stats (total, active count, avg rating, total sessions) from real data
- Wire "Edit" button → open modal with `usersApi.updateProfile()`
- Wire "Delete" button → confirm dialog → `usersApi.deactivateUser(id)` → refresh list
- Add coach edit modal component

##### [NEW] `codeflex-ai/src/components/admin/CoachEditModal.tsx`
- Form fields: name, email, phone, specialization, certifications, status
- Save → `usersApi.updateProfile(coachId, data)`

---

#### 3.3 Admin Equipment — Wire All Actions

##### [MODIFY] `codeflex-ai/src/app/admin-equipment/page.tsx`
- Wire "Add Equipment" button → open `EquipmentFormModal` (create mode)
- Wire "Edit" button → open `EquipmentFormModal` (edit mode, pre-filled)
- Wire "Maintain" button → `equipmentApi.updateEquipmentStatus(id, 2)` (UnderMaintenance) or open maintenance log modal
- Wire "Delete" button → confirm → `equipmentApi.deleteEquipment(id)` (new endpoint)
- After any mutation, refresh the equipment list

##### [NEW] `codeflex-ai/src/components/admin/EquipmentFormModal.tsx`
- Fields: name, category, location, tokens cost, status, next maintenance date, description
- Create mode → `POST /api/equipment`
- Edit mode → `PUT /api/equipment/{id}`
- Validation for required fields

##### [MODIFY] `codeflex-ai/src/lib/api/equipment.ts` — Add:
```typescript
async createEquipment(data: CreateEquipmentDto): Promise<ApiResponse<EquipmentDto>>
async updateEquipment(id: number, data: UpdateEquipmentDto): Promise<ApiResponse<EquipmentDto>>
async deleteEquipment(id: number): Promise<ApiResponse<boolean>>
```

---

#### 3.4 Admin Packages — Plan CRUD & Coupon Management

##### [MODIFY] `codeflex-ai/src/app/admin-packages/page.tsx`
- Replace mock plans with `subscriptionApi.getAllPlans()` in `useEffect`
- Replace mock coupons with `couponApi.getAll()` (new API client)
- Replace stats cards with computed or API-loaded values
- Wire "Create New Plan" → navigate to `/admin-packages/edit` (new plan mode)
- Wire "Add Coupon" → open `CouponFormModal`
- Wire coupon edit/delete buttons
- Wire revenue recovery section (placeholder until payment retry is implemented)

##### [NEW] `codeflex-ai/src/lib/api/coupons.ts`
```typescript
export const couponApi = {
  async getAll(): Promise<ApiResponse<CouponDto[]>>,
  async getById(id: number): Promise<ApiResponse<CouponDto>>,
  async create(data: CreateCouponDto): Promise<ApiResponse<CouponDto>>,
  async update(id: number, data: UpdateCouponDto): Promise<ApiResponse<CouponDto>>,
  async delete(id: number): Promise<ApiResponse<boolean>>,
  async validate(data: ValidateCouponDto): Promise<ApiResponse<ValidateCouponResultDto>>,
};
```

##### [NEW] `codeflex-ai/src/components/admin/CouponFormModal.tsx`
- Fields: code, description, discount type (% / fixed), discount value, min purchase, max usage, valid from/until dates
- Create/Edit modes

---

#### 3.5 Admin Packages Edit — Full CRUD Integration

##### [MODIFY] `codeflex-ai/src/app/admin-packages/edit/page.tsx`
- Read `planId` from URL search params
- If `planId` exists → fetch `subscriptionApi.getPlan(planId)` → populate form
- If no `planId` → empty form (create mode)
- Wire "Publish Changes":
  - Create mode → `POST /api/subscription/plans`
  - Edit mode → `PUT /api/subscription/plans/{id}`
- Wire "Delete Plan" → confirm → `DELETE /api/subscription/plans/{id}` → navigate to list
- Wire "Save Draft" → (optional, could save as inactive plan)
- Add feature list editor (add/remove features as text items, not just 4 toggles)
- Make the token allocation slider functional with save

---

#### 3.6 Admin Activity Log — New Page

##### [NEW] `codeflex-ai/src/app/admin-activity-log/page.tsx`
- Full page with paginated audit log list
- Filters: user, table name, action type, date range
- Columns: timestamp, user, action, table, record ID, details
- Pagination controls
- Protected by `ProtectedRoute` with `UserRole.Admin`

---

#### 3.7 Admin Analytics — Connect to Real API

##### [MODIFY] `codeflex-ai/src/app/admin-analytics/page.tsx`
- Fetch real revenue data from `adminApi.getRevenueOverview()`
- Fetch membership distribution from `adminApi.getMembershipDistribution()`
- Fetch peak hours from `adminApi.getPeakHours()`
- Fetch retention metrics from `adminApi.getRetentionMetrics()`
- Wire "Last 30 Days" filter to actually change date range
- Wire "Export Report" button to generate CSV/PDF
- Use `recharts` (already in package.json) for actual bar charts instead of plain divs

---

### Phase 4: Polish & Cross-Cutting Features

---

#### 4.1 Navigation — Add Activity Log to Sidebar

##### [MODIFY] `codeflex-ai/src/components/Sidebar.tsx` and `codeflex-ai/src/components/Navbar.tsx`
- Add `{ href: "/admin-activity-log", icon: ClipboardListIcon, label: "Activity Log" }` to `getAdminNav()` arrays

#### 4.2 Loading & Error States

All pages should consistently handle:
- **Loading state**: Spinner/skeleton while data fetches
- **Error state**: Error card with retry button (like the equipment page already has)
- **Empty state**: Friendly message with action button
- **Edge cases**: Network failure, empty data, invalid IDs

#### 4.3 Confirmation Dialogs for Destructive Actions

Add confirmation before:
- Deleting equipment
- Deleting plans
- Deactivating coaches/users
- Deleting coupons

#### 4.4 Toast Notifications

Add success/error toast after every mutation:
- "Coach created successfully"
- "Equipment added successfully"
- "Plan updated successfully"
- "Coupon deleted"
- etc.

---

## Service Manager Registration

### [MODIFY] `Core/ServiceAbstraction/IServiceManager.cs`
```csharp
public interface IServiceManager
{
    // ... existing properties ...
    IAdminService AdminService { get; }
    ICouponService CouponService { get; }
}
```

### [MODIFY] `Core/Service/ServiceManager.cs`
- Add `AdminService` and `CouponService` properties
- Register in constructor
- Pass to `Dispose()` if needed

### [MODIFY] `Program.cs` (or DI registration)
```csharp
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<ICouponService, CouponService>();
```

---

## Dependencies & Ordering

```
Phase 1 (Wire existing APIs)
  ├── 1.1 Admin Coaches → depends on existing backend only
  ├── 1.2 Admin Equipment → depends on existing backend only
  ├── 1.3 Admin Packages → depends on existing backend only
  └── 1.4 Admin Dashboard API client → created in prep for Phase 2

Phase 2 (New backend endpoints)
  ├── 2.1 Admin Stats Service + Controller
  ├── 2.2 Subscription Plan CRUD
  ├── 2.3 Coupon System (domain + service + controller)
  ├── 2.4 Equipment CRUD endpoints
  └── 2.5 Audit Log paginated endpoint

Phase 3 (Frontend features using Phase 2 APIs)
  ├── 3.1 Admin Dashboard → depends on 2.1
  ├── 3.2 Admin Coaches (edit modal) → depends on existing + new PUT
  ├── 3.3 Admin Equipment (full CRUD) → depends on 2.4
  ├── 3.4 Admin Packages (coupons) → depends on 2.3
  ├── 3.5 Admin Packages Edit (full CRUD) → depends on 2.2
  ├── 3.6 Admin Activity Log Page → depends on 2.5
  └── 3.7 Admin Analytics → depends on 2.1

Phase 4 (Polish)
  ├── 4.1 Navigation updates
  ├── 4.2 Loading/error states
  ├── 4.3 Confirmation dialogs
  └── 4.4 Toast notifications
```

---

## Verification Plan

### Automated
- Backend: `dotnet build` — verify all new controllers, services, DTOs compile
- Backend: `dotnet test` — run existing tests, ensure no regressions
- Frontend: `npm run build` — verify TypeScript compilation for all new/modified pages
- Frontend: `npm run lint` — verify code style

### Manual
- Log in as admin → dashboard shows real stats, not hardcoded numbers
- Navigate each admin page → verify no mock data visible
- Create a subscription plan → verify it appears in the plan list
- Edit a plan → verify changes persist after page refresh
- Delete a plan → verify it disappears from list
- Create a coupon → verify it appears in coupons list
- Add equipment → verify it appears in equipment list
- Edit/delete equipment → verify changes persist
- Deactivate a coach → verify they disappear from active list
- Activity log page → verify it shows real audit entries with pagination
- Analytics page → verify charts show real data
- Export report → verify CSV/PDF download works
