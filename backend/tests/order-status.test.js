const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock SMS service - but keep real validation functions
jest.mock('../src/services/smsService', () => {
  const actual = jest.requireActual('../src/services/smsService');
  return {
    ...actual,
    sendOrderConfirmation: jest.fn().mockResolvedValue(true),
    notifyAdminNewOrder: jest.fn().mockResolvedValue(true),
    sendStatusUpdate: jest.fn().mockResolvedValue(true),
    sendSMS: jest.fn().mockResolvedValue(true),
    sendCustomSMS: jest.fn().mockResolvedValue(true),
  };
});

describe('Order Status Management', () => {
  let authToken;
  let testCategory;
  let testProduct;
  let testOrder;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });
    authToken = loginResponse.body.data.token;

    // Create test category and product
    testCategory = await prisma.category.create({
      data: {
        name: 'Order Status Test Category',
        description: 'Category for order status tests',
      },
    });

    testProduct = await prisma.product.create({
      data: {
        name: 'Order Status Test Product',
        price: 150,
        unit: 'piece',
        isAvailable: true,
        categoryId: testCategory.id,
      },
    });

    // Create a test order
    const orderResponse = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Status Test Customer',
        phone: '09171234567',
        address: '123 Test Street, Test City, Test Province',
        barangay: 'Test Barangay',
        items: [{ productId: testProduct.id, quantity: 2 }],
      });
    
    testOrder = await prisma.order.findFirst({
      where: { customerName: 'Status Test Customer' },
      orderBy: { createdAt: 'desc' },
    });
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({
      where: { order: { customerName: { contains: 'Status Test' } } },
    });
    await prisma.order.deleteMany({
      where: { customerName: { contains: 'Status Test' } },
    });
    await prisma.product.deleteMany({
      where: { name: { contains: 'Order Status Test' } },
    });
    await prisma.category.deleteMany({
      where: { name: { contains: 'Order Status Test' } },
    });
    await prisma.$disconnect();
  });

  describe('PATCH /api/admin/orders/:id/status', () => {
    it('should update order status to accepted', async () => {
      const response = await request(app)
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'accepted' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'accepted');
    });

    it('should update order status to preparing', async () => {
      const response = await request(app)
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'preparing' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'preparing');
    });

    it('should update order status to out_for_delivery', async () => {
      const response = await request(app)
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'out_for_delivery' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'out_for_delivery');
    });

    it('should update order status to delivered', async () => {
      const response = await request(app)
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'delivered' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'delivered');
    });

    it('should update order status to completed', async () => {
      const response = await request(app)
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'completed');
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app)
        .patch('/api/admin/orders/99999/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'accepted' })
        .expect(404);
    });

    it('should reject status update without authentication', async () => {
      await request(app)
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .send({ status: 'accepted' })
        .expect(401);
    });
  });

  describe('GET /api/admin/orders/:id', () => {
    it('should get order details', async () => {
      const response = await request(app)
        .get(`/api/admin/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testOrder.id);
      expect(response.body.data).toHaveProperty('customerName');
      expect(response.body.data).toHaveProperty('items');
    });

    it('should return 404 for non-existent order', async () => {
      await request(app)
        .get('/api/admin/orders/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Order Cancellation and Rejection', () => {
    let orderToCancel;

    beforeAll(async () => {
      // Create another order for cancellation tests
      await request(app)
        .post('/api/orders')
        .send({
          customerName: 'Status Test Cancel Customer',
          phone: '09179876543',
          address: '456 Cancel Street, Test City, Test Province',
          barangay: 'Cancel Barangay',
          items: [{ productId: testProduct.id, quantity: 1 }],
        });
      
      orderToCancel = await prisma.order.findFirst({
        where: { customerName: 'Status Test Cancel Customer' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should reject an order', async () => {
      const response = await request(app)
        .patch(`/api/admin/orders/${orderToCancel.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'rejected' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'rejected');
    });
  });
});
