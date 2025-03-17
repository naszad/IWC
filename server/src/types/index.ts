export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  language_preferences?: {
    preferredLanguages?: string[];
    learningLanguages?: string[];
    proficiencyLevels?: Record<string, string>;
  };
  profile_image?: string;
  role: 'student' | 'instructor' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface Student extends User {
  proficiency_level: string;
  learning_goals?: string;
  study_streak: number;
  last_activity_date?: Date;
  native_language?: string;
}

export interface Instructor extends User {
  specializations?: string[];
  qualifications?: string;
  teaching_languages?: string[];
  availability?: Record<string, any>;
  rating?: number;
}

export interface Admin extends Instructor {
  permissions?: Record<string, any>;
  last_login?: Date;
  security_level: number;
}

export interface AuthRequest extends Request {
  get(header: string): string | undefined;
  user?: {
    id: number;
    role: string;
  };
}

// Updated UserProfile interface to match our user hierarchy
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
}

// Updated Resource interface to reference assessments instead of lessons
export interface Resource {
  id: number;
  assessment_id: number;
  title: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'link' | 'document';
  url: string;
  description?: string;
  language?: string;
  created_at: Date;
  updated_at: Date;
}

// Add type extensions for Express Request with file upload
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
} 