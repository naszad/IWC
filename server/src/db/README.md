# Database Model Documentation

## Assessments Module

The assessment system is built with PostgreSQL and provides a comprehensive solution for managing language proficiency assessments. 

### Core Tables

#### `assessments`
Stores core assessment metadata:
- `id` - Primary key
- `title` - Assessment title
- `description` - Detailed description 
- `instructor_id` - ID of instructor who created it (references `instructors.user_id`)
- `created_by` - User ID of creator (references `users.id`)
- `language` - Language being assessed (e.g., 'english', 'spanish')
- `category` - Assessment category (e.g., 'grammar', 'vocabulary')
- `level` - CEFR proficiency level (A1, A2, B1, B2, C1, C2)
- `duration` - Time limit in minutes (optional)
- `passing_score` - Score required to pass (0-100)
- `is_public` - Whether assessment is publicly available
- `tags` - JSONB array of tags
- `image_url` - Optional image URL for the assessment

#### `assessment_questions`
Stores questions for assessments:
- `id` - Primary key
- `assessment_id` - References `assessments.id`
- `question_type` - Type of question (multiple-choice, matching, etc.)
- `title` - Question title
- `instructions` - Instructions for answering
- `question_order` - Order within assessment
- `skill_type` - Skill being tested (vocabulary, grammar, etc.)
- `difficulty` - CEFR proficiency level

### Question Type Tables

#### `multiple_choice_questions`
- `id` - Primary key (UUID)
- `question_id` - References `assessment_questions.id`
- `text` - The question text
- `options` - JSONB array of choices
- `correct_answer` - The correct option

#### `matching_items`
- `id` - Primary key (UUID)
- `question_id` - References `assessment_questions.id`
- `term` - Term to match
- `translation` - Correct translation

#### `fill_in_blank_sentences`
- `id` - Primary key (UUID)
- `question_id` - References `assessment_questions.id`
- `text` - Sentence with blank (marked by underscore)
- `answer` - Correct word(s) for the blank

#### `flashcard_words`
- `id` - Primary key (UUID)
- `question_id` - References `assessment_questions.id`
- `term` - Word or phrase 
- `translation` - Translation
- `example` - Optional example of usage

### Tracking Attempt Progress

#### `assessment_attempts`
Tracks user attempts:
- `id` - Primary key (UUID)
- `assessment_id` - References `assessments.id`
- `user_id` - References `users.id`
- `started_at` - When attempt was started
- `completed_at` - When attempt was completed (null if in progress)
- `score` - Final score (0-100)

#### `assessment_answers`
Stores user answers for each question in an attempt:
- `id` - Primary key (UUID)
- `attempt_id` - References `assessment_attempts.id`
- `question_id` - References `assessment_questions.id`
- `answer_text` - User's answer 
- `is_correct` - Whether answer is correct

### Supporting Tables

#### `assessment_materials`
Additional resources for assessments:
- `id` - Primary key (UUID)
- `assessment_id` - References `assessments.id`
- `name` - Material name
- `url` - URL to resource
- `size` - Size in bytes (optional)

#### `assessment_tags`
Joins assessments to tags:
- `assessment_id` - References `assessments.id` 
- `tag_id` - References `tags.id`

## Using the Database

### Setup

To set up the database:

```
npm run db:setup    # For all platforms with cross-env
npm run db:reset:win # For Windows without cross-env
```

### Development Notes

1. The database uses UUIDs for many tables to ensure global uniqueness.
2. All tables include timestamps for created_at/updated_at.
3. Foreign keys use CASCADE to automatically clean up related records.
4. Most tables use soft typing with CHECK constraints for fields like question_type. 