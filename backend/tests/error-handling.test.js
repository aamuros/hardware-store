const request = require('supertest');
const app = require('../src/app');

describe('Error Handling', () => {
  describe('Invalid JSON', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Invalid Route Parameters', () => {
    it('should handle invalid product ID format', async () => {
      const response = await request(app)
        .get('/api/products/not-a-number')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should handle invalid category ID format', async () => {
      const response = await request(app)
        .get('/api/categories/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid');
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for malformed token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 for expired token format', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Validation Errors', () => {
    it('should return validation errors for invalid order data', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          customerName: '', // Empty name
          phone: '12345', // Invalid phone
          address: 'short', // Too short
          barangay: '',
          items: [],
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should return validation errors for invalid product data', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({ username: 'admin', password: 'admin123' });
      const token = loginResponse.body.data.token;

      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '', // Empty name
          price: -10, // Negative price
          unit: '',
          categoryId: 0,
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Not Found Errors', () => {
    it('should return 404 for unknown API routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('not found');
    });

    it('should return 404 for product that does not exist', async () => {
      const response = await request(app)
        .get('/api/products/999999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Product not found');
    });

    it('should return 404 for category that does not exist', async () => {
      const response = await request(app)
        .get('/api/categories/999999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Category not found');
    });

    it('should return 404 for order that does not exist', async () => {
      const response = await request(app)
        .get('/api/orders/track/NONEXISTENT-ORDER-123')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Content Type Handling', () => {
    it('should handle missing content-type header', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send('customerName=test')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
