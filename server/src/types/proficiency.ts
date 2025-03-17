import { Request } from 'express';

export type SkillType = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing' | 'comprehensive';

export interface ProficiencyLevel {
  level: string;
  name: string;
}

export interface Assessment {
  id: number;
  user_id: number;
  language: string;
  date: string;
  level: string;
  score: number;
  created_at: Date;
  updated_at: Date;
}

export interface Activity {
  id: number;
  user_id: number;
  type: string;
  name: string;
  date: string;
  language: string;
  result?: string;
  progress?: number;
  score?: number;
  skill?: SkillType;
  created_at: Date;
  updated_at: Date;
}

export interface Achievement {
  id: number;
  user_id: number;
  name: string;
  description: string;
  date: string;
  language: string;
  skill?: SkillType;
  created_at: Date;
  updated_at: Date;
}

export interface SkillRecommendation {
  id: number;
  user_id: number;
  language: string;
  skill: SkillType;
  recommendation: string;
  type: 'weak' | 'strong';
  created_at: Date;
  updated_at: Date;
}

export interface SkillBreakdown {
  user_id: number;
  language: string;
  vocabulary: number;
  grammar: number;
  reading: number;
  listening: number;
  speaking: number;
  writing: number;
  created_at: Date;
  updated_at: Date;
}

export interface SkillProgress {
  id: number;
  user_id: number;
  language: string;
  skill: SkillType;
  score: number;
  recorded_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface LanguageProficiency {
  language: string;
  currentLevel: string;
  startLevel: string;
  progressPercentage: number;
  startDate: string;
  studyHours: number;
  completedQuestions: number;
  vocabMastered: number;
  assessmentHistory: {
    date: string;
    level: string;
    score: number;
  }[];
  skillBreakdown: {
    vocabulary: number;
    grammar: number;
    reading: number;
    listening: number;
    speaking: number;
    writing: number;
  };
  skillProgressHistory?: {
    vocabulary: number[];
    grammar: number[];
    reading: number[];
    listening: number[];
    speaking: number[];
    writing: number[];
  };
  recentActivities: {
    id: number;
    type: string;
    name: string;
    date: string;
    result?: string;
    progress?: number;
    score?: number;
    skill?: SkillType;
  }[];
  achievements: {
    id: number;
    name: string;
    description: string;
    date: string;
    skill?: SkillType;
  }[];
  weakAreas?: {
    skill: SkillType;
    recommendation: string;
  }[];
  strongAreas?: {
    skill: SkillType;
    recommendation: string;
  }[];
}

export interface ProficiencyRequest extends Request {
  params: {
    userId?: string;
    language?: string;
  };
  user?: {
    id: number;
    role: string;
  };
}

export interface ProficiencyResponse {
  userId: number;
  username: string;
  languages: LanguageProficiency[];
} 