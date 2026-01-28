# Equipment-Muscle Filtering Implementation

## Overview
Implemented muscle-based filtering for gym equipment, allowing users to select a target muscle and see all equipment that targets that muscle group.

## Features Implemented

### Backend (C# / .NET)

#### 1. Domain Model
Created **EquipmentMuscle** junction table (`Core/DomainLayer/EquipmentMuscle.cs`):
- Links Equipment to Muscles (many-to-many relationship)
- `EquipmentMuscleId` (PK), `EquipmentId` (FK), `MuscleId` (FK)
- `IsPrimary` flag for primary vs secondary target muscles

#### 2. Updated Models
- **Equipment**: Added `EquipmentMuscles` navigation property
- **EquipmentDto**: Added `TargetMuscles` list property

#### 3. Database
- Added `equipment_muscles` table via EF migration `AddEquipmentMuscleRelationship`
- Foreign keys to `equipment` and `muscles` tables
- Cascade delete on both relationships

#### 4. Service Layer (`EquipmentService`)
New methods:
- `GetEquipmentByMuscleAsync(muscleId)`: Returns all equipment targeting specific muscle
- `GetAllMusclesAsync()`: Returns all available muscles
- Updated `MapToEquipmentDtoAsync()`: Now includes target muscles in DTO

#### 5. API Endpoints (`EquipmentController`)
New endpoints:
- `GET /api/equipment/muscles`: Get all muscles
- `GET /api/equipment/muscle/{muscleId}`: Get equipment targeting specific muscle

### Frontend (Next.js / TypeScript)

#### 1. API Client Updates (`equipment.ts`)
Added types:
```typescript
interface MuscleDto {
  muscleId: number;
  name: string;
  nameEn?: string;
  isFront: boolean;
  imageUrlMain?: string;
  imageUrlSecondary?: string;
}
```

Updated `EquipmentDto` to include:
```typescript
targetMuscles?: MuscleDto[];
```

New API methods:
- `getMuscles()`: Fetch all muscles (cached 30min)
- `getEquipmentByMuscle(muscleId)`: Fetch equipment for muscle (cached 15min)

#### 2. Equipment Browse Page (`/equipment-browse`)
Created new page with:

**Left Sidebar:**
- Search box for equipment name
- Muscle group filter (radio-style selection)
- Scrollable list of all muscles
- Clear filters button

**Main Content:**
- Equipment cards in responsive grid (1/2/3 columns)
- Each card shows:
  - Equipment name
  - Category badge
  - Location (if available)
  - Target muscles (as badges)
  - Status (Available/In Use/Under Maintenance)
  - Token cost per hour

**Behavior:**
- Select a muscle → shows only equipment targeting that muscle
- Search filters equipment names
- Combines muscle filter + search
- Empty state when no equipment found

#### 3. Navigation
Added "Equipment" link to member sidebar navigation

## Data Flow

1. **Load Muscles**: On page load, fetch all muscles from `/api/equipment/muscles`
2. **Load Equipment**: 
   - If no muscle selected → fetch all equipment from `/api/equipment`
   - If muscle selected → fetch filtered from `/api/equipment/muscle/{id}`
3. **Display**: Show equipment cards with their target muscles

## Usage Example

1. Navigate to `/equipment-browse`
2. See all gym equipment
3. Click on a muscle (e.g., "Biceps")
4. See only equipment that targets biceps (Barbell, Dumbbells, Cable Machine, etc.)
5. Each equipment card shows which muscles it targets
6. Use search to narrow further (e.g., search "Barbell")

## Database Schema

```sql
CREATE TABLE equipment_muscles (
    equipment_muscle_id SERIAL PRIMARY KEY,
    equipment_id INT NOT NULL REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    muscle_id INT NOT NULL REFERENCES muscles(muscle_id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false
);
```

## API Examples

### Get All Muscles
```
GET /api/equipment/muscles
Response: [
  { "muscleId": 1, "name": "Biceps", "nameEn": "Biceps", "isFront": true },
  { "muscleId": 2, "name": "Triceps", "nameEn": "Triceps", "isFront": false },
  ...
]
```

### Get Equipment for Biceps (muscleId=1)
```
GET /api/equipment/muscle/1
Response: [
  {
    "equipmentId": 5,
    "name": "Barbell",
    "category": "Free Weights",
    "status": 1,
    "location": "Weight Room A",
    "tokensCost": 0,
    "targetMuscles": [
      { "muscleId": 1, "nameEn": "Biceps", "isFront": true },
      { "muscleId": 8, "nameEn": "Shoulders", "isFront": true }
    ]
  },
  ...
]
```

## Next Steps

### Data Population
You need to populate `equipment_muscles` table with relationships:

```sql
-- Example: Barbell targets Biceps (primary) and Shoulders (secondary)
INSERT INTO equipment_muscles (equipment_id, muscle_id, is_primary) VALUES
(1, 1, true),   -- Barbell → Biceps (primary)
(1, 8, false),  -- Barbell → Shoulders (secondary)
(2, 2, true),   -- Dumbbell → Triceps (primary)
(2, 7, false),  -- Dumbbell → Chest (secondary)
...
```

Or import from wger exercise data (equipment used in exercises → muscles targeted by those exercises).

### Recommended Enhancements
1. **Add filtering to admin page**: Admin equipment page could also show muscle targets
2. **Multiple muscle selection**: Allow selecting multiple muscles (AND/OR logic)
3. **Equipment recommendations**: "Based on your workout, you need these equipment"
4. **Booking integration**: Book equipment filtered by muscle you're training
5. **Primary vs Secondary**: Distinguish in UI between primary and secondary muscles
6. **Muscle diagram**: Interactive body diagram for visual muscle selection
7. **Exercise integration**: Show which exercises use this equipment for selected muscle
8. **Equipment alternatives**: Suggest alternative equipment for same muscle

## Files Modified/Created

### Backend
- ✅ `Core/DomainLayer/EquipmentMuscle.cs` (NEW)
- ✅ `Core/DomainLayer/Models/Equipment.cs` (MODIFIED - added EquipmentMuscles property)
- ✅ `Infrastructure/Presistence/Data/IntelliFitDbContext.cs` (MODIFIED - added DbSet and config)
- ✅ `Core/ServiceAbstraction/Services/IEquipmentService.cs` (MODIFIED - added methods)
- ✅ `Shared/DTOs/Equipment/EquipmentDto.cs` (MODIFIED - added TargetMuscles)
- ✅ `Core/Service/Services/EquipmentService.cs` (MODIFIED - added implementations)
- ✅ `Infrastructure/Presentation/Controllers/EquipmentController.cs` (MODIFIED - added endpoints)
- ✅ `Migrations/XXX_AddEquipmentMuscleRelationship.cs` (NEW - Applied)

### Frontend
- ✅ `codeflex-ai/src/lib/api/equipment.ts` (MODIFIED - added MuscleDto, methods)
- ✅ `codeflex-ai/src/app/equipment-browse/page.tsx` (NEW)
- ✅ `codeflex-ai/src/components/Sidebar.tsx` (MODIFIED - added Equipment link)
- ✅ `codeflex-ai/src/app/exercises/page.tsx` (DELETED - not needed)

## Status
✅ Backend implementation complete
✅ Database migration applied
✅ Frontend equipment browse page created
✅ API client updated
✅ Navigation integrated
⏳ Equipment-muscle relationships need to be populated in database
