import { Request, Response } from 'express';
import pool from '../config/database';
import { ProficiencyRequest, LanguageProficiency, SkillType } from '../types/proficiency';

/**
 * Get a user's proficiency data for all languages or a specific language
 */
export const getProficiencyData = async (req: ProficiencyRequest, res: Response) => {
  try {
    // Get user ID from request params or from authenticated user
    const userId = req.params.userId ? parseInt(req.params.userId) : req.user?.id;
    const language = req.params.language;
    
    // Validate user ID
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Check if user exists
    const userResult = await pool.query('SELECT id, username FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get languages the user is learning
    const languagesQuery = language 
      ? 'SELECT language FROM language_proficiency WHERE user_id = $1 AND language = $2'
      : 'SELECT language FROM language_proficiency WHERE user_id = $1';
    
    const languageParams = language ? [userId, language] : [userId];
    const languagesResult = await pool.query(languagesQuery, languageParams);
    
    if (languagesResult.rows.length === 0) {
      return res.status(404).json({ 
        error: language 
          ? `User is not learning ${language}` 
          : 'User is not learning any languages' 
      });
    }
    
    // Get proficiency data for each language
    const languages = await Promise.all(
      languagesResult.rows.map(async (row) => {
        return await getLanguageProficiencyData(userId, row.language);
      })
    );
    
    return res.status(200).json({
      userId: user.id,
      username: user.username,
      languages
    });
    
  } catch (error) {
    console.error('Error fetching proficiency data:', error);
    return res.status(500).json({ error: 'Failed to fetch proficiency data' });
  }
};

/**
 * Get proficiency data for a specific language
 */
const getLanguageProficiencyData = async (userId: number, language: string): Promise<LanguageProficiency> => {
  // Get base language proficiency data
  const proficiencyResult = await pool.query(
    'SELECT * FROM language_proficiency WHERE user_id = $1 AND language = $2',
    [userId, language]
  );
  
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
    language,
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
    const { userId, language, level, score } = req.body;
    
    if (!userId || !language || !level || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert the assessment record
    const result = await pool.query(
      'INSERT INTO proficiency_assessments (user_id, language, level, score) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, language, level, score]
    );
    
    // Update the user's current level and progress percentage
    await pool.query(
      `UPDATE language_proficiency 
       SET current_level = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 AND language = $3`,
      [level, userId, language]
    );
    
    // Update skill breakdown based on assessment (simplified for example)
    await updateSkillBreakdown(userId, language, score);
    
    return res.status(201).json({ 
      id: result.rows[0].id,
      message: 'Assessment recorded successfully' 
    });
    
  } catch (error) {
    console.error('Error recording assessment:', error);
    return res.status(500).json({ error: 'Failed to record assessment' });
  }
};

/**
 * Record a new activity
 */
export const recordActivity = async (req: Request, res: Response) => {
  try {
    const { userId, language, type, name, result: activityResult, progress, score, skill } = req.body;
    
    if (!userId || !language || !type || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert the activity record
    const result = await pool.query(
      `INSERT INTO activities 
        (user_id, language, type, name, result, progress, score, skill) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id`,
      [userId, language, type, name, activityResult, progress, score, skill]
    );
    
    // Update completed questions count
    await pool.query(
      `UPDATE language_proficiency 
       SET completed_questions = completed_questions + 1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND language = $2`,
      [userId, language]
    );
    
    // If it's a vocabulary activity with a score, update vocab_mastered
    if (skill === 'vocabulary' && score && score > 70) {
      await pool.query(
        `UPDATE language_proficiency 
         SET vocab_mastered = vocab_mastered + 5, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND language = $2`,
        [userId, language]
      );
    }
    
    // If there's a skill and score, update skill progress
    if (skill && score) {
      await recordSkillProgress(userId, language, skill as SkillType, score);
    }
    
    return res.status(201).json({ 
      id: result.rows[0].id,
      message: 'Activity recorded successfully' 
    });
    
  } catch (error) {
    console.error('Error recording activity:', error);
    return res.status(500).json({ error: 'Failed to record activity' });
  }
};

/**
 * Record achievement for a user
 */
export const recordAchievement = async (req: Request, res: Response) => {
  try {
    const { userId, language, name, description, skill } = req.body;
    
    if (!userId || !language || !name || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if the achievement already exists
    const existingResult = await pool.query(
      'SELECT id FROM achievements WHERE user_id = $1 AND language = $2 AND name = $3',
      [userId, language, name]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Achievement already recorded' });
    }
    
    // Insert the achievement record
    const result = await pool.query(
      `INSERT INTO achievements 
        (user_id, language, name, description, skill) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      [userId, language, name, description, skill]
    );
    
    return res.status(201).json({ 
      id: result.rows[0].id,
      message: 'Achievement recorded successfully' 
    });
    
  } catch (error) {
    console.error('Error recording achievement:', error);
    return res.status(500).json({ error: 'Failed to record achievement' });
  }
};

/**
 * Add or update a skill recommendation
 */
export const updateSkillRecommendation = async (req: Request, res: Response) => {
  try {
    const { userId, language, skill, recommendation, type } = req.body;
    
    if (!userId || !language || !skill || !recommendation || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (type !== 'weak' && type !== 'strong') {
      return res.status(400).json({ error: 'Type must be either "weak" or "strong"' });
    }
    
    // Check if recommendation already exists
    const existingResult = await pool.query(
      'SELECT id FROM skill_recommendations WHERE user_id = $1 AND language = $2 AND skill = $3 AND type = $4',
      [userId, language, skill, type]
    );
    
    if (existingResult.rows.length > 0) {
      // Update existing recommendation
      await pool.query(
        `UPDATE skill_recommendations 
         SET recommendation = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $2 AND language = $3 AND skill = $4 AND type = $5`,
        [recommendation, userId, language, skill, type]
      );
      
      return res.status(200).json({ 
        id: existingResult.rows[0].id,
        message: 'Skill recommendation updated successfully' 
      });
    } else {
      // Insert new recommendation
      const result = await pool.query(
        `INSERT INTO skill_recommendations 
          (user_id, language, skill, recommendation, type) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        [userId, language, skill, recommendation, type]
      );
      
      return res.status(201).json({ 
        id: result.rows[0].id,
        message: 'Skill recommendation added successfully' 
      });
    }
    
  } catch (error) {
    console.error('Error updating skill recommendation:', error);
    return res.status(500).json({ error: 'Failed to update skill recommendation' });
  }
};

/**
 * Update study hours
 */
export const updateStudyHours = async (req: Request, res: Response) => {
  try {
    const { userId, language, hours } = req.body;
    
    if (!userId || !language || hours === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (hours <= 0) {
      return res.status(400).json({ error: 'Hours must be a positive number' });
    }
    
    // Update study hours
    await pool.query(
      `UPDATE language_proficiency 
       SET study_hours = study_hours + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 AND language = $3`,
      [hours, userId, language]
    );
    
    return res.status(200).json({ 
      message: 'Study hours updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating study hours:', error);
    return res.status(500).json({ error: 'Failed to update study hours' });
  }
};

/**
 * Initialize proficiency tracking for a new language
 */
export const initializeLanguageProficiency = async (req: Request, res: Response) => {
  try {
    const { userId, language, startLevel } = req.body;
    
    if (!userId || !language || !startLevel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if language proficiency already exists
    const existingResult = await pool.query(
      'SELECT id FROM language_proficiency WHERE user_id = $1 AND language = $2',
      [userId, language]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Language proficiency already initialized' });
    }
    
    // Initialize language proficiency
    const result = await pool.query(
      `INSERT INTO language_proficiency 
        (user_id, language, current_level, start_level) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [userId, language, startLevel, startLevel]
    );
    
    // Initialize skill breakdown with zeros
    await pool.query(
      `INSERT INTO skill_breakdowns 
        (user_id, language, vocabulary, grammar, reading, listening, speaking, writing) 
       VALUES ($1, $2, 0, 0, 0, 0, 0, 0)`,
      [userId, language]
    );
    
    return res.status(201).json({ 
      id: result.rows[0].id,
      message: 'Language proficiency initialized successfully' 
    });
    
  } catch (error) {
    console.error('Error initializing language proficiency:', error);
    return res.status(500).json({ error: 'Failed to initialize language proficiency' });
  }
};

// Helper functions

/**
 * Record a new skill progress entry
 */
const recordSkillProgress = async (
  userId: number, 
  language: string, 
  skill: SkillType, 
  score: number
) => {
  try {
    // Record new skill progress
    await pool.query(
      `INSERT INTO skill_progress 
        (user_id, language, skill, score) 
       VALUES ($1, $2, $3, $4)`,
      [userId, language, skill, score]
    );
    
    // Update skill breakdown
    await pool.query(
      `UPDATE skill_breakdowns 
       SET ${skill} = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 AND language = $3`,
      [score, userId, language]
    );
    
    // If score is particularly high or low, potentially create a recommendation
    if (score >= 85) {
      const recommendationText = getRecommendationForStrongSkill(skill);
      await updateSkillRecommendationInternal(userId, language, skill, recommendationText, 'strong');
    } else if (score <= 50) {
      const recommendationText = getRecommendationForWeakSkill(skill);
      await updateSkillRecommendationInternal(userId, language, skill, recommendationText, 'weak');
    }
    
  } catch (error) {
    console.error('Error recording skill progress:', error);
    throw error;
  }
};

/**
 * Update skill recommendations without API response handling
 */
const updateSkillRecommendationInternal = async (
  userId: number, 
  language: string, 
  skill: SkillType, 
  recommendation: string, 
  type: 'weak' | 'strong'
) => {
  try {
    // Check if recommendation already exists
    const existingResult = await pool.query(
      'SELECT id FROM skill_recommendations WHERE user_id = $1 AND language = $2 AND skill = $3 AND type = $4',
      [userId, language, skill, type]
    );
    
    if (existingResult.rows.length > 0) {
      // Update existing recommendation
      await pool.query(
        `UPDATE skill_recommendations 
         SET recommendation = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $2 AND language = $3 AND skill = $4 AND type = $5`,
        [recommendation, userId, language, skill, type]
      );
    } else {
      // Insert new recommendation
      await pool.query(
        `INSERT INTO skill_recommendations 
          (user_id, language, skill, recommendation, type) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, language, skill, recommendation, type]
      );
    }
  } catch (error) {
    console.error('Error updating skill recommendation internally:', error);
    throw error;
  }
};

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
 * Get recommendation text for a strong skill
 */
const getRecommendationForStrongSkill = (skill: SkillType): string => {
  switch (skill) {
    case 'vocabulary':
      return 'Continue expanding specialized vocabulary';
    case 'grammar':
      return 'Move on to more complex grammatical structures';
    case 'reading':
      return 'Try more challenging authentic texts';
    case 'listening':
      return 'Move to more advanced listening materials';
    case 'speaking':
      return 'Practice with native speakers on more complex topics';
    case 'writing':
      return 'Focus on writing longer, more complex texts';
    case 'comprehensive':
      return 'Consider preparing for a higher level proficiency exam';
    default:
      return 'Continue practicing to maintain your strength';
  }
};

/**
 * Get recommendation text for a weak skill
 */
const getRecommendationForWeakSkill = (skill: SkillType): string => {
  switch (skill) {
    case 'vocabulary':
      return 'Focus on expanding your everyday vocabulary';
    case 'grammar':
      return 'Review basic grammatical structures';
    case 'reading':
      return 'Practice with shorter, simpler texts';
    case 'listening':
      return 'Try podcasts designed for language learners';
    case 'speaking':
      return 'Practice with conversation partners more frequently';
    case 'writing':
      return 'Focus on structuring paragraphs and essays';
    case 'comprehensive':
      return 'Consider taking a structured assessment to build your foundation';
    default:
      return 'Schedule regular practice sessions to improve';
  }
}; 