const axios = require('axios');
const config = require('../config');
const prisma = require('../utils/prismaClient');

// ============================================================================
// PHILIPPINE TELCO PREFIXES (All Major Networks - Updated 2024)
// All Philippine mobile numbers start with 09XX
// ============================================================================
const PH_TELCO_PREFIXES = {
  // Globe Telecom (includes TM - Touch Mobile)
  GLOBE: [
    '0904', '0905', '0906', '0915', '0916', '0917', '0926', '0927',
    '0935', '0936', '0937', '0945', '0953', '0954', '0955', '0956', '0965',
    '0966', '0967', '0975', '0976', '0977', '0978', '0979', '0994', '0995',
    '0996', '0997'
  ],

  // Smart Communications (includes TNT and Sun)
  SMART: [
    '0907', '0908', '0909', '0910', '0911', '0912', '0913', '0914',
    '0918', '0919', '0920', '0921', '0922', '0923', '0924', '0925', '0928',
    '0929', '0930', '0931', '0932', '0933', '0934', '0938', '0939', '0940',
    '0941', '0942', '0943', '0944', '0946', '0947', '0948', '0949', '0950',
    '0951', '0961', '0963', '0968', '0969', '0970', '0971', '0973', '0974',
    '0981', '0989', '0992', '0998', '0999'
  ],

  // DITO Telecommunity (newest network)
  DITO: ['0991', '0993'],
};

// All valid prefixes combined (deduplicated)
const ALL_VALID_PREFIXES = [
  ...new Set([
    ...PH_TELCO_PREFIXES.GLOBE,
    ...PH_TELCO_PREFIXES.SMART,
    ...PH_TELCO_PREFIXES.DITO,
  ])
];

// ============================================================================
// PHONE NUMBER UTILITIES
// ============================================================================

/**
 * Format phone number to Philippine standard (09XXXXXXXXX)
 * Handles various input formats: +63, 63, 09, 9
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  // Remove all non-digit characters
  let cleaned = phone.toString().replace(/\D/g, '');

  // Handle +63 or 63 prefix (international format)
  if (cleaned.startsWith('63') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  }

  // Handle 9XXXXXXXXX (missing leading 0)
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
};

/**
 * Format phone number for international format (639XXXXXXXXX)
 * Required by most SMS providers
 */
const formatInternational = (phone) => {
  const formatted = formatPhoneNumber(phone);
  if (!formatted || formatted.length !== 11) return null;

  // Return without + prefix (some providers add it themselves)
  return '63' + formatted.slice(1);
};

/**
 * Validate Philippine phone number
 * Returns { valid: boolean, error?: string, formatted?: string, telco?: string }
 */
const validatePhoneNumber = (phone) => {
  const formatted = formatPhoneNumber(phone);

  if (!formatted) {
    return { valid: false, error: 'Phone number is required' };
  }

  if (formatted.length !== 11) {
    return {
      valid: false,
      error: `Phone number must be 11 digits (e.g., 09171234567). Got ${formatted.length} digits.`
    };
  }

  if (!formatted.startsWith('09')) {
    return { valid: false, error: 'Phone number must start with 09' };
  }

  // Check if prefix is valid (first 4 digits)
  const prefix = formatted.substring(0, 4);
  if (!ALL_VALID_PREFIXES.includes(prefix)) {
    // Still allow it but flag as unknown network
    return {
      valid: true,
      formatted,
      telco: 'UNKNOWN',
      warning: `Unrecognized network prefix: ${prefix}. SMS may still be delivered.`
    };
  }

  // Identify telco
  let telco = 'UNKNOWN';
  for (const [network, prefixes] of Object.entries(PH_TELCO_PREFIXES)) {
    if (prefixes.includes(prefix)) {
      telco = network;
      break;
    }
  }

  return { valid: true, formatted, telco };
};

/**
 * Get telco name for a phone number
 */
const getTelco = (phone) => {
  const result = validatePhoneNumber(phone);
  return result.valid ? result.telco : null;
};

// ============================================================================
// SMS TEMPLATES
// ============================================================================
const SMS_TEMPLATES = {
  ORDER_CONFIRMATION: (orderNumber, amount, storeName) =>
    `[${storeName}] Order ${orderNumber} received! Total: P${amount.toFixed(2)}. We'll notify you when accepted. Salamat po!`,

  ORDER_ACCEPTED: (orderNumber, storeName) =>
    `[${storeName}] Good news! Order ${orderNumber} ACCEPTED & being prepared. We'll update you when out for delivery.`,

  ORDER_REJECTED: (orderNumber, reason, storePhone) =>
    `Order ${orderNumber} cannot be processed${reason ? `: ${reason}` : ''}. Contact ${storePhone} for help. Sorry for inconvenience.`,

  ORDER_PREPARING: (orderNumber, storeName) =>
    `[${storeName}] Order ${orderNumber} is being prepared! We'll notify you when out for delivery.`,

  ORDER_OUT_FOR_DELIVERY: (orderNumber, estimate) =>
    `Your order ${orderNumber} is ON THE WAY!${estimate ? ` ETA: ${estimate}.` : ''} Please prepare payment. Thank you!`,

  ORDER_DELIVERED: (orderNumber, storeName) =>
    `Order ${orderNumber} DELIVERED! Thank you for shopping with ${storeName}. We appreciate your business!`,

  ORDER_CANCELLED: (orderNumber, reason, storePhone) =>
    `Order ${orderNumber} cancelled${reason ? `: ${reason}` : ''}. Questions? Contact ${storePhone}.`,

  ADMIN_NEW_ORDER: (orderNumber, amount, customerName) =>
    `NEW ORDER! ${orderNumber} - P${amount.toFixed(2)} from ${customerName}. Check dashboard now.`,
};

// ============================================================================
// SMS PROVIDERS
// ============================================================================

/**
 * Send SMS via Semaphore (Primary provider for Philippines)
 * https://semaphore.co/docs
 */
const sendViaSemaphore = async (phone, message) => {
  const internationalPhone = formatInternational(phone);

  const response = await axios.post(
    'https://api.semaphore.co/api/v4/messages',
    {
      apikey: config.sms.semaphore.apiKey,
      number: internationalPhone,
      message,
      sendername: config.sms.senderName,
    },
    {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  // Semaphore returns array of message results
  const result = response.data?.[0] || response.data;

  if (result?.status === 'failed' || result?.error) {
    throw new Error(result.error || 'Semaphore sending failed');
  }

  return {
    provider: 'semaphore',
    success: true,
    messageId: result?.message_id || null,
    response: response.data,
  };
};

/**
 * Send SMS via Movider (Backup provider)
 * https://docs.movider.co/
 */
const sendViaMovider = async (phone, message) => {
  const internationalPhone = '+' + formatInternational(phone);

  const response = await axios.post(
    'https://api.movider.co/v1/sms',
    {
      api_key: config.sms.movider.apiKey,
      api_secret: config.sms.movider.apiSecret,
      to: internationalPhone,
      text: message,
    },
    {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return {
    provider: 'movider',
    success: true,
    messageId: response.data?.phone_number_list?.[0]?.message_id || null,
    response: response.data,
  };
};

/**
 * Send SMS via Vonage/Nexmo (International option)
 * https://developer.vonage.com/messaging/sms/overview
 */
const sendViaVonage = async (phone, message) => {
  const internationalPhone = formatInternational(phone);

  const response = await axios.post(
    'https://rest.nexmo.com/sms/json',
    {
      api_key: config.sms.vonage.apiKey,
      api_secret: config.sms.vonage.apiSecret,
      from: config.sms.senderName,
      to: internationalPhone,
      text: message,
    },
    {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const msgResult = response.data?.messages?.[0];
  if (msgResult?.status !== '0') {
    throw new Error(`Vonage error: ${msgResult?.['error-text'] || 'Unknown error'}`);
  }

  return {
    provider: 'vonage',
    success: true,
    messageId: msgResult?.['message-id'] || null,
    response: response.data,
  };
};

// Provider map
const SMS_PROVIDERS = {
  semaphore: sendViaSemaphore,
  movider: sendViaMovider,
  vonage: sendViaVonage,
};

/**
 * Check if a provider is properly configured
 */
const isProviderConfigured = (providerName) => {
  switch (providerName) {
    case 'semaphore':
      return !!config.sms.semaphore?.apiKey;
    case 'movider':
      return !!(config.sms.movider?.apiKey && config.sms.movider?.apiSecret);
    case 'vonage':
      return !!(config.sms.vonage?.apiKey && config.sms.vonage?.apiSecret);
    default:
      return false;
  }
};

// ============================================================================
// MAIN SMS FUNCTION
// ============================================================================

/**
 * Send SMS with automatic provider fallback and retry
 */
const sendSMS = async (phone, message, orderId = null, options = {}) => {
  const { skipValidation = false, retryCount = 0 } = options;

  // Validate phone number
  if (!skipValidation) {
    const validation = validatePhoneNumber(phone);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    if (validation.warning) {
      console.warn(`⚠️ ${validation.warning}`);
    }
  }

  const formattedPhone = formatPhoneNumber(phone);
  const telco = getTelco(phone);

  // Create SMS log entry
  const smsLog = await prisma.smsLog.create({
    data: {
      orderId,
      phone: formattedPhone,
      message,
      status: 'pending',
    },
  });

  // Development mode - simulate SMS
  if (config.nodeEnv === 'development' && !config.sms.enabled) {
    console.log('\n📱 ════════════════════════════════════════════════════');
    console.log('📱 SMS (Development Mode - No actual SMS sent)');
    console.log('📱 ════════════════════════════════════════════════════');
    console.log(`📱 To: ${formattedPhone} (${telco || 'Unknown Network'})`);
    console.log(`📱 Message: ${message}`);
    console.log(`📱 Length: ${message.length} characters`);
    console.log('📱 ════════════════════════════════════════════════════\n');

    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        response: JSON.stringify({ mode: 'development', telco }),
      },
    });

    return { success: true, mode: 'development', telco, smsLogId: smsLog.id };
  }

  // Test mode - validate but don't actually send
  if (config.sms.testMode) {
    console.log(`📱 SMS Test Mode: Would send to ${formattedPhone} (${telco}): ${message.substring(0, 50)}...`);

    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        response: JSON.stringify({ mode: 'test', telco }),
      },
    });

    return { success: true, mode: 'test', telco, smsLogId: smsLog.id };
  }

  // Get provider order from config
  const providers = config.sms.providers || ['semaphore'];
  const maxRetries = config.sms.maxRetries || 2;
  const errors = [];

  // Try each provider in order
  for (const providerName of providers) {
    const provider = SMS_PROVIDERS[providerName];

    if (!provider) {
      console.warn(`⚠️ Unknown SMS provider: ${providerName}`);
      continue;
    }

    // Check if provider is configured
    if (!isProviderConfigured(providerName)) {
      console.warn(`⚠️ SMS provider ${providerName} not configured, skipping...`);
      continue;
    }

    try {
      console.log(`📱 Sending SMS via ${providerName} to ${formattedPhone} (${telco})...`);

      const result = await provider(formattedPhone, message);

      // Success - update log
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          response: JSON.stringify({
            ...result,
            telco,
            retryCount,
          }),
        },
      });

      console.log(`✅ SMS sent successfully via ${providerName} (ID: ${result.messageId || 'N/A'})`);

      return {
        success: true,
        provider: providerName,
        messageId: result.messageId,
        telco,
        smsLogId: smsLog.id,
      };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      console.error(`❌ ${providerName} failed: ${errorMsg}`);
      errors.push({ provider: providerName, error: errorMsg });
    }
  }

  // All providers failed
  const errorMessage = errors.map(e => `${e.provider}: ${e.error}`).join('; ');

  await prisma.smsLog.update({
    where: { id: smsLog.id },
    data: {
      status: 'failed',
      error: errorMessage,
    },
  });

  // Retry if not exceeded max retries
  if (retryCount < maxRetries) {
    const delay = 2000 * (retryCount + 1); // Exponential backoff
    console.log(`🔄 Retrying SMS in ${delay / 1000}s (attempt ${retryCount + 1}/${maxRetries})...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return sendSMS(phone, message, orderId, { skipValidation: true, retryCount: retryCount + 1 });
  }

  throw new Error(`SMS sending failed after ${maxRetries + 1} attempts: ${errorMessage}`);
};

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Send order confirmation to customer
 */
const sendOrderConfirmation = async (phone, orderNumber, amount, orderId = null) => {
  const message = SMS_TEMPLATES.ORDER_CONFIRMATION(
    orderNumber,
    amount,
    config.store.name
  );
  return sendSMS(phone, message, orderId);
};

/**
 * Send status update to customer
 */
const sendStatusUpdate = async (phone, orderNumber, status, customMessage = null, orderId = null) => {
  let message;

  switch (status) {
    case 'accepted':
      message = SMS_TEMPLATES.ORDER_ACCEPTED(orderNumber, config.store.name);
      break;
    case 'rejected':
      message = SMS_TEMPLATES.ORDER_REJECTED(orderNumber, customMessage, config.store.phone);
      break;
    case 'preparing':
      message = SMS_TEMPLATES.ORDER_PREPARING(orderNumber, config.store.name);
      break;
    case 'out_for_delivery':
      message = SMS_TEMPLATES.ORDER_OUT_FOR_DELIVERY(orderNumber, customMessage);
      break;
    case 'delivered':
    case 'completed':
      message = SMS_TEMPLATES.ORDER_DELIVERED(orderNumber, config.store.name);
      break;
    case 'cancelled':
      message = SMS_TEMPLATES.ORDER_CANCELLED(orderNumber, customMessage, config.store.phone);
      break;
    default:
      message = customMessage || `[${config.store.name}] Order ${orderNumber} status: ${status}`;
  }

  return sendSMS(phone, message, orderId);
};

/**
 * Notify admin of new order
 */
const notifyAdminNewOrder = async (orderNumber, amount, customerName = 'Customer') => {
  const adminPhone = config.sms.adminPhone;

  if (!adminPhone) {
    console.log('ℹ️ Admin phone not configured, skipping notification');
    return { success: false, reason: 'Admin phone not configured' };
  }

  const message = SMS_TEMPLATES.ADMIN_NEW_ORDER(orderNumber, amount, customerName);
  return sendSMS(adminPhone, message);
};

/**
 * Send custom SMS (for admin use)
 */
const sendCustomSMS = async (phone, message, orderId = null) => {
  return sendSMS(phone, message, orderId);
};

/**
 * Get SMS logs for an order
 */
const getSmsLogs = async (orderId) => {
  return prisma.smsLog.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get SMS statistics
 */
const getSmsStats = async (startDate = null, endDate = null) => {
  const where = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [total, sent, failed, pending] = await Promise.all([
    prisma.smsLog.count({ where }),
    prisma.smsLog.count({ where: { ...where, status: 'sent' } }),
    prisma.smsLog.count({ where: { ...where, status: 'failed' } }),
    prisma.smsLog.count({ where: { ...where, status: 'pending' } }),
  ]);

  return {
    total,
    sent,
    failed,
    pending,
    successRate: total > 0 ? ((sent / total) * 100).toFixed(2) + '%' : '0%',
  };
};

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
  // Main functions
  sendSMS,
  sendOrderConfirmation,
  sendStatusUpdate,
  notifyAdminNewOrder,
  sendCustomSMS,

  // Utility functions
  validatePhoneNumber,
  formatPhoneNumber,
  formatInternational,
  getTelco,
  isProviderConfigured,

  // Data functions
  getSmsLogs,
  getSmsStats,

  // Constants
  SMS_TEMPLATES,
  PH_TELCO_PREFIXES,
  ALL_VALID_PREFIXES,
};
