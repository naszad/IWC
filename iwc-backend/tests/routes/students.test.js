const request = require('supertest');
const express = require('express');
const mockDb = require('../mocks/db');

// Mock the database module
jest.mock('../../db', () => mockDb);

// Create Express app for testing
const app = express();

// Import routes
const studentRoutes = require('../../routes/students');

// Setup middleware and routes
app.use(express.json());
app.use('/api/students', studentRoutes);

describe('Student Routes', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/students', () => {
    it('should return all students', async () => {
      // Setup mock response
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'Test Student',
          email: 'test@example.com'
        }]
      });

      const response = await request(app)
        .get('/api/students')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Test Student');
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('handles database errors', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      await request(app)
        .get('/api/students')
        .expect(500);
    });
  });

  describe('POST /api/students', () => {
    it('should create a new student', async () => {
      const newStudent = {
        name: 'New Student',
        email: 'new@example.com'
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          ...newStudent
        }]
      });

      const response = await request(app)
        .post('/api/students')
        .send(newStudent)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.name).toBe(newStudent.name);
      expect(response.body.email).toBe(newStudent.email);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('handles validation errors', async () => {
      const invalidStudent = {
        name: '', // Invalid empty name
        email: 'invalid-email' // Invalid email format
      };

      await request(app)
        .post('/api/students')
        .send(invalidStudent)
        .expect(400);
    });
  });
}); 