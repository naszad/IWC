import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Student, Instructor, Admin, UserProfile } from '../interfaces/User';
import api from '../utils/api';

interface AuthContextType {
  user: User | Student | Instructor | Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    role: 'student' | 'instructor';
  }) => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | Student | Instructor | Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token and validate it
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          
          // Transform backend field names to frontend field names
          if (response.data.user) {
            const baseUserData: User = {
              id: response.data.user.id,
              username: response.data.user.username,
              email: response.data.user.email,
              role: response.data.user.role,
              firstName: response.data.user.first_name,
              lastName: response.data.user.last_name,
              bio: response.data.user.bio,
              languagePreferences: response.data.user.language_preferences,
              profileImage: response.data.user.profile_image,
              createdAt: response.data.user.created_at,
              updatedAt: response.data.user.updated_at,
            };
            
            // Add user subtype specific fields based on role
            let typedUser: User | Student | Instructor | Admin = baseUserData;
            
            if (response.data.user.role === 'student') {
              typedUser = {
                ...baseUserData,
                proficiencyLevel: response.data.user.proficiency_level,
                learningGoals: response.data.user.learning_goals,
                studyStreak: response.data.user.study_streak,
                lastActivityDate: response.data.user.last_activity_date,
                nativeLanguage: response.data.user.native_language,
              } as Student;
            } else if (response.data.user.role === 'instructor') {
              typedUser = {
                ...baseUserData,
                specializations: response.data.user.specializations,
                qualifications: response.data.user.qualifications,
                teachingLanguages: response.data.user.teaching_languages,
                availability: response.data.user.availability,
                rating: response.data.user.rating,
              } as Instructor;
            } else if (response.data.user.role === 'admin') {
              typedUser = {
                ...baseUserData,
                specializations: response.data.user.specializations,
                qualifications: response.data.user.qualifications,
                teachingLanguages: response.data.user.teaching_languages,
                availability: response.data.user.availability,
                rating: response.data.user.rating,
                permissions: response.data.user.permissions,
                lastLogin: response.data.user.last_login,
                securityLevel: response.data.user.security_level,
              } as Admin;
            }
            
            setUser(typedUser);
          } else {
            setUser(response.data.user);
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('Auth validation error:', error);
          localStorage.removeItem('auth_token');
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      // Format the user data to ensure consistent field names
      if (response.data.user) {
        const baseUserData: User = {
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          role: response.data.user.role,
          firstName: response.data.user.first_name,
          lastName: response.data.user.last_name,
          bio: response.data.user.bio,
          languagePreferences: response.data.user.language_preferences,
          profileImage: response.data.user.profile_image,
          createdAt: response.data.user.created_at,
          updatedAt: response.data.user.updated_at,
        };
        
        // Add user subtype specific fields based on role
        let typedUser: User | Student | Instructor | Admin = baseUserData;
        
        if (response.data.user.role === 'student') {
          typedUser = {
            ...baseUserData,
            proficiencyLevel: response.data.user.proficiency_level,
            learningGoals: response.data.user.learning_goals,
            studyStreak: response.data.user.study_streak,
            lastActivityDate: response.data.user.last_activity_date,
            nativeLanguage: response.data.user.native_language,
          } as Student;
        } else if (response.data.user.role === 'instructor') {
          typedUser = {
            ...baseUserData,
            specializations: response.data.user.specializations,
            qualifications: response.data.user.qualifications,
            teachingLanguages: response.data.user.teaching_languages,
            availability: response.data.user.availability,
            rating: response.data.user.rating,
          } as Instructor;
        } else if (response.data.user.role === 'admin') {
          typedUser = {
            ...baseUserData,
            specializations: response.data.user.specializations,
            qualifications: response.data.user.qualifications,
            teachingLanguages: response.data.user.teaching_languages,
            availability: response.data.user.availability,
            rating: response.data.user.rating,
            permissions: response.data.user.permissions,
            lastLogin: response.data.user.last_login,
            securityLevel: response.data.user.security_level,
          } as Admin;
        }
        
        console.log('Formatted user data with profile image:', typedUser.profileImage);
        setUser(typedUser);
      } else {
        setUser(response.data.user);
      }
      
      localStorage.setItem('auth_token', response.data.token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    role: 'student' | 'instructor';
  }) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.user) {
        const baseUserData: User = {
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          role: response.data.user.role,
          firstName: response.data.user.first_name,
          lastName: response.data.user.last_name,
          bio: response.data.user.bio,
          languagePreferences: response.data.user.language_preferences,
          profileImage: response.data.user.profile_image,
          createdAt: response.data.user.created_at,
          updatedAt: response.data.user.updated_at,
        };
        
        // Add user subtype specific fields based on role
        let typedUser: User | Student | Instructor = baseUserData;
        
        if (response.data.user.role === 'student') {
          typedUser = {
            ...baseUserData,
            proficiencyLevel: response.data.user.proficiency_level,
            learningGoals: response.data.user.learning_goals,
            studyStreak: response.data.user.study_streak,
            lastActivityDate: response.data.user.last_activity_date,
            nativeLanguage: response.data.user.native_language,
          } as Student;
        } else if (response.data.user.role === 'instructor') {
          typedUser = {
            ...baseUserData,
            specializations: response.data.user.specializations,
            qualifications: response.data.user.qualifications,
            teachingLanguages: response.data.user.teaching_languages,
            availability: response.data.user.availability,
            rating: response.data.user.rating,
          } as Instructor;
        }
        
        setUser(typedUser);
      } else {
        setUser(response.data.user);
      }
      
      localStorage.setItem('auth_token', response.data.token);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      console.log('Profile update response:', response.data);
      
      // Map the backend field names to frontend field names
      if (response.data.user && user) {
        // Make sure we're only updating if we have an existing user
        const baseUserData: User = {
          ...user as User,
          firstName: response.data.user.first_name || (user as User).firstName,
          lastName: response.data.user.last_name || (user as User).lastName,
          bio: response.data.user.bio || (user as User).bio,
          languagePreferences: response.data.user.language_preferences || (user as User).languagePreferences,
          profileImage: response.data.user.profile_image || profileData.profileImage || (user as User).profileImage,
        };
        
        // Add user subtype specific fields based on role
        let updatedUser: User | Student | Instructor | Admin = baseUserData;
        
        if (user.role === 'student') {
          updatedUser = {
            ...baseUserData,
            proficiencyLevel: response.data.user.proficiency_level || (user as Student).proficiencyLevel,
            learningGoals: response.data.user.learning_goals || (user as Student).learningGoals,
            studyStreak: response.data.user.study_streak || (user as Student).studyStreak,
            lastActivityDate: response.data.user.last_activity_date || (user as Student).lastActivityDate,
            nativeLanguage: response.data.user.native_language || (user as Student).nativeLanguage,
          } as Student;
        } else if (user.role === 'instructor') {
          updatedUser = {
            ...baseUserData,
            specializations: response.data.user.specializations || (user as Instructor).specializations,
            qualifications: response.data.user.qualifications || (user as Instructor).qualifications,
            teachingLanguages: response.data.user.teaching_languages || (user as Instructor).teachingLanguages,
            availability: response.data.user.availability || (user as Instructor).availability,
            rating: response.data.user.rating || (user as Instructor).rating,
          } as Instructor;
        } else if (user.role === 'admin') {
          updatedUser = {
            ...baseUserData,
            specializations: response.data.user.specializations || (user as Admin).specializations,
            qualifications: response.data.user.qualifications || (user as Admin).qualifications,
            teachingLanguages: response.data.user.teaching_languages || (user as Admin).teachingLanguages,
            availability: response.data.user.availability || (user as Admin).availability,
            rating: response.data.user.rating || (user as Admin).rating,
            permissions: response.data.user.permissions || (user as Admin).permissions,
            lastLogin: response.data.user.last_login || (user as Admin).lastLogin,
            securityLevel: response.data.user.security_level || (user as Admin).securityLevel,
          } as Admin;
        }
        
        setUser(updatedUser);
      }
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 