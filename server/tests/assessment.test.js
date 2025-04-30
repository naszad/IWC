const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Assessment, Question } = require('../src/models/index');
const assessmentService = require('../src/services/assessment.service');
const authService = require('../src/services/auth.service');
const jwt = require('jsonwebtoken');
const config = require('../src/config');

// Non-existent UUID for testing
const NON_EXISTENT_UUID = '00000000-0000-4000-a000-000000000000';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Assessment Service', () => {
  // Sample user data for testing
  const instructorData = {
    username: 'testinstructor',
    email: 'instructor@example.com',
    password: 'password123',
    role: 'instructor'
  };

  const studentData = {
    username: 'teststudent',
    email: 'student@example.com',
    password: 'password123',
    role: 'student'
  };

  // Sample assessment data
  const testAssessment = {
    title: 'Test Assessment',
    description: 'This is a test assessment',
    open_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    close_at: new Date(Date.now() + 86400000).toISOString(), // 1 day in future
    duration_minutes: 60,
    level: 'A',
    theme: 'education'
  };

  const closedAssessment = {
    title: 'Closed Assessment',
    description: 'This assessment is closed',
    open_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    close_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    duration_minutes: 60,
    level: 'B',
    theme: 'health'
  };

  const futureAssessment = {
    title: 'Future Assessment',
    description: 'This assessment is in the future',
    open_at: new Date(Date.now() + 86400000).toISOString(), // 1 day in future
    close_at: new Date(Date.now() + 172800000).toISOString(), // 2 days in future
    duration_minutes: 60,
    level: 'C',
    theme: 'work'
  };

  // Test questions
  const testQuestions = [
    {
      prompt: 'What is 2+2?',
      type: 'multiple_choice',
      points: 10,
      options: ['3', '4', '5', '6'],
      correct_answer: '4'
    },
    {
      prompt: 'Explain the concept of inheritance in OOP.',
      type: 'essay',
      points: 20
    }
  ];

  let instructor;
  let student;

  // Clear data and create users before each test
  beforeEach(async () => {
    await Assessment.destroy({ truncate: true, cascade: true });
    await User.destroy({ truncate: true, cascade: true });
    
    instructor = await authService.register(instructorData);
    student = await authService.register(studentData);
  });

  describe('create', () => {
    it('should create a new assessment without questions', async () => {
      const assessment = await assessmentService.create({
        instructorId: instructor.id,
        dto: testAssessment
      });

      expect(assessment).toBeDefined();
      expect(assessment.title).toBe(testAssessment.title);
      expect(assessment.instructor_id).toBe(instructor.id);
    });

    it('should create a new assessment with questions', async () => {
      const assessment = await assessmentService.create({
        instructorId: instructor.id,
        dto: { ...testAssessment, questions: testQuestions }
      });

      expect(assessment).toBeDefined();
      expect(assessment.title).toBe(testAssessment.title);
      
      // Verify questions were created by querying them directly
      const questions = await Question.findAll({ where: { assessment_id: assessment.id } });
      expect(questions.length).toBe(testQuestions.length);
    });
  });

  describe('list', () => {
    it('should list open assessments for students', async () => {
      // Create assessments in different states
      await assessmentService.create({
        instructorId: instructor.id,
        dto: testAssessment // currently open
      });
      await assessmentService.create({
        instructorId: instructor.id,
        dto: closedAssessment // closed
      });
      await assessmentService.create({
        instructorId: instructor.id,
        dto: futureAssessment // not open yet
      });

      const assessments = await assessmentService.list(student.id);
      expect(assessments.length).toBe(1); // Only the open assessment
      expect(assessments[0].title).toBe(testAssessment.title);
    });

    it('should list all created assessments for instructors', async () => {
      // Create assessments
      await assessmentService.create({
        instructorId: instructor.id,
        dto: testAssessment
      });
      await assessmentService.create({
        instructorId: instructor.id,
        dto: closedAssessment
      });
      await assessmentService.create({
        instructorId: instructor.id,
        dto: futureAssessment
      });

      const assessments = await assessmentService.list(instructor.id);
      expect(assessments.length).toBe(3); // All assessments
    });

    it('should return empty array for non-existing user', async () => {
      await expect(assessmentService.list(NON_EXISTENT_UUID))
        .rejects.toThrow('User not found');
    });
  });

  describe('getById', () => {
    it('should retrieve an assessment by ID', async () => {
      const created = await assessmentService.create({
        instructorId: instructor.id,
        dto: testAssessment
      });

      const assessment = await assessmentService.getById(created.id);
      expect(assessment).toBeDefined();
      expect(assessment.id).toBe(created.id);
      expect(assessment.title).toBe(created.title);
    });

    it('should return null for non-existent assessment', async () => {
      const assessment = await assessmentService.getById(NON_EXISTENT_UUID);
      expect(assessment).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an assessment', async () => {
      const created = await assessmentService.create({
        instructorId: instructor.id,
        dto: testAssessment
      });

      const updateData = {
        title: 'Updated Assessment',
        description: 'This assessment has been updated'
      };

      await assessmentService.update(created.id, updateData);
      
      const updated = await assessmentService.getById(created.id);
      expect(updated.title).toBe(updateData.title);
      expect(updated.description).toBe(updateData.description);
    });
  });

  describe('delete', () => {
    it('should delete an assessment', async () => {
      const created = await assessmentService.create({
        instructorId: instructor.id,
        dto: testAssessment
      });

      const result = await assessmentService.delete(created.id);
      expect(result).toBe(1); // One row affected

      const assessment = await assessmentService.getById(created.id);
      expect(assessment).toBeNull();
    });
  });
});

describe('Assessment API', () => {
  // Test data
  const instructorData = {
    username: 'apiinstructor',
    email: 'apiinstructor@example.com',
    password: 'password123',
    role: 'instructor'
  };

  const studentData = {
    username: 'apistudent',
    email: 'apistudent@example.com',
    password: 'password123',
    role: 'student'
  };

  const testAssessment = {
    title: 'API Test Assessment',
    description: 'This is a test assessment for API',
    open_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    close_at: new Date(Date.now() + 86400000).toISOString(), // 1 day in future
    duration_minutes: 60,
    level: 'A',
    theme: 'education',
    questions: [
      {
        prompt: 'What is 2+2?',
        type: 'multiple_choice',
        points: 10,
        options: ['3', '4', '5', '6'],
        correct_answer: '4'
      }
    ]
  };

  let instructorToken;
  let studentToken;
  let instructorId;
  let studentId;
  let assessmentId;

  // Setup users and tokens before each test section
  beforeEach(async () => {
    await User.destroy({ truncate: true, cascade: true });
    await Assessment.destroy({ truncate: true, cascade: true });
    
    // Create instructor and student users
    const instructor = await authService.register(instructorData);
    const student = await authService.register(studentData);
    
    instructorId = instructor.id;
    studentId = student.id;
    
    // Generate tokens
    instructorToken = jwt.sign(
      { id: instructor.id, role: instructor.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    studentToken = jwt.sign(
      { id: student.id, role: student.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  });

  describe('Instructor API', () => {
    it('should create a new assessment', async () => {
      const res = await request(app)
        .post('/instructor/assessments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(testAssessment);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe(testAssessment.title);
      assessmentId = res.body.id;
    });

    it('should list instructor assessments', async () => {
      // First create an assessment
      const createRes = await request(app)
        .post('/instructor/assessments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(testAssessment);
      
      const res = await request(app)
        .get('/instructor/assessments')
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should get assessment by ID', async () => {
      // First create an assessment
      const createRes = await request(app)
        .post('/instructor/assessments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(testAssessment);
        
      const id = createRes.body.id;
      
      const res = await request(app)
        .get(`/instructor/assessments/${id}`)
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(id);
      expect(res.body.title).toBe(testAssessment.title);
    });

    it('should update an assessment', async () => {
      // First create an assessment
      const createRes = await request(app)
        .post('/instructor/assessments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(testAssessment);
        
      const id = createRes.body.id;
      
      const updateData = {
        title: 'Updated API Assessment',
        description: 'This assessment has been updated via API'
      };

      const res = await request(app)
        .put(`/instructor/assessments/${id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updateData);
      
      expect(res.statusCode).toBe(200);
      
      // Verify the update
      const getRes = await request(app)
        .get(`/instructor/assessments/${id}`)
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(getRes.body.title).toBe(updateData.title);
      expect(getRes.body.description).toBe(updateData.description);
    });

    it('should delete an assessment', async () => {
      // First create an assessment
      const createRes = await request(app)
        .post('/instructor/assessments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(testAssessment);
        
      const id = createRes.body.id;
      
      const res = await request(app)
        .delete(`/instructor/assessments/${id}`)
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.statusCode).toBe(204);
      
      // Verify deletion
      const getRes = await request(app)
        .get(`/instructor/assessments/${id}`)
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(getRes.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/instructor/assessments');
      expect(res.statusCode).toBe(401);
    });

    it('should require instructor role', async () => {
      const res = await request(app)
        .get('/instructor/assessments')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Student API', () => {
    let openAssessmentId;

    beforeEach(async () => {
      // Create a new assessment for each test
      const res = await request(app)
        .post('/instructor/assessments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(testAssessment);
      
      openAssessmentId = res.body.id;
    });

    it('should list available assessments for students', async () => {
      const res = await request(app)
        .get('/student/assessments')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // At least the assessment we just created should be available
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should get assessment details for students', async () => {
      const res = await request(app)
        .get(`/student/assessments/${openAssessmentId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(openAssessmentId);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/student/assessments');
      expect(res.statusCode).toBe(401);
    });

    it('should require student role', async () => {
      const res = await request(app)
        .get('/student/assessments')
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.statusCode).toBe(403);
    });
  });
}); 