const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Admin Authentication API', () => {
  describe('POST /api/admin/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('username', 'admin');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Protected Admin Routes', () => {
    let authToken;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'admin',
          password: 'admin123',
        });
      authToken = loginResponse.body.data.token;
    });

    it('should access dashboard with valid token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('totalOrders');
      expect(response.body.data.stats).toHaveProperty('totalProducts');
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should get all orders as admin', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
