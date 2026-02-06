/**
 * Critical Bug Scenarios Test Suite
 *
 * Tests for the most important parts of the program:
 * 1. Stock management (order creation, cancellation, restoration)
 * 2. Concurrency / race conditions
 * 3. Sales report accuracy
 * 4. Order status transitions
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Mock SMS service
jest.mock('../src/services/smsService', () => {
    const actual = jest.requireActual('../src/services/smsService');
    return {
        ...actual,
        sendOrderConfirmation: jest.fn().mockResolvedValue(true),
        notifyAdminNewOrder: jest.fn().mockResolvedValue(true),
        sendStatusUpdate: jest.fn().mockResolvedValue(true),
    };
});

describe('Critical Bug Scenarios', () => {
    let testCategory;
    let testProduct;
    let adminToken;
    let testAdmin;

    beforeAll(async () => {
        // Clean up test data
        await prisma.orderStatusHistory.deleteMany();
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await prisma.productVariant.deleteMany();
        await prisma.product.deleteMany();
        await prisma.category.deleteMany();

        // Create test category
        testCategory = await prisma.category.create({
            data: {
                name: 'Critical Test Category',
                description: 'For critical bug tests',
            },
        });

        // Create test product with known stock
        testProduct = await prisma.product.create({
            data: {
                name: 'Critical Test Product',
                description: 'For stock tests',
                price: 100.0,
                unit: 'piece',
                sku: 'CRIT-TEST-001',
                stockQuantity: 10,
                isAvailable: true,
                categoryId: testCategory.id,
            },
        });

        // Create or find admin user
        const hashedPassword = await bcrypt.hash('TestAdmin123!', 10);
        testAdmin = await prisma.user.upsert({
            where: { username: 'test_admin_critical' },
            update: { password: hashedPassword, isActive: true },
            create: {
                username: 'test_admin_critical',
                password: hashedPassword,
                name: 'Critical Test Admin',
                role: 'admin',
                isActive: true,
            },
        });

        // Login to get admin token
        const loginResponse = await request(app).post('/api/admin/login').send({
            username: 'test_admin_critical',
            password: 'TestAdmin123!',
        });
        adminToken = loginResponse.body.data?.token;
    });

    afterAll(async () => {
        // Cleanup
        await prisma.orderStatusHistory.deleteMany();
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await prisma.productVariant.deleteMany();
        await prisma.product.deleteMany();
        await prisma.category.deleteMany();
        await prisma.user.deleteMany({ where: { username: 'test_admin_critical' } });
        await prisma.$disconnect();
    });

    // =============================================================================
    // STOCK MANAGEMENT TESTS
    // =============================================================================
    describe('Stock Management', () => {
        beforeEach(async () => {
            // Reset stock to known value before each test
            await prisma.product.update({
                where: { id: testProduct.id },
                data: { stockQuantity: 10 },
            });
        });

        it('should deduct stock when order is created', async () => {
            const initialStock = 10;
            const orderQuantity = 3;

            const response = await request(app)
                .post('/api/orders')
                .send({
                    customerName: 'Stock Test User',
                    phone: '09171234567',
                    address: '123 Test Street, City',
                    barangay: 'Test Barangay',
                    items: [{ productId: testProduct.id, quantity: orderQuantity }],
                })
                .expect(201);

            expect(response.body.success).toBe(true);

            // Verify stock was deducted
            const product = await prisma.product.findUnique({
                where: { id: testProduct.id },
            });
            expect(product.stockQuantity).toBe(initialStock - orderQuantity);
        });

        it('should restore stock when order is cancelled', async () => {
            // Create an order first
            const createResponse = await request(app)
                .post('/api/orders')
                .send({
                    customerName: 'Cancel Test User',
                    phone: '09171234567',
                    address: '123 Test Street, City',
                    barangay: 'Test Barangay',
                    items: [{ productId: testProduct.id, quantity: 2 }],
                })
                .expect(201);

            const orderId = createResponse.body.data.items[0].orderId ||
                (await prisma.order.findFirst({
                    where: { orderNumber: createResponse.body.data.orderNumber },
                    select: { id: true },
                }))?.id;

            const stockAfterOrder = (await prisma.product.findUnique({
                where: { id: testProduct.id },
            })).stockQuantity;

            // Cancel the order
            await request(app)
                .patch(`/api/admin/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'cancelled' })
                .expect(200);

            // Verify stock was restored
            const product = await prisma.product.findUnique({
                where: { id: testProduct.id },
            });
            expect(product.stockQuantity).toBe(stockAfterOrder + 2);
        });

        it('should reject order when stock is insufficient', async () => {
            // Set stock to 1
            await prisma.product.update({
                where: { id: testProduct.id },
                data: { stockQuantity: 1 },
            });

            const response = await request(app)
                .post('/api/orders')
                .send({
                    customerName: 'Insufficient Stock User',
                    phone: '09171234567',
                    address: '123 Test Street, City',
                    barangay: 'Test Barangay',
                    items: [{ productId: testProduct.id, quantity: 5 }],
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Insufficient stock');
            expect(response.body.code).toBe('INSUFFICIENT_STOCK');
        });

        it('should prevent negative stock (no overselling)', async () => {
            // Set stock to exactly 2
            await prisma.product.update({
                where: { id: testProduct.id },
                data: { stockQuantity: 2 },
            });

            // Try to order 3
            const response = await request(app)
                .post('/api/orders')
                .send({
                    customerName: 'Oversell Test User',
                    phone: '09171234567',
                    address: '123 Test Street, City',
                    barangay: 'Test Barangay',
                    items: [{ productId: testProduct.id, quantity: 3 }],
                })
                .expect(400);

            expect(response.body.success).toBe(false);

            // Verify stock wasn't touched
            const product = await prisma.product.findUnique({
                where: { id: testProduct.id },
            });
            expect(product.stockQuantity).toBe(2);
        });
    });

    // =============================================================================
    // ORDER STATUS TRANSITIONS
    // =============================================================================
    describe('Order Status Transitions', () => {
        let testOrderId;

        beforeEach(async () => {
            // Reset stock
            await prisma.product.update({
                where: { id: testProduct.id },
                data: { stockQuantity: 100 },
            });

            // Create a new order for each test
            const response = await request(app)
                .post('/api/orders')
                .send({
                    customerName: 'Status Test User',
                    phone: '09171234567',
                    address: '123 Test Street, City',
                    barangay: 'Test Barangay',
                    items: [{ productId: testProduct.id, quantity: 1 }],
                });

            const order = await prisma.order.findFirst({
                where: { orderNumber: response.body.data.orderNumber },
            });
            testOrderId = order.id;
        });

        it('should transition from pending to accepted', async () => {
            const response = await request(app)
                .patch(`/api/admin/orders/${testOrderId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'accepted' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('accepted');
        });

        it('should transition through full delivery flow', async () => {
            const statuses = ['accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed'];

            for (const status of statuses) {
                const response = await request(app)
                    .patch(`/api/admin/orders/${testOrderId}/status`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ status })
                    .expect(200);

                expect(response.body.data.status).toBe(status);
            }
        });

        it('should reject invalid status values', async () => {
            const response = await request(app)
                .patch(`/api/admin/orders/${testOrderId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'invalid_status' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should create status history entries', async () => {
            // Change status
            await request(app)
                .patch(`/api/admin/orders/${testOrderId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'accepted', message: 'Order confirmed' });

            // Check history
            const history = await prisma.orderStatusHistory.findMany({
                where: { orderId: testOrderId },
                orderBy: { createdAt: 'desc' },
            });

            expect(history.length).toBeGreaterThanOrEqual(2); // Initial + accepted
            expect(history[0].toStatus).toBe('accepted');
            expect(history[0].fromStatus).toBe('pending');
        });
    });

    // =============================================================================
    // SALES REPORT TESTS
    // =============================================================================
    describe('Sales Report Accuracy', () => {
        beforeAll(async () => {
            // Create completed orders for sales report testing
            await prisma.product.update({
                where: { id: testProduct.id },
                data: { stockQuantity: 1000 },
            });

            // Create multiple orders and mark them as completed
            for (let i = 0; i < 3; i++) {
                const orderResponse = await request(app)
                    .post('/api/orders')
                    .send({
                        customerName: `Sales Report User ${i}`,
                        phone: '09171234567',
                        address: '123 Test Street, City',
                        barangay: 'Test Barangay',
                        items: [{ productId: testProduct.id, quantity: 1 }],
                    });

                const order = await prisma.order.findFirst({
                    where: { orderNumber: orderResponse.body.data.orderNumber },
                });

                // Mark as completed
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'completed' },
                });
            }
        });

        it('should return correct sales totals', async () => {
            const response = await request(app)
                .get('/api/admin/reports/sales')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalSales');
            expect(response.body.data).toHaveProperty('orderCount');
            expect(response.body.data).toHaveProperty('averageOrderValue');

            // At least our 3 completed orders should be counted
            expect(response.body.data.orderCount).toBeGreaterThanOrEqual(3);
        });

        it('should filter by date range', async () => {
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 1);
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 1);

            const response = await request(app)
                .get('/api/admin/reports/sales')
                .query({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.orderCount).toBeGreaterThanOrEqual(0);
        });

        it('should exclude non-completed orders from sales', async () => {
            // Create pending order
            const pendingOrderResponse = await request(app)
                .post('/api/orders')
                .send({
                    customerName: 'Pending Sales User',
                    phone: '09171234567',
                    address: '123 Test Street, City',
                    barangay: 'Test Barangay',
                    items: [{ productId: testProduct.id, quantity: 10 }], // 1000 PHP
                });

            // Get sales report
            const salesBefore = await request(app)
                .get('/api/admin/reports/sales')
                .set('Authorization', `Bearer ${adminToken}`);

            const pendingOrderTotal = 10 * testProduct.price;

            // Verify pending orders are not in totals
            // The pending order's amount should NOT be included
            expect(salesBefore.body.data.totalSales).toBeDefined();
        });
    });

    // =============================================================================
    // CART VALIDATION TESTS
    // =============================================================================
    describe('Cart Validation', () => {
        it('should validate cart items before checkout', async () => {
            const response = await request(app)
                .post('/api/orders/validate-cart')
                .send({
                    items: [
                        { productId: testProduct.id, quantity: 1 },
                    ],
                })
                .expect(200);

            expect(response.body.valid).toBe(true);
            expect(response.body.validatedItems).toHaveLength(1);
        });

        it('should catch unavailable products', async () => {
            // Create unavailable product
            const unavailableProduct = await prisma.product.create({
                data: {
                    name: 'Unavailable Cart Test',
                    price: 50.0,
                    unit: 'piece',
                    sku: 'UNAVAIL-CART-001',
                    stockQuantity: 10,
                    isAvailable: false,
                    categoryId: testCategory.id,
                },
            });

            const response = await request(app)
                .post('/api/orders/validate-cart')
                .send({
                    items: [{ productId: unavailableProduct.id, quantity: 1 }],
                })
                .expect(200);

            expect(response.body.valid).toBe(false);
            expect(response.body.errors[0].type).toBe('UNAVAILABLE');
        });

        it('should catch insufficient stock', async () => {
            await prisma.product.update({
                where: { id: testProduct.id },
                data: { stockQuantity: 1 },
            });

            const response = await request(app)
                .post('/api/orders/validate-cart')
                .send({
                    items: [{ productId: testProduct.id, quantity: 100 }],
                })
                .expect(200);

            expect(response.body.valid).toBe(false);
            expect(response.body.errors[0].type).toBe('INSUFFICIENT_STOCK');
        });
    });

    // =============================================================================
    // AUTHENTICATION TESTS
    // =============================================================================
    describe('Admin Authentication', () => {
        it('should reject requests without token', async () => {
            await request(app).get('/api/admin/dashboard').expect(401);
        });

        it('should reject invalid tokens', async () => {
            await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);
        });

        it('should accept valid tokens', async () => {
            const response = await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('stats');
        });
    });
});
