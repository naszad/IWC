const { z } = require('zod');

const createAssessmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  open_at: z.string().datetime({ offset: true }, 'Invalid date format for open_at'),
  close_at: z.string().datetime({ offset: true }, 'Invalid date format for close_at'),
  duration_minutes: z.number().int().positive('Duration must be a positive integer'),
  level: z.enum(['A', 'B', 'C', 'D'], 'Level must be one of A, B, C, D'),
  theme: z.enum(['health', 'travel', 'food', 'work', 'education'], 'Theme must be one of the allowed values'),
  questions: z.array(
    z.object({
      prompt: z.string().min(1, 'Question text is required'),
      type: z.enum(['multiple_choice', 'essay', 'short_answer'], 'Question type must be valid'),
      points: z.number().int().positive('Points must be a positive integer'),
      options: z.array(z.string()).optional(),
      correct_answer: z.string().optional(),
    })
  ).optional(),
});

const updateAssessmentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  open_at: z.string().datetime({ offset: true }, 'Invalid date format for open_at').optional(),
  close_at: z.string().datetime({ offset: true }, 'Invalid date format for close_at').optional(),
  duration_minutes: z.number().int().positive('Duration must be a positive integer').optional(),
  level: z.enum(['A', 'B', 'C', 'D'], 'Level must be one of A, B, C, D').optional(),
  theme: z.enum(['health', 'travel', 'food', 'work', 'education'], 'Theme must be one of the allowed values').optional(),
});

module.exports = {
  createAssessmentSchema,
  updateAssessmentSchema,
}; 