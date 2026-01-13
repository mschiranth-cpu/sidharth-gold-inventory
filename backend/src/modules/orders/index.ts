/**
 * ============================================
 * ORDERS MODULE EXPORTS
 * ============================================
 * 
 * Clean barrel exports for the orders module.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

// Routes (default export)
export { default as ordersRouter } from './orders.routes';
export { ordersRouter as router } from './orders.routes';

// Controllers
export {
  handleCreateOrder,
  handleGetOrders,
  handleGetOrderById,
  handleUpdateOrder,
  handleDeleteOrder,
  handleUploadPhoto,
  handleAddStones,
  handleGetOrderStats,
} from './orders.controller';

// Service functions
export {
  createOrder,
  getOrderById,
  getOrders,
  updateOrder,
  deleteOrder,
  addStonesToOrder,
  updateOrderPhoto,
  getOrderStats,
} from './orders.service';

// Types
export {
  // Request/Response types
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderListItemResponse,
  OrderDetailResponse,
  PaginatedResponse,
  OrderQueryParams,
  StoneInput,
  OrderDetailsInput,
  
  // Error handling
  OrderError,
  OrderErrorCode,
  
  // Role visibility
  CUSTOMER_VISIBLE_ROLES,
  
  // Department helpers
  DEPARTMENT_ORDER,
  isValidStatusTransition,
  getNextDepartment,
} from './orders.types';

// Validation schemas
export {
  createOrderSchema,
  updateOrderSchema,
  orderQuerySchema,
  stoneInputSchema,
  orderDetailsInputSchema,
  paginationSchema,
  orderFiltersSchema,
  addStonesSchema,
  photoUploadSchema,
} from './orders.validation';
