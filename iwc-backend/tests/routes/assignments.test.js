const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'testsecret';

const app = express();
app.use(express.json());

// Mock the pool from assignments route
const pool = require('../../db/pool');
jest.mock('../../db/pool');

// Import assignments routes
const assignmentRoutes = require('../../routes/assignments');
app.use('/api/assignments', assignmentRoutes);

let server;

beforeAll((done) => {
  server = app.listen(() => {
    done();
  });
});

afterAll((done) => {
  if (server) {
    server.close(done);
  } else {
    done();
  }
});

describe('Assignments Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/assignments', () => {
    it('should return 404 when test not found', async () => {
      // First two calls for auth middleware:
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher', created_at: new Date() }]
        })
        .mockResolvedValueOnce({ rows: [{ teacher_id: 1 }] })
        // Next call for BEGIN:
        .mockResolvedValueOnce({})
        // Then testCheck returns empty:
        .mockResolvedValueOnce({ rows: [] })
        // And a ROLLBACK call:
        .mockResolvedValueOnce({});

      const teacherToken = jwt.sign({ id: 1, role: 'teacher', teacher_id: 1 }, process.env.JWT_SECRET);
      const res = await request(server)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ testId: 1, studentIds: [10, 11], dueDate: '2023-12-31' });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Test not found or unauthorized');
    });

    it('should create assignments successfully', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher', created_at: new Date() }]
        }) // Auth middleware: user query
        .mockResolvedValueOnce({ rows: [{ teacher_id: 1 }] }) // Auth middleware: teacher check
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ test_id: 1, teacher_id: 1 }] }) // testCheck (test exists)
        .mockResolvedValueOnce({ rows: [{ student_id: 10 }, { student_id: 11 }] }) // studentsCheck
        .mockResolvedValueOnce({ rows: [{ assignment_id: 100, test_id: 1, student_id: 10 }] }) // Insert for student 10
        .mockResolvedValueOnce({ rows: [{ assignment_id: 101, test_id: 1, student_id: 11 }] }) // Insert for student 11
        .mockResolvedValueOnce({}); // COMMIT

      const teacherToken = jwt.sign({ id: 1, role: 'teacher', teacher_id: 1 }, process.env.JWT_SECRET);
      const res = await request(server)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ testId: 1, studentIds: [10, 11], dueDate: '2023-12-31' });
      expect(res.statusCode).toBe(201);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/assignments/teacher', () => {
    it('should return assignments for teacher', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher', created_at: new Date() }]
        })
        .mockResolvedValueOnce({ rows: [{ teacher_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ assignment_id: 100, test_id: 1, student_id: 10 }] });
      const teacherToken = jwt.sign({ id: 1, role: 'teacher', teacher_id: 1 }, process.env.JWT_SECRET);
      const res = await request(server)
        .get('/api/assignments/teacher')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('PUT /api/assignments/:assignmentId', () => {
    it('should update assignment status', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher', created_at: new Date() }]
        }) // Auth middleware: fetch user
        .mockResolvedValueOnce({ rows: [{ teacher_id: 1 }] }) // Auth middleware: teacher check
        .mockResolvedValueOnce({ rows: [{ assignment_id: 100, status: 'in_progress' }] }); // Update query

      const teacherToken = jwt.sign({ id: 1, role: 'teacher', teacher_id: 1 }, process.env.JWT_SECRET);
      const res = await request(server)
        .put('/api/assignments/100')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'in_progress' });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('in_progress');
    });

    it('should return 404 if assignment not found', async () => {
      // Mock user lookup for auth middleware
      pool.query
        .mockResolvedValueOnce({ 
          rows: [{ id: 1, username: 'teacher1', full_name: 'Test Teacher', role: 'teacher' }] 
        })
        .mockResolvedValueOnce({ 
          rows: [{ teacher_id: 1 }] 
        })
        .mockResolvedValueOnce({ rows: [] }); // Assignment query result
      
      const teacherToken = jwt.sign({ id: 1, role: 'teacher', teacher_id: 1 }, process.env.JWT_SECRET);
      const res = await request(server)
        .put('/api/assignments/999')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'in_progress' });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Assignment not found or unauthorized');
    });
  });

  describe('DELETE /api/assignments/:assignmentId', () => {
    it('should delete assignment successfully', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher', created_at: new Date() }]
        }) // Auth middleware: fetch user
        .mockResolvedValueOnce({ rows: [{ teacher_id: 1 }] }) // Auth middleware: teacher check
        .mockResolvedValueOnce({ rows: [{ assignment_id: 100 }] }); // DELETE query result

      const teacherToken = jwt.sign({ id: 1, role: 'teacher', teacher_id: 1 }, process.env.JWT_SECRET);
      const res = await request(server)
        .delete('/api/assignments/100')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Assignment deleted successfully');
    });
  });

  describe('GET /api/assignments/student', () => {
    it('should return assignments for a student', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 2, username: 'student1', full_name: 'Student One', role: 'student', created_at: new Date() }]
        })
        .mockResolvedValueOnce({ rows: [{ student_id: 2, level: 'A' }] })
        .mockResolvedValueOnce({ rows: [{ assignment_id: 200, test_id: 2 }] });
      const studentToken = jwt.sign({ id: 2, role: 'student', student_id: 2, level: 'A' }, process.env.JWT_SECRET);
      const res = await request(server)
        .get('/api/assignments/student')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
}); 