const app = require('./app');
const config = require('./config');
const prisma = require('./utils/prismaClient');

const PORT = config.port;

/**
 * Validate required environment variables before starting the server.
 * This prevents the server from running with insecure default configurations.
 */
const validateEnvironment = () => {
  const errors = [];

  // Critical security check: JWT_SECRET must be set
  if (!config.jwt.secret) {
    errors.push('JWT_SECRET is required but not set in environment variables');
  } else if (config.jwt.secret.length < 32) {
    console.warn('[!] Warning: JWT_SECRET should be at least 32 characters for security');
  }

  // Check for production-specific requirements
  if (config.nodeEnv === 'production') {
    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL is required in production');
    }
    if (config.frontendUrl === 'http://localhost:5173') {
      console.warn('[!] Warning: FRONTEND_URL is set to localhost in production — set it to your real domain');
    }
  }

  // General DATABASE_URL check (required for PostgreSQL)
  if (!process.env.DATABASE_URL) {
    console.warn('[!] Warning: DATABASE_URL is not set — database operations will fail');
  }

  // If there are critical errors, fail fast
  if (errors.length > 0) {
    console.error('\n[X] Environment validation failed:\n');
    errors.forEach((err, i) => console.error(`   ${i + 1}. ${err}`));
    console.error('\nPlease set the required environment variables and restart.\n');
    process.exit(1);
  }

  console.log('[OK] Environment validation passed');
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const startServer = async () => {
  try {
    // Validate environment first
    validateEnvironment();

    // Test database connection
    await prisma.$connect();
    console.log('[OK] Database connected successfully');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   HARDWARE STORE API SERVER                        ║
║                                                    ║
║   Environment: ${config.nodeEnv.padEnd(32)}║
║   Port: ${PORT.toString().padEnd(39)}║
║   URL: http://localhost:${PORT.toString().padEnd(22)}║
║                                                    ║
║   Press CTRL+C to stop                             ║
║                                                    ║
╚════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('[X] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

