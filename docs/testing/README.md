# Testing Guide

This guide covers how to run tests and write new tests for the Hardware Store application.

## Testing Documentation

- **[Manual Test Cases](./manual-test-cases.md)** - Comprehensive step-by-step test scenarios for manual browser testing
- **Automated Tests** - Jest/Supertest API tests (covered in this document)

---

## Overview

The project uses **Jest** as the testing framework with **Supertest** for API testing.

```
backend/tests/
├── setup.js                    # Test setup and utilities
├── app.test.js                 # Basic app tests
├── admin.test.js               # Admin authentication tests
├── admin-crud.test.js          # Admin CRUD operations
├── categories.test.js          # Category API tests
├── products.test.js            # Product API tests
├── orders.test.js              # Order API tests
├── order-status.test.js        # Order status workflow tests
├── customer-auth.test.js       # Customer authentication tests
├── customer-addresses.test.js  # Customer addresses tests
├── customer-wishlist.test.js   # Wishlist tests
├── error-handling.test.js      # Error handling tests
└── sms.test.js                 # SMS service tests
```

---

## Running Tests

### Run All Tests

```bash
cd backend
npm test
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Run Specific Test File

```bash
npm test -- --testPathPattern=orders.test.js
```

### Run in Watch Mode

```bash
npm run test:watch
```

### Run Single Test

```bash
npm test -- --testNamePattern="should create an order"
```

---

## Test Configuration

### Jest Configuration

Located in `backend/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
  ],
};
```

### Test Setup

`tests/setup.js` provides:
- Test database setup
- Global test utilities
- Cleanup after tests

---

## Writing Tests

### Basic Test Structure

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Products API', () => {
  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });
  });
});
```

### Testing with Authentication

```javascript
describe('Admin API', () => {
  let adminToken;

  beforeAll(async () => {
    // Login and get token
    const response = await request(app)
      .post('/api/admin/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    adminToken = response.body.data.token;
  });

  it('should create a product', async () => {
    const response = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Product',
        price: 100,
        unit: 'piece',
        categoryId: 1
      })
      .expect(201);
    
    expect(response.body.success).toBe(true);
  });
});
```

### Testing Validation Errors

```javascript
it('should reject invalid phone number', async () => {
  const response = await request(app)
    .post('/api/orders')
    .send({
      customerName: 'Test',
      phone: '08171234567', // Invalid prefix
      address: 'Test',
      barangay: 'Test',
      items: [{ productId: 1, quantity: 1 }]
    })
    .expect(400);
  
  expect(response.body.success).toBe(false);
  expect(response.body.errors).toContainEqual(
    expect.objectContaining({ field: 'phone' })
  );
});
```

### Testing SMS Service

```javascript
const smsService = require('../src/services/smsService');

describe('SMS Service', () => {
  describe('validatePhoneNumber', () => {
    it('should validate Globe numbers', () => {
      const result = smsService.validatePhoneNumber('09171234567');
      expect(result.valid).toBe(true);
      expect(result.telco).toBe('GLOBE');
    });

    it('should reject invalid prefixes', () => {
      const result = smsService.validatePhoneNumber('08171234567');
      expect(result.valid).toBe(false);
    });
  });
});
```

---

## Test Data

### Using Seed Data

Tests use the seeded database. Key test data:

| Entity | ID | Name |
|--------|-----|------|
| Admin User | 1 | admin |
| Category | 1 | Tools |
| Product | 1 | Claw Hammer |

### Creating Test Data

For isolated tests, create data in `beforeAll`:

```javascript
let testProduct;

beforeAll(async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  testProduct = await prisma.product.create({
    data: {
      name: 'Test Product',
      price: 100,
      unit: 'piece',
      categoryId: 1
    }
  });
});

afterAll(async () => {
  await prisma.product.delete({
    where: { id: testProduct.id }
  });
});
```

---

## Coverage Report

After running tests with coverage:

```bash
npm test -- --coverage
```

View the HTML report:

```bash
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Aim for these minimums:

| Metric | Target |
|--------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

---

## Common Testing Patterns

### Testing Pagination

```javascript
it('should paginate results', async () => {
  const response = await request(app)
    .get('/api/products?page=1&limit=5')
    .expect(200);
  
  expect(response.body.data.pagination).toMatchObject({
    page: 1,
    limit: 5
  });
  expect(response.body.data.products.length).toBeLessThanOrEqual(5);
});
```

### Testing 404 Errors

```javascript
it('should return 404 for non-existent product', async () => {
  const response = await request(app)
    .get('/api/products/99999')
    .expect(404);
  
  expect(response.body.success).toBe(false);
  expect(response.body.message).toContain('not found');
});
```

### Testing Authorization

```javascript
it('should reject unauthenticated requests', async () => {
  await request(app)
    .get('/api/admin/orders')
    .expect(401);
});

it('should reject invalid tokens', async () => {
  await request(app)
    .get('/api/admin/orders')
    .set('Authorization', 'Bearer invalid-token')
    .expect(401);
});
```

---

## Debugging Tests

### Verbose Output

```bash
npm test -- --verbose
```

### Run Single File with Logging

```bash
npm test -- --testPathPattern=orders.test.js --verbose
```

### Debug with Node Inspector

```bash
node --inspect-brk node_modules/.bin/jest --testPathPattern=orders.test.js
```

Then open `chrome://inspect` in Chrome.

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: cd backend && npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Manual Testing

For comprehensive manual testing of the application's user interface and features, refer to:

**📋 [Manual Test Cases Document](./manual-test-cases.md)**

This document provides:
- **140+ step-by-step test scenarios** covering all customer and admin features
- Detailed instructions for testing each feature
- Expected results with checkboxes for tracking progress
- Test cases for:
  - Customer Portal (browsing, cart, checkout, account management, wishlist, order tracking)
  - Admin Dashboard (orders, products, categories, reports, analytics)
  - Edge cases and error handling
  - Responsive design and cross-browser compatibility

### When to Use Manual Testing

- **Before deployment** - Verify all features work end-to-end
- **After major changes** - Ensure UI updates work correctly
- **User acceptance testing** - Validate against requirements
- **Exploratory testing** - Find issues automated tests might miss
- **UI/UX validation** - Check visual design and user experience

### Running Manual Tests

1. **Start the application**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Open the test document**: [manual-test-cases.md](./manual-test-cases.md)

3. **Follow test scenarios** systematically, checking off each expected result

4. **Document issues** found during testing

---

## Best Practices

1. **Isolate Tests** - Each test should be independent
2. **Clean Up** - Remove test data in `afterAll`
3. **Descriptive Names** - Use clear test descriptions
4. **Test Edge Cases** - Invalid input, empty data, boundaries
5. **Mock External Services** - SMS, file uploads
6. **Fast Tests** - Keep individual tests under 1 second
7. **Consistent Data** - Use factories for test data
