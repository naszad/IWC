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
      
      // Prepare question data for bulk insertion
      const questionValues = [];
      const questionParams = [];
      let paramCounter = 1;
      
      for (let i = 0; i < assessmentData.questions.length; i++) {
        const question = assessmentData.questions[i];
        questionValues.push(`($${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++})`);
        questionParams.push(
          assessmentId,
          question.type,
          question.title,
          question.instructions,
          i
        );
      }
      
      // Bulk insert questions
      const questionInsertQuery = `
        INSERT INTO assessment_questions (
          assessment_id, question_type, title, instructions, question_order
        )
        VALUES ${questionValues.join(', ')}
        RETURNING id, question_order
      `;
      
      const questionResult = await client.query(questionInsertQuery, questionParams);
      const questionIds = questionResult.rows;
      
      // Process question-specific data
      for (let i = 0; i < assessmentData.questions.length; i++) {
        const question = assessmentData.questions[i];
        const questionId = questionIds[i].id;
        
        // Insert type-specific question data
        if (question.type === 'multiple-choice' && question.questions && question.questions.length > 0) {
          const mcQuestionValues = [];
          const mcQuestionParams = [];
          let mcParamCounter = 1;
          
          for (const mcQuestion of question.questions) {
            mcQuestionValues.push(`($${mcParamCounter++}, $${mcParamCounter++}, $${mcParamCounter++}, $${mcParamCounter++}, $${mcParamCounter++})`);
            mcQuestionParams.push(
              mcQuestion.id || uuidv4(),
              questionId,
              mcQuestion.text,
              JSON.stringify(mcQuestion.options || []),
              mcQuestion.correctAnswer || ''
            );
          }
          
          if (mcQuestionValues.length > 0) {
            const mcInsertQuery = `
              INSERT INTO multiple_choice_questions (
                id, question_id, text, options, correct_answer
              )
              VALUES ${mcQuestionValues.join(', ')}
            `;
            
            await client.query(mcInsertQuery, mcQuestionParams);
          }
        } else if (question.type === 'matching' && question.matchItems && question.matchItems.length > 0) {
          const matchingValues = [];
          const matchingParams = [];
          let matchParamCounter = 1;
          
          for (const item of question.matchItems) {
            matchingValues.push(`($${matchParamCounter++}, $${matchParamCounter++}, $${matchParamCounter++}, $${matchParamCounter++})`);
            matchingParams.push(
              item.id || uuidv4(),
              questionId,
              item.term,
              item.translation
            );
          }
          
          if (matchingValues.length > 0) {
            const matchingInsertQuery = `
              INSERT INTO matching_items (
                id, question_id, term, translation
              )
              VALUES ${matchingValues.join(', ')}
            `;
            
            await client.query(matchingInsertQuery, matchingParams);
          }
        } else if (question.type === 'fill-in-blank' && question.sentences && question.sentences.length > 0) {
          const sentenceValues = [];
          const sentenceParams = [];
          let sentenceParamCounter = 1;
          
          for (const sentence of question.sentences) {
            sentenceValues.push(`($${sentenceParamCounter++}, $${sentenceParamCounter++}, $${sentenceParamCounter++}, $${sentenceParamCounter++})`);
            sentenceParams.push(
              sentence.id || uuidv4(),
              questionId,
              sentence.text,
              sentence.answer
            );
          }
          
          if (sentenceValues.length > 0) {
            const sentenceInsertQuery = `
              INSERT INTO fill_in_blank_sentences (
                id, question_id, text, answer
              )
              VALUES ${sentenceValues.join(', ')}
            `;
            
            await client.query(sentenceInsertQuery, sentenceParams);
          }
        } else if (question.type === 'flashcards' && question.words && question.words.length > 0) {
          const wordValues = [];
          const wordParams = [];
          let wordParamCounter = 1;
          
          for (const word of question.words) {
            wordValues.push(`($${wordParamCounter++}, $${wordParamCounter++}, $${wordParamCounter++}, $${wordParamCounter++}, $${wordParamCounter++})`);
            wordParams.push(
              word.id || uuidv4(),
              questionId,
              word.term,
              word.translation,
              word.example || null
            );
          }
          
          if (wordValues.length > 0) {
            const wordInsertQuery = `
              INSERT INTO flashcard_words (
                id, question_id, term, translation, example
              )
              VALUES ${wordValues.join(', ')}
            `;
            
            await client.query(wordInsertQuery, wordParams);
          }
        }
      }
      
      // Insert materials using bulk insertion if available
      if (assessmentData.materials && assessmentData.materials.length > 0) {
        const materialValues = [];
        const materialParams = [];
        let materialParamCounter = 1;
        
        for (const material of assessmentData.materials) {
          materialValues.push(`($${materialParamCounter++}, $${materialParamCounter++}, $${materialParamCounter++}, $${materialParamCounter++}, $${materialParamCounter++})`);
          materialParams.push(
            uuidv4(),
            assessmentId,
            material.name,
            material.url,
            material.size
          );
        }
        
        const materialInsertQuery = `
          INSERT INTO assessment_materials (
            id, assessment_id, name, url, size
          )
          VALUES ${materialValues.join(', ')}
        `;
        
        await client.query(materialInsertQuery, materialParams);
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
    
    // Check if assessment exists and get questions in a single transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get assessment details
      const assessmentResult = await client.query(
        'SELECT * FROM assessments WHERE id = $1',
        [id]
      );
      
      if (assessmentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      const assessment = assessmentResult.rows[0];
      
      // Create a new attempt
      const attemptId = uuidv4();
      const now = new Date().toISOString();
      
      await client.query(`
        INSERT INTO assessment_attempts (
          id, assessment_id, user_id, started_at
        )
        VALUES ($1, $2, $3, $4)
      `, [attemptId, id, userId, now]);
      
      // Get questions for this assessment
      const questionsResult = await client.query(`
        SELECT q.*, 
          (SELECT json_agg(
            json_build_object(
              'id', mc.id, 
              'text', mc.text, 
              'options', mc.options, 
              'correctAnswer', mc.correct_answer
            )
          ) FROM multiple_choice_questions mc WHERE mc.question_id = q.id) as multiple_choice_questions,
          (SELECT json_agg(
            json_build_object(
              'id', s.id, 
              'text', s.text, 
              'answer', s.answer
            )
          ) FROM fill_in_blank_sentences s WHERE s.question_id = q.id) as fill_in_blank_sentences,
          (SELECT json_agg(
            json_build_object(
              'id', m.id, 
              'term', m.term, 
              'translation', m.translation
            )
          ) FROM matching_items m WHERE m.question_id = q.id) as matching_items,
          (SELECT json_agg(
            json_build_object(
              'id', f.id, 
              'term', f.term, 
              'translation', f.translation, 
              'example', f.example
            )
          ) FROM flashcard_words f WHERE f.question_id = q.id) as flashcard_words
        FROM assessment_questions q
        WHERE q.assessment_id = $1
        ORDER BY q.question_order
      `, [id]);
      
      // Format the questions
      const questions = questionsResult.rows.map(q => {
        let formattedQuestion = {
          id: q.id,
          type: q.question_type,
          title: q.title,
          instructions: q.instructions
        };
        
        // Add type-specific data
        if (q.question_type === 'multiple-choice' && q.multiple_choice_questions) {
          formattedQuestion = {
            ...formattedQuestion,
            questions: q.multiple_choice_questions
          };
        } else if (q.question_type === 'fill-in-blank' && q.fill_in_blank_sentences) {
          formattedQuestion = {
            ...formattedQuestion,
            sentences: q.fill_in_blank_sentences
          };
        } else if (q.question_type === 'matching' && q.matching_items) {
          formattedQuestion = {
            ...formattedQuestion,
            matchItems: q.matching_items
          };
        } else if (q.question_type === 'flashcards' && q.flashcard_words) {
          formattedQuestion = {
            ...formattedQuestion,
            words: q.flashcard_words
          };
        }
        
        return formattedQuestion;
      });
      
      await client.query('COMMIT');
      
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
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
    
    // Check if assessment exists
    const assessmentResult = await pool.query(`
      SELECT * FROM assessments
      WHERE id = $1
    `, [attempt.assessment_id]);
    
    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
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
    
    // Create a map of question IDs for faster lookup
    const questionsMap = new Map(
      questions.map(q => [String(q.id), q])
    );
    
    // Process each answer
    for (const answer of answers) {
      // Use the map for O(1) lookup instead of array.find()
      const question = questionsMap.get(String(answer.questionId));
      
      if (!question) continue;
      
      let isCorrect = false;
      
      // Type guards for different question types
      const isMultipleChoice = question.type === 'multiple-choice' && 'questions' in question;
      const isFillInBlank = question.type === 'fill-in-blank' && 'sentences' in question;
      const isMatching = question.type === 'matching' && 'matchItems' in question;
      
      // Check answer based on question type
      if (isMultipleChoice && question.questions && question.questions.length > 0) {
        // For multiple choice questions
        const mcQuestion = question.questions[0];
        
        if (mcQuestion.correctAnswer) {
          // Handle answers with "(correct)" suffix - strip it for comparison
          const normalizedUserAnswer = answer.answer.replace(/\s*\(correct\)\s*$/i, '').toLowerCase().trim();
          const normalizedCorrectAnswer = mcQuestion.correctAnswer.replace(/\s*\(correct\)\s*$/i, '').toLowerCase().trim();
          
          // Compare normalized answers
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
          
          // If not correct by direct comparison, try option index-based comparison
          if (!isCorrect && mcQuestion.options) {
            try {
              const normalizedOptions = mcQuestion.options.map((opt: string) => 
                opt.replace(/\s*\(correct\)\s*$/i, '').toLowerCase().trim()
              );
              
              const correctOptionIndex = normalizedOptions.indexOf(normalizedCorrectAnswer);
              const userAnswerIndex = parseInt(normalizedUserAnswer);
              
              if (!isNaN(userAnswerIndex) && correctOptionIndex === userAnswerIndex) {
                isCorrect = true;
              }
            } catch (err) {
              // Continue with other strategies if this fails
            }
          }
        }
      } else if (isFillInBlank && question.sentences) {
        // For fill-in-blank questions, find the matching sentence
        const sentence = question.sentences.find((s: any) => String(s.id) === String(answer.questionId));
        
        if (sentence && sentence.answer) {
          const normalizedUserAnswer = answer.answer.toLowerCase().trim();
          const normalizedCorrectAnswer = sentence.answer.toLowerCase().trim();
          
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        }
      } else if (isMatching && question.matchItems) {
        // For matching questions
        const matchItem = question.matchItems.find((item: any) => String(item.id) === String(answer.questionId));
        
        if (matchItem && matchItem.translation) {
          const normalizedUserAnswer = answer.answer.toLowerCase().trim();
          const normalizedCorrectAnswer = matchItem.translation.toLowerCase().trim();
          
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        }
      }
      
      if (isCorrect) {
        score++;
      }
    }
    
    // Update the attempt with the score and completion time
    const now = new Date().toISOString();
    const scorePercentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    
    await pool.query(`
      UPDATE assessment_attempts
      SET completed_at = $1, score = $2
      WHERE id = $3
    `, [now, scorePercentage, attemptId]);
    
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