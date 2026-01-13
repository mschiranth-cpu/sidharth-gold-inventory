/**
 * ============================================
 * DEPARTMENT FEATURE FLAGS
 * ============================================
 *
 * Centralized feature flag management for departments.
 * Allows admins to enable/disable department features.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

export interface DepartmentFeatureFlag {
  departmentId: string;
  isEnabled: boolean;
  enabledAt?: string;
  enabledBy?: string;
}

// Local storage key for feature flags
const FEATURE_FLAGS_KEY = 'department_feature_flags';

/**
 * Get all department feature flags from local storage
 */
export const getDepartmentFeatureFlags = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(FEATURE_FLAGS_KEY);
    if (!stored) {
      return getDefaultFeatureFlags();
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading feature flags:', error);
    return getDefaultFeatureFlags();
  }
};

/**
 * Get default feature flags (all enabled except those marked as coming soon)
 */
const getDefaultFeatureFlags = (): Record<string, boolean> => {
  return {
    CAD_DESIGN: true,
    '3D_PRINTING': false, // Coming soon by default
    CASTING: true,
    FILLING_SHAPING: true,
    MEENA_WORK: true,
    PRIMARY_POLISH: true,
    STONE_SETTING: true,
    FINAL_POLISH: true,
    FINISHING_TOUCH: true,
  };
};

/**
 * Check if a department feature is enabled
 */
export const isDepartmentEnabled = (departmentId: string): boolean => {
  const flags = getDepartmentFeatureFlags();
  return flags[departmentId] ?? true; // Default to enabled if not found
};

/**
 * Enable a department feature
 */
export const enableDepartment = (departmentId: string): void => {
  const flags = getDepartmentFeatureFlags();
  flags[departmentId] = true;
  localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(flags));

  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('departmentFlagsChanged', { detail: flags }));
};

/**
 * Disable a department feature
 */
export const disableDepartment = (departmentId: string): void => {
  const flags = getDepartmentFeatureFlags();
  flags[departmentId] = false;
  localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(flags));

  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('departmentFlagsChanged', { detail: flags }));
};

/**
 * Toggle a department feature
 */
export const toggleDepartment = (departmentId: string): boolean => {
  const flags = getDepartmentFeatureFlags();
  const newState = !flags[departmentId];
  flags[departmentId] = newState;
  localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(flags));

  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('departmentFlagsChanged', { detail: flags }));

  return newState;
};

/**
 * Reset all feature flags to defaults
 */
export const resetFeatureFlags = (): void => {
  const defaults = getDefaultFeatureFlags();
  localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(defaults));

  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('departmentFlagsChanged', { detail: defaults }));
};
