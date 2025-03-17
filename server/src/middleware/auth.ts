import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/index';

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; role: string };
    (req as unknown as AuthRequest).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
    return;
  }
};

// Alias for auth middleware to keep naming consistent with routes
export const authenticate = auth;

export const authorize = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as unknown as AuthRequest;
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      res.status(403).json({ error: 'Not authorized to access this resource' });
      return;
    }
    next();
  };
}; 