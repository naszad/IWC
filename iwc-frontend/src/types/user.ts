export type UserRole = 'student' | 'teacher';
export type StudentLevel = 'A' | 'B' | 'C' | 'D';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Student extends User {
  role: 'student';
  student_id: number;
  language: string;
  level: StudentLevel;
}

export interface Teacher extends User {
  role: 'teacher';
  teacher_id: number;
  email: string;
}

export interface Test {
  test_id: number;
  teacher_id: number;
  theme: string;
  level: StudentLevel;
  created_at: string;
}

export type QuestionType = 
  | 'picture_vocabulary'
  | 'sequence_order'
  | 'fill_in_the_blank'
  | 'listening_selection';

export interface Question {
  question_id: number;
  test_id: number;
  question_type: QuestionType;
  possible_answers: any; // JSONB in database
  correct_answer: string;
}

export interface StudentTest {
  student_test_id: number;
  student_id: number;
  test_id: number;
  attempt_date: string;
  score: number;
}

export interface Answer {
  answer_id: number;
  student_test_id: number;
  question_id: number;
  given_answer: string;
  is_correct: boolean;
}