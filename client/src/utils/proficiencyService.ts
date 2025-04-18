import api from './api';
import { ProficiencyData } from '../interfaces/Proficiency';

/**
 * Get a specific user's proficiency data
 */
export const getUserProficiencyData = async (userId: number): Promise<ProficiencyData> => {
  try {
    const response = await api.get(`/proficiency/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching proficiency data for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Record a language assessment result
 */
export const recordAssessment = async (userId: number, language: string, level: string, score: number) => {
  try {
    const response = await api.post('/proficiency/assessment', {
      userId,
      language,
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
 * Record a language learning activity
 */
export const recordActivity = async (
  userId: number,
  language: string,
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
      language,
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
 * Record a language learning achievement
 */
export const recordAchievement = async (
  userId: number, 
  language: string, 
  name: string, 
  description: string, 
  skill?: string
) => {
  try {
    const response = await api.post('/proficiency/achievement', { 
      userId, language, name, description, skill 
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
  language: string, 
  skill: string, 
  recommendation: string, 
  type: 'weak' | 'strong'
) => {
  try {
    const response = await api.post('/proficiency/recommendation', { 
      userId, language, skill, recommendation, type 
    });
    return response.data;
  } catch (error) {
    console.error('Error updating skill recommendation:', error);
    throw error;
  }
};

/**
 * Update study hours for a language
 */
export const updateStudyHours = async (userId: number, language: string, hours: number) => {
  try {
    const response = await api.post('/proficiency/study-hours', {
      userId,
      language,
      hours
    });
    return response.data;
  } catch (error) {
    console.error('Error updating study hours:', error);
    throw error;
  }
}; 