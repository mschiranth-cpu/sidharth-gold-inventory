import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env['PORT'] || '3000', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',

  // Database
  databaseUrl: process.env['DATABASE_URL'] || '',

  // JWT Configuration
  jwtSecret: process.env['JWT_SECRET'] || 'default-secret-change-me',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
  jwtRefreshSecret:
    process.env['JWT_REFRESH_SECRET'] ||
    process.env['JWT_SECRET'] ||
    'default-refresh-secret-change-me',
  jwtRefreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',

  // CORS
  corsOrigin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',

  // Logging
  logLevel: process.env['LOG_LEVEL'] || 'debug',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),

  // Security
  bcryptSaltRounds: parseInt(process.env['BCRYPT_SALT_ROUNDS'] || '12', 10),
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

export function validateEnv(): void {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0 && config.nodeEnv === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
