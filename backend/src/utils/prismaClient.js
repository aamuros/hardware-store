/**
 * Shared Prisma Client Instance
 * 
 * This module provides a singleton Prisma client instance to avoid
 * creating multiple database connection pools across the application.
 * 
 * Usage:
 *   const prisma = require('../utils/prismaClient');
 */

const { PrismaClient } = require('@prisma/client');

// Prevent multiple instances of Prisma Client in development
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
