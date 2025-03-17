import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { 
  getAllAssessments, 
  getAssessmentById, 
  createAssessment, 
  updateAssessment, 
  deleteAssessment,
  startAssessment,
  submitAssessment,
  getUserAttempts,
  getAssessmentResults
} from '../controllers/assessmentsController';

const router = express.Router();

// Error handler wrapper
const catchAsync = (fn: any): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

// Public routes - accessible to all authenticated users
router.get('/', authenticate, catchAsync(getAllAssessments));
router.get('/:id', authenticate, catchAsync(getAssessmentById));

// Instructor-only routes
router.post('/', authenticate, authorize('instructor', 'admin'), catchAsync(createAssessment));
router.put('/:id', authenticate, authorize('instructor', 'admin'), catchAsync(updateAssessment));
router.delete('/:id', authenticate, authorize('instructor', 'admin'), catchAsync(deleteAssessment));

// Assessment taking routes
router.post('/:id/start', authenticate, catchAsync(startAssessment));
router.post('/attempts/:attemptId/submit', authenticate, catchAsync(submitAssessment));
router.get('/user/attempts', authenticate, catchAsync(getUserAttempts));
router.get('/attempts/:attemptId/results', authenticate, catchAsync(getAssessmentResults));

export default router; 