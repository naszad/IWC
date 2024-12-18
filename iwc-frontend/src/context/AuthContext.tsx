// frontend/src/context/AuthContext.tsx (excerpt)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, registerStudent, registerTeacher } from '../api/index';
import { Student, Teacher } from '../types/user';

type User = Student | Teacher;

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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  registerStudent: (data: StudentRegisterData) => Promise<void>;
  registerTeacher: (data: TeacherRegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await login(username, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleStudentRegister = async (data: StudentRegisterData) => {
    try {
      const response = await registerStudent(data);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    } catch (error) {
      console.error('Student registration error:', error);
      throw error;
    }
  };

  const handleTeacherRegister = async (data: TeacherRegisterData) => {
    try {
      const response = await registerTeacher(data);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    } catch (error) {
      console.error('Teacher registration error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login: handleLogin,
    registerStudent: handleStudentRegister,
    registerTeacher: handleTeacherRegister,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
