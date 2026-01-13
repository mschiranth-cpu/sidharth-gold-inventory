# Worker Workflow - Developer Quick Reference

**Last Updated**: January 12, 2026  
**Status**: Production Ready ✅

---

## 🗺️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     WORKER WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘

1. Admin/Manager assigns order to department + worker
2. Worker logs in → Toast notification "X assignments waiting"
3. Worker navigates to My Work → Sees Current Assignments Card
4. Worker clicks "Continue Work" → Opens Work Submission Page
5. Worker fills form, uploads photos/files, saves draft
6. Worker clicks "Complete & Submit" → Validation runs
7. Backend updates status, creates activity log
8. Order auto-cascades to next department
9. Next worker receives assignment
```

---

## 📂 Key Files & Locations

### Frontend

**Main Page Component:**

- `frontend/src/pages/work/WorkSubmissionPage.tsx` (993 lines)
  - Dynamic form rendering
  - Photo/file uploads
  - Save draft & submit logic
  - Validation

**Dashboard Component:**

- `frontend/src/components/CurrentAssignmentsCard.tsx` (422 lines)
  - Shows current assignments
  - Progress checklist
  - Start/Continue work buttons

**Configuration:**

- `frontend/src/config/departmentRequirements.ts` (1293 lines)
  - All 9 department requirements
  - Form fields, photos, files
  - Validation rules
  - Tips and common mistakes

**Services:**

- `frontend/src/services/workers.service.ts`
  - API calls for work submission
  - Get work data
  - Save draft
  - Complete work
  - Start work

### Backend

**Workers Module:**

- `backend/src/modules/workers/workers.routes.ts`

  - Routes for worker operations
  - Protected routes (DEPARTMENT_WORKER role)

- `backend/src/modules/workers/workers.controller.ts`

  - Controllers for work operations
  - getPendingAssignmentsCount
  - getWorkDetails
  - saveWorkDraft
  - startWork
  - completeWork

- `backend/src/modules/workers/workers.service.ts`
  - Business logic for worker operations
  - Auto-cascade to next department
  - Activity log creation
  - Time tracking

**Database:**

- `backend/prisma/schema.prisma`
  - DepartmentTracking model
  - DepartmentWorkData model
  - DepartmentName enum (CAD, PRINT, CASTING, etc.)

---

## 🔗 Department Name Mapping

**Backend Enum → Frontend Config:**

| Backend (Prisma) | Frontend (Config) | Display Name      |
| ---------------- | ----------------- | ----------------- |
| `CAD`            | `CAD_DESIGN`      | CAD Design Studio |
| `PRINT`          | `3D_PRINTING`     | 3D Printing Lab   |
| `CASTING`        | `CASTING`         | Casting Workshop  |
| `FILLING`        | `FILLING_SHAPING` | Filling & Shaping |
| `MEENA`          | `MEENA_WORK`      | Meena Artistry    |
| `POLISH_1`       | `PRIMARY_POLISH`  | Primary Polish    |
| `SETTING`        | `STONE_SETTING`   | Stone Setting     |
| `POLISH_2`       | `FINAL_POLISH`    | Final Polish      |
| `ADDITIONAL`     | `FINISHING_TOUCH` | Finishing Touch   |

**Mapping Code:**

```typescript
const departmentNameToConfigId: Record<string, string> = {
  CAD: "CAD_DESIGN",
  PRINT: "3D_PRINTING",
  CASTING: "CASTING",
  FILLING: "FILLING_SHAPING",
  MEENA: "MEENA_WORK",
  POLISH_1: "PRIMARY_POLISH",
  SETTING: "STONE_SETTING",
  POLISH_2: "FINAL_POLISH",
  ADDITIONAL: "FINISHING_TOUCH",
};
```

---

## 🔄 Department Cascade Order

```
1. CAD Design Studio (CAD)
   ↓ cascades to
2. 3D Printing Lab (PRINT)
   ↓ cascades to
3. Casting Workshop (CASTING)
   ↓ cascades to
4. Filling & Shaping (FILLING)
   ↓ cascades to
5. Meena Artistry (MEENA)
   ↓ cascades to
6. Primary Polish (POLISH_1)
   ↓ cascades to
7. Stone Setting (SETTING)
   ↓ cascades to
8. Final Polish (POLISH_2)
   ↓ cascades to
9. Finishing Touch (ADDITIONAL)
   ↓ Order Complete
```

---

## 🛠️ Adding a New Department

If you need to add a new department:

### 1. Update Prisma Schema

```prisma
enum DepartmentName {
  CAD
  PRINT
  CASTING
  // ... existing
  NEW_DEPT  // Add here
}
```

### 2. Create Configuration

In `frontend/src/config/departmentRequirements.ts`:

```typescript
export const DEPARTMENT_REQUIREMENTS = {
  // ... existing departments
  NEW_DEPARTMENT_ID: {
    departmentId: 'NEW_DEPARTMENT_ID',
    departmentName: 'New Department Display Name',
    description: 'What this department does',
    formFields: [...],
    photoRequirements: [...],
    fileRequirements: [...],
    tips: [...],
    commonMistakes: [...]
  }
};
```

### 3. Update Mapping

In `WorkSubmissionPage.tsx` and `CurrentAssignmentsCard.tsx`:

```typescript
const departmentNameToConfigId: Record<string, string> = {
  // ... existing mappings
  NEW_DEPT: "NEW_DEPARTMENT_ID",
};
```

### 4. Run Migration

```bash
cd backend
npx prisma migrate dev --name add_new_department
```

**Done!** The form will automatically render based on the configuration.

---

## 📋 API Endpoints

### Worker Operations

**Get Pending Assignments Count:**

```
GET /api/workers/pending-assignments-count
Auth: Required (DEPARTMENT_WORKER)
Returns: { count: number, hasAssignments: boolean }
```

**Get Work Details:**

```
GET /api/workers/work/:orderId
Auth: Required (DEPARTMENT_WORKER)
Returns: { departmentName, order, tracking, workData, customer }
```

**Save Work Draft:**

```
POST /api/workers/work/:orderId/save
Auth: Required (DEPARTMENT_WORKER)
Body: { formData, uploadedFiles, uploadedPhotos }
Returns: { message, workData }
```

**Start Work:**

```
POST /api/workers/work/:orderId/start
Auth: Required (DEPARTMENT_WORKER)
Returns: { message, workData }
```

**Complete Work:**

```
POST /api/workers/work/:orderId/complete
Auth: Required (DEPARTMENT_WORKER)
Body: { formData, uploadedFiles, uploadedPhotos }
Returns: { message, nextDepartment? }
```

---

## 🎨 UI Components

### WorkSubmissionPage Structure

```
┌─────────────────────────────────────────────────────────┐
│ Header (Order info, customer, back button)             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────┐  ┌──────────────────────────┐  │
│  │                   │  │                          │  │
│  │  Main Content     │  │  Sidebar                 │  │
│  │                   │  │                          │  │
│  │  - Progress Bar   │  │  - Requirements          │  │
│  │  - Tips Panel     │  │    Checklist             │  │
│  │  - Form Fields    │  │    • Form fields: X/Y    │  │
│  │  - Photo Uploads  │  │    • Photos: X/Y         │  │
│  │  - File Uploads   │  │    • Files: X/Y          │  │
│  │                   │  │                          │  │
│  │  [Save Draft]     │  │  - Tips                  │  │
│  │  [Complete]       │  │  - Common Mistakes       │  │
│  │                   │  │  - Last Saved            │  │
│  └───────────────────┘  └──────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### CurrentAssignmentsCard Structure

```
┌─────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════╗ │
│ ║  Current Assignment - CAD Design Studio   ║ │
│ ╚═══════════════════════════════════════════╝ │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Product Image]   Order #12345                │
│                    High Priority 🔴             │
│                    Due: Jan 15, 2026            │
│                    Status: In Progress (3h ago) │
│                                                 │
│  Progress: ████████░░ 67%                      │
│                                                 │
│  Checklist:                                     │
│  ✅ Fill Required Fields (6/7 completed)        │
│  ✅ Upload Photos (3/4 uploaded)                │
│  ⬜ Upload Files (1/2 uploaded)                 │
│                                                 │
│  [Continue Work →]  [View Details]             │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Debugging Tips

### Common Issues

**1. "No requirements found for department"**

- Check department name mapping
- Verify config ID exists in departmentRequirements.ts
- Console log the department name from backend

**2. Photos not persisting**

- Check base64 encoding in handlePhotoUpload
- Verify uploadedPhotos array sent to backend
- Check DepartmentWorkData.uploadedPhotos column

**3. Auto-cascade not working**

- Check nextDepartmentMap in workers.service.ts
- Verify DepartmentTracking.departmentName matches enum
- Check activity log for errors

**4. Validation errors not clearing**

- Ensure setValidationErrors called with field name
- Check validationErrors state in handleFieldChange
- Verify field.name matches formData keys

### Debug Console Commands

```javascript
// Check current department requirements
const requirements = getDepartmentRequirements("CAD_DESIGN");
console.log(requirements);

// Check form data
console.log("Form Data:", formData);
console.log("Uploaded Photos:", uploadedPhotos);
console.log("Uploaded Files:", uploadedFiles);

// Check validation
const errors = validateWorkData(
  requirements,
  formData,
  uploadedPhotos,
  uploadedFiles
);
console.log("Validation Errors:", errors);
```

---

## 🧪 Testing Checklist

### Per Department Test

- [ ] Form renders with correct fields
- [ ] All field types work (text, number, select, textarea, checkbox, date)
- [ ] Photo upload works (drag & drop, click to upload)
- [ ] Photo thumbnails display
- [ ] File upload works with accepted formats
- [ ] Save Draft persists all data
- [ ] Refresh page loads saved data
- [ ] Progress bar updates correctly
- [ ] Requirements checklist accurate
- [ ] Complete & Submit validates all fields
- [ ] Success message displays
- [ ] Auto-cascade to next department works
- [ ] Files visible in Order Detail Files tab
- [ ] Activity log entry created

### End-to-End Test

- [ ] Create order
- [ ] Complete CAD → cascades to PRINT ✓
- [ ] Complete PRINT → cascades to CASTING ✓
- [ ] Complete CASTING → cascades to FILLING ✓
- [ ] Complete FILLING → cascades to MEENA ✓
- [ ] Complete MEENA → cascades to POLISH_1 ✓
- [ ] Complete POLISH_1 → cascades to SETTING ✓
- [ ] Complete SETTING → cascades to POLISH_2 ✓
- [ ] Complete POLISH_2 → cascades to ADDITIONAL ✓
- [ ] Complete ADDITIONAL → order status COMPLETED ✓

---

## 📊 Database Schema

### DepartmentTracking

```prisma
model DepartmentTracking {
  id              String              @id @default(uuid())
  orderId         String
  departmentName  DepartmentName
  status          DepartmentStatus    @default(NOT_STARTED)
  assignedToId    String?
  startedAt       DateTime?
  completedAt     DateTime?

  order           Order               @relation(...)
  assignedTo      User?               @relation(...)
  workData        DepartmentWorkData?
}
```

### DepartmentWorkData

```prisma
model DepartmentWorkData {
  id                    String              @id @default(uuid())
  departmentTrackingId  String              @unique

  // Work data
  formData              Json?               // Form field values
  uploadedFiles         Json?               // Array of file objects
  uploadedPhotos        Json?               // Array of photo objects

  // Metadata
  workStartedAt         DateTime?
  workCompletedAt       DateTime?
  timeSpentMinutes      Int?

  // Status
  isComplete            Boolean             @default(false)
  isDraft               Boolean             @default(true)
  lastSavedAt           DateTime?

  departmentTracking    DepartmentTracking  @relation(...)
}
```

---

## 🚀 Quick Commands

### Development

```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev

# Run database migrations
cd backend
npx prisma migrate dev

# Open Prisma Studio
cd backend
npx prisma studio

# Check database
cd backend
npx prisma db pull
```

### Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# E2E tests
cd frontend
npm run test:e2e
```

---

## 📚 Related Documentation

- **Progress Tracker**: `docs/WORKER_WORKFLOW_PROGRESS.md`
- **Requirements**: `docs/WORKER_WORKFLOW_REQUIREMENTS.md`
- **Testing Guide**: `docs/WORKER_WORKFLOW_TESTING.md`
- **Session Summary**: `docs/SESSION_SUMMARY_2026-01-12.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **User Guide**: `docs/USER_GUIDE.md`

---

## 💡 Pro Tips

1. **Configuration-Driven**: Never hardcode department requirements. Always use the config file.

2. **Type Safety**: The config exports TypeScript types. Use them for type safety.

3. **Validation**: Requirements config includes validation rules. Use them consistently.

4. **Auto-Save**: Code exists but is commented out. Uncomment lines ~195-209 in WorkSubmissionPage.tsx to enable.

5. **Department Mapping**: Always use departmentNameToConfigId mapping. Never assume backend enum === config ID.

6. **Photo Storage**: Photos are stored as base64 in JSON for simplicity. Consider S3 for production with many photos.

7. **File Storage**: Files are stored in uploads/ directory. Consider S3 for production.

8. **Activity Logs**: Every work completion creates an activity log. Useful for tracking and debugging.

---

**Need Help?**  
Check the testing guide or session summary for detailed walkthroughs.

---

_Last Updated: January 12, 2026_
