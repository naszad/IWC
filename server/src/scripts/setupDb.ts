import { exec } from 'child_process';
import path from 'path';

// Set environment to development to ensure seed data is inserted
process.env.NODE_ENV = 'development';

console.log('Setting up database...');

// Path to migration script relative to the location of this script
const migratePath = path.join(__dirname, '../db/migrate.ts');

// Use ts-node to run the migration script
const command = `npx ts-node ${migratePath}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Error: ${stderr}`);
    return;
  }
  
  console.log(stdout);
  console.log('Database setup complete!');
}); 