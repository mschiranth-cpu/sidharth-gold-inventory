/**
 * ============================================
 * DATA ENCRYPTION UTILITIES
 * ============================================
 * 
 * Provides encryption/decryption for sensitive data:
 * - AES-256-GCM encryption
 * - Field-level encryption for database
 * - Key derivation and management
 * - Secure hashing utilities
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import crypto from 'crypto';
import { securityConfig } from '../config/security.config';
import { logger } from './logger';

// ============================================
// TYPES
// ============================================

interface EncryptedData {
  iv: string;
  authTag: string;
  data: string;
  version: number;
}

interface EncryptionOptions {
  encoding?: BufferEncoding;
  associatedData?: string;
}

// ============================================
// CONSTANTS
// ============================================

const ENCRYPTION_VERSION = 1;
const KEY_ENCODING: BufferEncoding = 'hex';
const DATA_ENCODING: BufferEncoding = 'base64';

// ============================================
// KEY MANAGEMENT
// ============================================

/**
 * Derive encryption key from secret
 */
function deriveKey(secret: string, salt?: Buffer): Buffer {
  const config = securityConfig.encryption.keyDerivation;
  const actualSalt = salt || crypto.randomBytes(config.saltLength);
  
  return crypto.scryptSync(
    secret,
    actualSalt,
    config.keyLength,
    {
      N: config.cost,
      r: config.blockSize,
      p: config.parallelization,
    }
  );
}

/**
 * Get or derive encryption key
 */
function getEncryptionKey(): Buffer {
  const keyString = securityConfig.encryption.key;
  
  // If key is already 32 bytes (64 hex chars), use it directly
  if (keyString.length === 64 && /^[0-9a-fA-F]+$/.test(keyString)) {
    return Buffer.from(keyString, 'hex');
  }
  
  // If key is 32 characters, use it as-is
  if (keyString.length === 32) {
    return Buffer.from(keyString, 'utf8');
  }
  
  // Otherwise, derive a key
  const salt = crypto.createHash('sha256').update('gold-inventory-salt').digest().slice(0, 32);
  return deriveKey(keyString, salt);
}

// Cached encryption key
let encryptionKey: Buffer | null = null;

function getKey(): Buffer {
  if (!encryptionKey) {
    encryptionKey = getEncryptionKey();
  }
  return encryptionKey;
}

// ============================================
// CORE ENCRYPTION FUNCTIONS
// ============================================

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(
  plaintext: string,
  options: EncryptionOptions = {}
): string {
  if (!securityConfig.encryption.enabled) {
    return plaintext;
  }

  if (!plaintext || typeof plaintext !== 'string') {
    return plaintext;
  }

  try {
    const key = getKey();
    const iv = crypto.randomBytes(securityConfig.encryption.ivLength);
    
    const cipher = crypto.createCipheriv(
      securityConfig.encryption.algorithm as crypto.CipherGCMTypes,
      key,
      iv,
      { authTagLength: securityConfig.encryption.authTagLength }
    );

    // Add associated data if provided (for additional authentication)
    if (options.associatedData) {
      cipher.setAAD(Buffer.from(options.associatedData, 'utf8'));
    }

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    const encryptedData: EncryptedData = {
      iv: iv.toString(DATA_ENCODING),
      authTag: authTag.toString(DATA_ENCODING),
      data: encrypted.toString(DATA_ENCODING),
      version: ENCRYPTION_VERSION,
    };

    // Return as base64 encoded JSON
    return Buffer.from(JSON.stringify(encryptedData)).toString(DATA_ENCODING);
  } catch (error) {
    logger.error('Encryption error', { error });
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(
  ciphertext: string,
  options: EncryptionOptions = {}
): string {
  if (!securityConfig.encryption.enabled) {
    return ciphertext;
  }

  if (!ciphertext || typeof ciphertext !== 'string') {
    return ciphertext;
  }

  try {
    // Check if data is actually encrypted
    let encryptedData: EncryptedData;
    try {
      const decoded = Buffer.from(ciphertext, DATA_ENCODING).toString('utf8');
      encryptedData = JSON.parse(decoded);
      
      // Validate structure
      if (!encryptedData.iv || !encryptedData.authTag || !encryptedData.data) {
        // Not encrypted data, return as-is
        return ciphertext;
      }
    } catch {
      // Not encrypted data, return as-is
      return ciphertext;
    }

    const key = getKey();
    const iv = Buffer.from(encryptedData.iv, DATA_ENCODING);
    const authTag = Buffer.from(encryptedData.authTag, DATA_ENCODING);
    const encrypted = Buffer.from(encryptedData.data, DATA_ENCODING);

    const decipher = crypto.createDecipheriv(
      securityConfig.encryption.algorithm as crypto.CipherGCMTypes,
      key,
      iv,
      { authTagLength: securityConfig.encryption.authTagLength }
    );

    decipher.setAuthTag(authTag);

    // Add associated data if provided
    if (options.associatedData) {
      decipher.setAAD(Buffer.from(options.associatedData, 'utf8'));
    }

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('Decryption error', { error });
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if a string is encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  try {
    const decoded = Buffer.from(value, DATA_ENCODING).toString('utf8');
    const data = JSON.parse(decoded);
    return !!(data.iv && data.authTag && data.data && data.version);
  } catch {
    return false;
  }
}

// ============================================
// FIELD-LEVEL ENCRYPTION HELPERS
// ============================================

/**
 * Encrypt specific fields in an object
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): T {
  if (!securityConfig.encryption.enabled || !obj) return obj;

  const encrypted = { ...obj };

  for (const field of fields) {
    if (field in encrypted && encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }

  return encrypted;
}

/**
 * Decrypt specific fields in an object
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): T {
  if (!securityConfig.encryption.enabled || !obj) return obj;

  const decrypted = { ...obj };

  for (const field of fields) {
    if (field in decrypted && decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch {
        // Field might not be encrypted, keep original
      }
    }
  }

  return decrypted;
}

/**
 * Get encrypted fields for a model
 */
export function getEncryptedFieldsForModel(model: string): string[] {
  return (securityConfig.encryption.encryptedFields as Record<string, string[]>)[model] || [];
}

// ============================================
// HASHING UTILITIES
// ============================================

/**
 * Create a deterministic hash (for searching encrypted data)
 * Note: This is less secure than encryption, use for non-sensitive search
 */
export function createSearchHash(value: string): string {
  const key = getKey();
  return crypto
    .createHmac('sha256', key)
    .update(value.toLowerCase().trim())
    .digest('hex');
}

/**
 * Create a random hash/token
 */
export function createRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Create a secure hash (one-way)
 */
export function createHash(value: string, algorithm: string = 'sha256'): string {
  return crypto.createHash(algorithm).update(value).digest('hex');
}

/**
 * Constant-time string comparison (prevents timing attacks)
 */
export function secureCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  if (bufA.length !== bufB.length) return false;
  
  return crypto.timingSafeEqual(bufA, bufB);
}

// ============================================
// API KEY UTILITIES
// ============================================

/**
 * Generate a new API key
 */
export function generateApiKey(): { key: string; hash: string } {
  const keyBody = crypto.randomBytes(securityConfig.apiKeys.keyLength).toString('hex');
  const key = `${securityConfig.apiKeys.keyPrefix}${keyBody}`;
  const hash = createHash(key, securityConfig.apiKeys.hashAlgorithm);
  
  return { key, hash };
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  const keyHash = createHash(key, securityConfig.apiKeys.hashAlgorithm);
  return secureCompare(keyHash, hash);
}

// ============================================
// PRISMA MIDDLEWARE HELPER
// ============================================

/**
 * Create Prisma middleware for automatic field encryption
 * Use with: prisma.$use(createEncryptionMiddleware())
 */
export function createPrismaEncryptionMiddleware() {
  return async (params: any, next: (params: any) => Promise<any>) => {
    const encryptedFields = getEncryptedFieldsForModel(params.model?.toLowerCase() || '');
    
    if (encryptedFields.length === 0) {
      return next(params);
    }

    // Encrypt on create/update
    if (['create', 'update', 'upsert', 'createMany', 'updateMany'].includes(params.action)) {
      if (params.args.data) {
        params.args.data = encryptFields(params.args.data, encryptedFields);
      }
    }

    const result = await next(params);

    // Decrypt on read
    if (['findUnique', 'findFirst', 'findMany'].includes(params.action)) {
      if (Array.isArray(result)) {
        return result.map(item => decryptFields(item, encryptedFields));
      } else if (result) {
        return decryptFields(result, encryptedFields);
      }
    }

    return result;
  };
}

// ============================================
// RE-ENCRYPTION UTILITY
// ============================================

/**
 * Re-encrypt data with a new key (for key rotation)
 */
export async function reEncryptWithNewKey(
  oldCiphertext: string,
  oldKey: Buffer,
  newKey: Buffer
): Promise<string> {
  // Temporarily swap keys
  const originalKey = encryptionKey;
  
  // Decrypt with old key
  encryptionKey = oldKey;
  const plaintext = decrypt(oldCiphertext);
  
  // Encrypt with new key
  encryptionKey = newKey;
  const newCiphertext = encrypt(plaintext);
  
  // Restore original key
  encryptionKey = originalKey;
  
  return newCiphertext;
}

// ============================================
// EXPORTS
// ============================================

export default {
  encrypt,
  decrypt,
  isEncrypted,
  encryptFields,
  decryptFields,
  getEncryptedFieldsForModel,
  createSearchHash,
  createRandomToken,
  createHash,
  secureCompare,
  generateApiKey,
  verifyApiKey,
  createPrismaEncryptionMiddleware,
};
