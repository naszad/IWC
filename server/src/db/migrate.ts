import pool from '../config/database';
import createProficiencyTables from './proficiencyMigration';
import createAssessmentTables from './migrations/assessmentMigration';
import seedAssessments from './seeders/assessmentSeeder';

const createTables = async () => {
  try {
    // Drop existing tables
    await pool.query(`
      DROP TABLE IF EXISTS resources CASCADE;
      DROP TABLE IF EXISTS user_assessment_answers CASCADE;
      DROP TABLE IF EXISTS user_assessments CASCADE;
      DROP TABLE IF EXISTS assessment_questions CASCADE;
      DROP TABLE IF EXISTS assessments CASCADE;
      DROP TABLE IF EXISTS assessment_tags CASCADE;
      DROP TABLE IF EXISTS proficiency_assessments CASCADE;
      DROP TABLE IF EXISTS skill_progress CASCADE;
      DROP TABLE IF EXISTS skill_recommendations CASCADE;
      DROP TABLE IF EXISTS skill_breakdowns CASCADE;
      DROP TABLE IF EXISTS achievements CASCADE;
      DROP TABLE IF EXISTS activities CASCADE;
      DROP TABLE IF EXISTS language_proficiency CASCADE;
      DROP TABLE IF EXISTS tags CASCADE;
      DROP TABLE IF EXISTS admins CASCADE;
      DROP TABLE IF EXISTS instructors CASCADE;
      DROP TABLE IF EXISTS students CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create base users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        bio TEXT,
        language_preferences JSONB DEFAULT '{}',
        profile_image TEXT,
        role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create students table (subtype of users)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        proficiency_level VARCHAR(10) DEFAULT 'A1' CHECK (proficiency_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2')),
        learning_goals TEXT,
        study_streak INTEGER DEFAULT 0,
        last_activity_date TIMESTAMP,
        native_language VARCHAR(50)
      );
    `);

    // Create instructors table (subtype of users)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS instructors (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        specializations TEXT[],
        qualifications TEXT,
        teaching_languages TEXT[],
        availability JSONB DEFAULT '{}',
        rating DECIMAL(3,2)
      );
    `);

    // Create admins table (subtype of instructors)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        instructor_id INTEGER PRIMARY KEY REFERENCES instructors(user_id) ON DELETE CASCADE,
        permissions JSONB DEFAULT '{}',
        last_login TIMESTAMP,
        security_level INTEGER DEFAULT 1
      );
    `);

    // Create tags table for reusable tags
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    // Create assessments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        instructor_id INTEGER REFERENCES instructors(user_id) ON DELETE SET NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        language VARCHAR(50) NOT NULL DEFAULT 'english',
        category VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'vocabulary', 'grammar', 'pronunciation', 'conversation', 'writing', 'reading', 'listening')),
        level VARCHAR(50) NOT NULL DEFAULT 'A1' CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2')),
        duration INTEGER DEFAULT NULL,
        passing_score INTEGER NOT NULL DEFAULT 70,
        is_public BOOLEAN NOT NULL DEFAULT TRUE,
        tags JSONB DEFAULT '[]',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create assessment_tags join table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessment_tags (
        assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (assessment_id, tag_id)
      );
    `);

    // Create assessment_questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessment_questions (
        id SERIAL PRIMARY KEY,
        assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
        question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple-choice', 'true-false', 'fill-in-blank', 'matching', 'short-answer', 'essay', 'speaking', 'listening', 'flashcards')),
        title TEXT NOT NULL,
        instructions TEXT,
        question_order INTEGER NOT NULL DEFAULT 0,
        skill_type VARCHAR(50) CHECK (skill_type IN ('vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing')),
        difficulty VARCHAR(10) CHECK (difficulty IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create resources table for assessment-related resources
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('pdf', 'video', 'audio', 'image', 'link', 'document')),
        url TEXT NOT NULL,
        description TEXT,
        language VARCHAR(50) DEFAULT 'english',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create function to automatically add users to appropriate subtype tables
    await pool.query(`
      CREATE OR REPLACE FUNCTION insert_user_subtype()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.role = 'student' THEN
          INSERT INTO students (user_id) VALUES (NEW.id);
        ELSIF NEW.role = 'instructor' THEN
          INSERT INTO instructors (user_id) VALUES (NEW.id);
        ELSIF NEW.role = 'admin' THEN
          INSERT INTO instructors (user_id) VALUES (NEW.id);
          INSERT INTO admins (instructor_id) VALUES (NEW.id);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger to call the function on user insert
    await pool.query(`
      CREATE TRIGGER after_user_insert
      AFTER INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION insert_user_subtype();
    `);

    console.log('Base tables created successfully');
    
    // Create proficiency tracking tables
    await createProficiencyTables();
    
    // Create assessment-specific tables
    await createAssessmentTables();
    
    // Seed development data
    if (process.env.NODE_ENV === 'development') {
      await seedAssessments();
    }
    
    console.log('All tables created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

createTables(); 