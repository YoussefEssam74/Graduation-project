# ✅ **Opus 4.5 Prompt — Users / Profiles / IDs Refactor (SAFER INT-KEY VERSION)**

*(This replaces your old prompt and removes all Guid-migration steps.)*

---

# **Goal (Safer Path — keep integer PKs)**

* Preserve existing **integer primary keys** (`int UserId`, `int MemberId`, `int CoachId`).
* Add a **Role** column to `users` table using `UserRole` enum (stored as string).
* Remove TPT inheritance (`Member`, `Coach`).
* Keep `MemberProfile` and `CoachProfile` linked via `UserId` (`int`).
* Move member/coach-specific data into profile tables.
* Update `BaseEntity` to be usable across domain types (but still keep integer PKs).
* Update DTOs, services, repositories, and controllers.
* Update frontend API calls.
* Create EF migration to:

  * Add `Role` column to `users`.
  * Move any remaining data from `members` and `coaches` tables into profiles.
  * Drop the old `members` and `coaches` tables.
* **NO conversion to GUID anywhere.**

---

# **Assumptions**

* Repo root path: workspace root.
* Backend projects to modify:

  * `Core/DomainLayer/Models`
  * `Infrastructure/Presistence/Data/IntelliFitDbContext.cs`
  * `Infrastructure/Presistence/Migrations/*`
  * `Service/`
  * `ServiceAbstraction/`
  * `Infrastructure/Presentation/Controllers/`
* Frontend: `frontend/` and `intellifit-frontend/`.
* Database: PostgreSQL.

---

# **High-Level Steps**

## **1. Update `BaseEntity`**

* Keep integer PKs.
* Add timestamps + IsActive.
* Use:

```csharp
namespace IntelliFit.Domain.Models
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }   // keep int PK
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
    }
}
```

* Remove duplicate timestamp fields from all models inheriting `BaseEntity`.

---

## **2. Update `User` model**

* Keep existing `int UserId` but map it to `BaseEntity.Id`.
* Remove any inheritance (no abstract classes).
* Add:

```csharp
public UserRole Role { get; set; } = UserRole.Member;
```

* Keep only *general user data* in `User` (email, password hash, name, phone, etc.).

---

## **3. Add/Update `UserRole` enum**

```csharp
namespace IntelliFit.Domain.Enums
{
    public enum UserRole
    {
        Admin,
        Coach,
        Member,
        Receptionist
    }
}
```

---

## **4. Remove Member and Coach domain classes**

* Delete:

  * `Core/DomainLayer/Models/Member.cs`
  * `Core/DomainLayer/Models/Coach.cs`

* Replace their usage with:

  * `MemberProfile`
  * `CoachProfile`
  * `User.Role`

---

## **5. Update MemberProfile & CoachProfile**

* Keep integer PKs.
* Must include:

```csharp
public int UserId { get; set; }
public User User { get; set; }
```

* Remove any TPT inheritance.
* Ensure no `MemberId` or `CoachId` that duplicates `UserId`.

---

## **6. Update `IntelliFitDbContext`**

* Remove:

```csharp
DbSet<Member> Members
DbSet<Coach> Coaches
```

* Remove TPT mapping:

```csharp
modelBuilder.Entity<Member>().ToTable("members");
modelBuilder.Entity<Coach>().ToTable("coaches");
```

* Configure:

```csharp
entity.Property(e => e.Role)
      .HasConversion<string>()
      .HasMaxLength(50)
      .IsRequired();
```

* Configure profile foreign keys normally with int FK.

---

## **7. Update DTOs, services, repositories**

* Replace uses of `Member`/`Coach` with:

  * `User` + `Role`
  * Profiles via `MemberProfile` or `CoachProfile`
* Update DTO IDs to remain integers.

---

## **8. Migration (Add `Role`, migrate data, drop old tables)**

Migration must:

### **Add Role column**

```sql
ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'Member';
```

### **Move data**

* If old `members` or `coaches` tables contain profile fields, copy into:

  * `member_profiles`
  * `coach_profiles`

### **Drop old tables**

```sql
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS coaches;
```

---

## **9. Frontend updates**

* Update API calls to:

  * `/api/users`
  * `/api/member-profiles/{userId}`
  * `/api/coach-profiles/{userId}`

* Use integer IDs everywhere.

* Expect `role` in `UserDto`.

---

## **10. Tests**

* Update tests to use integer user IDs.

---

# **Commands After Applying Patches**

```powershell
dotnet ef migrations add UsersProfilesRefactor --project Infrastructure/Presistence --startup-project Graduation-Project
dotnet ef database update --project Infrastructure/Presistence --startup-project Graduation-Project
dotnet build

npm --prefix intellifit-frontend install
npm --prefix intellifit-frontend run dev
```

---

# **Signup-Role Restriction Prompt (Safer Path Version)**

## **Goal**

* Public signup always creates `Role = Member`.
* Only Admin can create accounts with role: Coach, Receptionist, Admin.
* Add role claim to JWT.
* Add admin-only endpoint.

## **Backend Changes**

### **Ensure User.Role exists**

```csharp
public UserRole Role { get; set; } = UserRole.Member;
```

### **Public signup (force Member)**

Controller:

```csharp
user.Role = UserRole.Member;
```

### **Admin-only endpoint**

```csharp
[Authorize(Roles = "Admin")]
[HttpPost("create-with-role")]
```

### **JWT token must include role**

```csharp
new Claim(ClaimTypes.Role, user.Role.ToString())
```

---

# **Database Changes**

* If `Role` column missing, add it via migration:

```csharp
migrationBuilder.AddColumn<string>(
    name: "Role",
    table: "users",
    type: "text",
    nullable: false,
    defaultValue: "Member");
```

---

# **Frontend Changes**

* Remove role selector from public signup.
* Add admin-only UI for creating:

  * Coach
  * Receptionist
  * Admin

