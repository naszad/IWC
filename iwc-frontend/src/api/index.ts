import axios from 'axios';
import { AuthResponse } from '../types/auth-response';
import { Test, TestAttempt, TestCreate, Question } from '../types/test';
import { StudentLevel } from '../types/user';
import { API_BASE_URL } from '../config';

interface StudentRegisterData {
  username: string;
  password: string;
  full_name: string;
  language: string;
  level: 'A' | 'B' | 'C' | 'D';
}

interface TeacherRegisterData {
  username: string;
  password: string;
  full_name: string;
  email: string;
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const registerStudent = async (data: StudentRegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register/student', data);
  return response.data;
};

export const registerTeacher = async (data: TeacherRegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register/teacher', data);
  return response.data;
};

// Test Management APIs
export const createTest = async (testData: TestCreate): Promise<Test> => {
  const response = await api.post('/tests', testData);
  return response.data;
};

export const updateTest = async (testId: number, testData: Partial<TestCreate>): Promise<Test> => {
  const response = await api.put(`/tests/${testId}`, testData);
  return response.data;
};

export const deleteTest = async (testId: number): Promise<void> => {
  await api.delete(`/tests/${testId}`);
};

export const updateQuestion = async (testId: number, questionIndex: number, questionData: Question): Promise<Test> => {
  const response = await api.put(`/tests/${testId}/questions/${questionIndex}`, questionData);
  return response.data;
};

export const deleteQuestion = async (testId: number, questionIndex: number): Promise<Test> => {
  const response = await api.delete(`/tests/${testId}/questions/${questionIndex}`);
  return response.data;
};

export const getTeacherTests = async (): Promise<Test[]> => {
  const response = await api.get('/tests/teacher');
  return response.data;
};

export const getStudentTests = async (): Promise<Test[]> => {
  const response = await api.get('/tests/student');
  return response.data;
};

export const getTestById = async (testId: number): Promise<Test> => {
  const response = await api.get(`/tests/${testId}`);
  return response.data;
};

export const getTestResults = async (testId: number): Promise<TestAttempt[]> => {
  const response = await api.get(`/tests/${testId}/results`);
  return response.data;
};

export const addQuestion = async (testId: number, questionData: Question): Promise<Test> => {
  const response = await api.post(`/tests/${testId}/questions`, questionData);
  return response.data;
};

// Student Management APIs
export interface StudentInfo {
  student_id: number;
  full_name: string;
  language: string;
  level: StudentLevel;
  created_at: string;
  tests_taken: number;
  average_score: number;
}

export interface StudentProgress {
  full_name: string;
  language: string;
  level: StudentLevel;
  test_name: string;
  score: number;
  attempt_date: string;
  total_questions: number;
  correct_answers: number;
}

export const getTeacherStudents = async (): Promise<StudentInfo[]> => {
  const response = await api.get('/students/teacher-students');
  return response.data;
};

export const getStudentProgress = async (studentId: number): Promise<StudentProgress[]> => {
  const response = await api.get(`/students/student-progress/${studentId}`);
  return response.data;
};

// Assignment Types and APIs
export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue';

export interface TestAssignment {
  assignment_id: number;
  test_id: number;
  student_id: number;
  teacher_id: number;
  assigned_at: string;
  due_date: string | null;
  status: AssignmentStatus;
  theme: string;
  level: StudentLevel;
  student_name: string;
  student_language: string;
  score: number;
  attempt_date: string | null;
}

export interface StudentAssignment {
  assignment_id: number;
  test_id: number;
  theme: string;
  level: string;
  assigned_at: string;
  due_date: string | null;
  status: 'assigned' | 'completed' | 'overdue';
  score: number | null;
  attempt_date: string | null;
}

export const assignTest = async (
  testId: number,
  studentIds: number[],
  dueDate?: string
): Promise<TestAssignment[]> => {
  const response = await api.post('/assignments', { testId, studentIds, dueDate });
  return response.data;
};

export const getTeacherAssignments = async (): Promise<TestAssignment[]> => {
  const response = await api.get('/assignments/teacher');
  return response.data;
};

export const getStudentAssignments = async (): Promise<StudentAssignment[]> => {
  const response = await api.get('/assignments/student');
  return response.data;
};

export const updateAssignmentStatus = async (
  assignmentId: number,
  status: AssignmentStatus
): Promise<TestAssignment> => {
  const response = await api.put(`/assignments/${assignmentId}`, { status });
  return response.data;
};

export const deleteAssignment = async (assignmentId: number): Promise<void> => {
  await api.delete(`/assignments/${assignmentId}`);
};

// Test Taking APIs
export interface PictureVocabularyAnswers {
  media_url: string;
  options: string[];
}

export interface SequenceOrderAnswers {
  sequence: string[];
  media_urls?: string[];
}

export interface FillInTheBlankAnswers {
  choices: string[];
  context?: string;
}

export interface ListeningSelectionAnswers {
  audio_url: string;
  options: string[];
}

export type QuestionAnswers = 
  | { type: 'picture_vocabulary', data: PictureVocabularyAnswers }
  | { type: 'sequence_order', data: SequenceOrderAnswers }
  | { type: 'fill_in_the_blank', data: FillInTheBlankAnswers }
  | { type: 'listening_selection', data: ListeningSelectionAnswers };

export interface TestQuestion {
  question_id: number;
  question_type: 'picture_vocabulary' | 'sequence_order' | 'fill_in_the_blank' | 'listening_selection';
  possible_answers: QuestionAnswers['data'];
  correct_answer: string;
}

export interface TestToTake {
  test_id: number;
  theme: string;
  level: string;
  questions: TestQuestion[];
  assignment_id: number;
}

export const getTestToTake = async (testId: number): Promise<TestToTake> => {
  const response = await api.get(`/tests/${testId}/take`);
  return response.data;
};

export interface TestSubmission {
  assignment_id: number;
  answers: { [key: number]: number };
  time_taken: number;
}

export const submitTest = async (testId: number, submission: TestSubmission) => {
  const response = await api.post(`/tests/${testId}/submit`, submission);
  return response.data;
};

export default api;