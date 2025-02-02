const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Ensure test secret is used
process.env.JWT_SECRET = 'testsecret';

const app = express();
app.use(express.json());

// Mock the pool used in the auth routes
const pool = require('../../db/pool');
jest.mock('../../db/pool');

// Import the auth router
const authRoutes = require('../../routes/auth');
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 if user not found', async () => {
      // Simulate user lookup returns no rows
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'password' });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 401 if password is invalid', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, username: 'test', hashed_password: 'hashedpwd', full_name: 'Test User', role: 'teacher' }]
      });
      bcrypt.compare = jest.fn().mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should login successfully for a teacher', async () => {
      // Simulate user lookup and fetch teacher details
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'test', hashed_password: 'hashedpwd', full_name: 'Test User', role: 'teacher' }]
        })
        .mockResolvedValueOnce({
          rows: [{ teacher_id: 1, email: 'teacher@example.com' }]
        });
      bcrypt.compare = jest.fn().mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'correctpassword' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('test');
      expect(res.body.user.email).toBe('teacher@example.com');
    });

    it('should login successfully for a student', async () => {
      // Simulate user lookup and fetch student details
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 2, username: 'student1', hashed_password: 'hashedpwd', full_name: 'Student User', role: 'student' }]
        })
        .mockResolvedValueOnce({
          rows: [{ student_id: 2, language: 'EN', level: 'A' }]
        });
      bcrypt.compare = jest.fn().mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'student1', password: 'correctpassword' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('student1');
      expect(res.body.user.language).toBe('EN');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user for a valid token (teacher)', async () => {
      // Supply mocks for the auth middleware then for the /me route
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher', created_at: new Date() }]
        }) // For auth middleware: fetch user
        .mockResolvedValueOnce({
          rows: [{ teacher_id: 1 }]
        }) // For auth middleware: teacher check
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher', created_at: new Date() }]
        }) // For GET /me: fetch user details
        .mockResolvedValueOnce({
          rows: [{ teacher_id: 1, email: 'teacher@example.com' }]
        }); // For GET /me: fetch teacher details

      const token = jwt.sign({ id: 1, role: 'teacher' }, process.env.JWT_SECRET);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ' + token);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.username).toBe('teacher1');
    });

    it('should return 404 if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const token = jwt.sign({ id: 999, role: 'teacher' }, process.env.JWT_SECRET);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ' + token);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('User not found.');
    });
  });

  describe('POST /api/auth/register/student', () => {
    it('should return 400 if username exists', async () => {
      pool.query
         .mockResolvedValueOnce({})                          // for BEGIN call
         .mockResolvedValueOnce({ rows: [{ id: 2 }] })       // duplicate found
         .mockResolvedValueOnce({});                         // for ROLLBACK call
      const res = await request(app)
        .post('/api/auth/register/student')
        .send({ username: 'existing', password: 'pass', full_name: 'Test', language: 'EN', level: 'A' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Username already exists');
    });

    it('should register a new student successfully', async () => {
      // Simulate no existing user then successful insert of user and student
      pool.query
        .mockResolvedValueOnce({})                         // for BEGIN call
        .mockResolvedValueOnce({ rows: [] })               // duplicate check
        .mockResolvedValueOnce({
          rows: [{ id: 3, username: 'newstudent', hashed_password: 'hashed', full_name: 'New Student', role: 'student' }]
        })  // insert user
        .mockResolvedValueOnce({
          rows: [{ student_id: 3, language: 'EN', level: 'A' }]
        })  // insert student
        .mockResolvedValueOnce({});                        // COMMIT

      bcrypt.hash = jest.fn().mockResolvedValueOnce('hashed');

      const res = await request(app)
        .post('/api/auth/register/student')
        .send({ username: 'newstudent', password: 'password', full_name: 'New Student', language: 'EN', level: 'A' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('newstudent');
      expect(res.body.user.language).toBe('EN');
    });
  });

  describe('POST /api/auth/register/teacher', () => {
    it('should return 400 if username exists', async () => {
      pool.query
         .mockResolvedValueOnce({})                          // for BEGIN call
         .mockResolvedValueOnce({ rows: [{ id: 1 }] })       // duplicate found
         .mockResolvedValueOnce({});                         // for ROLLBACK call
      const res = await request(app)
        .post('/api/auth/register/teacher')
        .send({ username: 'existingteacher', password: 'pass', full_name: 'Test Teacher', email: 't@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Username already exists');
    });

    it('should register a new teacher successfully', async () => {
      pool.query
        .mockResolvedValueOnce({})                             // for BEGIN call
        .mockResolvedValueOnce({ rows: [] })                   // duplicate check
        .mockResolvedValueOnce({
          rows: [{ id: 4, username: 'newteacher', hashed_password: 'hashed', full_name: 'New Teacher', role: 'teacher' }]
        })  // insert user query
        .mockResolvedValueOnce({
          rows: [{ teacher_id: 4, email: 'newteacher@example.com' }]
        })  // insert teacher query
        .mockResolvedValueOnce({});                            // COMMIT

      bcrypt.hash = jest.fn().mockResolvedValueOnce('hashed');

      const res = await request(app)
        .post('/api/auth/register/teacher')
        .send({ username: 'newteacher', password: 'password', full_name: 'New Teacher', email: 'newteacher@example.com' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('newteacher');
      expect(res.body.user.email).toBe('newteacher@example.com');
    });
  });
}); 