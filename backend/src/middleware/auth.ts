import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from './errorHandler';
import { getUserById } from '../modules/auth/auth.service';

export interface TokenPayload {
  id?: string; // Alias for userId for compatibility
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    const userId = decoded.userId || decoded.id;
    if (!userId) throw new ApiError(401, 'Invalid token.');
    const user = await getUserById(userId);
    if (!user) throw new ApiError(401, 'User account not found.');
    if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated.');
    req.user = { ...decoded, id: user.id, userId: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'Token expired. Please login again.'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid token.'));
    } else {
      next(error);
    }
  }
};

/**
 * Authorization middleware - checks user roles
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Not authorized to access this resource.'));
    }

    next();
  };
};

/**
 * Generate JWT token
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
};
