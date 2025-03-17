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
  id: string;
  title: string;
  description: string;
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  category: 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing';
  duration: number;
  questions: Question[];
  tags: string[];
  imageUrl?: string;
  materials?: { name: string; url: string; size: number }[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
} 