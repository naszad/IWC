const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'testsecret';

const app = express();
app.use(express.json());

// Mock the pool from the tests route
const pool = require('../../db/pool');
jest.mock('../../db/pool');

// Import tests routes
const testsRoutes = require('../../routes/tests');
app.use('/api/tests', testsRoutes);

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

describe('Tests Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/tests', () => {
    it('should create a new test successfully', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher', created_at: new Date() }]
        }) // Auth middleware: user
        .mockResolvedValueOnce({ rows: [{ teacher_id: 1 }] }) // Auth middleware: teacher check
        .mockResolvedValueOnce({}) // BEGIN (in route)
        .mockResolvedValueOnce({
          rows: [{ test_id: 1, theme: 'Math', level: 'A', teacher_id: 1 }]
        }) // Insert test
        .mockResolvedValueOnce({}) // Insert first question
        .mockResolvedValueOnce({}) // Insert second question
        .mockResolvedValueOnce({}); // COMMIT

      const teacherToken = jwt.sign({ id: 1, role: 'teacher', teacher_id: 1 }, process.env.JWT_SECRET);
      const testPayload = {
        theme: 'Math',
        level: 'A',
        questions: [
          { possible_answers: ['1', '2', '3'], correct_answer: '2' },
          { possible_answers: ['4', '5', '6'], correct_answer: '5' }
        ]
      };
      const res = await request(server)
        .post('/api/tests')
        .set('Authorization', 'Bearer ' + teacherToken)
        .send(testPayload);
      expect(res.statusCode).toBe(201);
      expect(res.body.test_id).toBe(1);
      expect(res.body.theme).toBe('Math');
    });
  });

  describe('GET /api/tests/teacher', () => {
    it('should return tests for a teacher', async () => {
      pool.query
        .mockResolvedValueOnce({ 
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher' }] 
        }) // Auth middleware: user lookup
        .mockResolvedValueOnce({ 
          rows: [{ teacher_id: 1 }] 
        }) // Auth middleware: teacher check
        .mockResolvedValueOnce({
          rows: [{ test_id: 1, theme: 'Math', level: 'A', teacher_id: 1 }]
        }); // Actual test data
      const teacherToken = jwt.sign({ id: 1, role: 'teacher', teacher_id: 1 }, process.env.JWT_SECRET);
      const res = await request(server)
        .get('/api/tests/teacher')
        .set('Authorization', 'Bearer ' + teacherToken);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/tests/:id', () => {
    it('should return a specific test with questions for a teacher', async () => {
      pool.query
        .mockResolvedValueOnce({ 
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher' }] 
        }) // Auth middleware: user lookup
        .mockResolvedValueOnce({ 
          rows: [{ teacher_id: 1 }] 
        }) // Auth middleware: teacher check
        .mockResolvedValueOnce({ // For test details
          rows: [{ test_id: 1, theme: 'Science', level: 'A', teacher_id: 1 }]
        })
        .mockResolvedValueOnce({ // For questions details
          rows: [{
            question_id: 10,
            possible_answers: '{"1": "a", "2": "b"}',
            correct_answer: '1',
            question_order: 1
          }]
        });
      const teacherToken = jwt.sign({ id: 1, role: 'teacher', teacher_id: 1 }, process.env.JWT_SECRET);
      const res = await request(server)
        .get('/api/tests/1')
        .set('Authorization', 'Bearer ' + teacherToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.test_id).toBe(1);
      expect(res.body.questions).toBeDefined();
    });
  });

  describe('GET /api/tests/:id/take', () => {
    it('should allow a student to take a test when assigned and valid', async () => {
      pool.query
         .mockResolvedValueOnce({
            rows: [{ id: 2, username: 'student1', full_name: 'Student One', role: 'student', created_at: new Date() }]
         }) // Auth middleware: fetch user
         .mockResolvedValueOnce({ rows: [{ student_id: 2, level: 'B' }] }) // Auth middleware: student check
         // Test existence query:
         .mockResolvedValueOnce({ rows: [{ test_id: 2, level: 'B' }] })
         // Student level check:
         .mockResolvedValueOnce({ rows: [{ student_id: 2, level: 'B' }] })
         // Assignment existence:
         .mockResolvedValueOnce({ 
           rows: [{ 
             assignment_id: 300, 
             test_id: 2,
             due_date: new Date(Date.now() + 100000), 
             status: 'assigned' 
           }] 
         })
         // Test questions with JSON aggregation:
         .mockResolvedValueOnce({ 
           rows: [{
             test_id: 2,
             theme: 'Grammar',
             level: 'B',
             questions: [
               {
                 question_id: 20,
                 question_type: 'fill_in_the_blank',
                 possible_answers: { '1': 'a', '2': 'b' },
                 correct_answer: '1',
                 question_order: 1
               }
             ]
           }]
         });

      const studentToken = jwt.sign({ id: 2, role: 'student', student_id: 2, level: 'B' }, process.env.JWT_SECRET);
      const res = await request(server)
        .get('/api/tests/2/take')
        .set('Authorization', 'Bearer ' + studentToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.test_id).toBe(2);
      expect(res.body.questions).toBeDefined();
      expect(Array.isArray(res.body.questions)).toBe(true);
      expect(res.body.questions.length).toBe(1);
    });
  });

  describe('POST /api/tests/:id/submit', () => {
    it('should submit a test attempt successfully', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 2, username: 'student1', full_name: 'Student One', role: 'student' }]
        }) // Auth middleware: user lookup
        .mockResolvedValueOnce({ 
          rows: [{ student_id: 2, level: 'B' }] 
        }) // Auth middleware: student check
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ 
          rows: [{ 
            assignment_id: 400, 
            test_id: 2,
            student_id: 2,
            status: 'assigned' 
          }] 
        }) // Assignment check
        .mockResolvedValueOnce({ 
          rows: [
            { question_id: 30, correct_answer: '2' },
            { question_id: 31, correct_answer: '3' }
          ] 
        }) // Fetch questions
        .mockResolvedValueOnce({ 
          rows: [{ student_test_id: 500, attempt_date: new Date() }] 
        }) // Insert student_tests
        .mockResolvedValueOnce({}) // Insert answer 1
        .mockResolvedValueOnce({}) // Insert answer 2
        .mockResolvedValueOnce({}) // Update assignment status
        .mockResolvedValueOnce({}); // COMMIT

      const studentToken = jwt.sign({ id: 2, role: 'student', student_id: 2, level: 'B' }, process.env.JWT_SECRET);
      const submitPayload = {
        answers: { '30': '2', '31': '3' },
        time_taken: 120
      };
      const res = await request(server)
        .post('/api/tests/2/submit')
        .set('Authorization', 'Bearer ' + studentToken)
        .send(submitPayload);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('score');
    });
  });
}); 