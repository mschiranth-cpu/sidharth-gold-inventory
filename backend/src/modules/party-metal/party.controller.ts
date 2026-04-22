/**
 * ============================================
 * PARTY METAL INVENTORY CONTROLLER
 * ============================================
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import {
  getAllParties,
  getPartyById,
  createParty,
  updateParty,
  createPartyMetalTransaction,
  getPartyMetalTransactions,
  getPartyMetalAccounts,
} from './party.service';
import { logger } from '../../utils/logger';

export async function getAllPartiesController(req: Request, res: Response) {
  try {
    const { type, search } = req.query;
    const parties = await getAllParties({
      type: type as string,
      search: search as string,
    });
    res.json({ success: true, data: parties });
  } catch (error) {
    logger.error('Get parties error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch parties' } });
  }
}

export async function getPartyByIdController(req: Request, res: Response) {
  try {
    const { partyId } = req.params;
    const party = await getPartyById(partyId);
    if (!party) {
      return res.status(404).json({ success: false, error: { message: 'Party not found' } });
    }
    res.json({ success: true, data: party });
  } catch (error) {
    logger.error('Get party error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch party' } });
  }
}

export async function createPartyController(req: Request, res: Response) {
  try {
    const party = await createParty(req.body);
    res.status(201).json({ success: true, data: party });
  } catch (error: any) {
    logger.error('Create party error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create party' } });
  }
}

export async function updatePartyController(req: Request, res: Response) {
  try {
    const { partyId } = req.params;
    const party = await updateParty(partyId, req.body);
    res.json({ success: true, data: party });
  } catch (error: any) {
    logger.error('Update party error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to update party' } });
  }
}

export async function createPartyMetalTransactionController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const transaction = await createPartyMetalTransaction(req.body, authReq.user.userId);
    res.status(201).json({ success: true, data: transaction });
  } catch (error: any) {
    logger.error('Create party transaction error', { error });
    res
      .status(500)
      .json({
        success: false,
        error: { message: error.message || 'Failed to create transaction' },
      });
  }
}

export async function getPartyMetalTransactionsController(req: Request, res: Response) {
  try {
    const { partyId } = req.params;
    const transactions = await getPartyMetalTransactions(partyId);
    res.json({ success: true, data: transactions });
  } catch (error) {
    logger.error('Get party transactions error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch transactions' } });
  }
}

export async function getPartyMetalAccountsController(req: Request, res: Response) {
  try {
    const { partyId } = req.params;
    const accounts = await getPartyMetalAccounts(partyId);
    res.json({ success: true, data: accounts });
  } catch (error) {
    logger.error('Get party accounts error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch accounts' } });
  }
}
