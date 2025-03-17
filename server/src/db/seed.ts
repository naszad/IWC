import seedAssessments from './seeders/assessmentSeeder';
import seedProficiencyData from './seeders/proficiencySeeder';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Seed assessments
    await seedAssessments();
    
    // Seed proficiency data
    await seedProficiencyData();
    
    // Add other seeders here if needed
    // e.g., await seedUsers();
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase(); 