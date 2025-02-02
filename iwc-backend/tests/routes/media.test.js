const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');

process.env.JWT_SECRET = 'testsecret';

const app = express();
app.use(express.json());

// Mock the pool from media route
const pool = require('../../db/pool');
jest.mock('../../db/pool');

// Import media routes
const mediaRoutes = require('../../routes/media');
app.use('/api/media', mediaRoutes);

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

describe('Media Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/media/upload', () => {
    it('should return 400 when no file is uploaded', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher' }]
        }) // Auth middleware: user lookup
        .mockResolvedValueOnce({ 
          rows: [{ teacher_id: 1 }] 
        }); // Auth middleware: teacher check

      const token = jwt.sign({ id: 1, role: 'teacher' }, process.env.JWT_SECRET);
      const res = await request(server)
        .post('/api/media/upload')
        .set('Authorization', 'Bearer ' + token)
        .field('type', 'image');
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('No file uploaded');
    });

    it('should return error for invalid file type', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher' }]
        }) // Auth middleware: user lookup
        .mockResolvedValueOnce({ 
          rows: [{ teacher_id: 1 }] 
        }); // Auth middleware: teacher check

      const token = jwt.sign({ id: 1, role: 'teacher' }, process.env.JWT_SECRET);
      const res = await request(server)
        .post('/api/media/upload')
        .set('Authorization', 'Bearer ' + token)
        .field('type', 'image')
        .attach('file', Buffer.from('not an image'), { 
          filename: 'test.txt',
          contentType: 'text/plain'
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid file');
    });

    it('should upload a valid image file successfully', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher' }]
        }) // Auth middleware: user lookup
        .mockResolvedValueOnce({ 
          rows: [{ teacher_id: 1 }] 
        }); // Auth middleware: teacher check

      const token = jwt.sign({ id: 1, role: 'teacher' }, process.env.JWT_SECRET);
      const res = await request(server)
        .post('/api/media/upload')
        .set('Authorization', 'Bearer ' + token)
        .field('type', 'image')
        .attach('file', Buffer.from('fake image data'), { 
          filename: 'test.png',
          contentType: 'image/png'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('url');
      expect(res.body).toHaveProperty('originalName', 'test.png');
    });
  });
}); 