import { Request, Response } from 'express';
import pool from '../config/database';
import { ProficiencyRequest, SkillType } from '../types/proficiency';

const ENGLISH_LANGUAGE = 'english';

/**
 * Get a user's English proficiency data
 */
export const getProficiencyData = async (req: ProficiencyRequest, res: Response) => {
  try {
    console.log('Received English proficiency data request');
    console.log('User:', req.user);
    
    // Get user ID from request params or from authenticated user
    const userId = req.params.userId ? parseInt(req.params.userId) : req.user?.id;
    
    console.log('Using userId:', userId);
    
    // Validate user ID
    if (!userId) {
      console.log('No user ID found');
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    
    // Check if user exists
    const userResult = await pool.query('SELECT id, username FROM users WHERE id = $1', [userId]);
    console.log('User query result:', userResult.rows[0]);
    
    if (userResult.rows.length === 0) {
      console.log('User not found');
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const user = userResult.rows[0];
    
    // Get English proficiency data
    const proficiencyData = await getLanguageProficiencyData(userId, ENGLISH_LANGUAGE);
    
    res.status(200).json({
      userId: user.id,
      username: user.username,
      ...proficiencyData
    });
    
  } catch (error) {
    console.error('Error fetching English proficiency data:', error);
    res.status(500).json({ error: 'Failed to fetch English proficiency data' });
  }
};

/**
 * Get proficiency data for English
 */
const getLanguageProficiencyData = async (userId: number, language: string) => {
  // Get base language proficiency data
  const proficiencyResult = await pool.query(
    'SELECT * FROM language_proficiency WHERE user_id = $1 AND language = $2',
    [userId, language]
  );
  
  if (proficiencyResult.rows.length === 0) {
    return {
      currentLevel: 'A1',
      startLevel: 'A1',
      progressPercentage: 0,
      startDate: new Date().toISOString().split('T')[0],
      studyHours: 0,
      completedQuestions: 0,
      vocabMastered: 0,
      assessmentHistory: [],
      skillBreakdown: {
        vocabulary: 0,
        grammar: 0,
        reading: 0,
        listening: 0,
        speaking: 0,
        writing: 0
      },
      skillProgressHistory: {
        vocabulary: [],
        grammar: [],
        reading: [],
        listening: [],
        speaking: [],
        writing: []
      },
      recentActivities: [],
      achievements: []
    };
  }
  
  const proficiencyData = proficiencyResult.rows[0];
  
  // Get assessment history
  const assessmentsResult = await pool.query(
    'SELECT date, level, score FROM proficiency_assessments WHERE user_id = $1 AND language = $2 ORDER BY date',
    [userId, language]
  );
  
  // Get skill breakdown
  const skillBreakdownResult = await pool.query(
    'SELECT vocabulary, grammar, reading, listening, speaking, writing FROM skill_breakdowns WHERE user_id = $1 AND language = $2',
    [userId, language]
  );
  
  const skillBreakdown = skillBreakdownResult.rows[0] || {
    vocabulary: 0,
    grammar: 0,
    reading: 0,
    listening: 0,
    speaking: 0,
    writing: 0
  };
  
  // Get skill progress history
  const skillProgressHistory: Record<string, number[]> = {
    vocabulary: [],
    grammar: [],
    reading: [],
    listening: [],
    speaking: [],
    writing: []
  };
  
  // Get data for each skill
  for (const skill of Object.keys(skillProgressHistory)) {
    const progressResult = await pool.query(
      'SELECT score FROM skill_progress WHERE user_id = $1 AND language = $2 AND skill = $3 ORDER BY recorded_at',
      [userId, language, skill]
    );
    
    skillProgressHistory[skill] = progressResult.rows.map(row => row.score);
  }
  
  // Get recent activities
  const activitiesResult = await pool.query(
    'SELECT id, type, name, date, result, progress, score, skill FROM activities WHERE user_id = $1 AND language = $2 ORDER BY date DESC LIMIT 10',
    [userId, language]
  );
  
  // Get achievements
  const achievementsResult = await pool.query(
    'SELECT id, name, description, date, skill FROM achievements WHERE user_id = $1 AND language = $2 ORDER BY date DESC',
    [userId, language]
  );
  
  // Get weak areas
  const weakAreasResult = await pool.query(
    'SELECT skill, recommendation FROM skill_recommendations WHERE user_id = $1 AND language = $2 AND type = $3',
    [userId, language, 'weak']
  );
  
  // Get strong areas
  const strongAreasResult = await pool.query(
    'SELECT skill, recommendation FROM skill_recommendations WHERE user_id = $1 AND language = $2 AND type = $3',
    [userId, language, 'strong']
  );
  
  // Format the data according to the client's expected structure
  return {
    currentLevel: proficiencyData.current_level,
    startLevel: proficiencyData.start_level,
    progressPercentage: proficiencyData.progress_percentage,
    startDate: new Date(proficiencyData.start_date).toISOString().split('T')[0],
    studyHours: proficiencyData.study_hours,
    completedQuestions: proficiencyData.completed_questions,
    vocabMastered: proficiencyData.vocab_mastered,
    assessmentHistory: assessmentsResult.rows.map(row => ({
      date: new Date(row.date).toISOString().split('T')[0],
      level: row.level,
      score: row.score
    })),
    skillBreakdown,
    skillProgressHistory,
    recentActivities: activitiesResult.rows.map(row => ({
      id: row.id,
      type: row.type,
      name: row.name,
      date: new Date(row.date).toISOString().split('T')[0],
      result: row.result,
      progress: row.progress,
      score: row.score,
      skill: row.skill as SkillType
    })),
    achievements: achievementsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      date: new Date(row.date).toISOString().split('T')[0],
      skill: row.skill as SkillType
    })),
    weakAreas: weakAreasResult.rows.map(row => ({
      skill: row.skill as SkillType,
      recommendation: row.recommendation
    })),
    strongAreas: strongAreasResult.rows.map(row => ({
      skill: row.skill as SkillType,
      recommendation: row.recommendation
    }))
  };
};

/**
 * Record a new assessment result
 */
export const recordAssessment = async (req: Request, res: Response) => {
  try {
    const { userId, level, score } = req.body;
    
    if (!userId || !level || score === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Insert the assessment record
    const result = await pool.query(
      'INSERT INTO proficiency_assessments (user_id, language, level, score) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, ENGLISH_LANGUAGE, level, score]
    );
    
    // Update the user's current level and progress percentage
    await pool.query(
      `UPDATE language_proficiency 
       SET current_level = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 AND language = $3`,
      [level, userId, ENGLISH_LANGUAGE]
    );
    
    // Update skill breakdown based on assessment (simplified for example)
    await updateSkillBreakdown(userId, ENGLISH_LANGUAGE, score);
    
    res.status(201).json({ 
      id: result.rows[0].id,
      message: 'Assessment recorded successfully' 
    });
    
  } catch (error) {
    console.error('Error recording assessment:', error);
    res.status(500).json({ error: 'Failed to record assessment' });
  }
};

/**
 * Initialize English proficiency tracking
 */
export const initializeLanguageProficiency = async (req: Request, res: Response) => {
  try {
    const { userId, startLevel } = req.body;
    
    if (!userId || !startLevel) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Check if English proficiency already exists
    const existingResult = await pool.query(
      'SELECT id FROM language_proficiency WHERE user_id = $1 AND language = $2',
      [userId, ENGLISH_LANGUAGE]
    );
    
    if (existingResult.rows.length > 0) {
      res.status(409).json({ error: 'English proficiency already initialized' });
      return;
    }
    
    // Initialize English proficiency
    const result = await pool.query(
      `INSERT INTO language_proficiency 
        (user_id, language, current_level, start_level) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [userId, ENGLISH_LANGUAGE, startLevel, startLevel]
    );
    
    // Initialize skill breakdown with zeros
    await pool.query(
      `INSERT INTO skill_breakdowns 
        (user_id, language, vocabulary, grammar, reading, listening, speaking, writing) 
       VALUES ($1, $2, 0, 0, 0, 0, 0, 0)`,
      [userId, ENGLISH_LANGUAGE]
    );
    
    res.status(201).json({ 
      id: result.rows[0].id,
      message: 'English proficiency initialized successfully' 
    });
    
  } catch (error) {
    console.error('Error initializing English proficiency:', error);
    res.status(500).json({ error: 'Failed to initialize English proficiency' });
  }
};

// Helper functions

/**
 * Update skill breakdown based on assessment score
 */
const updateSkillBreakdown = async (
  userId: number, 
  language: string, 
  score: number
) => {
  try {
    // For simplicity, distribute the score across skills
    // In a real system, you'd have separate scores for each skill from the assessment
    const vocabScore = Math.round(score * 0.8 + Math.random() * 20);
    const grammarScore = Math.round(score * 0.8 + Math.random() * 20);
    const readingScore = Math.round(score * 0.8 + Math.random() * 20);
    const listeningScore = Math.round(score * 0.8 + Math.random() * 20);
    const speakingScore = Math.round(score * 0.7 + Math.random() * 20);
    const writingScore = Math.round(score * 0.7 + Math.random() * 20);
    
    // Update skill breakdown
    await pool.query(
      `UPDATE skill_breakdowns 
       SET vocabulary = $1, grammar = $2, reading = $3, 
           listening = $4, speaking = $5, writing = $6, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $7 AND language = $8`,
      [vocabScore, grammarScore, readingScore, listeningScore, speakingScore, writingScore, userId, language]
    );
    
    // Record progress for each skill
    await recordSkillProgress(userId, language, 'vocabulary', vocabScore);
    await recordSkillProgress(userId, language, 'grammar', grammarScore);
    await recordSkillProgress(userId, language, 'reading', readingScore);
    await recordSkillProgress(userId, language, 'listening', listeningScore);
    await recordSkillProgress(userId, language, 'speaking', speakingScore);
    await recordSkillProgress(userId, language, 'writing', writingScore);
    
  } catch (error) {
    console.error('Error updating skill breakdown:', error);
    throw error;
  }
};

/**
 * Record progress for a specific skill
 */
const recordSkillProgress = async (
  userId: number,
  language: string,
  skill: SkillType,
  score: number
) => {
  try {
    await pool.query(
      `INSERT INTO skill_progress 
        (user_id, language, skill, score) 
       VALUES ($1, $2, $3, $4)`,
      [userId, language, skill, score]
    );
  } catch (error) {
    console.error('Error recording skill progress:', error);
    throw error;
  }
}; 