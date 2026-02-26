# Testing Guide

This document covers how to run the existing test suite and how to add new tests to the project. All tests are located in the `backend/tests/` directory.

## Test Stack

The project uses **Jest** as the test runner and **Supertest** for making HTTP requests against the Express app without actually starting the server. This combination lets us write tests that behave like real API calls but run entirely in memory.

## Test Files

```
backend/tests/
├── setup.js                    # Shared test configuration and helpers
├── app.test.js                 # Basic server health and configuration checks
├── admin.test.js               # Admin login and authentication
├── admin-crud.test.js          # Admin product and category CRUD operations
├── categories.test.js          # Public category listing endpoints
├── products.test.js            # Public product listing and detail endpoints
├── orders.test.js              # Order creation and tracking
├── order-status.test.js        # Order status transitions and workflow
├── customer-auth.test.js       # Customer registration and login
├── customer-addresses.test.js  # Saved delivery addresses
├── customer-wishlist.test.js   # Wishlist add/remove functionality
├── error-handling.test.js      # Error responses and edge cases
└── sms.test.js                 # SMS service logic (validation, formatting, providers)
```

---

## Running Tests

### Run the Full Suite

```bash
cd backend
npm test
```

This runs every test file and reports pass/fail results.

### Run with Coverage Report

```bash
npm test -- --coverage
```

After running, open the HTML report to see which lines of code are covered:
```bash
open coverage/lcov-report/index.html
```

### Run a Single Test File

If you only want to run one file — for example, just the order tests:

```bash
npm test -- --testPathPattern=orders.test.js
```

### Run a Single Test by Name

You can also target a specific `it()` or `test()` block by matching its description string:

```bash
npm test -- --testNamePattern="should create an order"
```

### Watch Mode

During active development, watch mode re-runs tests automatically whenever you save a file:

```bash
npm run test:watch
```

---

## Jest Configuration

The Jest config is in `backend/jest.config.js`:

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

The `setup.js` file handles:
- Setting up a clean test database before the suite runs
- Providing shared helper functions (like logging in and getting tokens)
- Cleaning up after all tests are done

---

## Writing Tests

### Basic Structure

A typical test file looks like this:

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Products API', () => {
  describe('GET /api/products', () => {
    it('should return a list of products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });
  });
});
```

`describe()` blocks group related tests together. `it()` blocks define individual test cases. `request(app)` creates an HTTP request against the Express app.

### Testing Protected Endpoints

Some endpoints require authentication. Log in first, save the token, and include it in the `Authorization` header:

```javascript
describe('Admin API', () => {
  let adminToken;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    adminToken = response.body.data.token;
  });

  it('should allow creating a product with a valid token', async () => {
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

### Testing Validation

When you want to verify that the API correctly rejects bad input:

```javascript
it('should reject an order with an invalid phone number', async () => {
  const response = await request(app)
    .post('/api/orders')
    .send({
      customerName: 'Test',
      phone: '08171234567',  // invalid prefix
      address: 'Test Address',
      barangay: 'Test Barangay',
      items: [{ productId: 1, quantity: 1 }]
    })
    .expect(400);
  
  expect(response.body.success).toBe(false);
  expect(response.body.errors).toContainEqual(
    expect.objectContaining({ field: 'phone' })
  );
});
```

### Testing the SMS Service Directly

You can also test services in isolation, without going through HTTP endpoints:

```javascript
const smsService = require('../src/services/smsService');

describe('SMS Service', () => {
  describe('validatePhoneNumber', () => {
    it('should identify Globe numbers correctly', () => {
      const result = smsService.validatePhoneNumber('09171234567');
      expect(result.valid).toBe(true);
      expect(result.telco).toBe('GLOBE');
    });

    it('should reject numbers with invalid prefixes', () => {
      const result = smsService.validatePhoneNumber('08171234567');
      expect(result.valid).toBe(false);
    });
  });
});
```

---

## Working with Test Data

### Seed Data

Tests run against the seeded database. Some key records you can rely on:

| What | ID | Identifier |
|------|-----|-----------|
| Admin user | 1 | username: `admin` |

### Creating Isolated Test Data

For tests that need specific records, create them in `beforeAll` and clean up in `afterAll`:

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

This keeps tests independent — one test's data will not interfere with another.

---

## Common Patterns

### Pagination

```javascript
it('should respect pagination parameters', async () => {
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

### 404 Not Found

```javascript
it('should return 404 for a product that does not exist', async () => {
  const response = await request(app)
    .get('/api/products/99999')
    .expect(404);
  
  expect(response.body.success).toBe(false);
  expect(response.body.message).toContain('not found');
});
```

### Authorization

```javascript
it('should block requests without a token', async () => {
  await request(app)
    .get('/api/admin/orders')
    .expect(401);
});

it('should reject an invalid token', async () => {
  await request(app)
    .get('/api/admin/orders')
    .set('Authorization', 'Bearer not-a-real-token')
    .expect(401);
});
```

---

## Debugging Failed Tests

### Verbose Output

Add `--verbose` to see each test case name as it runs:

```bash
npm test -- --verbose
```

### Verbose Output for a Single File

```bash
npm test -- --testPathPattern=orders.test.js --verbose
```

### Node Inspector

For stepping through tests line by line in Chrome DevTools:

```bash
node --inspect-brk node_modules/.bin/jest --testPathPattern=orders.test.js
```

Then open `chrome://inspect` in Chrome and click the inspect link.

---

## Coverage Targets

These are the minimum coverage percentages we aim for:

| Metric | Target |
|--------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

---

## CI/CD Integration

If you want to run tests automatically on every push or pull request, here is an example GitHub Actions workflow:

```yaml
name: Run Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests with coverage
        run: cd backend && npm test -- --coverage
      
      - name: Upload coverage report
        uses: codecov/codecov-action@v3
```

---

## Tips

1. **Keep tests independent** — each test should set up what it needs and clean up after itself
2. **Use descriptive names** — a reader should understand what the test does just from the `it()` description
3. **Test both happy and unhappy paths** — check that valid input works *and* that invalid input is properly rejected
4. **Test boundary conditions** — empty arrays, zero quantities, missing fields
5. **Mock external services** — the SMS service is mocked in tests so no real messages are sent
6. **Keep individual tests fast** — each should run in under one second
7. **Use consistent test data** — rely on seed data for common records and create specific data for edge-case tests
