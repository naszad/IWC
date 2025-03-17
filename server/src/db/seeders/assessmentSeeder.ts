import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

const seedAssessments = async () => {
  try {
    console.log('Seeding assessment data...');
    
    // Clear existing assessment data
    await pool.query(`
      DELETE FROM assessment_materials CASCADE;
      DELETE FROM flashcard_words CASCADE;
      DELETE FROM fill_in_blank_sentences CASCADE;
      DELETE FROM matching_items CASCADE;
      DELETE FROM multiple_choice_questions CASCADE;
      DELETE FROM assessment_answers CASCADE;
      DELETE FROM assessment_attempts CASCADE;
      DELETE FROM assessment_questions CASCADE;
      DELETE FROM assessments CASCADE;
    `);
    
    // Create some test users if they don't exist
    const adminUserId = await ensureUserExists('admin_user', 'admin');
    const instructorUserId = await ensureUserExists('instructor_user', 'instructor');
    
    // Create a vocabulary assessment
    const vocabAssessmentId = await pool.query(`
      INSERT INTO assessments (
        title, description, language, level, category, duration, 
        tags, image_url, created_by, created_at, updated_at
      )
      VALUES (
        'Beginner Vocabulary Assessment', 
        'Test your knowledge of basic vocabulary words',
        'english',
        'A1',
        'vocabulary',
        30,
        '["vocabulary", "beginner", "basic words"]',
        'https://example.com/images/vocab-assessment.jpg',
        $1,
        NOW(),
        NOW()
      )
      RETURNING id
    `, [instructorUserId]);
    
    const vocabId = vocabAssessmentId.rows[0].id;
    
    // Create multiple choice question type
    const mcQuestionId = await pool.query(`
      INSERT INTO assessment_questions (
        assessment_id, question_type, title, instructions, question_order
      )
      VALUES (
        $1,
        'multiple-choice',
        'Choose the correct meaning',
        'Select the best translation for each word',
        0
      )
      RETURNING id
    `, [vocabId]);
    
    const mcId = mcQuestionId.rows[0].id;
    
    // Add multiple choice questions
    await pool.query(`
      INSERT INTO multiple_choice_questions (
        id, question_id, text, options, correct_answer
      )
      VALUES
        ($1, $2, 'What is the meaning of "apple"?', '["fruit", "vegetable", "drink", "dessert"]', 'fruit'),
        ($3, $2, 'What is the meaning of "house"?', '["vehicle", "building", "furniture", "person"]', 'building'),
        ($4, $2, 'What is the meaning of "dog"?', '["animal", "insect", "plant", "tool"]', 'animal')
    `, [uuidv4(), mcId, uuidv4(), uuidv4()]);
    
    // Create a matching question type
    const matchingQuestionId = await pool.query(`
      INSERT INTO assessment_questions (
        assessment_id, question_type, title, instructions, question_order
      )
      VALUES (
        $1,
        'matching',
        'Match the words to their meanings',
        'Drag each word to match its correct translation',
        1
      )
      RETURNING id
    `, [vocabId]);
    
    const matchId = matchingQuestionId.rows[0].id;
    
    // Add matching items
    await pool.query(`
      INSERT INTO matching_items (
        id, question_id, term, translation
      )
      VALUES
        ($1, $2, 'cat', 'gato'),
        ($3, $2, 'dog', 'perro'),
        ($4, $2, 'house', 'casa'),
        ($5, $2, 'car', 'coche')
    `, [uuidv4(), matchId, uuidv4(), uuidv4(), uuidv4()]);
    
    // Create a grammar assessment
    const grammarAssessmentId = await pool.query(`
      INSERT INTO assessments (
        title, description, language, level, category, duration, 
        tags, image_url, created_by, created_at, updated_at
      )
      VALUES (
        'English Grammar for Beginners', 
        'Test your knowledge of basic English grammar rules',
        'english',
        'A2',
        'grammar',
        45,
        '["grammar", "beginner", "parts of speech"]',
        'https://example.com/images/grammar-assessment.jpg',
        $1,
        NOW(),
        NOW()
      )
      RETURNING id
    `, [instructorUserId]);
    
    const grammarId = grammarAssessmentId.rows[0].id;
    
    // Create fill-in-blank question type
    const fibQuestionId = await pool.query(`
      INSERT INTO assessment_questions (
        assessment_id, question_type, title, instructions, question_order
      )
      VALUES (
        $1,
        'fill-in-blank',
        'Complete the sentences',
        'Fill in the blanks with the correct word',
        0
      )
      RETURNING id
    `, [grammarId]);
    
    const fibId = fibQuestionId.rows[0].id;
    
    // Add fill-in-blank sentences
    await pool.query(`
      INSERT INTO fill_in_blank_sentences (
        id, question_id, text, answer
      )
      VALUES
        ($1, $2, 'I [blank] to the store yesterday.', 'went'),
        ($3, $2, 'She [blank] three languages fluently.', 'speaks'),
        ($4, $2, 'They [blank] studying for two hours.', 'have been'),
        ($5, $2, 'We [blank] dinner when the phone rang.', 'were eating'),
        ($6, $2, 'The children [blank] in the park every weekend.', 'play')
    `, [uuidv4(), fibId, uuidv4(), uuidv4(), uuidv4(), uuidv4()]);
    
    // Create another fill-in-blank question for variety
    const fib2QuestionId = await pool.query(`
      INSERT INTO assessment_questions (
        assessment_id, question_type, title, instructions, question_order
      )
      VALUES (
        $1,
        'fill-in-blank',
        'Verb Tense Practice',
        'Fill in the blanks with the correct form of the verb in parentheses',
        1
      )
      RETURNING id
    `, [grammarId]);
    
    const fib2Id = fib2QuestionId.rows[0].id;
    
    // Add more fill-in-blank sentences with a different pattern
    await pool.query(`
      INSERT INTO fill_in_blank_sentences (
        id, question_id, text, answer
      )
      VALUES
        ($1, $2, 'If it [blank] tomorrow, we will stay home. (rain)', 'rains'),
        ($3, $2, 'She [blank] the piano since she was five. (play)', 'has been playing'),
        ($4, $2, 'By next year, they [blank] their house. (finish)', 'will have finished')
    `, [uuidv4(), fib2Id, uuidv4(), uuidv4()]);
    
    console.log('Assessment data seeded successfully');
  } catch (error) {
    console.error('Error seeding assessment data:', error);
    throw error;
  }
};

// Helper to ensure users exist
async function ensureUserExists(username: string, role: string) {
  const userCheck = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  
  if (userCheck.rows.length > 0) {
    return userCheck.rows[0].id;
  }
  
  // Create a new user
  const result = await pool.query(`
    INSERT INTO users (
      username, email, password, first_name, last_name, role
    )
    VALUES (
      $1, $2, $3, $4, $5, $6
    )
    RETURNING id
  `, [
    username,
    `${username}@example.com`,
    '$2b$10$mCE4fGbEcmvZo7cAKJjlYubJwFN2bHGYXRvQw9wm7MYY9qPiWIw8a', // hashed 'password123'
    role === 'admin' ? 'Admin' : 'Instructor',
    'User',
    role
  ]);
  
  return result.rows[0].id;
}

export default seedAssessments; 