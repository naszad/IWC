import api from './api';
import { ProficiencyData } from '../interfaces/Proficiency';

/**
 * Get the current user's English proficiency data
 */
export const getUserProficiencyData = async (): Promise<ProficiencyData> => {
  try {
    console.log('Fetching English proficiency data...');
    const token = localStorage.getItem('auth_token');
    console.log('Auth token:', token ? 'Present' : 'Missing');
    
    // Get the current user's data from the /auth/me endpoint
    const userResponse = await api.get('/auth/me');
    const user = userResponse.data.user;
    
    if (!user || !user.id) {
      throw new Error('User not found');
    }
    
    const response = await api.get(`/proficiency/user/${user.id}/english`);
    console.log('Proficiency data response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching English proficiency data:', error);
    throw error;
  }
};

/**
 * Get a specific user's English proficiency data
 */
export const getUserProficiencyById = async (userId: number): Promise<ProficiencyData> => {
  try {
    const response = await api.get(`/proficiency/user/${userId}/english`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching English proficiency data for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Initialize English proficiency tracking
 */
export const initializeProficiency = async (userId: number, startLevel: string) => {
  try {
    const response = await api.post('/proficiency/initialize', {
      userId,
      startLevel
    });
    return response.data;
  } catch (error) {
    console.error('Error initializing English proficiency:', error);
    throw error;
  }
};

/**
 * Record an English assessment result
 */
export const recordAssessment = async (userId: number, level: string, score: number) => {
  try {
    const response = await api.post('/proficiency/assessment', {
      userId,
      level,
      score
    });
    return response.data;
  } catch (error) {
    console.error('Error recording assessment:', error);
    throw error;
  }
};

/**
 * Record a learning activity
 */
export const recordActivity = async (
  userId: number,
  type: string,
  name: string,
  skill?: string,
  result?: string,
  progress?: number,
  score?: number
) => {
  try {
    const response = await api.post('/proficiency/activity', {
      userId,
      type,
      name,
      skill,
      result,
      progress,
      score
    });
    return response.data;
  } catch (error) {
    console.error('Error recording activity:', error);
    throw error;
  }
};

/**
 * Record a learning achievement
 */
export const recordAchievement = async (
  userId: number, 
  name: string, 
  description: string, 
  skill?: string
) => {
  try {
    const response = await api.post('/proficiency/achievement', { 
      userId, name, description, skill 
    });
    return response.data;
  } catch (error) {
    console.error('Error recording achievement:', error);
    throw error;
  }
};

/**
 * Update a skill recommendation
 */
export const updateSkillRecommendation = async (
  userId: number, 
  skill: string, 
  recommendation: string, 
  type: 'weak' | 'strong'
) => {
  try {
    const response = await api.post('/proficiency/recommendation', { 
      userId, skill, recommendation, type 
    });
    return response.data;
  } catch (error) {
    console.error('Error updating skill recommendation:', error);
    throw error;
  }
};

/**
 * Update study hours
 */
export const updateStudyHours = async (userId: number, hours: number) => {
  try {
    const response = await api.post('/proficiency/study-hours', {
      userId,
      hours
    });
    return response.data;
  } catch (error) {
    console.error('Error updating study hours:', error);
    throw error;
  }
}; 