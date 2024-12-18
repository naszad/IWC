import { StudentLevel } from './user';

export interface Test {
  test_id: number;
  teacher_id: number;
  theme: string;
  level: StudentLevel;
  created_at: string;
  questions: Question[];
}

export type QuestionType = 
  | 'picture_vocabulary'
  | 'sequence_order'
  | 'fill_in_the_blank'
  | 'listening_selection';

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

export interface Question {
  question_id: number;
  question_type: QuestionType;
  possible_answers: PictureVocabularyAnswers | SequenceOrderAnswers | FillInTheBlankAnswers | ListeningSelectionAnswers;
  correct_answer: string;
}

export interface TestCreate {
  theme: string;
  level: StudentLevel;
  questions: Omit<Question, 'question_id'>[];
}

export interface TestAttempt {
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

export interface TestToTake extends Test {
  assignment_id: number;
}

export interface TestSubmission {
  assignment_id: number;
  answers: { [key: number]: number };
  time_taken: number;
}