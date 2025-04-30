const { z } = require('zod');

// Schema for submitting answers to an assessment
const submitAnswersSchema = z.object({
  answers: z.record(z.string(), z.any())
});

// Schema for instructor grading a submission
const gradeSubmissionSchema = z.object({
  score: z.number()
    .min(0, 'Score must be non-negative')
    .max(100, 'Score cannot exceed 100'),
  feedback: z.string().optional()
});

module.exports = {
  submitAnswersSchema,
  gradeSubmissionSchema
}; 