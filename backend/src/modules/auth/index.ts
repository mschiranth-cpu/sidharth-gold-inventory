/**
 * ============================================
 * AUTH MODULE INDEX
 * ============================================
 * 
 * Central export point for authentication module.
 * Provides easy access to all auth-related components.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

// ============================================
// ROUTES
// ============================================

export { default as authRoutes } from './auth.routes';

// ============================================
// CONTROLLERS
// ============================================

export {
  login,
  register,
  refreshToken,
  logout,
  getCurrentUser,
  handleChangePassword,
  getPasswordRequirements,
  handleValidatePassword,
} from './auth.controller';

// ============================================
// MIDDLEWARE
// ============================================

export {
  authenticate,
  optionalAuth,
  requireRoles,
  requirePermissions,
  requireAnyPermission,
  requireOwnershipOrAdmin,
  loginRateLimiter,
  createRateLimiter,
  verifyActiveUser,
  hasPermission,
  getPermissionsForRole,
  isAdmin,
  hasFactoryAccess,
} from './auth.middleware';

// ============================================
// SERVICES
// ============================================

export {
  // Password utilities
  validatePassword,
  hashPassword,
  comparePassword,
  PASSWORD_REQUIREMENTS,
  
  // Token utilities
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  
  // Token storage
  storeRefreshToken,
  getStoredRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  rotateRefreshToken,
  
  // Rate limiting
  checkRateLimit,
  recordLoginAttempt,
  RATE_LIMIT_CONFIG,
  
  // User operations
  authenticateUser,
  registerUser,
  refreshTokens,
  logoutUser,
  changePassword,
  getUserById,
  toAuthUserData,
  
  // Cleanup
  cleanupExpiredData,
} from './auth.service';

// ============================================
// TYPES
// ============================================

export {
  // Enums
  UserRole,
  AuthErrorCode,
  
  // JWT Payloads
  AccessTokenPayload,
  RefreshTokenPayload,
  
  // Request types
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  LogoutRequest,
  PasswordResetRequest,
  ChangePasswordRequest,
  
  // Response types
  AuthUserData,
  TokenPair,
  LoginResponse,
  RegisterResponse,
  RefreshResponse,
  LogoutResponse,
  
  // Extended Express types
  AuthenticatedRequest,
  OptionalAuthRequest,
  
  // Validation types
  PasswordValidationResult,
  PasswordRequirements,
  
  // Rate limiting types
  RateLimitInfo,
  RateLimitConfig,
  
  // Storage types
  StoredRefreshToken,
  SessionInfo,
  
  // Permission types
  Permission,
  ROLE_PERMISSIONS,
  
  // Token types
  TokenType,
  
  // Error class
  AuthError,
} from './auth.types';
