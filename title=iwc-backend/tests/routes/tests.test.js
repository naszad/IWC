describe('GET /api/tests/:id', () => {
    it('should return a specific test with questions for a teacher', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher', created_at: new Date() }]
        }) // (1) Auth middleware: fetch user
        .mockResolvedValueOnce({ rows: [{ teacher_id: 1 }] }) // (2) Auth middleware: teacher check
        .mockResolvedValueOnce({ // (3) Fetch test details
          rows: [{ test_id: 1, theme: 'Science', teacher_id: 1 }]
        })
        .mockResolvedValueOnce({ // (4) Fetch questions details
          rows: [{
            question_id: 10,
            possible_answers: '{"1": "a", "2": "b"}',
            correct_answer: '1',
            question_order: 1
          }]
        })
        .mockResolvedValueOnce({ rows: [] }); // (5) Extra mock to cover unexpected query

      const teacherToken = jwt.sign({ id: 1, role: 'teacher', teacher_id: 1 }, process.env.JWT_SECRET);
      const res = await request(app)
        .get('/api/tests/1')
        .set('Authorization', 'Bearer ' + teacherToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.test_id).toBe(1);
      expect(res.body.questions).toBeDefined();
    });
});

describe('GET /api/tests/teacher', () => {
    it('should return tests for a teacher', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher', created_at: new Date() }]
        }) // (1) Auth middleware: fetch user
        .mockResolvedValueOnce({ rows: [{ teacher_id: 1 }] }) // (2) Auth middleware: teacher check
        .mockResolvedValueOnce({ rows: [{ teacher_id: 1, email: 'teacher@example.com' }] }) // (3) Extra teacher details lookup
        .mockResolvedValueOnce({
          rows: [{ test_id: 1, theme: 'Math', level: 'A', teacher_id: 1 }]
        }); // (4) Query to fetch teacher tests

      const teacherToken = jwt.sign({ id: 1, role: 'teacher', teacher_id: 1 }, process.env.JWT_SECRET);
      const res = await request(app)
        .get('/api/tests/teacher')
        .set('Authorization', 'Bearer ' + teacherToken);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
});

describe('POST /api/tests/:id/submit', () => {
    it('should submit a test attempt successfully', async () => {
      pool.query
        .mockResolvedValueOnce({
           rows: [{ id: 2, username: 'student1', full_name: 'Student One', role: 'student', created_at: new Date() }]
        }) // (1) Auth middleware: fetch user
        .mockResolvedValueOnce({ rows: [{ student_id: 2, level: 'B' }] }) // (2) Auth middleware: student check
        .mockResolvedValueOnce({ rows: [{ assignment_id: 300, due_date: new Date(Date.now() + 100000), status: 'assigned' }] }) // (3) Assignment existence check
        .mockResolvedValueOnce({ rows: [{ test_id: 2, level: 'B' }] }) // (4) Fetch test details
        .mockResolvedValueOnce({ rows: [{ student_test_id: 500, attempt_date: new Date() }] }) // (5) Insert student test record
        .mockResolvedValueOnce({}) // (6) Insert answer 1
        .mockResolvedValueOnce({}) // (7) Insert answer 2
        .mockResolvedValueOnce({}); // (8) Update assignment / COMMIT

      const studentToken = jwt.sign({ id: 2, role: 'student', student_id: 2, level: 'B' }, process.env.JWT_SECRET);
      const submitPayload = {
        assignment_id: 300,
        answers: { '20': 1 },
        time_taken: 120
      };
      const res = await request(app)
        .post('/api/tests/2/submit')
        .set('Authorization', 'Bearer ' + studentToken)
        .send(submitPayload);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('score');
    });
});

describe('GET /api/tests/:id/take', () => {
    it('should allow a student to take a test when assigned and valid', async () => {
      pool.query
         .mockResolvedValueOnce({
            rows: [{ id: 2, username: 'student1', full_name: 'Student One', role: 'student', created_at: new Date() }]
         }) // (1) Auth middleware: fetch user
         .mockResolvedValueOnce({ rows: [{ student_id: 2, level: 'B' }] }) // (2) Auth middleware: student check
         .mockResolvedValueOnce({ rows: [{ test_id: 2, level: 'B' }] }) // (3) Query for test existence
         .mockResolvedValueOnce({ rows: [{ level: 'B' }] }) // (4) Query for additional test validation
         .mockResolvedValueOnce({ rows: [{ assignment_id: 300, due_date: new Date(Date.now() + 100000), status: 'assigned' }] }) // (5) Assignment existence
         .mockResolvedValueOnce({ rows: [{
            questions: [{
              question_id: 20,
              possible_answers: '{"1":"a","2":"b"}',
              correct_answer: '1',
              question_order: 1
            }]
         }] }) // (6) Fetch test questions
         .mockResolvedValueOnce({ rows: [{ test_id: 2 }] }); // (7) Extra query to return test_id
  
      const studentToken = jwt.sign({ id: 2, role: 'student', student_id: 2, level: 'B' }, process.env.JWT_SECRET);
      const res = await request(app)
        .get('/api/tests/2/take')
        .set('Authorization', 'Bearer ' + studentToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.test_id).toBe(2);
      expect(res.body.questions).toBeDefined();
    });
}); 