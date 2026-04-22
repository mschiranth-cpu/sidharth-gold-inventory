/**
 * ============================================
 * DIAMOND INVENTORY CONTROLLER
 * ============================================
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import {
  getAllDiamonds,
  getDiamondById,
  createDiamond,
  issueDiamond,
  getAllDiamondLots,
  createDiamondLot,
} from './diamond.service';
import { logger } from '../../utils/logger';

export async function getAllDiamondsController(req: Request, res: Response) {
  try {
    const { shape, color, clarity, status } = req.query;
    const diamonds = await getAllDiamonds({
      shape: shape as string,
      color: color as string,
      clarity: clarity as string,
      status: status as string,
    });
    res.json({ success: true, data: diamonds });
  } catch (error) {
    logger.error('Get diamonds error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch diamonds' } });
  }
}

export async function getDiamondByIdController(req: Request, res: Response) {
  try {
    const { diamondId } = req.params;
    const diamond = await getDiamondById(diamondId);
    if (!diamond) {
      return res.status(404).json({ success: false, error: { message: 'Diamond not found' } });
    }
    res.json({ success: true, data: diamond });
  } catch (error) {
    logger.error('Get diamond error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch diamond' } });
  }
}

export async function createDiamondController(req: Request, res: Response) {
  try {
    const diamond = await createDiamond(req.body);
    res.status(201).json({ success: true, data: diamond });
  } catch (error: any) {
    logger.error('Create diamond error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create diamond' } });
  }
}

export async function issueDiamondController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const diamond = await issueDiamond(req.body, authReq.user.userId);
    res.json({ success: true, data: diamond });
  } catch (error: any) {
    logger.error('Issue diamond error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to issue diamond' } });
  }
}

export async function getAllDiamondLotsController(req: Request, res: Response) {
  try {
    const lots = await getAllDiamondLots();
    res.json({ success: true, data: lots });
  } catch (error) {
    logger.error('Get diamond lots error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch lots' } });
  }
}

export async function createDiamondLotController(req: Request, res: Response) {
  try {
    const lot = await createDiamondLot(req.body);
    res.status(201).json({ success: true, data: lot });
  } catch (error: any) {
    logger.error('Create diamond lot error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create lot' } });
  }
}
