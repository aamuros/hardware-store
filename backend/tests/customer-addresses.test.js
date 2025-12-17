const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('Customer Saved Addresses API', () => {
    const testEmail = 'addresstest@example.com';
    const testPassword = 'testpass123';
    let authToken;
    let customerId;
    let addressId;

    // Setup: Create test customer and get auth token
    beforeAll(async () => {
        // Cleanup existing test data
        await prisma.savedAddress.deleteMany({
            where: { customer: { email: testEmail } },
        }).catch(() => { });
        await prisma.wishlistItem.deleteMany({
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
                name: 'Address Test Customer',
            },
        });
        customerId = customer.id;

        // Get auth token
        const loginResponse = await request(app)
            .post('/api/customers/login')
            .send({ email: testEmail, password: testPassword });
        authToken = loginResponse.body.data.token;
    });

    describe('POST /api/customers/addresses', () => {
        it('should create a new address', async () => {
            const response = await request(app)
                .post('/api/customers/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    label: 'Home',
                    address: '123 Test Street',
                    barangay: 'Test Barangay',
                    landmarks: 'Near the church',
                })
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('label', 'Home');
            expect(response.body.data).toHaveProperty('isDefault', true); // First address is default

            addressId = response.body.data.id;
        });

        it('should set first address as default automatically', async () => {
            const addresses = await request(app)
                .get('/api/customers/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const defaultAddresses = addresses.body.data.filter(a => a.isDefault);
            expect(defaultAddresses.length).toBe(1);
        });

        it('should create second address without default', async () => {
            const response = await request(app)
                .post('/api/customers/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    label: 'Office',
                    address: '456 Work Street',
                    barangay: 'Business Barangay',
                })
                .expect(201);

            expect(response.body.data).toHaveProperty('isDefault', false);
        });

        it('should reject address without required fields', async () => {
            const response = await request(app)
                .post('/api/customers/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    label: 'Incomplete',
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('required');
        });

        it('should allow setting new address as default', async () => {
            const response = await request(app)
                .post('/api/customers/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    label: 'New Default',
                    address: '789 New Street',
                    barangay: 'New Barangay',
                    isDefault: true,
                })
                .expect(201);

            expect(response.body.data).toHaveProperty('isDefault', true);

            // Check that old default is no longer default
            const addresses = await request(app)
                .get('/api/customers/addresses')
                .set('Authorization', `Bearer ${authToken}`);

            const defaultAddresses = addresses.body.data.filter(a => a.isDefault);
            expect(defaultAddresses.length).toBe(1);
            expect(defaultAddresses[0].label).toBe('New Default');
        });

        it('should reject request without auth', async () => {
            const response = await request(app)
                .post('/api/customers/addresses')
                .send({
                    label: 'Unauthorized',
                    address: '123 Street',
                    barangay: 'Barangay',
                })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('GET /api/customers/addresses', () => {
        it('should return all addresses for customer', async () => {
            const response = await request(app)
                .get('/api/customers/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(3);
        });

        it('should return addresses sorted by default first', async () => {
            const response = await request(app)
                .get('/api/customers/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // First address should be default
            expect(response.body.data[0].isDefault).toBe(true);
        });
    });

    describe('PATCH /api/customers/addresses/:id', () => {
        it('should update address label', async () => {
            const response = await request(app)
                .patch(`/api/customers/addresses/${addressId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ label: 'Updated Home' })
                .expect(200);

            expect(response.body.data).toHaveProperty('label', 'Updated Home');
        });

        it('should update address details', async () => {
            const response = await request(app)
                .patch(`/api/customers/addresses/${addressId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    address: 'Updated Address',
                    barangay: 'Updated Barangay',
                    landmarks: 'Updated Landmarks',
                })
                .expect(200);

            expect(response.body.data.address).toBe('Updated Address');
            expect(response.body.data.barangay).toBe('Updated Barangay');
        });

        it('should return 404 for non-existent address', async () => {
            const response = await request(app)
                .patch('/api/customers/addresses/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ label: 'Test' })
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should not allow updating other customer addresses', async () => {
            // Create another customer
            const otherCustomer = await prisma.customer.create({
                data: {
                    email: 'other@example.com',
                    password: await bcrypt.hash('pass123', 10),
                    name: 'Other Customer',
                },
            });

            const otherAddress = await prisma.savedAddress.create({
                data: {
                    customerId: otherCustomer.id,
                    label: 'Other Home',
                    address: 'Other Address',
                    barangay: 'Other Barangay',
                },
            });

            // Try to update other customer's address
            const response = await request(app)
                .patch(`/api/customers/addresses/${otherAddress.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ label: 'Hacked' })
                .expect(404);

            expect(response.body).toHaveProperty('success', false);

            // Cleanup
            await prisma.savedAddress.delete({ where: { id: otherAddress.id } });
            await prisma.customer.delete({ where: { id: otherCustomer.id } });
        });
    });

    describe('PATCH /api/customers/addresses/:id/default', () => {
        it('should set address as default', async () => {
            const response = await request(app)
                .patch(`/api/customers/addresses/${addressId}/default`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data).toHaveProperty('isDefault', true);
        });

        it('should only have one default address', async () => {
            const addresses = await request(app)
                .get('/api/customers/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const defaultAddresses = addresses.body.data.filter(a => a.isDefault);
            expect(defaultAddresses.length).toBe(1);
        });
    });

    describe('DELETE /api/customers/addresses/:id', () => {
        it('should delete address', async () => {
            // Create an address to delete
            const createResponse = await request(app)
                .post('/api/customers/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    label: 'To Delete',
                    address: 'Delete Street',
                    barangay: 'Delete Barangay',
                });

            const deleteId = createResponse.body.data.id;

            const response = await request(app)
                .delete(`/api/customers/addresses/${deleteId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('should set another address as default when deleting default', async () => {
            // Set addressId as default first
            await request(app)
                .patch(`/api/customers/addresses/${addressId}/default`)
                .set('Authorization', `Bearer ${authToken}`);

            // Get addresses before delete
            const beforeDelete = await request(app)
                .get('/api/customers/addresses')
                .set('Authorization', `Bearer ${authToken}`);

            const addressCount = beforeDelete.body.data.length;

            // Delete the default address
            await request(app)
                .delete(`/api/customers/addresses/${addressId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Check that another address is now default (if any addresses remain)
            const afterDelete = await request(app)
                .get('/api/customers/addresses')
                .set('Authorization', `Bearer ${authToken}`);

            if (afterDelete.body.data.length > 0) {
                const defaultAddresses = afterDelete.body.data.filter(a => a.isDefault);
                expect(defaultAddresses.length).toBe(1);
            }
        });

        it('should return 404 for non-existent address', async () => {
            const response = await request(app)
                .delete('/api/customers/addresses/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    // Cleanup
    afterAll(async () => {
        await prisma.savedAddress.deleteMany({
            where: { customerId },
        }).catch(() => { });
        await prisma.customer.delete({
            where: { id: customerId },
        }).catch(() => { });
        await prisma.$disconnect();
    });
});
