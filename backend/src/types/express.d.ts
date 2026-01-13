/**
 * Express Request Type Extension
 *
 * Extends the Express Request type to include the user property
 * that is attached by the authentication middleware.
 */

declare namespace Express {
  interface Request {
    user?: {
      id?: string; // Optional for compatibility
      userId: string;
      email: string;
      role: string;
    };
  }
}
