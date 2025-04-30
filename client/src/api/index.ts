import axios from 'axios';
import {
  User, UserRole, Assessment,
  Question, Submission
} from '../types';

// Assume the backend is running on localhost:5000 for development
// Use Vite's way to access environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Utility to set the auth token for subsequent requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// --- Auth API --- Auth endpoints are prefixed with /auth

export const login = async (credentials: { identifier: string; password: string }): Promise<{ token: string }> => {
  const response = await apiClient.post('/auth/login', credentials);
  // Backend only returns { token }
  if (response.data.token) {
    setAuthToken(response.data.token);
  }
  return response.data;
};

export const register = async (userData: { username: string; email?: string; password: string; role: UserRole }): Promise<User> => {
  const response = await apiClient.post('/auth/register', userData);
  // Assuming backend returns the created user object (without token)
  return response.data;
};

// --- Admin API --- Admin endpoints are prefixed with /admin

export const adminListUsers = async (): Promise<User[]> => {
  const response = await apiClient.get('/admin/users');
  return response.data;
};

export const adminCreateUser = async (userData: Omit<User, 'id' | 'created_at'>): Promise<User> => {
  const response = await apiClient.post('/admin/users', userData);
  return response.data;
};

export const adminGetUser = async (userId: string): Promise<User> => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
};

export const adminUpdateUser = async (userId: string, userData: Partial<Omit<User, 'id' | 'created_at' | 'password_hash'>>): Promise<User> => {
  const response = await apiClient.put(`/admin/users/${userId}`, userData);
  return response.data;
};

export const adminDeleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/admin/users/${userId}`);
};

// --- Instructor API --- Instructor endpoints are prefixed with /instructor

export const instructorListAssessments = async (): Promise<Assessment[]> => {
  const response = await apiClient.get('/instructor/assessments');
  return response.data;
};

export const instructorCreateAssessment = async (assessmentData: Omit<Assessment, 'id' | 'instructor_id' | 'created_at'>): Promise<Assessment> => {
  const response = await apiClient.post('/instructor/assessments', assessmentData);
  return response.data;
};

export const instructorGetAssessment = async (assessmentId: string): Promise<Assessment> => {
  const response = await apiClient.get(`/instructor/assessments/${assessmentId}`);
  return response.data;
};

// Note: updateAssessment allows sending questions as well based on backend route
export const instructorUpdateAssessment = async (assessmentId: string, assessmentData: Partial<Omit<Assessment, 'id' | 'instructor_id' | 'created_at'> & { questions?: Partial<Question>[] }>): Promise<Assessment> => {
  const response = await apiClient.put(`/instructor/assessments/${assessmentId}`, assessmentData);
  return response.data;
};

export const instructorDeleteAssessment = async (assessmentId: string): Promise<void> => {
  await apiClient.delete(`/instructor/assessments/${assessmentId}`);
};

export const instructorListSubmissions = async (assessmentId: string): Promise<Submission[]> => {
  const response = await apiClient.get(`/instructor/assessments/${assessmentId}/submissions`);
  return response.data;
};

export const instructorGradeSubmission = async (submissionId: string, gradeData: { score: number; feedback?: string }): Promise<Submission> => {
  const response = await apiClient.put(`/instructor/submissions/${submissionId}`, gradeData);
  return response.data;
};

// --- Student API --- Student endpoints are prefixed with /student

export const studentListAssessments = async (): Promise<Assessment[]> => {
  const response = await apiClient.get('/student/assessments');
  return response.data;
};

// Assuming this endpoint returns the assessment with its questions
export const studentGetAssessmentDetails = async (assessmentId: string): Promise<Assessment & { questions: Question[] }> => {
  const response = await apiClient.get(`/student/assessments/${assessmentId}`);
  return response.data;
};

export const studentSubmitAssessment = async (assessmentId: string, answers: Record<string, any>): Promise<Submission> => {
  const response = await apiClient.post(`/student/assessments/${assessmentId}/submit`, { answers });
  return response.data;
};

// Assuming this returns the submission with score and feedback
export const studentGetAssessmentResults = async (assessmentId: string): Promise<Submission> => {
  const response = await apiClient.get(`/student/assessments/${assessmentId}/results`);
  return response.data;
};
