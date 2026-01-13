/**
 * ============================================
 * IMAGE OPTIMIZATION SERVICE
 * ============================================
 * 
 * Image processing utilities:
 * - Resize images
 * - Compress images
 * - Convert to WebP
 * - Generate thumbnails
 */

import { performanceConfig } from '../config/performance.config';
import { logger } from './logger';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Note: In production, use sharp library for actual image processing
// This module provides the interface and can be enhanced with sharp

interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

interface UploadedImage {
  originalName: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
}

/**
 * Validate image file
 */
export function validateImage(file: {
  mimetype: string;
  size: number;
}): { valid: boolean; error?: string } {
  const { allowedMimeTypes, maxFileSize } = performanceConfig.images;

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
    };
  }

  if (file.size > maxFileSize) {
    const maxMB = maxFileSize / (1024 * 1024);
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Generate unique filename
 */
export function generateImageFilename(originalName: string, suffix?: string): string {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const hash = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  
  if (suffix) {
    return `${name}-${timestamp}-${hash}-${suffix}${ext}`;
  }
  
  return `${name}-${timestamp}-${hash}${ext}`;
}

/**
 * Get image dimensions (placeholder - use sharp in production)
 */
export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  // In production, use sharp:
  // const metadata = await sharp(buffer).metadata();
  // return { width: metadata.width || 0, height: metadata.height || 0 };
  
  return { width: 0, height: 0 };
}

/**
 * Process image with given options (placeholder - use sharp in production)
 */
export async function processImage(
  buffer: Buffer,
  options: ImageProcessingOptions
): Promise<ProcessedImage> {
  const config = performanceConfig.images;
  
  // In production, use sharp:
  /*
  let pipeline = sharp(buffer);
  
  // Resize if needed
  if (options.width || options.height) {
    pipeline = pipeline.resize({
      width: options.width,
      height: options.height,
      fit: options.fit || 'inside',
      withoutEnlargement: true,
    });
  }
  
  // Set format and quality
  const format = options.format || (config.compression.convertToWebP ? 'webp' : 'jpeg');
  const quality = options.quality || config.compression.quality;
  
  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 9 });
      break;
    default:
      pipeline = pipeline.jpeg({ quality, progressive: true });
  }
  
  const outputBuffer = await pipeline.toBuffer();
  const metadata = await sharp(outputBuffer).metadata();
  
  return {
    buffer: outputBuffer,
    width: metadata.width || 0,
    height: metadata.height || 0,
    format,
    size: outputBuffer.length,
  };
  */
  
  // Placeholder return
  return {
    buffer,
    width: 0,
    height: 0,
    format: 'jpeg',
    size: buffer.length,
  };
}

/**
 * Resize image to fit max dimensions
 */
export async function resizeImage(
  buffer: Buffer,
  maxWidth?: number,
  maxHeight?: number
): Promise<ProcessedImage> {
  const config = performanceConfig.images.resize;
  
  return processImage(buffer, {
    width: maxWidth || config.maxWidth,
    height: maxHeight || config.maxHeight,
    fit: 'inside',
  });
}

/**
 * Generate thumbnail
 */
export async function generateThumbnail(buffer: Buffer): Promise<ProcessedImage> {
  const { thumbnail } = performanceConfig.images.resize;
  
  return processImage(buffer, {
    width: thumbnail.width,
    height: thumbnail.height,
    fit: 'cover',
  });
}

/**
 * Generate medium-sized image
 */
export async function generateMedium(buffer: Buffer): Promise<ProcessedImage> {
  const { medium } = performanceConfig.images.resize;
  
  return processImage(buffer, {
    width: medium.width,
    height: medium.height,
    fit: 'inside',
  });
}

/**
 * Convert image to WebP
 */
export async function convertToWebP(buffer: Buffer, quality?: number): Promise<ProcessedImage> {
  return processImage(buffer, {
    format: 'webp',
    quality: quality || performanceConfig.images.compression.quality,
  });
}

/**
 * Save image to storage
 */
export async function saveImage(
  buffer: Buffer,
  filename: string,
  subdir?: string
): Promise<string> {
  const config = performanceConfig.images.storage;
  
  if (config.type === 'local') {
    const dir = subdir
      ? path.join(config.localPath, subdir)
      : config.localPath;
    
    await fs.mkdir(dir, { recursive: true });
    
    const filepath = path.join(dir, filename);
    await fs.writeFile(filepath, buffer);
    
    // Return URL
    const baseUrl = config.cdnUrl || '';
    const urlPath = subdir ? `/${subdir}/${filename}` : `/${filename}`;
    
    return `${baseUrl}/uploads${urlPath}`;
  }
  
  // For S3/Cloudinary, implement accordingly
  // Return placeholder for now
  return `/uploads/${filename}`;
}

/**
 * Delete image from storage
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  const config = performanceConfig.images.storage;
  
  if (config.type === 'local') {
    try {
      const filepath = imageUrl.replace(/^.*\/uploads/, config.localPath);
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      logger.error('Failed to delete image:', error);
      return false;
    }
  }
  
  return false;
}

/**
 * Process and save uploaded image with all variants
 */
export async function processUploadedImage(
  fileBuffer: Buffer,
  originalName: string,
  subdir?: string
): Promise<UploadedImage> {
  const config = performanceConfig.images;
  
  // Validate
  const validation = validateImage({
    mimetype: getMimeType(originalName),
    size: fileBuffer.length,
  });
  
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Process main image
  const processed = await resizeImage(fileBuffer);
  
  // Convert to WebP if enabled
  let finalBuffer = processed.buffer;
  let extension = path.extname(originalName);
  
  if (config.compression.convertToWebP) {
    const webp = await convertToWebP(processed.buffer);
    finalBuffer = webp.buffer;
    extension = '.webp';
  }
  
  // Generate filename
  const baseFilename = path.basename(originalName, path.extname(originalName));
  const filename = `${baseFilename}-${Date.now()}${extension}`;
  
  // Save main image
  const mainUrl = await saveImage(finalBuffer, filename, subdir);
  
  // Generate and save thumbnail
  let thumbnailUrl: string | undefined;
  if (config.resize.enabled) {
    const thumbnail = await generateThumbnail(fileBuffer);
    const thumbFilename = `${baseFilename}-${Date.now()}-thumb${extension}`;
    thumbnailUrl = await saveImage(thumbnail.buffer, thumbFilename, subdir);
  }
  
  // Generate and save medium
  let mediumUrl: string | undefined;
  if (config.resize.enabled) {
    const medium = await generateMedium(fileBuffer);
    const medFilename = `${baseFilename}-${Date.now()}-medium${extension}`;
    mediumUrl = await saveImage(medium.buffer, medFilename, subdir);
  }
  
  return {
    originalName,
    filename,
    path: `${subdir || ''}/${filename}`,
    url: mainUrl,
    size: finalBuffer.length,
    mimeType: getMimeType(filename),
    thumbnailUrl,
    mediumUrl,
  };
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}
