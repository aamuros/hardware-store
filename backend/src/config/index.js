require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT - No fallback! Server will fail fast if not set (see server.js validateEnvironment)
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // SMS Configuration
  sms: {
    // Enable/disable SMS sending (set to false to prevent any SMS in dev)
    enabled: process.env.SMS_ENABLED === 'true',

    // Test mode - logs SMS but doesn't send (even if enabled)
    testMode: process.env.SMS_TEST_MODE === 'true',

    // Sender name (must be registered with provider, max 11 chars)
    senderName: process.env.SMS_SENDER_NAME || 'HARDWARE',

    // Admin phone for new order notifications
    adminPhone: process.env.ADMIN_NOTIFICATION_PHONE,

    // Provider priority order (will fallback to next on failure)
    providers: (process.env.SMS_PROVIDERS || 'semaphore').split(',').map(p => p.trim()),

    // Retry configuration
    maxRetries: parseInt(process.env.SMS_MAX_RETRIES) || 2,

    // Semaphore (Primary - Best for Philippines)
    // Sign up: https://semaphore.co/
    semaphore: {
      apiKey: process.env.SEMAPHORE_API_KEY,
    },

    // Movider (Backup - Good for Philippines)
    // Sign up: https://movider.co/
    movider: {
      apiKey: process.env.MOVIDER_API_KEY,
      apiSecret: process.env.MOVIDER_API_SECRET,
    },

    // Vonage/Nexmo (International backup)
    // Sign up: https://dashboard.nexmo.com/
    vonage: {
      apiKey: process.env.VONAGE_API_KEY,
      apiSecret: process.env.VONAGE_API_SECRET,
    },
  },

  // Email Configuration (for password resets, etc.)
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@hardwarestore.com',
    // Smart auto-detect: test mode ON if no credentials are configured
    // Set EMAIL_TEST_MODE=true to force test mode even with credentials
    // Set EMAIL_TEST_MODE=false to force real emails (will fail without credentials)
    testMode: process.env.EMAIL_TEST_MODE
      ? process.env.EMAIL_TEST_MODE === 'true'
      : !(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
  },

  // Password Reset
  passwordReset: {
    tokenExpiryMinutes: parseInt(process.env.PASSWORD_RESET_EXPIRY_MINUTES) || 30,
  },

  // Store Info
  store: {
    name: process.env.STORE_NAME || 'Hardware Store',
    phone: process.env.STORE_PHONE || '',
    address: process.env.STORE_ADDRESS || '',
  },

  // CORS — supports multiple comma-separated origins in FRONTEND_URL
  cors: {
    origin: (process.env.FRONTEND_URL || 'http://localhost:5173')
      .split(',')
      .map(u => u.trim()),
    credentials: true,
  },

  // The primary frontend URL (first origin) — used for email links, password resets, etc.
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim(),

  // Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    path: process.env.UPLOAD_PATH || './uploads',
  },
};

module.exports = config;
