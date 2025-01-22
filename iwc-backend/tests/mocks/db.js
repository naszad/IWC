// Mock database client
const mockDb = {
  connect: jest.fn().mockResolvedValue(null),
  end: jest.fn().mockResolvedValue(null),
  query: jest.fn(),
  // Add other database methods as needed
};

// Reset all mocks before each test
beforeEach(() => {
  mockDb.query.mockReset();
  mockDb.connect.mockReset();
  mockDb.end.mockReset();
});

module.exports = mockDb; 