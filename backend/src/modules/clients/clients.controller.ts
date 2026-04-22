/**
 * ============================================
 * CLIENT PORTAL CONTROLLER
 * ============================================
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import {
  createClient,
  getAllClients,
  getClientByUserId,
  getClientById,
  updateClient,
  approveClient,
  createClientOrder,
  getClientOrders,
  getOrdersPendingApproval,
  approveClientOrder,
  addOrderComment,
  getOrderComments,
  markCommentAsRead,
} from './clients.service';
import { logger } from '../../utils/logger';

/**
 * Create new client (Admin/Office Staff)
 */
export async function createClientController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const client = await createClient(req.body, authReq.user.userId);
    res.status(201).json({ success: true, data: client });
  } catch (error: any) {
    logger.error('Create client error', { error });
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to create client' },
    });
  }
}

/**
 * Self-register as client
 */
export async function selfRegisterController(req: Request, res: Response) {
  try {
    const client = await createClient({
      ...req.body,
      registrationMethod: 'SELF_REGISTERED',
    });
    res.status(201).json({
      success: true,
      data: client,
      message: 'Registration successful. Please wait for admin approval.',
    });
  } catch (error: any) {
    logger.error('Self registration error', { error });
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Registration failed' },
    });
  }
}

/**
 * Get all clients (Admin/Office Staff)
 */
export async function getAllClientsController(req: Request, res: Response) {
  try {
    const { approvalStatus, search } = req.query;
    const clients = await getAllClients({
      approvalStatus: approvalStatus as string,
      search: search as string,
    });
    res.json({ success: true, data: clients });
  } catch (error) {
    logger.error('Get all clients error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch clients' },
    });
  }
}

/**
 * Get current client profile
 */
export async function getMyProfileController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const client = await getClientByUserId(authReq.user.userId);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client profile not found' },
      });
    }

    res.json({ success: true, data: client });
  } catch (error) {
    logger.error('Get my profile error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch profile' },
    });
  }
}

/**
 * Get client by ID (Admin/Office Staff)
 */
export async function getClientByIdController(req: Request, res: Response) {
  try {
    const { clientId } = req.params;
    const client = await getClientById(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client not found' },
      });
    }

    res.json({ success: true, data: client });
  } catch (error) {
    logger.error('Get client by ID error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch client' },
    });
  }
}

/**
 * Update client profile
 */
export async function updateClientController(req: Request, res: Response) {
  try {
    const { clientId } = req.params;
    const client = await updateClient(clientId, req.body);
    res.json({ success: true, data: client });
  } catch (error) {
    logger.error('Update client error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update client' },
    });
  }
}

/**
 * Approve/reject client registration (Admin/Office Staff)
 */
export async function approveClientController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const client = await approveClient(req.body, authReq.user.userId);
    res.json({ success: true, data: client });
  } catch (error) {
    logger.error('Approve client error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to approve client' },
    });
  }
}

/**
 * Create order from client portal
 */
export async function createClientOrderController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const client = await getClientByUserId(authReq.user.userId);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client profile not found' },
      });
    }

    if (client.approvalStatus !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        error: { message: 'Your account is not approved yet' },
      });
    }

    const order = await createClientOrder(client.id, authReq.user.userId, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    logger.error('Create client order error', { error });
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to create order' },
    });
  }
}

/**
 * Get client orders
 */
export async function getClientOrdersController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const client = await getClientByUserId(authReq.user.userId);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client profile not found' },
      });
    }

    const { status } = req.query;
    const orders = await getClientOrders(client.id, {
      status: status as string,
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('Get client orders error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch orders' },
    });
  }
}

/**
 * Get orders pending approval (Office Staff/Admin)
 */
export async function getOrdersPendingApprovalController(req: Request, res: Response) {
  try {
    const orders = await getOrdersPendingApproval();
    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('Get pending orders error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch pending orders' },
    });
  }
}

/**
 * Approve/reject client order (Office Staff/Admin)
 */
export async function approveClientOrderController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId } = req.params;
    const { approved, rejectionReason } = req.body;

    const order = await approveClientOrder(orderId, approved, authReq.user.userId, rejectionReason);

    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Approve order error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to approve order' },
    });
  }
}

/**
 * Add comment to order
 */
export async function addOrderCommentController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const comment = await addOrderComment(authReq.user.userId, req.body);
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    logger.error('Add comment error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add comment' },
    });
  }
}

/**
 * Get order comments
 */
export async function getOrderCommentsController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId } = req.params;
    const { includeInternal } = req.query;

    // Only staff can see internal comments
    const canSeeInternal = ['ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'].includes(authReq.user.role);

    const comments = await getOrderComments(orderId, includeInternal === 'true' && canSeeInternal);

    res.json({ success: true, data: comments });
  } catch (error) {
    logger.error('Get comments error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch comments' },
    });
  }
}

/**
 * Mark comment as read
 */
export async function markCommentAsReadController(req: Request, res: Response) {
  try {
    const { commentId } = req.params;
    const comment = await markCommentAsRead(commentId);
    res.json({ success: true, data: comment });
  } catch (error) {
    logger.error('Mark comment as read error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to mark comment as read' },
    });
  }
}
