// Set up test environment variables
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(() => {
  // Add any global setup here
});

// Global test teardown
afterAll(() => {
  // Add any global cleanup here
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
}); 