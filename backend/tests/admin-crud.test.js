const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Admin CRUD Operations', () => {
  let authToken;
  let testCategory;
  let testProduct;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });
    authToken = loginResponse.body.data.token;

    // Create test category
    testCategory = await prisma.category.create({
      data: {
        name: 'Admin CRUD Test Category',
        description: 'Category for admin CRUD tests',
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.product.deleteMany({
      where: { name: { contains: 'Admin CRUD Test' } },
    });
    await prisma.category.deleteMany({
      where: { name: { contains: 'Admin CRUD Test' } },
    });
    await prisma.$disconnect();
  });

  describe('Product Management', () => {
    describe('POST /api/admin/products', () => {
      it('should create a new product with valid data', async () => {
        const productData = {
          name: 'Admin CRUD Test Product',
          description: 'A test product for CRUD operations',
          price: 199.99,
          unit: 'piece',
          sku: 'CRUD-TEST-001',
          categoryId: testCategory.id,
        };

        const response = await request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(productData)
          .expect(201);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('name', productData.name);
        expect(response.body.data).toHaveProperty('price', productData.price);
        
        testProduct = response.body.data;
      });

      it('should reject product creation without authentication', async () => {
        const productData = {
          name: 'Unauthorized Product',
          price: 99.99,
          unit: 'piece',
          categoryId: testCategory.id,
        };

        await request(app)
          .post('/api/admin/products')
          .send(productData)
          .expect(401);
      });

      it('should reject product creation with missing required fields', async () => {
        const response = await request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Incomplete Product' })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });
    });

    describe('PATCH /api/admin/products/:id', () => {
      it('should update an existing product', async () => {
        const updateData = {
          name: 'Admin CRUD Test Product Updated',
          price: 249.99,
        };

        const response = await request(app)
          .patch(`/api/admin/products/${testProduct.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('name', updateData.name);
        expect(response.body.data).toHaveProperty('price', updateData.price);
      });

      it('should return 404 for non-existent product', async () => {
        await request(app)
          .patch('/api/admin/products/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Updated Name' })
          .expect(404);
      });
    });

    describe('PATCH /api/admin/products/:id/availability', () => {
      it('should toggle product availability', async () => {
        const response = await request(app)
          .patch(`/api/admin/products/${testProduct.id}/availability`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('isAvailable');
      });
    });

    describe('DELETE /api/admin/products/:id', () => {
      it('should delete a product', async () => {
        // Create a product to delete
        const productToDelete = await prisma.product.create({
          data: {
            name: 'Admin CRUD Test Delete Product',
            price: 50,
            unit: 'piece',
            categoryId: testCategory.id,
          },
        });

        const response = await request(app)
          .delete(`/api/admin/products/${productToDelete.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });

      it('should return 404 when deleting non-existent product', async () => {
        await request(app)
          .delete('/api/admin/products/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });
  });

  describe('Category Management', () => {
    let createdCategory;

    describe('POST /api/admin/categories', () => {
      it('should create a new category', async () => {
        const categoryData = {
          name: 'Admin CRUD Test New Category',
          description: 'A new test category',
          icon: '🔧',
        };

        const response = await request(app)
          .post('/api/admin/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send(categoryData)
          .expect(201);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('name', categoryData.name);
        
        createdCategory = response.body.data;
      });

      it('should reject category creation with missing name', async () => {
        await request(app)
          .post('/api/admin/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ description: 'No name category' })
          .expect(400);
      });
    });

    describe('PATCH /api/admin/categories/:id', () => {
      it('should update an existing category', async () => {
        const updateData = {
          name: 'Admin CRUD Test Updated Category',
          description: 'Updated description',
        };

        const response = await request(app)
          .patch(`/api/admin/categories/${createdCategory.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('name', updateData.name);
      });
    });

    describe('DELETE /api/admin/categories/:id', () => {
      it('should delete a category without products', async () => {
        // Create a category to delete
        const categoryToDelete = await prisma.category.create({
          data: {
            name: 'Admin CRUD Test Category To Delete',
            description: 'Will be deleted',
          },
        });

        const response = await request(app)
          .delete(`/api/admin/categories/${categoryToDelete.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });
  });
});
