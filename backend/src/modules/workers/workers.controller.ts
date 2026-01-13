/**
 * ============================================
 * WORKERS CONTROLLER
 * ============================================
 *
 * Controller for worker-specific operations
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as workersService from './workers.service';
import { logger } from '../../utils/logger';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

/**
 * Get count of pending assignments for the logged-in worker
 *
 * @route GET /api/workers/pending-assignments-count
 * @access Private - DEPARTMENT_WORKER only
 */
export const getPendingAssignmentsCount = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const count = await workersService.getPendingAssignmentsCount(userId);

    res.json({
      success: true,
      data: {
        count,
        hasAssignments: count > 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching pending assignments count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending assignments count',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get work data for a specific order
 *
 * @route GET /api/workers/work/:orderId
 * @access Private - DEPARTMENT_WORKER only
 */
export const getWorkData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const workData = await workersService.getWorkData(orderId, userId);

    res.json({
      success: true,
      data: workData,
    });
  } catch (error) {
    logger.error('Error fetching work data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Start work on an order
 *
 * @route POST /api/workers/work/:orderId/start
 * @access Private - DEPARTMENT_WORKER only
 */
export const startWork = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const result = await workersService.startWork(orderId, userId);

    res.json({
      success: true,
      message: 'Work started successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error starting work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start work',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Save work progress (draft)
 *
 * @route POST /api/workers/work/:orderId/save
 * @access Private - DEPARTMENT_WORKER only
 */
export const saveWorkProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { orderId } = req.params;
    const { formData, uploadedFiles, uploadedPhotos } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const result = await workersService.saveWorkProgress(orderId, userId, {
      formData,
      uploadedFiles,
      uploadedPhotos,
    });

    res.json({
      success: true,
      message: 'Progress saved successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error saving work progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save progress',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Complete and submit work
 *
 * @route POST /api/workers/work/:orderId/complete
 * @access Private - DEPARTMENT_WORKER only
 */
export const completeWork = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { orderId } = req.params;
    const { formData, uploadedFiles, uploadedPhotos } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const result = await workersService.completeWork(orderId, userId, {
      formData,
      uploadedFiles,
      uploadedPhotos,
    });

    res.json({
      success: true,
      message: 'Work completed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error completing work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete work',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Upload a file for work
 *
 * @route POST /api/workers/work/:orderId/upload-file
 * @access Private - DEPARTMENT_WORKER only
 */
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { orderId } = req.params;
    const { category } = req.body;
    const file = req.file;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No file provided',
      });
      return;
    }

    // Keep file as is on server (don't convert to base64)
    // Files like PDFs and CAD models need to be downloaded as actual files
    const fileData = {
      id: crypto.randomUUID(),
      name: file.filename, // Server-generated filename
      originalName: file.originalname,
      url: `/uploads/${file.filename}`, // Server path for download
      category: category || 'file', // Category for filtering
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    logger.info('File uploaded for work', { orderId, userId, file: fileData.name });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileData,
    });
  } catch (error) {
    logger.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Upload photos for work
 *
 * @route POST /api/workers/work/:orderId/upload-photos
 * @access Private - DEPARTMENT_WORKER only
 */
export const uploadPhotos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { orderId } = req.params;
    const { category } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No photos provided',
      });
      return;
    }

    // Create photo metadata for each uploaded file with base64 data URLs
    const photos = files.map((file, index) => {
      // Read file and convert to base64 data URL for immediate display
      const fileBuffer = fs.readFileSync(file.path);
      const base64 = fileBuffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return {
        id: crypto.randomUUID(),
        name: `${category || 'photo'}_${Date.now()}_${index}${path.extname(file.originalname)}`,
        originalName: file.originalname,
        url: dataUrl,
        thumbnailUrl: dataUrl,
        category: category || 'work_photo',
        uploadedAt: new Date().toISOString(),
      };
    });

    logger.info('Photos uploaded for work', { orderId, userId, count: photos.length });

    res.json({
      success: true,
      message: `${photos.length} photo(s) uploaded successfully`,
      photos,
    });
  } catch (error) {
    logger.error('Error uploading photos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photos',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete an uploaded file
 *
 * @route DELETE /api/workers/work/:orderId/files/:fileId
 * @access Private - DEPARTMENT_WORKER only
 */
export const deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { orderId, fileId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // In production, delete the actual file from storage
    logger.info('File deleted from work', { orderId, userId, fileId });

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete an uploaded photo
 *
 * @route DELETE /api/workers/work/:orderId/photos/:photoId
 * @access Private - DEPARTMENT_WORKER only
 */
export const deletePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { orderId, photoId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // In production, delete the actual photo from storage
    logger.info('Photo deleted from work', { orderId, userId, photoId });

    res.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete photo',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
