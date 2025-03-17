import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Assessment, AssessmentCreateDTO, AssessmentUpdateDTO, AssessmentAttempt } from '../types/assessment';
import pool from '../config/database';

// Define custom request interface with user property
interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

/**
 * Get all assessments
 */
export const getAllAssessments = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.username as created_by_username
      FROM assessments a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
    `);
    
    const assessments = result.rows.map(row => formatAssessmentFromDb(row));
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
};

/**
 * Get a single assessment by ID
 */
export const getAssessmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get assessment core data
    const assessmentResult = await pool.query(`
      SELECT a.*, u.username as created_by_username
      FROM assessments a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = $1
    `, [id]);
    
    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    // Get assessment questions
    const questionsResult = await pool.query(`
      SELECT * FROM assessment_questions
      WHERE assessment_id = $1
      ORDER BY question_order
    `, [id]);
    
    // Get question details based on type
    const assessment = formatAssessmentFromDb(assessmentResult.rows[0]);
    assessment.questions = await Promise.all(
      questionsResult.rows.map(async question => {
        return await getFormattedQuestion(question);
      })
    );
    
    res.json(assessment);
  } catch (error) {
    console.error(`Error fetching assessment ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
};

/**
 * Create a new assessment
 */
export const createAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const assessmentData: AssessmentCreateDTO = req.body;
    
    // Validation
    if (!assessmentData.title || !assessmentData.description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    if (!assessmentData.questions || assessmentData.questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required' });
    }
    
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Create assessment - let PostgreSQL generate the ID since it's a SERIAL column
      const createdBy = req.user?.id || null;
      const now = new Date().toISOString();
      
      const assessmentResult = await client.query(`
        INSERT INTO assessments (
          title, description, language, level, category, duration, 
          tags, image_url, created_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        assessmentData.title,
        assessmentData.description,
        assessmentData.language,
        assessmentData.level,
        assessmentData.category,
        assessmentData.duration,
        JSON.stringify(assessmentData.tags),
        assessmentData.imageUrl || null,
        createdBy,
        now,
        now
      ]);

      const assessmentId = assessmentResult.rows[0].id;
      
      // Insert questions - let PostgreSQL generate the IDs since it's a SERIAL column
      for (let i = 0; i < assessmentData.questions.length; i++) {
        const question = assessmentData.questions[i];
        
        const questionResult = await client.query(`
          INSERT INTO assessment_questions (
            assessment_id, question_type, title, instructions, question_order
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [
          assessmentId,
          question.type,
          question.title,
          question.instructions,
          i
        ]);
        
        const questionId = questionResult.rows[0].id;
        
        // Insert type-specific question data
        if (question.type === 'multiple-choice' && question.questions) {
          for (const mcQuestion of question.questions) {
            await client.query(`
              INSERT INTO multiple_choice_questions (
                id, question_id, text, options, correct_answer
              )
              VALUES ($1, $2, $3, $4, $5)
            `, [
              mcQuestion.id || uuidv4(),
              questionId,
              mcQuestion.text,
              JSON.stringify(mcQuestion.options || []),
              mcQuestion.correctAnswer || ''
            ]);
          }
        } else if (question.type === 'matching' && question.matchItems) {
          for (const item of question.matchItems) {
            await client.query(`
              INSERT INTO matching_items (
                id, question_id, term, translation
              )
              VALUES ($1, $2, $3, $4)
            `, [
              item.id || uuidv4(),
              questionId,
              item.term,
              item.translation
            ]);
          }
        } else if (question.type === 'fill-in-blank' && question.sentences) {
          for (const sentence of question.sentences) {
            await client.query(`
              INSERT INTO fill_in_blank_sentences (
                id, question_id, text, answer
              )
              VALUES ($1, $2, $3, $4)
            `, [
              sentence.id || uuidv4(),
              questionId,
              sentence.text,
              sentence.answer
            ]);
          }
        } else if (question.type === 'flashcards' && question.words) {
          for (const word of question.words) {
            await client.query(`
              INSERT INTO flashcard_words (
                id, question_id, term, translation, example
              )
              VALUES ($1, $2, $3, $4, $5)
            `, [
              word.id || uuidv4(),
              questionId,
              word.term,
              word.translation,
              word.example || null
            ]);
          }
        }
      }
      
      // Insert materials if any
      if (assessmentData.materials && assessmentData.materials.length > 0) {
        for (const material of assessmentData.materials) {
          await client.query(`
            INSERT INTO assessment_materials (
              id, assessment_id, name, url, size
            )
            VALUES ($1, $2, $3, $4, $5)
          `, [
            uuidv4(),
            assessmentId,
            material.name,
            material.url,
            material.size
          ]);
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Return the created assessment
      res.status(201).json({
        id: assessmentId,
        title: assessmentData.title,
        message: 'Assessment created successfully'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
};

/**
 * Update an existing assessment
 */
export const updateAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: AssessmentUpdateDTO = req.body;
    
    // Check if assessment exists
    const checkResult = await pool.query(
      'SELECT created_by FROM assessments WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    // Check permission - only the creator can update
    const createdBy = checkResult.rows[0].created_by;
    if (createdBy !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Update assessment
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 1;
    
    if (updateData.title !== undefined) {
      updateFields.push(`title = $${valueIndex}`);
      updateValues.push(updateData.title);
      valueIndex++;
    }
    
    if (updateData.description !== undefined) {
      updateFields.push(`description = $${valueIndex}`);
      updateValues.push(updateData.description);
      valueIndex++;
    }
    
    if (updateData.language !== undefined) {
      updateFields.push(`language = $${valueIndex}`);
      updateValues.push(updateData.language);
      valueIndex++;
    }
    
    if (updateData.level !== undefined) {
      updateFields.push(`level = $${valueIndex}`);
      updateValues.push(updateData.level);
      valueIndex++;
    }
    
    if (updateData.category !== undefined) {
      updateFields.push(`category = $${valueIndex}`);
      updateValues.push(updateData.category);
      valueIndex++;
    }
    
    if (updateData.duration !== undefined) {
      updateFields.push(`duration = $${valueIndex}`);
      updateValues.push(updateData.duration);
      valueIndex++;
    }
    
    if (updateData.tags !== undefined) {
      updateFields.push(`tags = $${valueIndex}`);
      updateValues.push(JSON.stringify(updateData.tags));
      valueIndex++;
    }
    
    if (updateData.imageUrl !== undefined) {
      updateFields.push(`image_url = $${valueIndex}`);
      updateValues.push(updateData.imageUrl);
      valueIndex++;
    }
    
    // Add updated_at
    updateFields.push(`updated_at = $${valueIndex}`);
    updateValues.push(new Date().toISOString());
    valueIndex++;
    
    // Add id as the last parameter
    updateValues.push(id);
    
    if (updateFields.length > 0) {
      await pool.query(
        `UPDATE assessments SET ${updateFields.join(', ')} WHERE id = $${valueIndex}`,
        updateValues
      );
    }
    
    // Update questions if provided
    // (In a real implementation, you'd handle this with more granularity)
    if (updateData.questions !== undefined) {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Delete existing questions and related data
        await client.query(
          'DELETE FROM assessment_questions WHERE assessment_id = $1',
          [id]
        );
        
        // Insert new questions
        for (let i = 0; i < updateData.questions.length; i++) {
          const question = updateData.questions[i];
          const questionId = question.id || uuidv4();
          
          await client.query(`
            INSERT INTO assessment_questions (
              id, assessment_id, question_type, title, instructions, question_order
            )
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            questionId,
            id,
            question.type,
            question.title,
            question.instructions,
            i
          ]);
          
          // Insert type-specific question data (similar to create function)
          // ...Add the code for inserting specific question types here
        }
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    
    // Fetch updated assessment
    return getAssessmentById(req, res);
    
  } catch (error) {
    console.error(`Error updating assessment ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
};

/**
 * Delete an assessment
 */
export const deleteAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if assessment exists and get creator
    const checkResult = await pool.query(
      'SELECT created_by FROM assessments WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    // Check permission - only the creator can delete
    const createdBy = checkResult.rows[0].created_by;
    if (createdBy !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Delete assessment and all related data (using CASCADE in DB schema)
    await pool.query('DELETE FROM assessments WHERE id = $1', [id]);
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting assessment ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
};

/**
 * Start an assessment attempt
 */
export const startAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to start an assessment' });
    }
    
    // Check if assessment exists
    const assessmentResult = await pool.query(
      'SELECT * FROM assessments WHERE id = $1',
      [id]
    );
    
    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    const assessment = assessmentResult.rows[0];
    
    // Create a new attempt
    const attemptId = uuidv4();
    const now = new Date().toISOString();
    
    await pool.query(`
      INSERT INTO assessment_attempts (
        id, assessment_id, user_id, started_at
      )
      VALUES ($1, $2, $3, $4)
    `, [attemptId, id, userId, now]);
    
    // Get questions for this assessment
    const questionsResult = await pool.query(`
      SELECT * FROM assessment_questions
      WHERE assessment_id = $1
      ORDER BY question_order
    `, [id]);
    
    const questions = await Promise.all(
      questionsResult.rows.map(async question => {
        return await getFormattedQuestion(question);
      })
    );
    
    res.status(201).json({
      attemptId,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        questions,
        duration: assessment.duration
      }
    });
  } catch (error) {
    console.error(`Error starting assessment ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to start assessment' });
  }
};

/**
 * Submit answers for an assessment attempt
 */
export const submitAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to submit an assessment' });
    }
    
    // Check if attempt exists and belongs to user
    const attemptResult = await pool.query(`
      SELECT * FROM assessment_attempts
      WHERE id = $1 AND user_id = $2
    `, [attemptId, userId]);
    
    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    
    const attempt = attemptResult.rows[0];
    
    // Check if assessment exists (removed creator check - students take assessments they didn't create)
    const assessmentResult = await pool.query(`
      SELECT * FROM assessments
      WHERE id = $1
    `, [attempt.assessment_id]);
    
    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    const assessment = assessmentResult.rows[0];
    
    // Get all questions for this assessment to check answers
    const questionsResult = await pool.query(`
      SELECT * FROM assessment_questions
      WHERE assessment_id = $1
    `, [attempt.assessment_id]);
    
    const questions = await Promise.all(
      questionsResult.rows.map(async (q) => await getFormattedQuestion(q))
    );
    
    // Calculate score
    let score = 0;
    let totalQuestions = questions.length;
    
    // Process each answer
    for (const answer of answers) {
      // Find matching question - handle both string and number ID formats
      console.log(`Looking for question with ID: ${answer.questionId} (${typeof answer.questionId})`);
      console.log('Available question IDs:', questions.map(q => `${q.id} (${typeof q.id})`));
      
      const question = questions.find(q => 
        q.id === answer.questionId || 
        q.id === parseInt(answer.questionId) || 
        String(q.id) === answer.questionId
      );
      
      if (!question) {
        console.log(`Question not found for ID: ${answer.questionId}`);
        continue;
      }
      
      console.log(`Found matching question:`, question);
      
      let isCorrect = false;
      
      // Debug logs
      console.log(`Processing answer for question ID ${answer.questionId}`);
      console.log(`Question type: ${question.type}`);
      console.log(`User answer: ${answer.answer}`);
      
      // Type guards for different question types
      const isMultipleChoice = question.type === 'multiple-choice' && 'questions' in question;
      const isFillInBlank = question.type === 'fill-in-blank' && 'sentences' in question;
      const isMatching = question.type === 'matching' && 'matchItems' in question;
      
      // Check answer based on question type
      if (isMultipleChoice && question.questions && question.questions.length > 0) {
        // For multiple choice questions
        const mcQuestion = question.questions[0];
        console.log(`MC question full details:`, JSON.stringify(mcQuestion, null, 2));
        
        if (mcQuestion.correctAnswer) {
          // Handle answers with "(correct)" suffix - strip it for comparison
          const normalizedUserAnswer = answer.answer.replace(/\s*\(correct\)\s*$/i, '').toLowerCase().trim();
          const normalizedCorrectAnswer = mcQuestion.correctAnswer.replace(/\s*\(correct\)\s*$/i, '').toLowerCase().trim();
          
          console.log(`Normalized user answer: "${normalizedUserAnswer}"`);
          console.log(`Normalized correct answer: "${normalizedCorrectAnswer}"`);
          // Show exact comparison for debugging
          console.log(`Direct comparison: "${normalizedUserAnswer}" === "${normalizedCorrectAnswer}" ? ${normalizedUserAnswer === normalizedCorrectAnswer}`);
          console.log(`Loose comparison: "${normalizedUserAnswer}" == "${normalizedCorrectAnswer}" ? ${normalizedUserAnswer == normalizedCorrectAnswer}`);
          
          // Try multiple validation strategies to ensure we catch all valid answers
          
          // Strategy 1: Direct text comparison (case insensitive, trimmed)
          let isCorrectStrategy1 = normalizedUserAnswer === normalizedCorrectAnswer;
          console.log(`Strategy 1 (direct text) result: ${isCorrectStrategy1}`);
          
          // Strategy 2: Index-based comparison
          let isCorrectStrategy2 = false;
          
          try {
            const normalizedOptions = mcQuestion.options.map((opt: string) => 
              opt.replace(/\s*\(correct\)\s*$/i, '').toLowerCase().trim()
            );
            
            console.log(`Normalized options: ${JSON.stringify(normalizedOptions)}`);
            
            const userAnswerIndex = normalizedOptions.findIndex(
              (opt: string) => opt === normalizedUserAnswer
            );
            
            const correctAnswerIndex = normalizedOptions.findIndex(
              (opt: string) => opt === normalizedCorrectAnswer
            );
            
            console.log(`User answer index: ${userAnswerIndex}, Correct answer index: ${correctAnswerIndex}`);
            
            // Check if they selected the same option by position
            isCorrectStrategy2 = (userAnswerIndex !== -1 && userAnswerIndex === correctAnswerIndex);
            console.log(`Strategy 2 (index matching) result: ${isCorrectStrategy2}`);
          } catch (error) {
            console.error('Error in strategy 2:', error);
          }
          
          // Strategy 3: Check if the correct answer is part of the user's answer (useful when "(correct)" is included)
          let isCorrectStrategy3 = false;
          
          try {
            // Check if user's answer contains the correct answer text
            isCorrectStrategy3 = normalizedUserAnswer.includes(normalizedCorrectAnswer) || 
                                 normalizedCorrectAnswer.includes(normalizedUserAnswer);
            console.log(`Strategy 3 (substring match) result: ${isCorrectStrategy3}`);
          } catch (error) {
            console.error('Error in strategy 3:', error);
          }
          
          // Strategy 4: Check if the user answered one of the options that contains "(correct)"
          let isCorrectStrategy4 = false;
          
          try {
            // Check if the user selected an option that has "(correct)" in it
            isCorrectStrategy4 = answer.answer.toLowerCase().includes('(correct)');
            console.log(`Strategy 4 (contains correct marker) result: ${isCorrectStrategy4}`);
          } catch (error) {
            console.error('Error in strategy 4:', error);
          }
          
          // Combine all strategies
          isCorrect = isCorrectStrategy1 || isCorrectStrategy2 || isCorrectStrategy3 || isCorrectStrategy4;
          console.log(`Final result - Answer is correct: ${isCorrect}`);
        }
      } 
      else if (isFillInBlank && question.sentences && question.sentences.length > 0) {
        // For fill-in-blank questions
        console.log(`Processing fill-in-blank question with ID ${question.id}`);
        console.log(`Looking for sentence with ID: ${answer.questionId}`);
        
        // Try to find the sentence directly by ID first
        let sentence = question.sentences.find(s => 
          s.id === answer.questionId || 
          s.id === parseInt(answer.questionId) || 
          String(s.id) === answer.questionId
        );
        
        // If sentence not found by direct ID match, use the first sentence as fallback
        if (!sentence && question.sentences.length > 0) {
          console.log(`Sentence not found by ID, using first sentence as fallback`);
          sentence = question.sentences[0];
        }
        
        if (sentence) {
          console.log(`Found sentence: "${sentence.text}" with correct answer: "${sentence.answer}"`);
          
          // Compare the user's answer with the correct answer (case insensitive, trimmed)
          const normalizedUserAnswer = answer.answer.toLowerCase().trim();
          const normalizedCorrectAnswer = sentence.answer.toLowerCase().trim();
          
          console.log(`Comparing answers: "${normalizedUserAnswer}" vs "${normalizedCorrectAnswer}"`);
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
          
          console.log(`Answer is correct: ${isCorrect}`);
        } else {
          console.log(`No sentence found for this answer`);
        }
      }
      else if (isMatching) {
        // For matching questions, the answer format would need to be an object mapping terms to translations
        // This is a simplified example
        isCorrect = true; // Placeholder - implement actual matching logic
      }
      
      if (isCorrect) {
        score++;
      }
      
      // Store the answer in the database (optional)
      // This step would allow you to later show which answers were right/wrong
      try {
        await pool.query(`
          INSERT INTO assessment_answers (
            id, attempt_id, question_id, answer_text, is_correct
          )
          VALUES ($1, $2, $3, $4, $5)
        `, [uuidv4(), attemptId, answer.questionId, answer.answer, isCorrect]);
      } catch (err) {
        console.error('Error storing answer:', err);
        // Continue even if storing the answer fails
      }
    }
    
    // Calculate percentage score
    const scorePercentage = Math.round((score / totalQuestions) * 100);
    
    // Update attempt score
    const now = new Date().toISOString();
    await pool.query(`
      UPDATE assessment_attempts
      SET score = $1, completed_at = $2
      WHERE id = $3
    `, [scorePercentage, now, attemptId]);
    
    res.status(200).json({
      score: scorePercentage,
      totalQuestions,
      correctAnswers: score,
      completedAt: now
    });
  } catch (error) {
    console.error(`Error submitting assessment ${req.params.attemptId}:`, error);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
};

/**
 * Get all assessment attempts for the current user
 */
export const getUserAttempts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to view your attempts' });
    }
    
    // Get all attempts for this user
    const attemptsResult = await pool.query(`
      SELECT 
        aa.id, 
        aa.assessment_id, 
        aa.user_id, 
        aa.started_at, 
        aa.completed_at, 
        aa.score,
        a.title as assessment_title,
        a.description as assessment_description,
        a.duration,
        a.level,
        a.category
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE aa.user_id = $1
      ORDER BY aa.started_at DESC
    `, [userId]);
    
    // Format the response
    const attempts = attemptsResult.rows.map(row => ({
      id: row.id,
      assessmentId: row.assessment_id,
      userId: row.user_id,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      score: row.score,
      assessment: {
        id: row.assessment_id,
        title: row.assessment_title,
        description: row.assessment_description,
        duration: row.duration,
        level: row.level,
        category: row.category
      }
    }));
    
    res.status(200).json(attempts);
  } catch (error) {
    console.error(`Error fetching user attempts:`, error);
    res.status(500).json({ error: 'Failed to fetch assessment attempts' });
  }
};

/**
 * Get detailed results for a specific assessment attempt
 */
export const getAssessmentResults = async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to view assessment results' });
    }
    
    // Get the attempt and check if it belongs to the user
    const attemptResult = await pool.query(`
      SELECT aa.*, a.title as assessment_title
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE aa.id = $1 AND aa.user_id = $2
    `, [attemptId, userId]);
    
    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment attempt not found' });
    }
    
    const attempt = attemptResult.rows[0];
    
    // Check if the attempt is completed
    if (!attempt.completed_at) {
      return res.status(400).json({ error: 'Assessment is not completed yet' });
    }
    
    // Get all answers for this attempt
    const answersResult = await pool.query(`
      SELECT aa.*, aq.title as question_title, aq.question_type
      FROM assessment_answers aa
      JOIN assessment_questions aq ON aa.question_id = aq.id
      WHERE aa.attempt_id = $1
    `, [attemptId]);
    
    // Format the questions and answers
    const questions = await Promise.all(
      answersResult.rows.map(async (row) => {
        // Get the question details
        const questionResult = await pool.query(`
          SELECT * FROM assessment_questions
          WHERE id = $1
        `, [row.question_id]);
        
        if (questionResult.rows.length === 0) {
          return {
            id: row.question_id,
            question_text: row.question_title || 'Unknown question',
            your_answer: row.answer_text || '',
            is_correct: row.is_correct
          };
        }
        
        const question = questionResult.rows[0];
        const formattedQuestion = await getFormattedQuestion(question);
        
        // Get the correct answer based on question type
        let correctAnswer = '';
        
        if (question.question_type === 'multiple-choice' && 'questions' in formattedQuestion) {
          const mcQuestion = formattedQuestion.questions?.[0];
          if (mcQuestion) {
            correctAnswer = mcQuestion.correctAnswer || '';
          }
        } 
        else if (question.question_type === 'fill-in-blank' && 'sentences' in formattedQuestion) {
          // Try to find the sentence by ID
          if (formattedQuestion.sentences && formattedQuestion.sentences.length > 0) {
            // Check if we can find the exact sentence by ID
            const sentenceId = row.question_id; // The question_id in the answers table may be the sentence ID
            const sentence = formattedQuestion.sentences.find(s => 
              s.id === sentenceId || 
              s.id === parseInt(sentenceId as string) || 
              String(s.id) === sentenceId
            );
            
            if (sentence) {
              correctAnswer = sentence.answer || '';
            } else {
              // Fallback to first sentence if not found
              correctAnswer = formattedQuestion.sentences[0].answer || '';
            }
          }
        }
        
        return {
          id: row.question_id,
          question_text: question.title || 'Unknown question',
          your_answer: row.answer_text || '',
          correct_answer: correctAnswer,
          is_correct: row.is_correct
        };
      })
    );
    
    // Calculate proficiency changes (mock data for now)
    const proficiency_changes = {
      vocabulary: 2,
      grammar: 1,
      overall: 2
    };
    
    // Generate recommendations based on performance
    const recommendations = [
      'Continue practicing with more assessments',
      'Review incorrect answers to improve understanding'
    ];
    
    // Return the formatted results
    res.status(200).json({
      questions,
      proficiency_changes,
      recommendations
    });
  } catch (error) {
    console.error(`Error getting assessment results for attempt ${req.params.attemptId}:`, error);
    res.status(500).json({ error: 'Failed to get assessment results' });
  }
};

// Helper functions
const formatAssessmentFromDb = (row: any): Assessment => {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    language: row.language,
    level: row.level,
    category: row.category,
    duration: row.duration,
    questions: [],
    tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
    imageUrl: row.image_url,
    createdBy: row.created_by_username || row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const getFormattedQuestion = async (question: any) => {
  const baseQuestion = {
    id: question.id,
    type: question.question_type,
    title: question.title,
    instructions: question.instructions
  };
  
  if (question.question_type === 'multiple-choice') {
    const mcResult = await pool.query(`
      SELECT * FROM multiple_choice_questions
      WHERE question_id = $1
    `, [question.id]);
    
    return {
      ...baseQuestion,
      questions: mcResult.rows.map(row => ({
        id: row.id,
        text: row.text,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
        correctAnswer: row.correct_answer
      }))
    };
  }
  
  if (question.question_type === 'matching') {
    const matchResult = await pool.query(`
      SELECT * FROM matching_items
      WHERE question_id = $1
    `, [question.id]);
    
    return {
      ...baseQuestion,
      matchItems: matchResult.rows.map(row => ({
        id: row.id,
        term: row.term,
        translation: row.translation
      }))
    };
  }
  
  if (question.question_type === 'fill-in-blank') {
    const fibResult = await pool.query(`
      SELECT * FROM fill_in_blank_sentences
      WHERE question_id = $1
    `, [question.id]);
    
    return {
      ...baseQuestion,
      sentences: fibResult.rows.map(row => ({
        id: row.id,
        text: row.text,
        answer: row.answer
      }))
    };
  }
  
  if (question.question_type === 'flashcards') {
    const fcResult = await pool.query(`
      SELECT * FROM flashcard_words
      WHERE question_id = $1
    `, [question.id]);
    
    return {
      ...baseQuestion,
      words: fcResult.rows.map(row => ({
        id: row.id,
        term: row.term,
        translation: row.translation,
        example: row.example
      }))
    };
  }
  
  return baseQuestion;
};