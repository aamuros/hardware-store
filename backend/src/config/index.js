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
  
  // SMS
  sms: {
    apiKey: process.env.SMS_API_KEY,
    senderName: process.env.SMS_SENDER_NAME || 'HARDWARE',
    adminPhone: process.env.ADMIN_NOTIFICATION_PHONE,
  },
  
  // Store Info
  store: {
    name: process.env.STORE_NAME || 'Hardware Store',
    phone: process.env.STORE_PHONE,
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
