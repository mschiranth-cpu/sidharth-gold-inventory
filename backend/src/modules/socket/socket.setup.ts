/**
 * ============================================
 * SOCKET.IO SETUP
 * ============================================
 *
 * WebSocket configuration for real-time
 * notifications and updates.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { setSocketServer } from '../notifications/notifications.service';
import { SOCKET_EVENTS } from '../notifications/notifications.types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Initialize Socket.io server
 */
export const initializeSocketServer = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      // Get token from auth header or query
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      logger.debug(`Socket authenticated for user: ${decoded.id}`);
      next();
    } catch (error) {
      logger.warn('Socket authentication failed:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handler
  io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
    const userId = socket.userId;

    if (!userId) {
      socket.disconnect();
      return;
    }

    logger.info(`User connected: ${userId} (Socket: ${socket.id})`);

    // Join user-specific room for targeted notifications
    socket.join(`user:${userId}`);

    // Join role-based room
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }

    // Handle custom room joins
    socket.on(SOCKET_EVENTS.JOIN_USER_ROOM, (roomId: string) => {
      // Validate room name for security
      if (roomId.startsWith('order:') || roomId.startsWith('department:')) {
        socket.join(roomId);
        logger.debug(`User ${userId} joined room: ${roomId}`);
      }
    });

    // Handle room leaves
    socket.on(SOCKET_EVENTS.LEAVE_USER_ROOM, (roomId: string) => {
      socket.leave(roomId);
      logger.debug(`User ${userId} left room: ${roomId}`);
    });

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      logger.info(`User disconnected: ${userId} (Reason: ${reason})`);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to notification server',
      userId,
      socketId: socket.id,
    });
  });

  // Set socket server in notification service for broadcasting
  setSocketServer(io);

  logger.info('Socket.io server initialized');

  return io;
};

/**
 * Emit an event to a specific user
 */
export const emitToUser = (io: SocketServer, userId: string, event: string, data: any): void => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit an event to all users with a specific role
 */
export const emitToRole = (io: SocketServer, role: string, event: string, data: any): void => {
  io.to(`role:${role}`).emit(event, data);
};

/**
 * Emit an event to all connected clients
 */
export const emitToAll = (io: SocketServer, event: string, data: any): void => {
  io.emit(event, data);
};

/**
 * Emit an event to a specific room
 */
export const emitToRoom = (io: SocketServer, room: string, event: string, data: any): void => {
  io.to(room).emit(event, data);
};

export default {
  initializeSocketServer,
  emitToUser,
  emitToRole,
  emitToAll,
  emitToRoom,
};
