import pool from '../config/database';

const createProficiencyTables = async () => {
  try {
    console.log('Creating proficiency tracking tables...');
    
    // First, drop tables if they exist to avoid conflicts
    await pool.query(`
      DROP TABLE IF EXISTS skill_progress CASCADE;
      DROP TABLE IF EXISTS skill_recommendations CASCADE;
      DROP TABLE IF EXISTS skill_breakdowns CASCADE;
      DROP TABLE IF EXISTS achievements CASCADE;
      DROP TABLE IF EXISTS activities CASCADE;
      DROP TABLE IF EXISTS proficiency_assessments CASCADE;
      DROP TABLE IF EXISTS language_proficiency CASCADE;
    `);
    
    // User language proficiency table - stores overall language data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS language_proficiency (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        language VARCHAR(50) NOT NULL,
        current_level VARCHAR(10) NOT NULL DEFAULT 'A1' CHECK (current_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2')),
        start_level VARCHAR(10) NOT NULL DEFAULT 'A1' CHECK (start_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2')),
        progress_percentage INTEGER NOT NULL DEFAULT 0,
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        study_hours INTEGER NOT NULL DEFAULT 0,
        completed_questions INTEGER NOT NULL DEFAULT 0,
        vocab_mastered INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, language)
      );
    `);
    
    // Proficiency assessments table - stores assessment history
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proficiency_assessments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        language VARCHAR(50) NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        level VARCHAR(10) NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2')),
        score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Activities table - stores user learning activities
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        language VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        result VARCHAR(50),
        progress INTEGER,
        score INTEGER,
        skill VARCHAR(50) CHECK (skill IN ('vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing', 'comprehensive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Achievements table - stores user achievements
    await pool.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        language VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        skill VARCHAR(50) CHECK (skill IN ('vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing', 'comprehensive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Skill breakdown table - stores current skill levels
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skill_breakdowns (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        language VARCHAR(50) NOT NULL,
        vocabulary INTEGER NOT NULL DEFAULT 0,
        grammar INTEGER NOT NULL DEFAULT 0,
        reading INTEGER NOT NULL DEFAULT 0,
        listening INTEGER NOT NULL DEFAULT 0,
        speaking INTEGER NOT NULL DEFAULT 0,
        writing INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, language)
      );
    `);
    
    // Skill progress history - stores skill progress over time
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skill_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        language VARCHAR(50) NOT NULL,
        skill VARCHAR(50) NOT NULL CHECK (skill IN ('vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing', 'comprehensive')),
        score INTEGER NOT NULL,
        recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Skill recommendations - stores weak/strong areas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skill_recommendations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        language VARCHAR(50) NOT NULL,
        skill VARCHAR(50) NOT NULL CHECK (skill IN ('vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing', 'comprehensive')),
        recommendation TEXT NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('weak', 'strong')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Proficiency tracking tables created successfully');
    
  } catch (error) {
    console.error('Error creating proficiency tables:', error);
    throw error;
  }
};

export default createProficiencyTables; 