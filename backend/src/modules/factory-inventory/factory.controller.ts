/**
 * ============================================
 * FACTORY INVENTORY CONTROLLER
 * ============================================
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import {
  getAllCategories,
  createCategory,
  getAllFactoryItems,
  getFactoryItemById,
  createFactoryItem,
  updateFactoryItem,
  createFactoryItemTransaction,
  createEquipmentMaintenance,
  getEquipmentMaintenance,
} from './factory.service';
import { logger } from '../../utils/logger';

export async function getAllCategoriesController(req: Request, res: Response) {
  try {
    const categories = await getAllCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Get categories error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch categories' } });
  }
}

export async function createCategoryController(req: Request, res: Response) {
  try {
    const category = await createCategory(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    logger.error('Create category error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create category' } });
  }
}

export async function getAllFactoryItemsController(req: Request, res: Response) {
  try {
    const { categoryId, isEquipment } = req.query;
    const items = await getAllFactoryItems({
      categoryId: categoryId as string,
      isEquipment: isEquipment === 'true',
    });
    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Get factory items error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch items' } });
  }
}

export async function getFactoryItemByIdController(req: Request, res: Response) {
  try {
    const { itemId } = req.params;
    const item = await getFactoryItemById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: { message: 'Item not found' } });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    logger.error('Get factory item error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch item' } });
  }
}

export async function createFactoryItemController(req: Request, res: Response) {
  try {
    const item = await createFactoryItem(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    logger.error('Create factory item error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create item' } });
  }
}

export async function updateFactoryItemController(req: Request, res: Response) {
  try {
    const { itemId } = req.params;
    const item = await updateFactoryItem(itemId, req.body);
    res.json({ success: true, data: item });
  } catch (error: any) {
    logger.error('Update factory item error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to update item' } });
  }
}

export async function createFactoryItemTransactionController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const transaction = await createFactoryItemTransaction(req.body, authReq.user.userId);
    res.status(201).json({ success: true, data: transaction });
  } catch (error: any) {
    logger.error('Create factory transaction error', { error });
    res
      .status(500)
      .json({
        success: false,
        error: { message: error.message || 'Failed to create transaction' },
      });
  }
}

export async function createEquipmentMaintenanceController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const maintenance = await createEquipmentMaintenance(req.body, authReq.user.userId);
    res.status(201).json({ success: true, data: maintenance });
  } catch (error: any) {
    logger.error('Create maintenance error', { error });
    res
      .status(500)
      .json({
        success: false,
        error: { message: error.message || 'Failed to create maintenance' },
      });
  }
}

export async function getEquipmentMaintenanceController(req: Request, res: Response) {
  try {
    const { equipmentId } = req.query;
    const maintenance = await getEquipmentMaintenance(equipmentId as string);
    res.json({ success: true, data: maintenance });
  } catch (error) {
    logger.error('Get maintenance error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch maintenance' } });
  }
}
