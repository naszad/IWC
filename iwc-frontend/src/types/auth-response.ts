import { Student, Teacher } from './user';

export interface AuthResponse {
  token: string;
  user: Student | Teacher;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  status?: number;
}