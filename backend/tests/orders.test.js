const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock SMS service to prevent actual SMS sending during tests
jest.mock('../src/services/smsService', () => ({
  sendOrderConfirmation: jest.fn().mockResolvedValue(true),
  notifyAdminNewOrder: jest.fn().mockResolvedValue(true),
  sendStatusUpdate: jest.fn().mockResolvedValue(true),
}));

describe('Orders API', () => {
  let testCategory;
  let testProduct;

  beforeAll(async () => {
    // Clean up and create test data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category Orders',
        description: 'For order tests',
      },
    });

    testProduct = await prisma.product.create({
      data: {
        name: 'Test Product Orders',
        description: 'Product for testing',
        price: 100.00,
        unit: 'piece',
        sku: 'TEST-ORD-001',
        isAvailable: true,
        categoryId: testCategory.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/orders', () => {
    it('should create a new order successfully', async () => {
      const orderData = {
        customerName: 'John Doe',
        phone: '09171234567',
        address: '123 Test Street, Makati City, Metro Manila',
        barangay: 'Test Barangay',
        landmarks: 'Near the mall',
        notes: 'Please call before delivery',
        items: [
          { productId: testProduct.id, quantity: 2 },
        ],
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Order placed successfully');
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data).toHaveProperty('totalAmount', 200.00);
      expect(response.body.data).toHaveProperty('status', 'pending');
    });

    it('should reject order with validation errors (empty items array)', async () => {
      const orderData = {
        customerName: 'John Doe',
        phone: '09171234567',
        address: '123 Test Street, Makati City, Metro Manila',
        barangay: 'Test Barangay',
        items: [],
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      // Validation middleware returns "Validation failed"
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject order with non-existent product', async () => {
      const orderData = {
        customerName: 'John Doe',
        phone: '09171234567',
        address: '123 Test Street, Makati City, Metro Manila',
        barangay: 'Test Barangay',
        items: [
          { productId: 99999, quantity: 1 },
        ],
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('not found');
    });

    it('should reject order with unavailable product', async () => {
      // Create an unavailable product in same category
      const unavailableProduct = await prisma.product.create({
        data: {
          name: 'Unavailable Test Item',
          price: 50.00,
          unit: 'piece',
          sku: 'TEST-ORD-UNAVAIL',
          isAvailable: false,
          categoryId: testCategory.id,
        },
      });

      const orderData = {
        customerName: 'John Doe',
        phone: '09171234567',
        address: '123 Test Street, Makati City, Metro Manila',
        barangay: 'Test Barangay',
        items: [
          { productId: unavailableProduct.id, quantity: 1 },
        ],
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('unavailable');
    });

    it('should reject order with invalid phone number', async () => {
      const orderData = {
        customerName: 'John Doe',
        phone: '12345',
        address: '123 Test Street, Makati City, Metro Manila',
        barangay: 'Test Barangay',
        items: [
          { productId: testProduct.id, quantity: 1 },
        ],
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/orders/track/:orderNumber', () => {
    it('should track order by order number', async () => {
      // First create an order
      const orderData = {
        customerName: 'Jane Doe',
        phone: '09179876543',
        address: '456 Test Avenue, Quezon City, Metro Manila',
        barangay: 'Sample Barangay',
        items: [
          { productId: testProduct.id, quantity: 1 },
        ],
      };

      const createResponse = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      const orderNumber = createResponse.body.data.orderNumber;

      // Now track the order
      const trackResponse = await request(app)
        .get(`/api/orders/track/${orderNumber}`)
        .expect(200);

      expect(trackResponse.body).toHaveProperty('success', true);
      expect(trackResponse.body.data).toHaveProperty('orderNumber', orderNumber);
      expect(trackResponse.body.data).toHaveProperty('status');
      expect(trackResponse.body.data).toHaveProperty('items');
      expect(trackResponse.body.data).toHaveProperty('totalAmount');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/track/NON-EXISTENT-123')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
