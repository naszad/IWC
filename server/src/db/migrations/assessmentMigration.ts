import pool from '../../config/database';

const createAssessmentTables = async () => {
  try {
    console.log('Creating assessment tables...');

    // First ensure any existing tables are dropped to avoid conflicts
    await pool.query(`
      DROP TABLE IF EXISTS assessment_answers CASCADE;
      DROP TABLE IF EXISTS assessment_attempts CASCADE;
      DROP TABLE IF EXISTS multiple_choice_questions CASCADE;
      DROP TABLE IF EXISTS matching_items CASCADE;
      DROP TABLE IF EXISTS fill_in_blank_sentences CASCADE;
      DROP TABLE IF EXISTS flashcard_words CASCADE;
      DROP TABLE IF EXISTS assessment_materials CASCADE;
    `);

    // Create table for assessment attempts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessment_attempts (
        id VARCHAR(36) PRIMARY KEY,
        assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create table for storing answers to assessment attempts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessment_answers (
        id VARCHAR(36) PRIMARY KEY,
        attempt_id VARCHAR(36) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES assessment_questions(id) ON DELETE CASCADE,
        answer_text TEXT,
        is_correct BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create table for multiple choice questions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS multiple_choice_questions (
        id VARCHAR(36) PRIMARY KEY,
        question_id INTEGER REFERENCES assessment_questions(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        options JSONB,
        correct_answer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create table for matching questions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS matching_items (
        id VARCHAR(36) PRIMARY KEY,
        question_id INTEGER REFERENCES assessment_questions(id) ON DELETE CASCADE,
        term TEXT NOT NULL,
        translation TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create table for fill-in-blank questions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fill_in_blank_sentences (
        id VARCHAR(36) PRIMARY KEY,
        question_id INTEGER REFERENCES assessment_questions(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create table for flashcard questions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS flashcard_words (
        id VARCHAR(36) PRIMARY KEY,
        question_id INTEGER REFERENCES assessment_questions(id) ON DELETE CASCADE,
        term TEXT NOT NULL,
        translation TEXT NOT NULL,
        example TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create table for assessment materials
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessment_materials (
        id VARCHAR(36) PRIMARY KEY,
        assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Assessment tables created successfully');
    
  } catch (error) {
    console.error('Error creating assessment tables:', error);
    throw error;
  }
};

export default createAssessmentTables; 