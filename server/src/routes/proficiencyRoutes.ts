import express, { Response, Request, NextFunction, RequestHandler } from 'express';
import {
  getProficiencyData,
  recordAssessment,
  recordActivity,
  recordAchievement,
  updateSkillRecommendation,
  updateStudyHours,
  initializeLanguageProficiency
} from '../controllers/proficiencyController';
import { authenticate } from '../middleware/auth';
import { ProficiencyRequest } from '../types/proficiency';

const router = express.Router();

// Apply authentication middleware to all proficiency routes
router.use(authenticate);

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

// Get proficiency data
router.get('/user/:userId', catchAsync(getProficiencyData));
router.get('/user/:userId/language/:language', catchAsync(getProficiencyData));
router.get('/profile', catchAsync(getProficiencyData)); // Get current logged-in user's data

// Record new data
router.post('/assessment', catchAsync(recordAssessment));
router.post('/activity', catchAsync(recordActivity));
router.post('/achievement', catchAsync(recordAchievement));
router.post('/recommendation', catchAsync(updateSkillRecommendation));
router.post('/study-hours', catchAsync(updateStudyHours));
router.post('/initialize', catchAsync(initializeLanguageProficiency));

export default router; 