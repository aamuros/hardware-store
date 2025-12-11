// Test setup file
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Clean database before tests
beforeAll(async () => {
  // Clean up test data
  await prisma.orderItem.deleteMany();
  await prisma.smsLog.deleteMany().catch(() => {}); // May not exist
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
});

// Close database connection after tests
afterAll(async () => {
  await prisma.$disconnect();
});

module.exports = { prisma };
