const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Categories API', () => {
  let testCategory;

  beforeAll(async () => {
    // Clean up and create test data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category description',
        icon: 'wrench',
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

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should include product count for each category', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      const category = response.body.data[0];
      expect(category).toHaveProperty('_count');
      expect(category._count).toHaveProperty('products');
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return a specific category', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategory.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testCategory.id);
      expect(response.body.data).toHaveProperty('name', 'Test Category');
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/categories/99999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Category not found');
    });
  });
});
