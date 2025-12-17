const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('Customer Wishlist API', () => {
    const testEmail = 'wishlisttest@example.com';
    const testPassword = 'testpass123';
    let authToken;
    let customerId;
    let testProductId;

    // Setup: Create test customer, product, and get auth token
    beforeAll(async () => {
        // Cleanup existing test data
        await prisma.wishlistItem.deleteMany({
            where: { customer: { email: testEmail } },
        }).catch(() => { });
        await prisma.savedAddress.deleteMany({
            where: { customer: { email: testEmail } },
        }).catch(() => { });
        await prisma.customer.deleteMany({
            where: { email: testEmail },
        }).catch(() => { });

        // Create test customer
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const customer = await prisma.customer.create({
            data: {
                email: testEmail,
                password: hashedPassword,
                name: 'Wishlist Test Customer',
            },
        });
        customerId = customer.id;

        // Get or create a test product
        let category = await prisma.category.findFirst({
            where: { isDeleted: false },
        });
        if (!category) {
            category = await prisma.category.create({
                data: {
                    name: 'Wishlist Test Category ' + Date.now(),
                },
            });
        }

        const product = await prisma.product.create({
            data: {
                name: 'Test Wishlist Product ' + Date.now(),
                sku: 'TEST-WISH-' + Date.now(),
                price: 100,
                unit: 'piece',
                categoryId: category.id,
                stockQuantity: 10,
                isAvailable: true,
            },
        });
        testProductId = product.id;

        // Get auth token
        const loginResponse = await request(app)
            .post('/api/customers/login')
            .send({ email: testEmail, password: testPassword });
        authToken = loginResponse.body.data.token;
    });

    describe('POST /api/customers/wishlist', () => {
        it('should add product to wishlist', async () => {
            const response = await request(app)
                .post('/api/customers/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ productId: testProductId })
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('productId', testProductId);
            expect(response.body.data.product).toHaveProperty('name');
        });

        it('should reject duplicate wishlist item', async () => {
            const response = await request(app)
                .post('/api/customers/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ productId: testProductId })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('already in wishlist');
        });

        it('should reject non-existent product', async () => {
            const response = await request(app)
                .post('/api/customers/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ productId: 99999 })
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('not found');
        });

        it('should reject request without productId', async () => {
            const response = await request(app)
                .post('/api/customers/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should reject deleted products', async () => {
            // Create and soft-delete a product
            const category = await prisma.category.findFirst();
            const deletedProduct = await prisma.product.create({
                data: {
                    name: 'Deleted Product',
                    sku: 'DEL-' + Date.now(),
                    price: 50,
                    unit: 'piece',
                    categoryId: category.id,
                    isDeleted: true,
                },
            });

            const response = await request(app)
                .post('/api/customers/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ productId: deletedProduct.id })
                .expect(404);

            expect(response.body.message).toContain('not found');

            // Cleanup
            await prisma.product.delete({ where: { id: deletedProduct.id } });
        });

        it('should reject request without auth', async () => {
            const response = await request(app)
                .post('/api/customers/wishlist')
                .send({ productId: testProductId })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('GET /api/customers/wishlist', () => {
        it('should return wishlist items', async () => {
            const response = await request(app)
                .get('/api/customers/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(1);
            expect(response.body.data[0]).toHaveProperty('product');
            expect(response.body.data[0].product).toHaveProperty('name');
        });

        it('should include product details', async () => {
            const response = await request(app)
                .get('/api/customers/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const item = response.body.data.find(i => i.productId === testProductId);
            expect(item.product).toHaveProperty('price');
            expect(item.product).toHaveProperty('isAvailable');
            expect(item.product).toHaveProperty('category');
        });

        it('should not include deleted products', async () => {
            // Create a product, add to wishlist, then soft-delete it
            const category = await prisma.category.findFirst();
            const product = await prisma.product.create({
                data: {
                    name: 'Soon Deleted',
                    sku: 'SOON-DEL-' + Date.now(),
                    price: 75,
                    unit: 'piece',
                    categoryId: category.id,
                },
            });

            // Add to wishlist
            await prisma.wishlistItem.create({
                data: {
                    customerId,
                    productId: product.id,
                },
            });

            // Soft-delete the product
            await prisma.product.update({
                where: { id: product.id },
                data: { isDeleted: true },
            });

            // Fetch wishlist
            const response = await request(app)
                .get('/api/customers/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Should not include the deleted product
            const deletedItem = response.body.data.find(i => i.productId === product.id);
            expect(deletedItem).toBeUndefined();

            // Cleanup
            await prisma.wishlistItem.deleteMany({ where: { productId: product.id } });
            await prisma.product.delete({ where: { id: product.id } });
        });
    });

    describe('GET /api/customers/wishlist/ids', () => {
        it('should return array of product IDs', async () => {
            const response = await request(app)
                .get('/api/customers/wishlist/ids')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data).toContain(testProductId);
        });
    });

    describe('GET /api/customers/wishlist/check/:productId', () => {
        it('should return true for item in wishlist', async () => {
            const response = await request(app)
                .get(`/api/customers/wishlist/check/${testProductId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data).toHaveProperty('inWishlist', true);
        });

        it('should return false for item not in wishlist', async () => {
            const response = await request(app)
                .get('/api/customers/wishlist/check/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data).toHaveProperty('inWishlist', false);
        });
    });

    describe('DELETE /api/customers/wishlist/:productId', () => {
        it('should remove product from wishlist', async () => {
            const response = await request(app)
                .delete(`/api/customers/wishlist/${testProductId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.message).toContain('Removed');
        });

        it('should return 404 for item not in wishlist', async () => {
            const response = await request(app)
                .delete(`/api/customers/wishlist/${testProductId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should not affect other customer wishlists', async () => {
            // Add back to wishlist first
            await request(app)
                .post('/api/customers/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ productId: testProductId });

            // Create another customer with same product in wishlist
            const otherCustomer = await prisma.customer.create({
                data: {
                    email: 'other-wishlist@example.com',
                    password: await bcrypt.hash('pass123', 10),
                    name: 'Other Customer',
                },
            });

            await prisma.wishlistItem.create({
                data: {
                    customerId: otherCustomer.id,
                    productId: testProductId,
                },
            });

            // Delete from our wishlist
            await request(app)
                .delete(`/api/customers/wishlist/${testProductId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Other customer should still have it
            const otherWishlist = await prisma.wishlistItem.findUnique({
                where: {
                    customerId_productId: {
                        customerId: otherCustomer.id,
                        productId: testProductId,
                    },
                },
            });

            expect(otherWishlist).not.toBeNull();

            // Cleanup
            await prisma.wishlistItem.deleteMany({ where: { customerId: otherCustomer.id } });
            await prisma.customer.delete({ where: { id: otherCustomer.id } });
        });
    });

    // Cleanup
    afterAll(async () => {
        await prisma.wishlistItem.deleteMany({
            where: { customerId },
        }).catch(() => { });
        await prisma.product.delete({
            where: { id: testProductId },
        }).catch(() => { });
        await prisma.customer.delete({
            where: { id: customerId },
        }).catch(() => { });
        await prisma.$disconnect();
    });
});
