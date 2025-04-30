const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Assessment, Question, Submission, SubmissionAnswer } = require('../src/models/index');
const submissionService = require('../src/services/submission.service');
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

describe('Submission Service', () => {
  // Sample user data for testing
  const instructorData = {
    username: 'subinstructor',
    email: 'subinstructor@example.com',
    password: 'password123',
    role: 'instructor'
  };

  const studentData = {
    username: 'substudent',
    email: 'substudent@example.com',
    password: 'password123',
    role: 'student'
  };

  // Sample assessment data
  const testAssessment = {
    title: 'Test Submission Assessment',
    description: 'This is a test assessment for submission',
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
        options: ['1', '2', '3', '4'],
        correct_answer: '4'
      },
      {
        prompt: 'Is the sky blue?',
        type: 'multiple_choice',
        points: 5,
        options: ['Yes', 'No'],
        correct_answer: 'Yes'
      },
      {
        prompt: 'Explain the concept of gravity.',
        type: 'essay',
        points: 20
      }
    ]
  };

  let instructor;
  let student;
  let assessment;
  let questions;

  // Setup users and assessment before each test
  beforeEach(async () => {
    await Submission.destroy({ truncate: true, cascade: true });
    await Question.destroy({ truncate: true, cascade: true });
    await Assessment.destroy({ truncate: true, cascade: true });
    await User.destroy({ truncate: true, cascade: true });
    
    instructor = await authService.register(instructorData);
    student = await authService.register(studentData);
    
    assessment = await assessmentService.create({
      instructorId: instructor.id,
      dto: testAssessment
    });
    
    questions = await Question.findAll({ where: { assessment_id: assessment.id } });
  });

  describe('submit', () => {
    it('should submit answers and auto-grade multiple-choice questions', async () => {
      const answers = {};
      // Add correct answers for multiple choice questions
      questions.forEach(q => {
        if (q.type === 'multiple_choice') {
          answers[q.id] = q.correct_answer;
        } else if (q.type === 'essay') {
          answers[q.id] = 'This is my essay answer about gravity.';
        }
      });

      const submission = await submissionService.submit({
        assessmentId: assessment.id,
        studentId: student.id,
        answers
      });

      expect(submission).toBeDefined();
      expect(submission.assessment_id).toBe(assessment.id);
      expect(submission.student_id).toBe(student.id);
      expect(submission.score).toBeGreaterThan(0);

      // Verify submission answers were saved
      const savedAnswers = await SubmissionAnswer.findAll({
        where: { submission_id: submission.id }
      });
      
      expect(savedAnswers.length).toBe(questions.length);
      
      // Multiple choice questions should be auto-graded as correct
      const mcAnswers = savedAnswers.filter(a => 
        questions.find(q => q.id === a.question_id && q.type === 'multiple_choice')
      );
      mcAnswers.forEach(answer => {
        expect(answer.is_correct).toBe(true);
      });

      // Essay questions should be marked for manual grading
      const essayAnswers = savedAnswers.filter(a => 
        questions.find(q => q.id === a.question_id && q.type === 'essay')
      );
      essayAnswers.forEach(answer => {
        expect(answer.is_correct).toBeNull();
      });
    });

    it('should mark incorrect multiple-choice answers as wrong', async () => {
      const answers = {};
      // Add incorrect answers for multiple choice questions
      questions.forEach(q => {
        if (q.type === 'multiple_choice') {
          // Pick an incorrect answer
          const correctAnswer = q.correct_answer;
          const options = q.options;
          const incorrectAnswer = options.find(o => o !== correctAnswer);
          answers[q.id] = incorrectAnswer;
        } else if (q.type === 'essay') {
          answers[q.id] = 'This is my essay answer.';
        }
      });

      const submission = await submissionService.submit({
        assessmentId: assessment.id,
        studentId: student.id,
        answers
      });

      expect(submission).toBeDefined();
      expect(submission.score).toBe(0); // All multiple choice answers are incorrect

      // Verify submission answers were saved
      const savedAnswers = await SubmissionAnswer.findAll({
        where: { submission_id: submission.id }
      });
      
      // Multiple choice questions should be auto-graded as incorrect
      const mcAnswers = savedAnswers.filter(a => 
        questions.find(q => q.id === a.question_id && q.type === 'multiple_choice')
      );
      mcAnswers.forEach(answer => {
        expect(answer.is_correct).toBe(false);
      });
    });
  });
});

describe('Submission API', () => {
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

  // Test assessment
  const testAssessment = {
    title: 'API Test Assessment',
    description: 'This is a test assessment for submission API',
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
        options: ['1', '2', '3', '4'],
        correct_answer: '4'
      },
      {
        prompt: 'Is the sky blue?',
        type: 'multiple_choice',
        points: 5,
        options: ['Yes', 'No'],
        correct_answer: 'Yes'
      }
    ]
  };

  let instructorToken;
  let studentToken;
  let instructorId;
  let studentId;
  let assessmentId;
  let questions;
  let submissionId;

  // Setup for each test
  beforeEach(async () => {
    await Submission.destroy({ truncate: true, cascade: true });
    await Question.destroy({ truncate: true, cascade: true });
    await Assessment.destroy({ truncate: true, cascade: true });
    await User.destroy({ truncate: true, cascade: true });
    
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

    // Create an assessment
    const res = await request(app)
      .post('/instructor/assessments')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send(testAssessment);
    
    assessmentId = res.body.id;
    
    // Get questions
    questions = await Question.findAll({ where: { assessment_id: assessmentId } });
  });

  describe('Student API', () => {
    it('should allow student to submit answers to an assessment', async () => {
      const answers = {};
      questions.forEach(q => {
        answers[q.id] = q.correct_answer; // Use correct answers
      });

      const res = await request(app)
        .post(`/student/assessments/${assessmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('score');
      expect(res.body.assessment_id).toBe(assessmentId);
      expect(res.body.student_id).toBe(studentId);
      
      submissionId = res.body.id;
    });

    it('should allow student to view their submission results', async () => {
      // First create a submission
      const answers = {};
      questions.forEach(q => {
        answers[q.id] = q.correct_answer;
      });

      const submitRes = await request(app)
        .post(`/student/assessments/${assessmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers });
      
      submissionId = submitRes.body.id;
      
      // Now get the results
      const res = await request(app)
        .get(`/student/assessments/${assessmentId}/results`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('submission');
      expect(res.body).toHaveProperty('answers');
      expect(res.body.submission.id).toBe(submissionId);
      expect(res.body.answers.length).toBe(questions.length);
    });

    it('should not allow submission after assessment is closed', async () => {
      // Create a closed assessment
      const closedAssessment = {
        ...testAssessment,
        title: 'Closed Assessment',
        open_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        close_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      };
      
      const createRes = await request(app)
        .post('/instructor/assessments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(closedAssessment);
      
      const closedAssessmentId = createRes.body.id;
      
      // Try to submit answers
      const closedQuestions = await Question.findAll({ 
        where: { assessment_id: closedAssessmentId } 
      });
      
      const answers = {};
      closedQuestions.forEach(q => {
        answers[q.id] = q.correct_answer;
      });

      const res = await request(app)
        .post(`/student/assessments/${closedAssessmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/not currently available/i);
    });

    it('should not allow submission for an assessment that does not exist', async () => {
      const res = await request(app)
        .post(`/student/assessments/${NON_EXISTENT_UUID}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: {} });
      
      expect(res.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post(`/student/assessments/${assessmentId}/submit`)
        .send({ answers: {} });
      
      expect(res.statusCode).toBe(401);
    });

    it('should require student role', async () => {
      const res = await request(app)
        .post(`/student/assessments/${assessmentId}/submit`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ answers: {} });
      
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Instructor API', () => {
    beforeEach(async () => {
      // Create a student submission to work with
      const answers = {};
      questions.forEach(q => {
        if (q.type === 'multiple_choice') {
          answers[q.id] = q.correct_answer;
        }
      });

      const submission = await submissionService.submit({
        assessmentId: assessmentId,
        studentId: studentId,
        answers
      });
      
      submissionId = submission.id;
    });

    it('should allow instructor to list submissions for an assessment', async () => {
      const res = await request(app)
        .get(`/instructor/assessments/${assessmentId}/submissions`)
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toBe(submissionId);
    });

    it('should allow instructor to grade a submission', async () => {
      const gradeData = {
        score: 95,
        feedback: 'Excellent work!'
      };

      const res = await request(app)
        .put(`/instructor/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(gradeData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.score).toBe(gradeData.score);
      expect(res.body.feedback).toBe(gradeData.feedback);
    });

    it('should not allow grading of non-existent submission', async () => {
      const gradeData = {
        score: 95,
        feedback: 'Excellent work!'
      };

      const res = await request(app)
        .put(`/instructor/submissions/${NON_EXISTENT_UUID}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(gradeData);
      
      expect(res.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get(`/instructor/assessments/${assessmentId}/submissions`);
      
      expect(res.statusCode).toBe(401);
    });

    it('should require instructor role', async () => {
      const res = await request(app)
        .get(`/instructor/assessments/${assessmentId}/submissions`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.statusCode).toBe(403);
    });
  });
}); 