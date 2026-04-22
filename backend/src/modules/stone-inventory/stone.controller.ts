/**
 * ============================================
 * STONE INVENTORY CONTROLLER
 * ============================================
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import {
  getAllRealStones,
  createRealStone,
  getAllStonePackets,
  createStonePacket,
  createStonePacketTransaction,
} from './stone.service';
import { logger } from '../../utils/logger';

export async function getAllRealStonesController(req: Request, res: Response) {
  try {
    const { stoneType, status } = req.query;
    const stones = await getAllRealStones({
      stoneType: stoneType as any,
      status: status as string,
    });
    res.json({ success: true, data: stones });
  } catch (error) {
    logger.error('Get real stones error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stones' } });
  }
}

export async function createRealStoneController(req: Request, res: Response) {
  try {
    const stone = await createRealStone(req.body);
    res.status(201).json({ success: true, data: stone });
  } catch (error: any) {
    logger.error('Create real stone error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create stone' } });
  }
}

export async function getAllStonePacketsController(req: Request, res: Response) {
  try {
    const { stoneType, size } = req.query;
    const packets = await getAllStonePackets({
      stoneType: stoneType as any,
      size: size as string,
    });
    res.json({ success: true, data: packets });
  } catch (error) {
    logger.error('Get stone packets error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch packets' } });
  }
}

export async function createStonePacketController(req: Request, res: Response) {
  try {
    const packet = await createStonePacket(req.body);
    res.status(201).json({ success: true, data: packet });
  } catch (error: any) {
    logger.error('Create stone packet error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create packet' } });
  }
}

export async function createStonePacketTransactionController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const transaction = await createStonePacketTransaction(req.body, authReq.user.userId);
    res.status(201).json({ success: true, data: transaction });
  } catch (error: any) {
    logger.error('Create stone transaction error', { error });
    res
      .status(500)
      .json({
        success: false,
        error: { message: error.message || 'Failed to create transaction' },
      });
  }
}
