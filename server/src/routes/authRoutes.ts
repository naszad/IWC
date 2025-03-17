import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { login, register, me, updateProfile } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Async wrapper: using 'any' for the controller function to avoid type incompatibility issues
const catchAsync = (fn: any): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

router.post('/login', catchAsync(login));
router.post('/register', catchAsync(register));
router.get('/me', auth, catchAsync(me));
router.put('/profile', auth, catchAsync(updateProfile));

export default router; 