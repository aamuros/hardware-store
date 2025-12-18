const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('Customer Authentication API', () => {
    const testEmail = 'testcustomer@example.com';
    // Strong password meeting requirements: 8+ chars, uppercase, lowercase, number, special char
    const testPassword = 'TestPass123!';
    let customerId = null;

    // Cleanup test customer before tests
    beforeAll(async () => {
        // Clean up any existing test customer
        await prisma.wishlistItem.deleteMany({
            where: { customer: { email: testEmail } },
        }).catch(() => { });
        await prisma.savedAddress.deleteMany({
            where: { customer: { email: testEmail } },
        }).catch(() => { });
        await prisma.customer.deleteMany({
            where: { email: testEmail },
        }).catch(() => { });
    });

    describe('POST /api/customers/register', () => {
        it('should register a new customer successfully', async () => {
            const response = await request(app)
                .post('/api/customers/register')
                .send({
                    email: testEmail,
                    password: testPassword,
                    name: 'Test Customer',
                    phone: '09171234567',
                })
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('customer');
            expect(response.body.data.customer).toHaveProperty('email', testEmail);
            expect(response.body.data.customer).not.toHaveProperty('password');

            customerId = response.body.data.customer.id;
        });

        it('should reject registration with existing email', async () => {
            const response = await request(app)
                .post('/api/customers/register')
                .send({
                    email: testEmail,
                    password: 'AnotherPass123!',
                    name: 'Another Customer',
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('already registered');
        });

        it('should reject registration with missing required fields', async () => {
            const response = await request(app)
                .post('/api/customers/register')
                .send({
                    email: 'incomplete@example.com',
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should reject registration with invalid email format', async () => {
            const response = await request(app)
                .post('/api/customers/register')
                .send({
                    email: 'not-an-email',
                    password: 'TestPass123!',
                    name: 'Test User',
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('Invalid email');
        });

        it('should reject registration with weak password', async () => {
            const response = await request(app)
                .post('/api/customers/register')
                .send({
                    email: 'newuser@example.com',
                    password: '123',
                    name: 'Test User',
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('Password does not meet requirements');
        });

        it('should normalize email to lowercase', async () => {
            const upperCaseEmail = 'UPPERCASE@EXAMPLE.COM';
            const response = await request(app)
                .post('/api/customers/register')
                .send({
                    email: upperCaseEmail,
                    password: 'TestPass123!',
                    name: 'Uppercase User',
                })
                .expect(201);

            expect(response.body.data.customer.email).toBe(upperCaseEmail.toLowerCase());

            // Cleanup
            await prisma.customer.delete({
                where: { email: upperCaseEmail.toLowerCase() },
            });
        });
    });

    describe('POST /api/customers/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/customers/login')
                .send({
                    email: testEmail,
                    password: testPassword,
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('customer');
        });

        it('should login with email regardless of case', async () => {
            const response = await request(app)
                .post('/api/customers/login')
                .send({
                    email: testEmail.toUpperCase(),
                    password: testPassword,
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('should reject login with wrong password', async () => {
            const response = await request(app)
                .post('/api/customers/login')
                .send({
                    email: testEmail,
                    password: 'wrongpassword',
                })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should reject login with non-existent email', async () => {
            const response = await request(app)
                .post('/api/customers/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'somepassword',
                })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should reject login with missing fields', async () => {
            const response = await request(app)
                .post('/api/customers/login')
                .send({
                    email: testEmail,
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should reject login for inactive customer', async () => {
            // Deactivate customer
            await prisma.customer.update({
                where: { email: testEmail },
                data: { isActive: false },
            });

            const response = await request(app)
                .post('/api/customers/login')
                .send({
                    email: testEmail,
                    password: testPassword,
                })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);

            // Reactivate customer for remaining tests
            await prisma.customer.update({
                where: { email: testEmail },
                data: { isActive: true },
            });
        });
    });

    describe('Protected Customer Routes', () => {
        let authToken;

        beforeAll(async () => {
            const loginResponse = await request(app)
                .post('/api/customers/login')
                .send({
                    email: testEmail,
                    password: testPassword,
                });
            authToken = loginResponse.body.data.token;
        });

        describe('GET /api/customers/profile', () => {
            it('should get profile with valid token', async () => {
                const response = await request(app)
                    .get('/api/customers/profile')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body).toHaveProperty('success', true);
                expect(response.body.data).toHaveProperty('email', testEmail);
                expect(response.body.data).toHaveProperty('_count');
            });

            it('should reject access without token', async () => {
                const response = await request(app)
                    .get('/api/customers/profile')
                    .expect(401);

                expect(response.body).toHaveProperty('success', false);
            });

            it('should reject access with invalid token', async () => {
                const response = await request(app)
                    .get('/api/customers/profile')
                    .set('Authorization', 'Bearer invalid-token')
                    .expect(401);

                expect(response.body).toHaveProperty('success', false);
            });

            it('should reject admin token on customer routes', async () => {
                // Get admin token
                const adminLogin = await request(app)
                    .post('/api/admin/login')
                    .send({ username: 'admin', password: 'admin123' });

                const adminToken = adminLogin.body.data?.token;

                if (adminToken) {
                    const response = await request(app)
                        .get('/api/customers/profile')
                        .set('Authorization', `Bearer ${adminToken}`)
                        .expect(401);

                    expect(response.body.message).toContain('Customer authentication');
                }
            });
        });

        describe('PATCH /api/customers/profile', () => {
            it('should update profile name', async () => {
                const response = await request(app)
                    .patch('/api/customers/profile')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ name: 'Updated Name' })
                    .expect(200);

                expect(response.body).toHaveProperty('success', true);
                expect(response.body.data).toHaveProperty('name', 'Updated Name');
            });

            it('should update profile phone', async () => {
                const response = await request(app)
                    .patch('/api/customers/profile')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ phone: '09181234567' })
                    .expect(200);

                expect(response.body.data).toHaveProperty('phone', '09181234567');
            });

            it('should allow clearing phone number', async () => {
                const response = await request(app)
                    .patch('/api/customers/profile')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ phone: '' })
                    .expect(200);

                expect(response.body.data.phone).toBeNull();
            });
        });

        describe('PATCH /api/customers/change-password', () => {
            it('should change password with correct current password', async () => {
                const response = await request(app)
                    .patch('/api/customers/change-password')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        currentPassword: testPassword,
                        newPassword: 'NewPass456!',
                    })
                    .expect(200);

                expect(response.body).toHaveProperty('success', true);

                // Login with new password should work
                const loginResponse = await request(app)
                    .post('/api/customers/login')
                    .send({
                        email: testEmail,
                        password: 'NewPass456!',
                    })
                    .expect(200);

                // Update authToken for subsequent tests
                authToken = loginResponse.body.data.token;

                // Change back to original password
                await request(app)
                    .patch('/api/customers/change-password')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        currentPassword: 'NewPass456!',
                        newPassword: testPassword,
                    });
            });

            it('should reject with wrong current password', async () => {
                const response = await request(app)
                    .patch('/api/customers/change-password')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        currentPassword: 'WrongPassword1!',
                        newPassword: 'NewPass456!',
                    })
                    .expect(401);

                expect(response.body).toHaveProperty('success', false);
            });

            it('should reject weak new password', async () => {
                const response = await request(app)
                    .patch('/api/customers/change-password')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        currentPassword: testPassword,
                        newPassword: '123',
                    })
                    .expect(400);

                expect(response.body.message).toContain('does not meet requirements');
            });
        });
    });

    // Cleanup after all tests
    afterAll(async () => {
        if (customerId) {
            await prisma.wishlistItem.deleteMany({
                where: { customerId },
            }).catch(() => { });
            await prisma.savedAddress.deleteMany({
                where: { customerId },
            }).catch(() => { });
            await prisma.customer.delete({
                where: { id: customerId },
            }).catch(() => { });
        }
        await prisma.$disconnect();
    });
});
