const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Products API', () => {
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
        name: 'Tools Products Test',
        description: 'Hand and power tools',
      },
    });

    testProduct = await prisma.product.create({
      data: {
        name: 'Hammer Test',
        description: 'Steel claw hammer',
        price: 299.99,
        unit: 'piece',
        sku: 'TOOL-PROD-001',
        isAvailable: true,
        categoryId: testCategory.id,
      },
    });

    // Create additional products for testing
    await prisma.product.create({
      data: {
        name: 'Screwdriver Set Test',
        description: '10-piece screwdriver set',
        price: 499.99,
        unit: 'set',
        sku: 'TOOL-PROD-002',
        isAvailable: true,
        categoryId: testCategory.id,
      },
    });

    await prisma.product.create({
      data: {
        name: 'Unavailable Product Test',
        description: 'Out of stock item',
        price: 199.99,
        unit: 'piece',
        sku: 'TOOL-PROD-003',
        isAvailable: false,
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

  describe('GET /api/products', () => {
    it('should return all products with pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get(`/api/products?category=${testCategory.id}`)
        .expect(200);

      expect(response.body.data.every(p => p.categoryId === testCategory.id)).toBe(true);
    });

    it('should filter products by availability', async () => {
      const response = await request(app)
        .get('/api/products?available=true')
        .expect(200);

      expect(response.body.data.every(p => p.isAvailable === true)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=2')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a specific product', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testProduct.id);
      expect(response.body.data).toHaveProperty('name', 'Hammer Test');
      expect(response.body.data).toHaveProperty('price', 299.99);
      expect(response.body.data).toHaveProperty('category');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/99999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Product not found');
    });
  });

  describe('GET /api/products/search', () => {
    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/products/search?q=Hammer')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.some(p => p.name.toLowerCase().includes('hammer'))).toBe(true);
    });

    it('should search products by description', async () => {
      const response = await request(app)
        .get('/api/products/search?q=steel')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 400 for search query less than 2 characters', async () => {
      const response = await request(app)
        .get('/api/products/search?q=h')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/products/search?q=xyz123nonexistent')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/products/category/:categoryId', () => {
    it('should return products by category', async () => {
      const response = await request(app)
        .get(`/api/products/category/${testCategory.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.every(p => p.categoryId === testCategory.id)).toBe(true);
    });
  });
});
