const { sequelize } = require('../src/models');

beforeAll(async () => {
  // Sync database before all tests
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection after all tests
  await sequelize.close();
});

beforeEach(async () => {
  // Clear all tables before each test
  const tables = Object.values(sequelize.models);
  for (const table of tables) {
    await table.destroy({ truncate: true, cascade: true });
  }
}); 