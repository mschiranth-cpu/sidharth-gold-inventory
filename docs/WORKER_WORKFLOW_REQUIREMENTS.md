# Worker Workflow System - Department Requirements

**Project**: Sidharth Gold Inventory Site  
**Version**: 1.0  
**Last Updated**: January 11, 2026

---

## 📋 Complete Department Requirements

This document defines the specific requirements for each of the 9 departments in the gold jewelry production workflow.

---

## 🎨 1. CAD Design Studio

### Required Fields

| Field             | Type     | Required | Validation                |
| ----------------- | -------- | -------- | ------------------------- |
| Design Dimensions | Text     | Yes      | Format: "L x W x H in mm" |
| Specifications    | Textarea | Yes      | Min 20 characters         |
| Work Notes        | Textarea | Yes      | Min 20 characters         |

### Required Files

- **CAD Files**: .dwg, .stl, .3dm, .stp formats
- **Max Size**: 10 MB per file
- **Max Count**: 5 files

### Required Photos

- **CAD File Renders**: Design renders from CAD software
- **Design Screenshots**: Multiple angle views
- **Max Count**: 10 photos
- **Format**: JPG, PNG

### Tips

- Ensure all measurements are accurate
- Include design variations if any
- Mark critical areas in renders
- Double-check stone placement details
- Verify gold weight calculations

### Common Mistakes

- Forgetting to save final version
- Missing stone placement details
- Incorrect gold weight calculations
- Not including all design angles

---

## 🖨️ 2. 3D Printing Lab

### Required Fields

| Field          | Type     | Required | Validation               |
| -------------- | -------- | -------- | ------------------------ |
| Print Settings | Text     | Yes      | Resolution, layer height |
| Material Used  | Dropdown | Yes      | Wax type selection       |
| Print Duration | Number   | Yes      | Minutes                  |
| Work Notes     | Textarea | Yes      | Min 20 characters        |

### Required Files

- None (uses CAD files from previous department)

### Required Photos

- **Completed Wax Model**: Multiple angles
- **Detail Shots**: Close-ups of intricate areas
- **Max Count**: 10 photos
- **Format**: JPG, PNG

### Tips

- Check model for support removal completeness
- Verify all details are visible
- Ensure no defects or bubbles
- Confirm dimensions match CAD design

### Common Mistakes

- Incomplete support removal
- Not checking for defects
- Poor surface finish
- Dimension mismatch

---

## 🔥 3. Casting Workshop

### Required Fields

| Field           | Type     | Required | Validation                 |
| --------------- | -------- | -------- | -------------------------- |
| Gold Weight IN  | Number   | Yes      | In grams, 2 decimal places |
| Gold Weight OUT | Number   | Yes      | In grams, 2 decimal places |
| Temperature     | Number   | Yes      | In °C                      |
| Casting Method  | Dropdown | Yes      | Centrifugal/Vacuum/Gravity |
| Work Notes      | Textarea | Yes      | Min 20 characters          |

### Required Files

- None

### Required Photos

- **Before Casting**: Wax model ready for casting
- **After Casting**: Cast gold piece (cleaned)
- **Max Count**: 10 photos
- **Format**: JPG, PNG

### Tips

- Verify temperature is optimal for gold type
- Record exact weights for quality control
- Check for any casting defects
- Ensure complete filling of mold

### Common Mistakes

- Incorrect temperature settings
- Not recording weights accurately
- Missing defects in inspection
- Incomplete mold filling

---

## ✨ 4. Filling & Shaping

### Required Fields

| Field            | Type     | Required | Validation                 |
| ---------------- | -------- | -------- | -------------------------- |
| Gold Weight IN   | Number   | Yes      | In grams, 2 decimal places |
| Gold Weight OUT  | Number   | Yes      | In grams, 2 decimal places |
| Areas Filled     | Textarea | Yes      | Describe areas worked on   |
| Adjustments Made | Textarea | Yes      | Detail modifications       |
| Work Notes       | Textarea | Yes      | Min 20 characters          |

### Required Files

- None

### Required Photos

- **Before Filling**: Piece before shaping work
- **After Filling**: Completed shaping
- **Max Count**: 10 photos
- **Format**: JPG, PNG

### Tips

- Document all areas that needed filling
- Note any structural adjustments
- Verify symmetry and proportions
- Check gold weight changes

### Common Mistakes

- Not documenting filled areas
- Missing asymmetry issues
- Incorrect gold weight recording
- Over-filing causing weight loss

---

## 🎨 5. Meena Artistry

### Required Fields

| Field           | Type         | Required | Validation                        |
| --------------- | ------------ | -------- | --------------------------------- |
| Colors Used     | Multi-select | Yes      | List all enamel colors            |
| Firing Cycles   | Number       | Yes      | Number of firings                 |
| Meena Technique | Dropdown     | Yes      | Cloisonné/Champlevé/Plique-à-jour |
| Work Notes      | Textarea     | Yes      | Min 20 characters                 |

### Required Files

- None

### Required Photos

- **Before Meena**: Clean piece before enamel
- **After Firing**: Completed meena work
- **Close-up Details**: Intricate enamel patterns
- **Max Count**: 15 photos (more detail needed)
- **Format**: JPG, PNG

### Tips

- Document exact colors used for consistency
- Record firing temperatures and duration
- Check for air bubbles or cracks
- Verify color depth and clarity

### Common Mistakes

- Not recording color combinations
- Insufficient firing cycles
- Missing defects (cracks, bubbles)
- Inconsistent color application

---

## ✨ 6. Primary Polish

### Required Fields

| Field              | Type     | Required | Validation                 |
| ------------------ | -------- | -------- | -------------------------- |
| Gold Weight IN     | Number   | Yes      | In grams, 2 decimal places |
| Gold Weight OUT    | Number   | Yes      | In grams, 2 decimal places |
| Polishing Compound | Text     | Yes      | Type of compound used      |
| Duration           | Number   | Yes      | In minutes                 |
| Work Notes         | Textarea | Yes      | Min 20 characters          |

### Required Files

- None

### Required Photos

- **Before Polish**: Unpolished surface
- **After Polish**: Initial polish complete
- **Max Count**: 10 photos
- **Format**: JPG, PNG

### Tips

- Use appropriate compound for gold type
- Monitor weight loss during polishing
- Ensure even polish across surface
- Check for missed areas

### Common Mistakes

- Over-polishing causing weight loss
- Uneven polish finish
- Using wrong compound
- Not checking hidden areas

---

## 💎 7. Stone Setting

### Required Fields

| Field          | Type        | Required | Validation                   |
| -------------- | ----------- | -------- | ---------------------------- |
| Stone Types    | Multi-input | Yes      | Diamond, Ruby, Emerald, etc. |
| Stone Sizes    | Text        | Yes      | Carat/mm for each stone      |
| Quantity Set   | Number      | Yes      | Total number of stones       |
| Setting Method | Dropdown    | Yes      | Prong/Bezel/Channel/Pavé     |
| Work Notes     | Textarea    | Yes      | Min 20 characters            |

### Required Files

- None

### Required Photos

- **Before Setting**: Prepared seats/prongs
- **After Setting**: All stones set
- **Detail Shots**: Close-ups of each stone
- **Max Count**: 15 photos
- **Format**: JPG, PNG

### Tips

- Verify stone quality before setting
- Ensure secure setting for each stone
- Check alignment and symmetry
- Test prong security

### Common Mistakes

- Loose stone settings
- Misaligned stones
- Damaged stones during setting
- Incorrect stone identification

---

## ✨ 8. Final Polish

### Required Fields

| Field            | Type     | Required | Validation                 |
| ---------------- | -------- | -------- | -------------------------- |
| Gold Weight IN   | Number   | Yes      | In grams, 2 decimal places |
| Gold Weight OUT  | Number   | Yes      | In grams, 2 decimal places |
| Shine Level      | Dropdown | Yes      | Excellent/Good/Fair        |
| Final Assessment | Textarea | Yes      | Quality evaluation         |
| Work Notes       | Textarea | Yes      | Min 20 characters          |

### Required Files

- None

### Required Photos

- **Final Piece - Multiple Angles**: Front, back, sides, top
- **Close-ups**: Detail shots of polished areas
- **Stone Highlights**: If stones are present
- **Max Count**: 15 photos
- **Format**: JPG, PNG

### Tips

- Achieve mirror-like finish
- Ensure no scratches or marks
- Verify stones are secure
- Check for any defects

### Common Mistakes

- Missing scratches or marks
- Uneven shine level
- Over-polishing near stones
- Not checking all angles

---

## 🎁 9. Finishing Touch

### Required Fields

| Field               | Type     | Required    | Validation         |
| ------------------- | -------- | ----------- | ------------------ |
| Rhodium Plating     | Checkbox | Conditional | If applicable      |
| Hallmark Stamped    | Checkbox | Yes         | Must be checked    |
| Quality Certificate | Text     | Yes         | Certificate number |
| Work Notes          | Textarea | Yes         | Min 20 characters  |

### Required Files

- **Quality Certificate**: PDF format
- **Max Size**: 5 MB

### Required Photos

- **Hallmark Close-up**: Clear stamp visibility
- **Packaged Piece**: Final presentation
- **Certificate Photo**: Quality certificate image
- **Max Count**: 10 photos
- **Format**: JPG, PNG

### Tips

- Ensure hallmark is clearly visible
- Verify rhodium coverage if applied
- Check packaging is pristine
- Confirm certificate details match piece

### Common Mistakes

- Unclear hallmark stamp
- Missing certificate details
- Poor packaging presentation
- Incorrect certificate information

---

## 📊 Summary Table

| Department        | Required Fields | Required Files | Required Photos | Validation Level |
| ----------------- | --------------- | -------------- | --------------- | ---------------- |
| CAD Design Studio | 3               | CAD files      | 2 types         | High             |
| 3D Printing Lab   | 4               | None           | 2 types         | Medium           |
| Casting Workshop  | 5               | None           | 2 types         | High             |
| Filling & Shaping | 5               | None           | 2 types         | High             |
| Meena Artistry    | 4               | None           | 3 types         | Very High        |
| Primary Polish    | 5               | None           | 2 types         | High             |
| Stone Setting     | 5               | None           | 3 types         | Very High        |
| Final Polish      | 5               | None           | 3 types         | Very High        |
| Finishing Touch   | 4               | Certificate    | 3 types         | Critical         |

---

## 🔐 Validation Rules

### Global Rules

- **Work Notes**: Minimum 20 characters, maximum 500 characters
- **Gold Weights**: Must be positive numbers with 2 decimal places
- **Photos**: Max 10 MB per photo, JPG/PNG only
- **Files**: Max size varies by type, see department details

### Weight Validation

- **Gold Weight OUT** should be less than or equal to **Gold Weight IN**
- Acceptable loss: Up to 2% for polishing departments
- System alerts if weight loss exceeds 2%

### Photo Requirements

- Minimum resolution: 1280x720 pixels
- Maximum file size: 10 MB per photo
- Accepted formats: JPEG, PNG
- Photos must be clear and well-lit

### File Upload Rules

- CAD files: .dwg, .stl, .3dm, .stp formats only
- Certificate: PDF format only
- All files scanned for viruses
- Files stored with unique identifiers

---

## 🎯 Department-Specific Workflows

### Auto-Cascade Behavior

When a worker completes their department work:

1. System validates all required fields
2. System checks all required photos uploaded
3. System verifies all required files uploaded
4. If validation passes:
   - Department status → COMPLETED
   - Order moves to next department automatically
   - Next available worker auto-assigned
5. If validation fails:
   - Error message shows missing items
   - Worker must complete requirements

### Multi-Department Workers (Future)

_Note: Currently workers are assigned to single department. Multi-department capability planned for future release._

---

## 📱 UI/UX Guidelines

### Checklist Display

- ✅ Green checkmark for completed items
- ⬜ Gray checkbox for pending items
- 🔴 Red icon for failed validation
- 📊 Progress bar (X/Y completed)

### Photo Upload UI

- Drag-and-drop area
- Click to browse
- Thumbnail preview
- Delete/replace buttons
- Zoom/lightbox view

### File Upload UI

- File type indicators
- Upload progress bars
- File size display
- Preview capability (PDFs, images)

### Form Validation

- Real-time validation as user types
- Clear error messages
- Highlight missing required fields
- Prevent submission until valid

---

## 🔧 Technical Specifications

### API Endpoints (Planned)

- `GET /api/workers/my-assignments` - Get worker's assigned orders
- `GET /api/departments/:orderId/requirements` - Get department requirements
- `POST /api/departments/:orderId/start` - Start work on order
- `POST /api/departments/:orderId/save-progress` - Save draft
- `POST /api/departments/:orderId/complete` - Complete and validate
- `POST /api/uploads/files` - Upload files
- `POST /api/uploads/photos` - Upload photos
- `DELETE /api/uploads/:fileId` - Delete file/photo

### Database Schema (Planned Updates)

- Add department-specific data fields to DepartmentTracking model
- Add file upload tracking tables
- Add validation rules table
- Add work progress tracking

---

## 📞 Support & Troubleshooting

### Common Issues

1. **Photo won't upload**: Check file size (max 10 MB) and format (JPG/PNG only)
2. **Can't complete work**: Ensure all required fields are filled
3. **Weight validation error**: Verify weights are accurate, check for excessive loss
4. **File format error**: Check accepted file types for your department

### Getting Help

- Check `docs/TROUBLESHOOTING.md`
- Contact factory manager
- See `docs/USER_GUIDE.md` for detailed instructions

---

_This document will be updated as requirements evolve._
