import pool from '../config/database';

const checkSchema = async () => {
  try {
    // Check if the users table exists and its columns
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);

    console.log('Users table schema:');
    console.log(result.rows);

    // List all tables in the database
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

    console.log('\nAll tables in database:');
    console.log(tables.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
};

checkSchema(); 