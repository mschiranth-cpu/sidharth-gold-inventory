# Worker Workflow Testing Guide

**Date**: January 12, 2026  
**Status**: Ready for Testing  
**Goal**: Test complete workflow from CAD → PRINT → CASTING → ... → FINISHING

---

## Test Prerequisites

1. ✅ Backend server running on port 3000
2. ✅ Frontend server running on port 5173
3. ✅ Department requirements config complete (all 9 departments)
4. ✅ Department name mapping updated in WorkSubmissionPage and CurrentAssignmentsCard

---

## Test Plan

### Test 1: Create New Order for Complete Workflow

**Steps:**

1. Login as Admin or Office Staff
2. Create a new order with:
   - Product Type: Ring/Necklace/Pendant
   - Metal Type: 22K Gold
   - Priority: Normal or High
   - Due Date: 2 weeks from now
3. Navigate to Factory Tracking
4. Assign order to CAD department and assign to a worker (e.g., Nisha)

**Expected Result:**

- Order appears in CAD column
- Worker receives assignment

---

### Test 2: CAD Department Workflow

**Steps:**

1. Login as CAD worker (Nisha)
2. Check Dashboard - should show toast notification "X assignments waiting"
3. Navigate to My Work page
4. Verify Current Assignments Card shows:
   - Order details
   - "Start Work" or "Continue Work" button
   - Checklist showing: 0/7 fields, 0/4 photos, 0/2 files
5. Click "Continue Work" or "Start Work"
6. Fill CAD form with all required fields:
   - Design Software Used: Select option
   - Design Complexity: Select option
   - Design File Names: Enter text
   - Number of Components: Enter number
   - Modification Notes: Enter text
   - Design Approval Status: Select option
   - Special Features: Enter text
7. Upload 4 required photos:
   - Top View Render
   - Side View Render
   - Perspective View
   - Detail Shot
8. Upload 2 required files:
   - 3D Model File (.stl, .obj, .3dm)
   - Technical Drawing (.pdf, .dwg)
9. Click "Save Draft" - verify success message
10. Refresh page - verify all data persists
11. Click "Complete & Submit"

**Expected Result:**

- Form validates all required fields
- Work status changes to COMPLETED
- Order auto-cascades to PRINT department
- CAD worker no longer sees order in My Work
- Activity log created

---

### Test 3: 3D Printing Lab Workflow

**Steps:**

1. Login as Admin/Manager
2. Navigate to Factory Tracking
3. Assign PRINT department to a worker
4. Login as PRINT worker
5. Navigate to My Work
6. Click "Continue Work"
7. Verify PRINT form shows with fields:
   - Printer Model: Select option
   - Material Type: Select option
   - Layer Height: Enter number
   - Total Print Time: Enter number
   - Support Structure: Select option
   - Post-Processing Steps: Enter text
   - Quality Check Passed: Checkbox
8. Upload 2 required photos:
   - Printed Model (2-4 photos)
   - Detail Shots (1-3 photos)
9. Upload optional file:
   - Print Settings File (.form, .config, .pdf)
10. Save Draft and verify persistence
11. Complete & Submit

**Expected Result:**

- PRINT form renders correctly with all fields
- Photos upload successfully
- Work completes and cascades to CASTING
- Files visible in Order Detail Files tab under "3D Printing Lab" department

---

### Test 4: Casting Workshop Workflow

**Steps:**

1. Assign CASTING to worker
2. Login as CASTING worker
3. Complete CASTING form with fields:
   - Metal Type: Select option
   - Metal Weight Used: Enter number
   - Investment Type: Select option
   - Burnout Temperature: Enter number
   - Casting Temperature: Enter number
   - Casting Pressure: Enter number
   - Flask Size: Enter text
   - Casting Method: Select option
   - Quality Check Passed: Checkbox
4. Upload 2 required photos:
   - Before Casting
   - After Casting
5. Complete & Submit

**Expected Result:**

- CASTING form renders correctly
- Work completes and cascades to FILLING department

---

### Test 5: Remaining Departments

**Test each department in sequence:**

1. FILLING (Filling & Shaping)
2. MEENA (Meena Artistry)
3. POLISH_1 (Primary Polish)
4. SETTING (Stone Setting)
5. POLISH_2 (Final Polish)
6. ADDITIONAL (Finishing Touch)

**For each department:**

- Verify form renders with correct fields
- Upload required photos
- Upload required files (if any)
- Save Draft and test persistence
- Complete & Submit and verify cascade

---

## Test 6: Cross-Department Features

**Test Features:**

1. **Files Tab in Order Detail**

   - Verify all uploaded files visible
   - Verify department sub-filter works
   - Verify color-coded badges
   - Verify human-readable labels
   - Verify uploader info displayed

2. **Activity Log**

   - Verify activity entries created for each department completion
   - Verify timestamps accurate

3. **Progress Tracking**

   - Verify progress bar in Work Submission Page
   - Verify checklist in Current Assignments Card
   - Verify completion percentages

4. **Worker Dashboard**
   - Verify metrics update (completed today, this week, this month)
   - Verify recent activity shows work completions

---

## Known Issues to Watch For

1. **Department Name Mapping**

   - Ensure backend enum (CAD, PRINT, etc.) maps correctly to config IDs (CAD_DESIGN, 3D_PRINTING, etc.)

2. **Photo/File Upload**

   - Ensure base64 URLs work for photos
   - Ensure file uploads save to correct directory
   - Ensure file size estimates work

3. **Auto-Cascade**

   - Ensure next department assigned correctly
   - Ensure worker receives assignment notification

4. **Validation**
   - Ensure all required fields checked before submission
   - Ensure minimum photo counts enforced

---

## Success Criteria

✅ All 9 department forms render correctly  
✅ All fields, photos, files upload successfully  
✅ Save Draft persists data  
✅ Complete & Submit validates and cascades  
✅ Files Tab shows all files with proper categorization  
✅ Activity log tracks all completions  
✅ Worker dashboard updates correctly  
✅ No console errors  
✅ No database errors

---

## Next Steps After Testing

1. Document any bugs found
2. Fix critical issues
3. Add Phase 5: Work Instructions Panel (optional enhancement)
4. Add Phase 6: Start Work API (optional enhancement)
5. Phase 11: Auto-save every 2 minutes
6. Phase 12: Enhanced UX (photo gallery, zoom, etc.)
7. Phase 13: Admin quality control features
8. Phase 14: Comprehensive testing with real workers
9. Phase 15: Documentation and training materials

---

**Tester**: ********\_********  
**Date Tested**: ********\_********  
**Results**: ********\_********
