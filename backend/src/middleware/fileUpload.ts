/**
 * ============================================
 * SECURE FILE UPLOAD MIDDLEWARE
 * ============================================
 * 
 * Comprehensive file upload security:
 * - File type validation (MIME + extension + magic numbers)
 * - File size limits
 * - Filename sanitization
 * - Malware scanning integration
 * - Image dimension validation
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { securityConfig } from '../config/security.config';
import { logger } from '../utils/logger';
import { logFileOperation, AuditAction } from '../utils/auditLog';

// ============================================
// TYPES
// ============================================

interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

interface MagicNumber {
  mime: string;
  signature: number[];
  offset?: number;
}

// ============================================
// MAGIC NUMBERS (FILE SIGNATURES)
// ============================================

const MAGIC_NUMBERS: MagicNumber[] = [
  // Images
  { mime: 'image/jpeg', signature: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: 'image/gif', signature: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF....WEBP
  
  // Documents
  { mime: 'application/pdf', signature: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { 
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    signature: [0x50, 0x4B, 0x03, 0x04] // PK (ZIP-based)
  },
  { 
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    signature: [0x50, 0x4B, 0x03, 0x04] // PK (ZIP-based)
  },
  { mime: 'application/msword', signature: [0xD0, 0xCF, 0x11, 0xE0] }, // DOC
  { mime: 'application/vnd.ms-excel', signature: [0xD0, 0xCF, 0x11, 0xE0] }, // XLS
];

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove path components
  let sanitized = path.basename(filename);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove/replace dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '_');
  
  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '');
  
  // Limit length
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);
  const maxNameLength = securityConfig.fileUpload.maxFilenameLength - ext.length;
  
  if (name.length > maxNameLength) {
    sanitized = name.substring(0, maxNameLength) + ext;
  }
  
  // If filename is empty or only extension, generate random name
  if (!name || name.trim() === '') {
    sanitized = `file_${Date.now()}${ext}`;
  }
  
  return sanitized;
}

/**
 * Generate random filename
 */
function generateRandomFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const randomPart = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}_${randomPart}${ext}`;
}

/**
 * Validate file extension
 */
function validateExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return securityConfig.fileUpload.allowedExtensions.includes(ext);
}

/**
 * Validate MIME type
 */
function validateMimeType(mimeType: string): boolean {
  return securityConfig.fileUpload.allowedMimeTypes.includes(mimeType);
}

/**
 * Validate file signature (magic numbers)
 */
async function validateMagicNumber(filepath: string, expectedMime: string): Promise<boolean> {
  if (!securityConfig.fileUpload.magicNumberValidation) {
    return true;
  }

  try {
    const fileHandle = await fs.open(filepath, 'r');
    const buffer = Buffer.alloc(16);
    await fileHandle.read(buffer, 0, 16, 0);
    await fileHandle.close();

    // Find matching magic number for expected MIME type
    const matchingMagic = MAGIC_NUMBERS.filter(m => 
      m.mime === expectedMime || 
      (expectedMime.startsWith('application/vnd.openxmlformats') && m.signature[0] === 0x50)
    );

    if (matchingMagic.length === 0) {
      // No magic number defined for this type, allow
      return true;
    }

    // Check if file matches any valid signature
    return matchingMagic.some(magic => {
      const offset = magic.offset || 0;
      return magic.signature.every((byte, index) => buffer[offset + index] === byte);
    });
  } catch (error) {
    logger.error('Magic number validation error', { error, filepath });
    return false;
  }
}

/**
 * Validate image dimensions
 */
async function validateImageDimensions(filepath: string): Promise<boolean> {
  if (!securityConfig.fileUpload.imageValidation.enabled) {
    return true;
  }

  try {
    // Use sharp for image validation (already in dependencies)
    const sharp = await import('sharp');
    const metadata = await sharp.default(filepath).metadata();

    if (!metadata.width || !metadata.height) {
      return false;
    }

    const { maxWidth, maxHeight, minWidth, minHeight } = securityConfig.fileUpload.imageValidation;

    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      logger.warn('Image dimensions exceed maximum', {
        width: metadata.width,
        height: metadata.height,
        maxWidth,
        maxHeight,
      });
      return false;
    }

    if (metadata.width < minWidth || metadata.height < minHeight) {
      logger.warn('Image dimensions below minimum', {
        width: metadata.width,
        height: metadata.height,
        minWidth,
        minHeight,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Image dimension validation error', { error, filepath });
    return false;
  }
}

/**
 * Scan file for malware (ClamAV integration)
 */
async function scanForMalware(filepath: string): Promise<{ clean: boolean; threat?: string }> {
  if (!securityConfig.fileUpload.malwareScan.enabled) {
    return { clean: true };
  }

  try {
    const net = await import('net');
    const { host, port, timeout } = securityConfig.fileUpload.malwareScan.clamav;

    return new Promise((resolve) => {
      const client = net.createConnection(port, host, async () => {
        try {
          // Read file content
          const content = await fs.readFile(filepath);
          
          // Send INSTREAM command
          client.write('nINSTREAM\n');
          
          // Send file in chunks
          const chunkSize = 2048;
          for (let i = 0; i < content.length; i += chunkSize) {
            const chunk = content.slice(i, i + chunkSize);
            const size = Buffer.alloc(4);
            size.writeUInt32BE(chunk.length);
            client.write(size);
            client.write(chunk);
          }
          
          // Signal end of stream
          const zero = Buffer.alloc(4);
          zero.writeUInt32BE(0);
          client.write(zero);
        } catch (err) {
          client.destroy();
          resolve({ clean: true }); // Assume clean if scan fails
        }
      });

      client.setTimeout(timeout);

      let response = '';
      client.on('data', (data) => {
        response += data.toString();
      });

      client.on('end', () => {
        if (response.includes('OK')) {
          resolve({ clean: true });
        } else if (response.includes('FOUND')) {
          const match = response.match(/: (.+) FOUND/);
          resolve({ clean: false, threat: match?.[1] || 'Unknown threat' });
        } else {
          resolve({ clean: true }); // Assume clean if response unclear
        }
      });

      client.on('error', () => {
        resolve({ clean: true }); // Assume clean if ClamAV unavailable
      });

      client.on('timeout', () => {
        client.destroy();
        resolve({ clean: true }); // Assume clean on timeout
      });
    });
  } catch (error) {
    logger.warn('Malware scan unavailable', { error });
    return { clean: true }; // Assume clean if scan fails
  }
}

/**
 * Comprehensive file validation
 */
async function validateFile(
  file: Express.Multer.File,
  filepath: string
): Promise<FileValidationResult> {
  // Check file size
  if (file.size > securityConfig.fileUpload.maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${securityConfig.fileUpload.maxSize / 1024 / 1024}MB`,
    };
  }

  // Check extension
  if (!validateExtension(file.originalname)) {
    return {
      valid: false,
      error: 'File type not allowed',
    };
  }

  // Check MIME type
  if (!validateMimeType(file.mimetype)) {
    return {
      valid: false,
      error: 'File MIME type not allowed',
    };
  }

  // Validate magic number
  const magicValid = await validateMagicNumber(filepath, file.mimetype);
  if (!magicValid) {
    return {
      valid: false,
      error: 'File content does not match declared type',
    };
  }

  // Validate image dimensions (if applicable)
  if (file.mimetype.startsWith('image/')) {
    const dimensionsValid = await validateImageDimensions(filepath);
    if (!dimensionsValid) {
      return {
        valid: false,
        error: 'Image dimensions out of allowed range',
      };
    }
  }

  // Malware scan
  const scanResult = await scanForMalware(filepath);
  if (!scanResult.clean) {
    return {
      valid: false,
      error: `File contains potential threat: ${scanResult.threat}`,
    };
  }

  // Sanitize filename
  const sanitizedName = securityConfig.fileUpload.randomFilename
    ? generateRandomFilename(file.originalname)
    : sanitizeFilename(file.originalname);

  return {
    valid: true,
    sanitizedName,
  };
}

// ============================================
// MULTER CONFIGURATION
// ============================================

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = securityConfig.fileUpload.tempDir;
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Use temp filename, will rename after validation
    const tempName = `temp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    cb(null, tempName);
  },
});

/**
 * Multer file filter
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  // Quick checks before upload
  if (!validateExtension(file.originalname)) {
    cb(new Error('File type not allowed'));
    return;
  }

  if (!validateMimeType(file.mimetype)) {
    cb(new Error('File MIME type not allowed'));
    return;
  }

  cb(null, true);
};

/**
 * Create multer upload instance
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: securityConfig.fileUpload.maxSize,
    files: 10, // Max 10 files per request
    fields: 20, // Max 20 non-file fields
  },
});

// ============================================
// EXPRESS MIDDLEWARE
// ============================================

/**
 * Post-upload validation middleware
 * Use after multer middleware
 */
export const validateUploadMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    const fileArray: Express.Multer.File[] = Array.isArray(files) 
      ? files 
      : Object.values(files || {}).flat();

    if (!fileArray || fileArray.length === 0) {
      return next();
    }

    const validatedFiles: Express.Multer.File[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const tempPath = path.join(securityConfig.fileUpload.tempDir, file.filename);
      
      const validation = await validateFile(file, tempPath);
      
      if (!validation.valid) {
        // Delete invalid file
        try {
          await fs.unlink(tempPath);
        } catch {
          // Ignore delete errors
        }
        
        errors.push(`${file.originalname}: ${validation.error}`);
        
        // Log security event
        logFileOperation(AuditAction.FILE_UPLOAD, req, file.originalname, false, {
          error: validation.error,
          size: file.size,
          mimeType: file.mimetype,
        });
        
        continue;
      }

      // Move to final destination with sanitized name
      const finalDir = securityConfig.fileUpload.uploadDir;
      await fs.mkdir(finalDir, { recursive: true });
      
      const finalPath = path.join(finalDir, validation.sanitizedName!);
      await fs.rename(tempPath, finalPath);

      // Update file info
      file.filename = validation.sanitizedName!;
      file.path = finalPath;
      
      validatedFiles.push(file);
      
      // Log successful upload
      logFileOperation(AuditAction.FILE_UPLOAD, req, validation.sanitizedName!, true, {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      });
    }

    if (errors.length > 0 && validatedFiles.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_VALIDATION_ERROR',
          message: 'All files failed validation',
          details: errors,
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Update req.files with only valid files
    if (Array.isArray(req.files)) {
      req.files = validatedFiles;
    }

    // Attach validation info to request
    (req as any).fileValidation = {
      validated: validatedFiles.length,
      rejected: errors.length,
      errors,
    };

    next();
  } catch (error) {
    logger.error('File validation error', { error });
    next(error);
  }
};

/**
 * Error handler for multer errors
 */
export const handleUploadError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${securityConfig.fileUpload.maxSize / 1024 / 1024}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message,
        statusCode: 400,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (err.message.includes('File type not allowed') || 
      err.message.includes('File MIME type not allowed')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TYPE_ERROR',
        message: err.message,
        statusCode: 400,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next(err);
};

// ============================================
// CLEANUP UTILITIES
// ============================================

/**
 * Clean up temporary files older than 1 hour
 */
export async function cleanupTempFiles(): Promise<void> {
  const tempDir = securityConfig.fileUpload.tempDir;
  const maxAge = 60 * 60 * 1000; // 1 hour

  try {
    const files = await fs.readdir(tempDir);
    const now = Date.now();

    for (const file of files) {
      const filepath = path.join(tempDir, file);
      const stats = await fs.stat(filepath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filepath);
        logger.info('Cleaned up temp file', { file });
      }
    }
  } catch (error) {
    // Directory might not exist, that's fine
  }
}

// Run cleanup every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);

// ============================================
// EXPORTS
// ============================================

export default {
  upload,
  validateUploadMiddleware,
  handleUploadError,
  sanitizeFilename,
  validateExtension,
  validateMimeType,
  cleanupTempFiles,
};
