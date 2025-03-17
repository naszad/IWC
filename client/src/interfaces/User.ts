export interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  bio?: string;
  languagePreferences?: {
    preferredLanguages?: string[];
    learningLanguages?: string[];
    proficiencyLevels?: Record<string, string>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Student extends User {
  proficiencyLevel?: string;
  learningGoals?: string;
  studyStreak?: number;
  lastActivityDate?: Date;
  nativeLanguage?: string;
}

export interface Instructor extends User {
  specializations?: string[];
  qualifications?: string;
  teachingLanguages?: string[];
  availability?: Record<string, any>;
  rating?: number;
}

export interface Admin extends Instructor {
  permissions?: Record<string, any>;
  lastLogin?: Date;
  securityLevel?: number;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  bio?: string;
  languagePreferences?: {
    preferredLanguages?: string[];
    learningLanguages?: string[];
    proficiencyLevels?: Record<string, string>;
  };
  profileImage?: string;
  
  // Student-specific fields
  proficiencyLevel?: string;
  learningGoals?: string;
  nativeLanguage?: string;
  
  // Instructor-specific fields
  specializations?: string[];
  qualifications?: string;
  teachingLanguages?: string[];
  availability?: Record<string, any>;
  
  // Stats and achievements (can be fetched separately)
  achievements?: Achievement[];
  languageStats?: {
    language: string;
    proficiencyStart: string;
    proficiencyCurrent: string;
    vocabMastered: number;
    grammarMastered: number;
    listeningHours: number;
    speakingHours: number;
  }[];
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  dateEarned: Date;
  type: 'language_milestone' | 'vocabulary_mastery' | 'grammar_mastery' | 'speaking_practice';
  icon?: string;
} 