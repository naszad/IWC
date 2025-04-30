const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models/index');
const userService = require('../src/services/user.service');
const authService = require('../src/services/auth.service');
const jwt = require('jsonwebtoken');
const config = require('../src/config');
const { z } = require('zod');

// Non-existent UUID for testing
const NON_EXISTENT_UUID = '00000000-0000-4000-a000-000000000000';

// Mock the validation middleware
jest.mock('../src/middleware/validate.middleware', () => {
  return jest.fn(() => (req, res, next) => next());
});

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('User Service', () => {
  // Sample user data for testing
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password_hash: 'hashedpassword', // In real tests, use bcrypt to hash
    role: 'student'
  };

  const adminUser = {
    username: 'adminuser',
    email: 'admin@example.com',
    password_hash: 'hashedpassword',
    role: 'admin'
  };

  // Clear all users before each test
  beforeEach(async () => {
    await User.destroy({ truncate: true, cascade: true });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const user = await userService.create(testUser);
      expect(user).toBeDefined();
      expect(user.username).toBe(testUser.username);
      expect(user.email).toBe(testUser.email);
      expect(user.role).toBe(testUser.role);
    });
  });

  describe('list', () => {
    it('should list all users without password hashes', async () => {
      await userService.create(testUser);
      await userService.create({
        ...adminUser,
        username: 'admin2',
        email: 'admin2@example.com'
      });

      const users = await userService.list();
      expect(users).toHaveLength(2);
      expect(users[0].password_hash).toBeUndefined();
      expect(users[1].password_hash).toBeUndefined();
    });
  });

  describe('get', () => {
    it('should retrieve a user by ID without password hash', async () => {
      const created = await userService.create(testUser);
      const user = await userService.get(created.id);
      expect(user).toBeDefined();
      expect(user.id).toBe(created.id);
      expect(user.username).toBe(created.username);
      expect(user.password_hash).toBeUndefined();
    });

    it('should return null for non-existent user', async () => {
      const user = await userService.get(NON_EXISTENT_UUID);
      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const created = await userService.create(testUser);
      const [count, updated] = await userService.update(created.id, {
        username: 'updateduser'
      });
      expect(count).toBe(1);
      expect(updated[0].username).toBe('updateduser');
    });

    it('should return 0 for non-existent user', async () => {
      const [count] = await userService.update(NON_EXISTENT_UUID, { username: 'nobody' });
      expect(count).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const created = await userService.create(testUser);
      const count = await userService.delete(created.id);
      expect(count).toBe(1);
      const user = await userService.get(created.id);
      expect(user).toBeNull();
    });

    it('should return 0 for non-existent user', async () => {
      const count = await userService.delete(NON_EXISTENT_UUID);
      expect(count).toBe(0);
    });
  });
});

describe('Admin API', () => {
  // Test data
  const adminData = {
    username: 'adminuser',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  };

  const userData = {
    username: 'regularuser',
    email: 'user@example.com',
    password: 'password123',
    role: 'student'
  };

  // Clear users and create admin user before each test
  let adminToken;
  let userId;

  beforeEach(async () => {
    await User.destroy({ truncate: true, cascade: true });
    
    // Create admin user
    const admin = await authService.register(adminData);
    adminToken = jwt.sign(
      { id: admin.id, role: admin.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Create a regular user for testing
    const user = await authService.register(userData);
    userId = user.id;
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/admin/users');
      expect(res.statusCode).toBe(401);
    });

    it('should require admin role', async () => {
      // Create non-admin user and generate token
      const nonAdmin = await authService.register({
        username: 'nonadmin',
        email: 'nonadmin@example.com',
        password: 'password123',
        role: 'student'
      });
      
      const nonAdminToken = jwt.sign(
        { id: nonAdmin.id, role: nonAdmin.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const res = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${nonAdminToken}`);
      
      expect(res.statusCode).toBe(403);
    });
  });

  describe('CRUD Operations', () => {
    it('should list all users', async () => {
      const res = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2); // Admin + regular user
      expect(res.body[0]).not.toHaveProperty('password_hash');
    });

    it('should get a user by ID', async () => {
      const res = await request(app)
        .get(`/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(userId);
      expect(res.body.username).toBe(userData.username);
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get(`/admin/users/${NON_EXISTENT_UUID}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(404);
    });

    it('should create a new user', async () => {
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashedpassword',
        role: 'instructor'
      };

      const res = await request(app)
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.username).toBe(newUser.username);
      expect(res.body.email).toBe(newUser.email);
      expect(res.body.role).toBe(newUser.role);
    });

    it('should update a user', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const res = await request(app)
        .put(`/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe(updateData.username);
      expect(res.body.email).toBe(updateData.email);
    });

    it('should delete a user', async () => {
      const res = await request(app)
        .delete(`/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(204);
      
      // Verify user is deleted
      const checkRes = await request(app)
        .get(`/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(checkRes.statusCode).toBe(404);
    });
  });
}); 