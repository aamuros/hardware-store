// Test setup file
const prisma = require('../src/utils/prismaClient');

// Clean database before tests (respects foreign key constraints)
beforeAll(async () => {
  // Clean up test data in correct order for FK constraints
  await prisma.wishlistItem.deleteMany().catch(() => {});
  await prisma.orderStatusHistory.deleteMany().catch(() => {});
  await prisma.orderItem.deleteMany().catch(() => {});
  await prisma.smsLog.deleteMany().catch(() => {});
  await prisma.order.deleteMany().catch(() => {});
  await prisma.savedAddress.deleteMany().catch(() => {});
  await prisma.bulkPricingTier.deleteMany().catch(() => {});
  await prisma.productImage.deleteMany().catch(() => {});
  await prisma.productVariant.deleteMany().catch(() => {});
  await prisma.product.deleteMany().catch(() => {});
  await prisma.category.deleteMany().catch(() => {});
  await prisma.customer.deleteMany().catch(() => {});
});

// Close database connection after tests
afterAll(async () => {
  await prisma.$disconnect();
});

module.exports = { prisma };
