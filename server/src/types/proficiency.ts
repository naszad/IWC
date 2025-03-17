import { Request } from 'express';

export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'D1' | 'D2';

export type SkillType = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing' | 'comprehensive';

export interface Assessment {
  date: string;
  level: ProficiencyLevel;
  score: number;
}

export interface Activity {
  id: number;
  type: string;
  name: string;
  date: string;
  result: string;
  progress: number;
  score: number;
  skill: SkillType;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  date: string;
  skill: SkillType;
}

export interface SkillRecommendation {
  skill: SkillType;
  recommendation: string;
}

export interface SkillBreakdown {
  vocabulary: number;
  grammar: number;
  reading: number;
  listening: number;
  speaking: number;
  writing: number;
}

export interface SkillProgressHistory {
  vocabulary: number[];
  grammar: number[];
  reading: number[];
  listening: number[];
  speaking: number[];
  writing: number[];
}

export interface ProficiencyData {
  userId: number;
  username: string;
  currentLevel: ProficiencyLevel;
  startLevel: ProficiencyLevel;
  progressPercentage: number;
  startDate: string;
  studyHours: number;
  completedQuestions: number;
  vocabMastered: number;
  assessmentHistory: Assessment[];
  skillBreakdown: SkillBreakdown;
  skillProgressHistory: SkillProgressHistory;
  recentActivities: Activity[];
  achievements: Achievement[];
  weakAreas: SkillRecommendation[];
  strongAreas: SkillRecommendation[];
}

export interface ProficiencyRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
} 