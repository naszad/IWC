import express from 'express';
import { 
  getProficiencyData, 
  recordAssessment, 
  initializeLanguageProficiency 
} from '../controllers/proficiencyController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get English proficiency data for a user
router.get('/user/:userId/english', auth, getProficiencyData);

// Get current user's English proficiency data
router.get('/me/english', auth, getProficiencyData);

// Initialize English proficiency tracking
router.post('/initialize', auth, initializeLanguageProficiency);

// Record an English assessment result
router.post('/assessment', auth, recordAssessment);

export default router; 