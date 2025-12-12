require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
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
  
  // Store Info
  store: {
    name: process.env.STORE_NAME || 'Hardware Store',
    phone: process.env.STORE_PHONE || '',
    address: process.env.STORE_ADDRESS || '',
  },
  
  // CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  
  // Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    path: process.env.UPLOAD_PATH || './uploads',
  },
};

module.exports = config;
