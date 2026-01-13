/**
 * ============================================
 * DEPARTMENT TRACKING MODULE EXPORTS
 * ============================================
 * 
 * Clean barrel exports for the department tracking module.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

// Routes (default export)
export { default as departmentsRouter } from './departments.routes';
export { departmentsRouter as router } from './departments.routes';

// Controllers
export {
  handleGetOrderDepartments,
  handleGetDepartmentTracking,
  handleStartDepartment,
  handleCompleteDepartment,
  handleAssignWorker,
  handleUploadPhotos,
  handleGetPhotoUploadUrl,
  handlePutOnHold,
  handleResumeDepartment,
} from './departments.controller';

// Service functions
export {
  getOrderDepartments,
  getDepartmentTracking,
  startDepartment,
  completeDepartment,
  assignWorker,
  uploadDepartmentPhotos,
  putDepartmentOnHold,
  resumeDepartment,
  getPhotoUploadUrl,
  initializeDepartmentTracking,
  getRecentNotifications,
} from './departments.service';

// Types
export {
  // Constants
  DEPARTMENT_ORDER,
  DEPARTMENT_DISPLAY_NAMES,
  DEPARTMENT_MANAGEMENT_ROLES,
  
  // Error handling
  DepartmentError,
  DepartmentErrorCode,
  
  // Request types
  StartDepartmentRequest,
  CompleteDepartmentRequest,
  AssignWorkerRequest,
  UploadPhotosRequest,
  PutOnHoldRequest,
  
  // Response types
  WorkerSummary,
  DepartmentTrackingResponse,
  OrderDepartmentsResponse,
  DepartmentNotification,
  
  // Helper functions
  getDepartmentSequence,
  getPreviousDepartment,
  getNextDepartment,
  isValidDepartmentStatusTransition,
  calculateDurationHours,
  canStartDepartment,
  
  // Validation schemas
  departmentNameSchema,
  startDepartmentSchema,
  completeDepartmentSchema,
  assignWorkerSchema,
  uploadPhotosSchema,
  updateNotesSchema,
  putOnHoldSchema,
} from './departments.types';
