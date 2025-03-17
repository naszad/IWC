import api from './api';
import { Assessment } from '../interfaces/Assessment';

// Get all available assessments
export const getAllAssessments = async () => {
  try {
    const response = await api.get('/assessments');
    return response.data;
  } catch (error) {
    console.error('Error fetching assessments:', error);
    throw error;
  }
};

// Get a specific assessment by ID
export const getAssessmentById = async (id: string) => {
  try {
    const response = await api.get(`/assessments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching assessment ${id}:`, error);
    throw error;
  }
};

// Start an assessment attempt
export const startAssessment = async (id: string) => {
  try {
    const response = await api.post(`/assessments/${id}/start`);
    return response.data;
  } catch (error) {
    console.error(`Error starting assessment ${id}:`, error);
    throw error;
  }
};

// Submit an assessment attempt
export const submitAssessment = async (attemptId: string, answers: Array<{ questionId: string; answer: string }>) => {
  try {
    const response = await api.post(`/assessments/attempts/${attemptId}/submit`, { answers });
    return response.data;
  } catch (error) {
    console.error(`Error submitting assessment attempt ${attemptId}:`, error);
    throw error;
  }
};

// Get the results of an assessment attempt
export const getAssessmentResults = async (attemptId: string) => {
  try {
    const response = await api.get(`/assessments/attempts/${attemptId}/results`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching assessment results for attempt ${attemptId}:`, error);
    throw error;
  }
};

// Get all assessment attempts for the current user
export const getUserAttempts = async () => {
  try {
    const response = await api.get('/assessments/user/attempts');
    return response.data;
  } catch (error) {
    console.error('Error fetching user assessment attempts:', error);
    throw error;
  }
};

// Create a new assessment (instructor only)
export const createAssessment = async (assessmentData: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
  try {
    const response = await api.post('/assessments', assessmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw error;
  }
};

// Update an existing assessment (instructor only)
export const updateAssessment = async (id: string, assessmentData: Partial<Assessment>) => {
  try {
    const response = await api.put(`/assessments/${id}`, assessmentData);
    return response.data;
  } catch (error) {
    console.error(`Error updating assessment ${id}:`, error);
    throw error;
  }
};

// Delete an assessment (instructor only)
export const deleteAssessment = async (id: string) => {
  try {
    const response = await api.delete(`/assessments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting assessment ${id}:`, error);
    throw error;
  }
}; 