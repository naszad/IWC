const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models/index');
const authService = require('../src/services/auth.service');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});
afterAll(async () => {
  await sequelize.close();
});

describe('Auth API', () => {
  beforeEach(async () => {
    await User.destroy({ truncate: true, cascade: true });
  });

  test('Register a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'student'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.username).toBe('testuser');
  });

  test('Login with correct credentials', async () => {
    // First register a user that we can log in with
    await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'student'
      });
      
    const res = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'testuser',
        password: 'password123'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('Login with wrong password fails', async () => {
    // First register a user
    await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'student'
      });
      
    const res = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'testuser',
        password: 'wrongpassword'
      });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });
});

describe('Auth Service', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'student'
  };

  describe('register', () => {
    it('should create a new user', async () => {
      const user = await authService.register(testUser);
      expect(user).toBeDefined();
      expect(user.username).toBe(testUser.username);
      expect(user.email).toBe(testUser.email);
      expect(user.role).toBe(testUser.role);
      expect(user.password_hash).toBeDefined();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register(testUser);
    });

    it('should login with username and return JWT', async () => {
      const token = await authService.login({
        identifier: testUser.username,
        password: testUser.password
      });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should login with email and return JWT', async () => {
      const token = await authService.login({
        identifier: testUser.email,
        password: testUser.password
      });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should fail with wrong password', async () => {
      await expect(authService.login({
        identifier: testUser.username,
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid credentials');
    });
  });
});
