export interface Question {
  id: string;
  type: 'multiple-choice' | 'fill-in-blank' | 'matching' | 'flashcards';
  title: string;
  instructions: string;
  questions?: {
    id: string;
    text: string;
    options?: string[];
    correctAnswer?: string;
  }[];
  words?: {
    id: string;
    term: string;
    translation: string;
    example?: string;
  }[];
  sentences?: {
    id: string;
    text: string;
    answer: string;
  }[];
  matchItems?: {
    id: string;
    term: string;
    translation: string;
  }[];
}

export interface Assessment {
  id: string | number;
  title: string;
  description: string;
  language: string;
  level: string;
  category: string;
  duration?: number;
  tags: string[];
  imageUrl?: string;
  createdBy?: string | number;
  createdAt?: string;
  updatedAt?: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  id: string | number;
  type: string;
  title: string;
  instructions?: string;
  // Additional properties based on question type
  questions?: MultipleChoiceItem[];
  matchItems?: MatchingItem[];
  sentences?: FillInBlankSentence[];
  words?: FlashcardWord[];
}

export interface MultipleChoiceItem {
  id: string | number;
  text: string;
  options: string[];
  correctAnswer?: string;
}

export interface MatchingItem {
  id: string | number;
  term: string;
  translation: string;
}

export interface FillInBlankSentence {
  id: string | number;
  text: string;
  answer: string;
}

export interface FlashcardWord {
  id: string | number;
  term: string;
  translation: string;
  example?: string;
}

export interface AssessmentMaterial {
  id?: string | number;
  name: string;
  url: string;
  size?: number;
}

export interface AssessmentCreateDTO {
  title: string;
  description: string;
  language: string;
  level: string;
  category: string;
  duration?: number;
  tags?: string[];
  imageUrl?: string;
  questions: AssessmentQuestion[];
  materials?: AssessmentMaterial[];
}

export interface AssessmentUpdateDTO {
  title?: string;
  description?: string;
  language?: string;
  level?: string;
  category?: string;
  duration?: number;
  tags?: string[];
  imageUrl?: string;
  questions?: AssessmentQuestion[];
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string | number;
  userId: string | number;
  startedAt: string;
  completedAt?: string;
  score?: number;
  answers?: AssessmentAnswer[];
}

export interface AssessmentAnswer {
  questionId: string | number;
  answer: string | any;
  isCorrect?: boolean;
}

export interface AssessmentResult {
  questions: {
    id: string | number;
    question_text: string;
    your_answer: string;
    correct_answer?: string;
    is_correct: boolean;
  }[];
  proficiency_changes: {
    [key: string]: number;
  };
  recommendations: string[];
} 