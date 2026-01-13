/**
 * ============================================
 * SUBMISSIONS MODULE EXPORTS
 * ============================================
 * 
 * Clean barrel exports for the submissions module.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

// Routes
export { default as submissionsRouter, orderSubmissionRouter } from './submissions.routes';

// Controllers
export {
  handleCreateSubmission,
  handleGetSubmissions,
  handleGetSubmissionById,
  handleGetSubmissionByOrder,
  handleUpdateApproval,
  handleGetStats,
} from './submissions.controller';

// Service functions
export {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  getSubmissionByOrderId,
  updateCustomerApproval,
  getSubmissionStats,
  getRecentNotifications,
} from './submissions.service';

// Types
export {
  // Constants
  WEIGHT_VARIANCE_ALERT_THRESHOLD,
  QUALITY_GRADES,
  SUBMISSION_ROLES,
  NOTIFICATION_RECIPIENT_ROLES,
  
  // Error handling
  SubmissionError,
  SubmissionErrorCode,
  
  // Request types
  CreateSubmissionRequest,
  SubmissionQueryParams,
  CustomerApprovalRequest,
  
  // Response types
  WeightVariance,
  SubmitterInfo,
  OrderSummary,
  SubmissionListItem,
  SubmissionDetailResponse,
  PaginatedSubmissionsResponse,
  SubmissionNotification,
  
  // Validation schemas
  createSubmissionSchema,
  submissionQuerySchema,
  customerApprovalSchema,
  
  // Helper functions
  calculateWeightVariance,
  canSubmitOrder,
  canViewCustomerInfo,
} from './submissions.types';
