import pool from '../../config/database';
import { SkillType } from '../../types/proficiency';

const languages = ['English', 'Spanish', 'French'];
const proficiencyLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];

async function seedProficiencyData() {
  try {
    console.log('Seeding proficiency data...');

    // Clear existing proficiency data
    await pool.query(`
      DELETE FROM skill_recommendations CASCADE;
      DELETE FROM skill_progress CASCADE;
      DELETE FROM skill_breakdowns CASCADE;
      DELETE FROM proficiency_assessments CASCADE;
      DELETE FROM activities CASCADE;
      DELETE FROM achievements CASCADE;
      DELETE FROM language_proficiency CASCADE;
    `);

    // Get all users
    const usersResult = await pool.query('SELECT id FROM users');
    const users = usersResult.rows;

    for (const user of users) {
      // For each user, create proficiency data for 1-2 languages
      const numLanguages = Math.floor(Math.random() * 2) + 1;
      const selectedLanguages = languages
        .sort(() => Math.random() - 0.5)
        .slice(0, numLanguages);

      for (const language of selectedLanguages) {
        // Generate random start level (A1-B2)
        const startLevel = proficiencyLevels[Math.floor(Math.random() * 4)];
        const currentLevel = proficiencyLevels[Math.floor(Math.random() * 4) + 2];

        // Initialize language proficiency
        await pool.query(
          `INSERT INTO language_proficiency 
            (user_id, language, current_level, start_level, progress_percentage, 
             study_hours, completed_questions, vocab_mastered, start_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            user.id,
            language,
            currentLevel,
            startLevel,
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 1000),
            Math.floor(Math.random() * 500),
            Math.floor(Math.random() * 2000),
            new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random date within last year
          ]
        );

        // Initialize skill breakdown
        await pool.query(
          `INSERT INTO skill_breakdowns 
            (user_id, language, vocabulary, grammar, reading, listening, speaking, writing) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            user.id,
            language,
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100)
          ]
        );

        // Generate assessment history
        const numAssessments = Math.floor(Math.random() * 5) + 3;
        for (let i = 0; i < numAssessments; i++) {
          await pool.query(
            `INSERT INTO proficiency_assessments (user_id, language, date, level, score) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              user.id,
              language,
              new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
              proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)],
              Math.floor(Math.random() * 40) + 60 // Scores between 60-100
            ]
          );
        }

        // Generate skill progress history
        const skills: SkillType[] = ['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing'];
        const numProgressEntries = 6; // One entry per month for 6 months

        for (const skill of skills) {
          for (let i = 0; i < numProgressEntries; i++) {
            await pool.query(
              `INSERT INTO skill_progress (user_id, language, skill, score, recorded_at) 
               VALUES ($1, $2, $3, $4, $5)`,
              [
                user.id,
                language,
                skill,
                Math.floor(Math.random() * 40) + 60, // Scores between 60-100
                new Date(Date.now() - (numProgressEntries - i) * 30 * 24 * 60 * 60 * 1000) // One entry per month
              ]
            );
          }
        }

        // Generate activities
        const activityTypes = ['assessment', 'exercise', 'lesson', 'quiz'];
        const numActivities = Math.floor(Math.random() * 10) + 5;

        for (let i = 0; i < numActivities; i++) {
          await pool.query(
            `INSERT INTO activities 
              (user_id, language, type, name, date, result, progress, score, skill) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              user.id,
              language,
              activityTypes[Math.floor(Math.random() * activityTypes.length)],
              `${language} ${activityTypes[Math.floor(Math.random() * activityTypes.length)]} ${i + 1}`,
              new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
              Math.random() > 0.5 ? 'Completed' : 'In Progress',
              Math.floor(Math.random() * 100),
              Math.floor(Math.random() * 40) + 60,
              skills[Math.floor(Math.random() * skills.length)]
            ]
          );
        }

        // Generate achievements
        const achievementNames = [
          'First Steps',
          'Vocabulary Master',
          'Grammar Guru',
          'Reading Champion',
          'Listening Expert',
          'Speaking Star',
          'Writing Wizard'
        ];

        const numAchievements = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numAchievements; i++) {
          await pool.query(
            `INSERT INTO achievements 
              (user_id, language, name, description, date, skill) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              user.id,
              language,
              achievementNames[Math.floor(Math.random() * achievementNames.length)],
              `Achieved ${achievementNames[Math.floor(Math.random() * achievementNames.length)]} in ${language}`,
              new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
              skills[Math.floor(Math.random() * skills.length)]
            ]
          );
        }

        // Generate skill recommendations
        const numWeakAreas = Math.floor(Math.random() * 2) + 1;
        const numStrongAreas = Math.floor(Math.random() * 2) + 1;

        // Weak areas
        for (let i = 0; i < numWeakAreas; i++) {
          const skill = skills[Math.floor(Math.random() * skills.length)];
          await pool.query(
            `INSERT INTO skill_recommendations 
              (user_id, language, skill, recommendation, type) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              user.id,
              language,
              skill,
              `Focus on improving your ${skill} skills through regular practice`,
              'weak'
            ]
          );
        }

        // Strong areas
        for (let i = 0; i < numStrongAreas; i++) {
          const skill = skills[Math.floor(Math.random() * skills.length)];
          await pool.query(
            `INSERT INTO skill_recommendations 
              (user_id, language, skill, recommendation, type) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              user.id,
              language,
              skill,
              `Keep up the great work in ${skill}! Consider more advanced exercises`,
              'strong'
            ]
          );
        }
      }
    }

    console.log('Proficiency data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding proficiency data:', error);
    throw error;
  }
}

export default seedProficiencyData; 