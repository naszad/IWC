const pool = require('./pool');

const initDb = async () => {
  try {
    // Create ENUM types if they don't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('student', 'teacher');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE student_level AS ENUM ('A', 'B', 'C', 'D');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE question_type_enum AS ENUM (
          'picture_vocabulary',
          'sequence_order',
          'fill_in_the_blank',
          'listening_selection'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE assignment_status AS ENUM (
          'assigned',
          'in_progress',
          'completed',
          'overdue'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role user_role NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS teachers (
        teacher_id INTEGER PRIMARY KEY,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS students (
        student_id INTEGER PRIMARY KEY,
        language VARCHAR(50) NOT NULL,
        level student_level NOT NULL,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tests (
        test_id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL,
        theme VARCHAR(255),
        level CHAR(1) NOT NULL CHECK (level IN ('A','B','C','D')),
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS questions (
        question_id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL,
        question_type question_type_enum NOT NULL,
        possible_answers JSONB,
        correct_answer TEXT,
        FOREIGN KEY (test_id) REFERENCES tests(test_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS test_assignments (
        assignment_id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        assigned_at TIMESTAMP DEFAULT NOW(),
        due_date TIMESTAMP,
        status assignment_status DEFAULT 'assigned',
        FOREIGN KEY (test_id) REFERENCES tests(test_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
        UNIQUE (test_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS student_tests (
        student_test_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        test_id INTEGER NOT NULL,
        assignment_id INTEGER,
        attempt_date TIMESTAMP DEFAULT NOW(),
        score NUMERIC(5,2),
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests(test_id) ON DELETE CASCADE,
        FOREIGN KEY (assignment_id) REFERENCES test_assignments(assignment_id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS answers (
        answer_id SERIAL PRIMARY KEY,
        student_test_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        given_answer TEXT,
        is_correct BOOLEAN,
        FOREIGN KEY (student_test_id) REFERENCES student_tests(student_test_id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
      );
    `);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
};

module.exports = initDb;