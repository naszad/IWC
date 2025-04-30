export type UserRole = 'admin' | 'instructor' | 'student';
export type AssessmentLevel = 'A' | 'B' | 'C' | 'D';
export type AssessmentTheme = 'health' | 'travel' | 'food' | 'work' | 'education';
export type QuestionType = 'multiple_choice' | 'essay' | 'short_answer';

export interface User {
  id: string;
  username: string;
  email?: string;
  // password_hash should not be exposed to the frontend
  role: UserRole;
  created_at: string; // Assuming ISO date string format
}

export interface Assessment {
  id: string;
  instructor_id: string;
  title: string;
  description?: string;
  open_at: string; // Assuming ISO date string format
  close_at: string; // Assuming ISO date string format
  duration_minutes: number;
  created_at: string; // Assuming ISO date string format
  level: AssessmentLevel;
  theme: AssessmentTheme;
  // Associations (optional, depending on API responses)
  instructor?: User;
  questions?: Question[];
  submissions?: Submission[];
}

export interface Question {
  id: string;
  assessment_id: string;
  type: QuestionType;
  prompt: string;
  position: number;
  points: number;
  options?: any; // Could be string[] for multiple_choice, structure depends on usage
  correct_answer?: string; // Might be sensitive, consider if needed on frontend
  // Associations (optional)
  assessment?: Assessment;
  submission_answers?: SubmissionAnswer[];
}

export interface Submission {
  id: string;
  assessment_id: string;
  student_id: string;
  score: number; // Sequelize DECIMAL maps to number
  feedback?: string;
  submitted_at: string; // Assuming ISO date string format
  // Associations (optional)
  assessment?: Assessment;
  student?: User;
  answers?: SubmissionAnswer[];
}

export interface SubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  answer?: any; // JSONB can hold various structures
  is_correct?: boolean;
  // Associations (optional)
  submission?: Submission;
  question?: Question;
}

// You might want more specific types for things like Question.options
// depending on how you handle different question types on the frontend.
// For example:
export interface MultipleChoiceQuestion extends Question {
  type: 'multiple_choice';
  options: string[];
  correct_answer: string; // Index or value? Based on backend logic
}

export interface EssayQuestion extends Question {
  type: 'essay';
  options?: undefined;
  correct_answer?: undefined; // Usually manually graded
}

export interface ShortAnswerQuestion extends Question {
  type: 'short_answer';
  options?: undefined;
  correct_answer?: string; // Or potentially an array of acceptable answers
}
