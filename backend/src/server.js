/**
 * Server Entry Point
 * ------------------
 * This file is responsible for starting the actual HTTP server and handling
 * runtime operations like graceful shutdowns and uncaught errors.
 * It imports the Express application from app.js, which separates the
 * API configuration from the server execution.
 */
const app = require('./app');
const config = require('./config');
const prisma = require('./utils/prismaClient');

const PORT = config.port;

/**
 * Validate required environment variables before starting the server.
 * Ensures the application doesn't start with missing or insecure configurations,
 * which is critical for both development and production environments.
 */
const validateEnvironment = () => {
  const errors = [];

  // Critical security check: JWT_SECRET must be set for secure authentication
  if (!config.jwt.secret) {
    errors.push('JWT_SECRET is required but not set in environment variables');
  } else if (config.jwt.secret.length < 32) {
    console.warn('[!] Warning: JWT_SECRET should be at least 32 characters for security');
  }

  // Check for production-specific requirements (e.g., when deployed on Railway)
  if (config.nodeEnv === 'production') {
    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL is required in production');
    } else if (process.env.DATABASE_URL.startsWith('file:')) {
      errors.push('DATABASE_URL cannot use SQLite file: URLs in production. Use managed PostgreSQL.');
    }
    if (config.frontendUrl === 'http://localhost:5173') {
      console.warn('[!] Warning: FRONTEND_URL is set to localhost in production — set it to your real domain');
    }
  }

  // General DATABASE_URL check to ensure Prisma can connect to a database
  if (!process.env.DATABASE_URL) {
    console.warn('[!] Warning: DATABASE_URL is not set — database operations will fail');
  }

  // Fail fast: Prevent the server from running if there are critical missing variables
  if (errors.length > 0) {
    console.error('\n[X] Environment validation failed:\n');
    errors.forEach((err, i) => console.error(`   ${i + 1}. ${err}`));
    console.error('\nPlease set the required environment variables and restart.\n');
    process.exit(1);
  }

  console.log('[OK] Environment validation passed');
};

/**
 * Graceful Shutdown Handler
 * Safely closes database connections and cleans up resources before
 * terminating the Node.js process. Prevents data corruption on exit.
 * 
 * @param {string} signal - The termination signal received (e.g., SIGTERM, SIGINT)
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Disconnect Prisma client safely
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Listen for termination signals from the OS or hosting provider
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // e.g., Docker stop, Railway terminate
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // e.g., Ctrl+C in terminal

// Catch-all for uncaught operational exceptions
// IMPORTANT: We log but do NOT exit — exiting causes Railway restarts and data loss.
// Only truly fatal system errors (e.g. EADDRINUSE, out-of-memory) should exit.
process.on('uncaughtException', (error) => {
  console.error('[!] Uncaught Exception (server kept alive):', error.message);
  console.error(error.stack);
  // Only exit for fatal system-level errors that cannot be recovered from
  const fatalCodes = ['EADDRINUSE', 'EACCES'];
  if (error.code && fatalCodes.includes(error.code)) {
    console.error('[X] Fatal system error — shutting down.');
    process.exit(1);
  }
  // For all other errors: log and continue. The request that caused this error
  // has already been dropped, but the server remains healthy for all other requests.
});

// Catch-all for unhandled promise rejections
// Log but do NOT exit — these are almost always recoverable async errors.
process.on('unhandledRejection', (reason, promise) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error('[!] Unhandled Promise Rejection (server kept alive):', msg);
});

/**
 * Main Server Initialization
 * Validates the environment, connects to the database, and starts listening for HTTP requests.
 */
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

