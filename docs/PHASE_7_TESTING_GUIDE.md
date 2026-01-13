# Phase 7: Work Submission Page - Testing Guide

**Date**: January 11, 2026  
**Phase**: Phase 7 - Work Submission Page  
**Test User**: Nisha Sharma (Department Worker - CAD department)  
**Test Order**: ORD-2026-00001-U8M

---

## 🎯 What Was Implemented

**Frontend:**

- ✅ New route `/orders/:id/work` for work submission
- ✅ Complete WorkSubmissionPage with 520+ lines of code
- ✅ Dynamic form based on department requirements
- ✅ Real-time progress tracking
- ✅ Save Draft and Complete & Submit functionality
- ✅ File and photo upload UI (basic)
- ✅ Tips and Common Mistakes panels

**Backend:**

- ✅ GET `/api/workers/work/:orderId` - Load work data
- ✅ POST `/api/workers/work/:orderId/start` - Start work
- ✅ POST `/api/workers/work/:orderId/save` - Save draft
- ✅ POST `/api/workers/work/:orderId/complete` - Complete work

---

## 🚀 Pre-Testing Setup

### 1. Start Both Servers

**Terminal 1 - Backend:**

```powershell
cd "c:\AI Websites\Sidharth Gold Inventory Site\backend"
npm run dev
```

Wait for: `✓ Server running on http://localhost:3000`

**Terminal 2 - Frontend (Keep this running):**

```powershell
cd "c:\AI Websites\Sidharth Gold Inventory Site\frontend"
npm run dev
```

Wait for: `Local: http://localhost:5173/`

### 2. Login as Nisha Sharma

- Email: `nisha@example.com`
- Password: `password123`
- Role: DEPARTMENT_WORKER (CAD department)

---

## 📋 Testing Checklist

### Test 1: Navigation from Assignment Card ⭐ CRITICAL

**Steps:**

1. Go to My Work page (`/my-work`)
2. Find the assignment card with order ORD-2026-00001-U8M
3. Click "Continue Work" button

**Expected Results:**

- ✅ Should navigate to `/orders/[order-id]/work`
- ✅ Page should load without errors
- ✅ Should NOT redirect to dashboard
- ✅ Loading spinner should appear briefly

**What to Look For:**

- No console errors
- Smooth navigation
- Page loads within 1-2 seconds

---

### Test 2: Page Header Display

**What to Check:**

- ✅ Order number displays correctly (e.g., "ORD-2026-00001-U8M")
- ✅ Customer name shows (e.g., "Priya Sharma")
- ✅ Product name appears
- ✅ Department badge shows "CAD Design Studio"
- ✅ Status badge shows "IN_PROGRESS" or "NOT_STARTED"
- ✅ "Back to My Work" button is visible
- ✅ Progress bar at 0% initially

**Screenshot Location**: Header section at top

---

### Test 3: CAD Form Fields Display

**Check All 7 Fields Are Present:**

1. **Design Complexity** (Dropdown)
   - Options: Simple, Medium, Complex, Very Complex
2. **CAD Software Used** (Dropdown)
   - Options: Rhino 3D, Matrix, JewelCAD, Blender, Other
3. **Design File Names** (Text input)
4. **Number of Components** (Number input)
5. **Modification Notes** (Textarea - large)
6. **Design Approval Status** (Dropdown)
   - Options: Pending Review, Client Approved, Manager Approved, Needs Revision
7. **Special Features** (Textarea - large)

**Expected Results:**

- ✅ All fields have labels with red asterisk (\*)
- ✅ Dropdowns show placeholder "Select [Field Name]"
- ✅ Text inputs are empty initially
- ✅ Helper text visible under some fields

---

### Test 4: Progress Indicator (Real-Time)

**Steps:**

1. Note progress bar at 0%
2. Fill in "Design Complexity" dropdown → Select "Medium"
3. Observe progress bar

**Expected Results:**

- ✅ Progress bar should increase (approximately 14% per field)
- ✅ Percentage number updates in header
- ✅ Progress bar animates smoothly
- ✅ Color: Indigo to Purple gradient

**Continue Testing:** 4. Fill in "CAD Software Used" → Select "Rhino 3D" 5. Progress should increase again 6. Fill all 7 fields 7. Progress should reach ~58% (7 of 12 requirements)

**Note**: Total requirements = 7 fields + 3 photos + 2 files = 12

---

### Test 5: File Upload Section

**What to Check:**

- ✅ Section titled "Required Files" with red asterisk
- ✅ Two upload areas visible (CAD files requirement)
- ✅ Each shows: Upload icon, "Upload [File Type]", allowed formats
- ✅ Accepted formats: .stl, .obj, .3dm files
- ✅ File size limit displayed (e.g., "up to 50MB")
- ✅ Click on upload area - file picker should open
- ✅ Currently file upload is UI only (doesn't actually upload yet)

**Note**: Actual file upload will be implemented in Phase 8

---

### Test 6: Photo Upload Section

**What to Check:**

- ✅ Section titled "Required Photos" with red asterisk
- ✅ Grid layout with 4 photo upload boxes (2x2 grid)
- ✅ Each labeled:
  - "CAD Design Screenshots"
  - "Different Angle Views"
  - "Component Details"
  - "Final Design Render"
- ✅ Camera icon in each box
- ✅ Helper text under each label
- ✅ Click on upload area - file picker opens (images only)
- ✅ Currently photo upload is UI only

**Note**: Actual photo upload will be implemented in Phase 8

---

### Test 7: Tips & Common Mistakes Panels (Right Sidebar)

**Check "💡 Helpful Tips" Panel:**

- ✅ Blue background card
- ✅ List of tips specific to CAD department
- ✅ Bullet points with helpful guidance
- ✅ Examples:
  - "Always save multiple versions..."
  - "Use consistent naming conventions..."
  - "Document all modifications..."

**Check "⚠️ Common Mistakes" Panel:**

- ✅ Yellow background card
- ✅ List of common mistakes
- ✅ Bullet points with warnings
- ✅ Examples:
  - "Not saving backup copies..."
  - "Incorrect scale or dimensions..."

---

### Test 8: Save Draft Functionality ⭐ CRITICAL

**Steps:**

1. Fill in at least 2-3 form fields:
   - Design Complexity: "Medium"
   - CAD Software: "Rhino 3D"
   - Number of Components: "5"
2. Click "Save Progress" button

**Expected Results:**

- ✅ Button shows "Saving..." briefly
- ✅ Success toast: "Progress saved successfully!" (green)
- ✅ "Last saved" timestamp appears in header (e.g., "Last saved 2:45:30 PM")
- ✅ No errors in console
- ✅ Button returns to "Save Progress"

**Verify Persistence:** 3. Refresh the page (F5 or Ctrl+R) 4. Page reloads 5. **All filled fields should still have their values!** 6. Progress bar should show same percentage 7. "Last saved" timestamp should be preserved

**If Fields Are Empty After Refresh:**

- ❌ Check browser console for errors
- ❌ Check Network tab for API response
- ❌ Verify backend is running

---

### Test 9: Form Validation (Complete Button)

**Steps:**

1. Clear all form fields (refresh page if needed)
2. Click "Complete & Submit" button (green button)

**Expected Results:**

- ✅ Error toast appears (red)
- ✅ Message lists missing fields:
  - "Please complete all required fields:"
  - "Design Complexity, CAD Software Used, ... Photos (0/3), Files (0/2)"
- ✅ Toast stays for 5 seconds
- ✅ Form does NOT submit
- ✅ Page stays on work submission

**Test Partial Completion:** 3. Fill only 3 fields out of 7 4. Click "Complete & Submit" 5. Should still show error with remaining required fields

---

### Test 10: Complete & Submit Flow ⭐ CRITICAL

**Steps:**

1. Fill ALL 7 form fields:
   - Design Complexity: "Medium"
   - CAD Software Used: "Rhino 3D"
   - Design File Names: "gold-ring-v3.3dm, ring-render.jpg"
   - Number of Components: "5"
   - Modification Notes: "Added engraving detail as per client request"
   - Design Approval Status: "Client Approved"
   - Special Features: "Custom engraving pattern on band"

**Note for Testing:** Since file/photo upload is not yet implemented, we'll test with empty uploads. The validation may block you. **For now, test the Save Draft extensively instead.**

2. Click "Save Progress" to ensure data is saved
3. Verify toast: "Progress saved successfully!"

**Expected Behavior (once validation is bypassed):**

- ✅ Success toast: "Work submitted successfully! Moving to next department..."
- ✅ Status updates to COMPLETED
- ✅ Auto-cascades to next department (3D Printing Lab)
- ✅ Redirect to My Work page after 1.5 seconds
- ✅ Assignment disappears from "Current Assignments" card

**Note**: Complete submission with full validation will work once Phase 8 (file uploads) is complete.

---

### Test 11: Back Navigation

**Steps:**

1. While on work submission page
2. Click "← Back to My Work" button in header

**Expected Results:**

- ✅ Navigates back to `/my-work` page
- ✅ No errors
- ✅ Assignment card still visible

---

### Test 12: Last Saved Timestamp

**Steps:**

1. Fill a field and save draft
2. Note the "Last saved" time
3. Wait 1 minute
4. Fill another field and save again

**Expected Results:**

- ✅ Timestamp updates to new save time
- ✅ Format: "Last saved 2:46:15 PM"
- ✅ Clock icon visible next to timestamp

---

### Test 13: Status Change (Backend Verification)

**Use Prisma Studio to Verify:**

1. Open new terminal:

```powershell
cd "c:\AI Websites\Sidharth Gold Inventory Site\backend"
npx prisma studio
```

2. Navigate to: `http://localhost:5555`

3. Click on **DepartmentTracking** table

4. Find the order "ORD-2026-00001-U8M" (CAD department)

5. Check `status` column:

   - ✅ Should be "IN_PROGRESS" (after first save)
   - ✅ Should NOT be "NOT_STARTED" anymore

6. Click on **DepartmentWorkData** table

7. Find record with matching `departmentTrackingId`

8. Verify:
   - ✅ `formData` column has JSON with your filled fields
   - ✅ `isDraft` is `true`
   - ✅ `isComplete` is `false`
   - ✅ `lastSavedAt` has recent timestamp
   - ✅ `startedAt` has timestamp

---

## 🐛 Common Issues & Solutions

### Issue 1: Page Doesn't Load / Shows 404

**Solution:**

- Check backend is running on http://localhost:3000
- Check frontend is running on http://localhost:5173
- Verify you're logged in as Nisha
- Check browser console for errors

### Issue 2: Form Fields Don't Show

**Solution:**

- Check if order has department tracking entry
- Verify department name maps correctly (CAD → CAD_DESIGN)
- Check browser console for errors

### Issue 3: Save Button Does Nothing

**Solution:**

- Open Network tab (F12 → Network)
- Click Save Progress
- Look for POST request to `/api/workers/work/[id]/save`
- Check response status (should be 200)
- If 401: User not authenticated
- If 500: Check backend console logs

### Issue 4: Progress Bar Doesn't Update

**Solution:**

- Check that `getDepartmentRequirements()` returns data
- Verify `calculateProgress()` function executes
- Check React DevTools for formData state

### Issue 5: Data Doesn't Persist After Refresh

**Solution:**

- Verify Save Draft was successful (check toast)
- Check Network tab for GET `/api/workers/work/[id]` response
- Verify `workData` object in response has `formData`
- Check `useEffect` dependency array includes `existingWorkData`

---

## ✅ Success Criteria

Phase 7 is successful if:

1. ✅ "Continue Work" button navigates to work submission page
2. ✅ Page loads with correct order info and department
3. ✅ All 7 CAD form fields display and are editable
4. ✅ Progress bar updates in real-time as fields are filled
5. ✅ Save Draft saves data to backend successfully
6. ✅ Saved data persists after page refresh
7. ✅ Tips and Common Mistakes panels visible
8. ✅ Validation blocks submission when fields missing
9. ✅ Backend APIs respond correctly (check Network tab)
10. ✅ No console errors throughout entire workflow

---

## 📸 Screenshots to Take

1. **Initial Page Load**: Full page view with header, form, and sidebar
2. **Form with Data**: After filling several fields
3. **Progress Bar**: Showing percentage increase
4. **Save Success**: Toast notification visible
5. **Last Saved**: Timestamp in header
6. **Validation Error**: Toast showing missing fields
7. **Prisma Studio**: DepartmentWorkData table entry

---

## 🎉 What's Next?

After Phase 7 testing is complete:

1. **Phase 8**: File Upload System (real file/photo uploads)
2. **Phase 5**: Work Instructions Panel (can be added as enhancement)
3. **Phase 6**: Start Work Dialog (optional enhancement)
4. **Phase 9**: Forms for remaining 8 departments

---

## 📝 Testing Notes Template

Copy this template for your testing:

```
PHASE 7 TESTING - [Your Name] - [Date/Time]

Test Environment:
- Backend: http://localhost:3000 [ ] Running
- Frontend: http://localhost:5173 [ ] Running
- User: Nisha Sharma (CAD Worker)
- Order: ORD-2026-00001-U8M

Test Results:
[ ] Test 1: Navigation - PASS / FAIL
[ ] Test 2: Page Header - PASS / FAIL
[ ] Test 3: Form Fields - PASS / FAIL
[ ] Test 4: Progress Bar - PASS / FAIL
[ ] Test 5: File Upload UI - PASS / FAIL
[ ] Test 6: Photo Upload UI - PASS / FAIL
[ ] Test 7: Tips Panels - PASS / FAIL
[ ] Test 8: Save Draft - PASS / FAIL
[ ] Test 9: Validation - PASS / FAIL
[ ] Test 10: Complete Submit - PASS / FAIL (Limited - needs Phase 8)
[ ] Test 11: Back Navigation - PASS / FAIL
[ ] Test 12: Timestamp - PASS / FAIL
[ ] Test 13: Backend Verification - PASS / FAIL

Issues Found:
1. [Issue description]
2. [Issue description]

Notes:
- [Any additional observations]
```

---

**Happy Testing! 🚀**
