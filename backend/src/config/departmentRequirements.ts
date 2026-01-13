/**
 * ============================================
 * DEPARTMENT REQUIREMENTS CONFIGURATION
 * ============================================
 *
 * Simplified requirements for progress calculation
 * Matches the frontend department requirements
 */

interface DepartmentRequirementCounts {
  requiredFields: number;
  requiredPhotos: number;
  requiredFiles: number;
}

// Department name mapping from enum to config
const DEPARTMENT_MAP: Record<string, string> = {
  CAD: 'CAD_DESIGN',
  PRINT: '3D_PRINTING',
  CASTING: 'CASTING',
  FILLING: 'FILLING_SHAPING',
  MEENA: 'MEENA_WORK',
  POLISH_1: 'PRIMARY_POLISH',
  SETTING: 'STONE_SETTING',
  POLISH_2: 'FINAL_POLISH',
  ADDITIONAL: 'FINISHING_TOUCH',
};

// Simplified requirement counts for each department
const REQUIREMENT_COUNTS: Record<string, DepartmentRequirementCounts> = {
  CAD_DESIGN: {
    requiredFields: 6, // designSoftware, designTime, modelComplexity, stoneCount, fileFormat, designNotes
    requiredPhotos: 3, // design_preview (1), reference_comparison (1), angle_views (1)
    requiredFiles: 1, // cad_file (1)
  },
  '3D_PRINTING': {
    requiredFields: 5,
    requiredPhotos: 2,
    requiredFiles: 0,
  },
  CASTING: {
    requiredFields: 6,
    requiredPhotos: 2,
    requiredFiles: 0,
  },
  FILLING_SHAPING: {
    requiredFields: 5,
    requiredPhotos: 2,
    requiredFiles: 0,
  },
  MEENA_WORK: {
    requiredFields: 5,
    requiredPhotos: 3,
    requiredFiles: 0,
  },
  PRIMARY_POLISH: {
    requiredFields: 4,
    requiredPhotos: 2,
    requiredFiles: 0,
  },
  STONE_SETTING: {
    requiredFields: 5,
    requiredPhotos: 3,
    requiredFiles: 0,
  },
  FINAL_POLISH: {
    requiredFields: 4,
    requiredPhotos: 2,
    requiredFiles: 0,
  },
  FINISHING_TOUCH: {
    requiredFields: 4,
    requiredPhotos: 2,
    requiredFiles: 0,
  },
};

/**
 * Calculate work completion percentage for a department
 */
export function calculateDepartmentProgress(departmentName: string, workData: any): number {
  const configId = DEPARTMENT_MAP[departmentName];
  const requirements = REQUIREMENT_COUNTS[configId];

  if (!requirements || !workData) {
    return 0;
  }

  // Count completed form fields
  const formData = workData.formData || {};
  const completedFields = Object.keys(formData).filter((key) => {
    const value = formData[key];
    return value !== undefined && value !== null && value !== '';
  }).length;

  // Count uploaded photos (must meet minimum for each required category)
  const uploadedPhotos = Array.isArray(workData.uploadedPhotos)
    ? workData.uploadedPhotos.length
    : 0;

  // Count uploaded files
  const uploadedFiles = Array.isArray(workData.uploadedFiles) ? workData.uploadedFiles.length : 0;

  // Calculate completion as 3 categories (fields, photos, files)
  let completedCategories = 0;
  const totalCategories =
    (requirements.requiredFields > 0 ? 1 : 0) +
    (requirements.requiredPhotos > 0 ? 1 : 0) +
    (requirements.requiredFiles > 0 ? 1 : 0);

  // Fields category
  if (requirements.requiredFields > 0 && completedFields >= requirements.requiredFields) {
    completedCategories++;
  }

  // Photos category
  if (requirements.requiredPhotos > 0 && uploadedPhotos >= requirements.requiredPhotos) {
    completedCategories++;
  }

  // Files category
  if (requirements.requiredFiles > 0 && uploadedFiles >= requirements.requiredFiles) {
    completedCategories++;
  }

  // Return percentage
  return totalCategories > 0 ? Math.round((completedCategories / totalCategories) * 100) : 0;
}
