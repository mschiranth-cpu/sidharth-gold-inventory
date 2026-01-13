/**
 * ============================================
 * SECURITY CONFIGURATION
 * ============================================
 *
 * Central configuration for all security measures:
 * - Helmet security headers
 * - CORS configuration
 * - CSRF protection
 * - Rate limiting & brute force protection
 * - Input sanitization
 * - Data encryption
 * - Audit logging
 * - File upload security
 * - Authentication security
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import dotenv from 'dotenv';
dotenv.config();

// ============================================
// ENVIRONMENT HELPERS
// ============================================

const isProduction = process.env['NODE_ENV'] === 'production';

// ============================================
// SECURITY CONFIGURATION OBJECT
// ============================================

export const securityConfig = {
  // ============================================
  // HELMET SECURITY HEADERS
  // ============================================
  helmet: {
    // Content Security Policy
    contentSecurityPolicy: {
      enabled: isProduction,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", process.env['API_URL'] || 'http://localhost:3000'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin' as const,
    },
    // Other headers
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
    frameguard: { action: 'deny' as const },
    crossOriginEmbedderPolicy: false, // Disabled for compatibility
    crossOriginResourcePolicy: { policy: 'same-origin' as const },
    crossOriginOpenerPolicy: { policy: 'same-origin' as const },
    dnsPrefetchControl: { allow: false },
    ieNoOpen: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' as const },
  },

  // ============================================
  // CORS CONFIGURATION
  // ============================================
  cors: {
    // Allowed origins (whitelist)
    allowedOrigins: (
      process.env['CORS_ALLOWED_ORIGINS'] ||
      'http://localhost:5173,http://localhost:4173,http://localhost:3000'
    )
      .split(',')
      .map((origin) => origin.trim()),

    // Allowed methods
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Allowed headers
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-API-Key',
      'Accept',
      'Origin',
    ],

    // Exposed headers (accessible to client)
    exposedHeaders: [
      'X-Total-Count',
      'X-Page',
      'X-Page-Size',
      'X-CSRF-Token',
      'Content-Disposition',
    ],

    // Allow credentials (cookies, auth headers)
    credentials: true,

    // Preflight cache duration
    maxAge: 86400, // 24 hours

    // Options success status (for legacy browsers)
    optionsSuccessStatus: 204,
  },

  // ============================================
  // CSRF PROTECTION
  // ============================================
  csrf: {
    enabled: process.env['CSRF_ENABLED'] !== 'false',

    // Cookie settings for CSRF token
    cookie: {
      name: '_csrf',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      maxAge: 3600000, // 1 hour
      path: '/',
    },

    // Header name for CSRF token
    headerName: 'X-CSRF-Token',

    // Methods that require CSRF validation
    protectedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

    // Paths excluded from CSRF (e.g., webhooks)
    excludePaths: ['/api/webhooks', '/api/health', '/health'],

    // Token length in bytes
    tokenLength: 32,

    // Secret key for CSRF token generation
    secret: process.env['CSRF_SECRET'] || process.env['JWT_SECRET'] || 'csrf-secret-change-me',
  },

  // ============================================
  // RATE LIMITING & BRUTE FORCE PROTECTION
  // ============================================
  rateLimiting: {
    enabled: process.env['RATE_LIMIT_ENABLED'] !== 'false',

    // Global rate limit
    global: {
      windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
      max: parseInt(process.env['RATE_LIMIT_MAX'] || '1000', 10),
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    },

    // API endpoint rate limit
    api: {
      windowMs: 60000, // 1 minute
      max: 100,
      message: 'Too many API requests, please slow down.',
    },

    // Auth endpoints rate limit
    auth: {
      windowMs: 900000, // 15 minutes
      max: 20,
      message: 'Too many authentication attempts, please try again later.',
    },

    // Upload rate limit
    upload: {
      windowMs: 3600000, // 1 hour
      max: 20,
      message: 'Too many uploads, please try again later.',
    },

    // Strict rate limit for sensitive operations
    strict: {
      windowMs: 3600000, // 1 hour
      max: 5,
      message: 'Too many attempts for this sensitive operation.',
    },
  },

  // ============================================
  // BRUTE FORCE PROTECTION (LOGIN)
  // ============================================
  bruteForce: {
    enabled: process.env['BRUTE_FORCE_ENABLED'] !== 'false',

    // Maximum login attempts before lockout
    maxAttempts: parseInt(process.env['LOGIN_MAX_ATTEMPTS'] || '5', 10),

    // Lockout duration in milliseconds (15 minutes)
    lockoutDuration: parseInt(process.env['LOGIN_LOCKOUT_DURATION'] || '900000', 10),

    // Window for counting attempts (15 minutes)
    attemptWindow: parseInt(process.env['LOGIN_ATTEMPT_WINDOW'] || '900000', 10),

    // Progressive delays (ms) after each failed attempt
    progressiveDelays: [0, 1000, 2000, 4000, 8000],

    // Track by IP or email
    trackBy: 'both' as 'ip' | 'email' | 'both',

    // Redis key prefix for tracking
    keyPrefix: 'brute_force:',

    // Notify admin after X failed attempts
    notifyAdminAfter: 10,

    // Whitelist IPs (skip brute force check)
    whitelistIPs: (process.env['BRUTE_FORCE_WHITELIST_IPS'] || '')
      .split(',')
      .filter((ip) => ip.trim()),
  },

  // ============================================
  // INPUT SANITIZATION
  // ============================================
  sanitization: {
    enabled: true,

    // XSS protection settings
    xss: {
      enabled: true,
      stripTags: true,
      whitelistTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
      encodeEntities: true,
    },

    // SQL injection protection
    sqlInjection: {
      enabled: true,
      // Patterns to detect SQL injection
      patterns: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/gi,
        /(--|\#|\/\*|\*\/)/g,
        /(\bOR\b|\bAND\b).*?[=<>]/gi,
        /'.*?'/g,
        /;.*?(SELECT|INSERT|UPDATE|DELETE)/gi,
      ],
    },

    // NoSQL injection protection
    noSqlInjection: {
      enabled: true,
      // Block MongoDB operators in input
      blockedPatterns: [
        '$gt',
        '$gte',
        '$lt',
        '$lte',
        '$ne',
        '$in',
        '$nin',
        '$or',
        '$and',
        '$not',
        '$regex',
        '$where',
      ],
    },

    // Path traversal protection
    pathTraversal: {
      enabled: true,
      patterns: [/\.\./g, /\.\//g, /\/\./g],
    },

    // Field length limits
    fieldLimits: {
      default: 1000,
      email: 254,
      password: 128,
      name: 100,
      description: 5000,
      notes: 10000,
      // Image fields need to store base64 data URLs which can be very large
      productPhotoUrl: 10000000, // 10MB max
      referenceImages: 10000000, // 10MB max per image
      completionPhotos: 10000000, // 10MB max per photo
      photos: 10000000, // 10MB max per photo
      avatar: 10000000, // 10MB max
      certificateUrl: 10000000, // 10MB max
      cadFiles: 10000000, // 10MB max
    },
  },

  // ============================================
  // DATA ENCRYPTION
  // ============================================
  encryption: {
    enabled: process.env['ENCRYPTION_ENABLED'] !== 'false',

    // Encryption algorithm
    algorithm: 'aes-256-gcm',

    // Encryption key (must be 32 bytes for AES-256)
    key:
      process.env['ENCRYPTION_KEY'] ||
      process.env['JWT_SECRET']?.substring(0, 32) ||
      'encryption-key-must-be-32-bytes!',

    // IV length in bytes
    ivLength: 16,

    // Auth tag length for GCM
    authTagLength: 16,

    // Fields to encrypt in database
    encryptedFields: {
      orders: ['customerName', 'customerPhone', 'customerAddress'],
      users: ['phoneNumber'],
    },

    // Key derivation settings
    keyDerivation: {
      algorithm: 'scrypt',
      saltLength: 32,
      keyLength: 32,
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
    },
  },

  // ============================================
  // AUDIT LOGGING
  // ============================================
  auditLog: {
    enabled: process.env['AUDIT_LOG_ENABLED'] !== 'false',

    // Events to log
    events: {
      authentication: true,
      authorization: true,
      dataCreate: true,
      dataUpdate: true,
      dataDelete: true,
      fileUpload: true,
      configChange: true,
      securityEvent: true,
    },

    // Fields to log
    logFields: [
      'userId',
      'action',
      'resource',
      'resourceId',
      'changes',
      'ip',
      'userAgent',
      'timestamp',
    ],

    // Sensitive fields to mask in logs
    maskedFields: ['password', 'token', 'refreshToken', 'apiKey', 'secret', 'creditCard'],

    // Log retention (days)
    retentionDays: parseInt(process.env['AUDIT_LOG_RETENTION_DAYS'] || '90', 10),

    // Store in database or file
    storage: (process.env['AUDIT_LOG_STORAGE'] || 'database') as 'database' | 'file' | 'both',

    // File path for file storage
    filePath: process.env['AUDIT_LOG_PATH'] || './logs/audit.log',

    // Max file size before rotation (10MB)
    maxFileSize: 10 * 1024 * 1024,
  },

  // ============================================
  // FILE UPLOAD SECURITY
  // ============================================
  fileUpload: {
    enabled: true,

    // Maximum file size (10MB)
    maxSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10),

    // Allowed MIME types
    allowedMimeTypes: [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // CAD file MIME types
      'model/stl',
      'application/sla',
      'application/vnd.ms-pki.stl',
      'model/obj',
      'model/3dm',
      'application/x-3dm',
      'application/step',
      'application/x-step',
      'model/step',
      'model/iges',
      'application/iges',
      'application/x-iges',
      'image/vnd.dwg',
      'application/dwg',
      'application/x-dwg',
      'image/x-dwg',
      'application/dxf',
      'image/vnd.dxf',
      'image/x-dxf',
      'application/x-dxf',
      'model/vnd.dwf',
      'application/dwf',
      'x-drawing/dwf',
      'model/vnd.collada+xml',
      'model/gltf+json',
      'model/gltf-binary',
      'application/octet-stream', // Generic binary for various CAD formats
      'model/mesh',
      'model/vrml',
      'x-world/x-vrml',
      'application/x-tgif',
      'model/x3d+xml',
      'model/x3d+binary',
    ],

    // Allowed file extensions
    allowedExtensions: [
      // Images
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.svg',
      // Documents
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      // CAD file extensions - Comprehensive list for jewelry design
      '.stl', // Stereolithography (most common for 3D printing)
      '.obj', // Wavefront Object (widely supported)
      '.3dm', // Rhino 3D (popular for jewelry CAD)
      '.step', // STEP format (ISO standard)
      '.stp', // STEP format (alternate extension)
      '.iges', // IGES format (ISO standard)
      '.igs', // IGES format (alternate extension)
      '.dwg', // AutoCAD Drawing
      '.dwf', // Autodesk Design Web Format
      '.dxf', // Drawing Exchange Format (2D)
      '.fbx', // Autodesk Filmbox (3D interchange)
      '.3ds', // 3D Studio Max
      '.blend', // Blender
      '.ply', // Polygon File Format
      '.dae', // COLLADA (XML-based)
      '.glb', // GL Transmission Format (binary)
      '.gltf', // GL Transmission Format (JSON)
      '.x3d', // Extensible 3D
      '.wrl', // VRML (Virtual Reality Modeling Language)
      '.amf', // Additive Manufacturing File Format
      '.3mf', // 3D Manufacturing Format
      '.ipt', // Autodesk Inventor Part
      '.iam', // Autodesk Inventor Assembly
      '.prt', // Various CAD Part files
      '.asm', // Various CAD Assembly files
      '.sldprt', // SolidWorks Part
      '.sldasm', // SolidWorks Assembly
    ],

    // Maximum filename length
    maxFilenameLength: 255,

    // Sanitize filename
    sanitizeFilename: true,

    // Generate random filename
    randomFilename: true,

    // Upload directory
    uploadDir: process.env['UPLOAD_DIR'] || './uploads',

    // Temporary directory for processing
    tempDir: process.env['TEMP_UPLOAD_DIR'] || './uploads/temp',

    // Malware scanning
    malwareScan: {
      enabled: process.env['MALWARE_SCAN_ENABLED'] === 'true',
      // ClamAV settings (if using ClamAV)
      clamav: {
        host: process.env['CLAMAV_HOST'] || 'localhost',
        port: parseInt(process.env['CLAMAV_PORT'] || '3310', 10),
        timeout: 60000,
      },
    },

    // Image validation
    imageValidation: {
      enabled: true,
      maxWidth: 4096,
      maxHeight: 4096,
      minWidth: 10,
      minHeight: 10,
    },

    // Magic number validation (file signature)
    magicNumberValidation: true,
  },

  // ============================================
  // AUTHENTICATION SECURITY
  // ============================================
  authentication: {
    // Password requirements
    password: {
      minLength: parseInt(process.env['PASSWORD_MIN_LENGTH'] || '8', 10),
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      preventCommonPasswords: true,
      preventUserInfoInPassword: true,
      historyCount: 5, // Prevent reuse of last N passwords
    },

    // JWT settings
    jwt: {
      accessToken: {
        expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
        algorithm: 'HS256' as const,
      },
      refreshToken: {
        expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
        rotateOnUse: true, // Rotate refresh token on each use
      },
    },

    // Cookie settings for refresh tokens
    cookies: {
      refreshToken: {
        name: 'refreshToken',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict' as const,
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      accessToken: {
        name: 'accessToken',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 15 * 60 * 1000, // 15 minutes
      },
    },

    // Token blacklist (for logout)
    tokenBlacklist: {
      enabled: true,
      storage: 'redis' as 'redis' | 'memory',
      cleanupInterval: 3600000, // 1 hour
    },

    // Two-factor authentication
    twoFactor: {
      enabled: process.env['TWO_FACTOR_ENABLED'] === 'true',
      issuer: process.env['TWO_FACTOR_ISSUER'] || 'Gold Inventory System',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      window: 1, // Allow 1 period before/after for clock drift
      // Backup codes
      backupCodes: {
        count: 10,
        length: 8,
      },
    },

    // Session settings
    session: {
      maxConcurrentSessions: 5,
      idleTimeout: 30 * 60 * 1000, // 30 minutes
      absoluteTimeout: 24 * 60 * 60 * 1000, // 24 hours
    },
  },

  // ============================================
  // API KEY AUTHENTICATION
  // ============================================
  apiKeys: {
    enabled: process.env['API_KEYS_ENABLED'] === 'true',

    // Header name for API key
    headerName: 'X-API-Key',

    // Key prefix for validation
    keyPrefix: 'gis_',

    // Key length (excluding prefix)
    keyLength: 32,

    // Hash algorithm for storing keys
    hashAlgorithm: 'sha256',

    // Rate limiting for API key usage
    rateLimit: {
      windowMs: 60000, // 1 minute
      max: 1000,
    },

    // Scopes/permissions for API keys
    defaultScopes: ['read'],
    availableScopes: ['read', 'write', 'admin', 'reports'],
  },

  // ============================================
  // REQUEST SECURITY
  // ============================================
  request: {
    // Request body size limits
    bodyLimit: {
      json: '10mb',
      urlencoded: '10mb',
      raw: '50mb',
    },

    // Request timeout (30 seconds)
    timeout: parseInt(process.env['REQUEST_TIMEOUT'] || '30000', 10),

    // Slow request threshold for logging
    slowRequestThreshold: parseInt(process.env['SLOW_REQUEST_THRESHOLD'] || '5000', 10),

    // Parameter pollution protection
    parameterPollution: {
      enabled: true,
      whitelist: ['sort', 'filter', 'fields'],
    },
  },

  // ============================================
  // ERROR HANDLING
  // ============================================
  errors: {
    // Hide stack traces in production
    exposeStackTrace: !isProduction,

    // Hide internal error details in production
    exposeInternalErrors: !isProduction,

    // Generic error messages for production
    genericMessage: 'An error occurred. Please try again later.',

    // Error codes to expose
    exposedErrorCodes: ['VALIDATION_ERROR', 'AUTH_ERROR', 'NOT_FOUND', 'FORBIDDEN'],
  },
};

// ============================================
// COMMON PASSWORDS LIST (Top 100)
// ============================================

export const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'monkey',
  '1234567',
  'letmein',
  'trustno1',
  'dragon',
  'baseball',
  'iloveyou',
  'master',
  'sunshine',
  'ashley',
  'bailey',
  'shadow',
  '123123',
  '654321',
  'superman',
  'qazwsx',
  'michael',
  'football',
  'password1',
  'password123',
  'batman',
  'login',
  'admin',
  'welcome',
  'welcome1',
  'welcome123',
  'passw0rd',
  '1234567890',
  'password!',
  'hello',
  'charlie',
  'donald',
  'qwertyuiop',
  '121212',
  '000000',
  'starwars',
  'master123',
  'hello123',
  'freedom',
  'whatever',
  'qazwsxedc',
  'mustang',
  'access',
  'maggie',
  'princess',
  'joshua',
  'michelle',
  'nicole',
  'cheese',
  'daniel',
  'mercedes',
  'yankees',
  'dallas',
  'austin',
  'hunter',
  'tigger',
  'harley',
  'ranger',
  'pepper',
  'jordan',
  'taylor',
  'buster',
  'soccer',
  'hockey',
  'george',
  'andrew',
  'hannah',
  'amanda',
  'samantha',
  'summer',
  'ginger',
  'bailey',
  'abcdef',
  'qwe123',
  'password2',
  'pass123',
  '12345',
  '111111',
  '1234',
  'test',
  'guest',
  'root',
  'administrator',
]);

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate environment configuration
 */
export function validateSecurityConfig(): string[] {
  const errors: string[] = [];

  // Check encryption key length
  if (securityConfig.encryption.enabled && securityConfig.encryption.key.length < 32) {
    errors.push('ENCRYPTION_KEY must be at least 32 characters');
  }

  // Check CSRF secret
  if (securityConfig.csrf.enabled && securityConfig.csrf.secret === 'csrf-secret-change-me') {
    if (isProduction) {
      errors.push('CSRF_SECRET must be set in production');
    }
  }

  // Check allowed origins
  if (isProduction && securityConfig.cors.allowedOrigins.includes('http://localhost:5173')) {
    errors.push('Remove localhost from CORS_ALLOWED_ORIGINS in production');
  }

  return errors;
}

export default securityConfig;
