const axios = require('axios');
const config = require('../config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// SMS Templates
const SMS_TEMPLATES = {
  ORDER_CONFIRMATION: (orderNumber, amount) =>
    `Order ${orderNumber} received! Total: P${amount.toFixed(2)}. We'll notify you when it's accepted. Thank you for ordering from ${config.store.name}!`,
  
  ORDER_ACCEPTED: (orderNumber) =>
    `Great news! Your order ${orderNumber} has been accepted and is being prepared. We'll update you when it's ready for delivery.`,
  
  ORDER_REJECTED: (orderNumber, reason = '') =>
    `We're sorry, order ${orderNumber} couldn't be processed${reason ? `: ${reason}` : ''}. Please contact us at ${config.store.phone} for assistance.`,
  
  ORDER_PREPARING: (orderNumber) =>
    `Your order ${orderNumber} is now being prepared! We'll notify you once it's out for delivery.`,
  
  ORDER_OUT_FOR_DELIVERY: (orderNumber, estimate = '') =>
    `Your order ${orderNumber} is on the way!${estimate ? ` Estimated arrival: ${estimate}.` : ''} Please prepare your payment. Thank you!`,
  
  ORDER_DELIVERED: (orderNumber) =>
    `Order ${orderNumber} has been delivered! Thank you for shopping with ${config.store.name}. We appreciate your business!`,
  
  ORDER_CANCELLED: (orderNumber, reason = '') =>
    `Order ${orderNumber} has been cancelled${reason ? `: ${reason}` : ''}. For questions, contact ${config.store.phone}.`,
  
  ADMIN_NEW_ORDER: (orderNumber, amount) =>
    `NEW ORDER! ${orderNumber} - P${amount.toFixed(2)}. Please check your dashboard to process this order.`,
};

// Send SMS via Semaphore (Philippines)
const sendSMS = async (phone, message, orderId = null) => {
  try {
    // Format phone number (remove +63 if present, ensure it starts with 09)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('63')) {
      formattedPhone = '0' + formattedPhone.slice(2);
    }
    if (!formattedPhone.startsWith('0')) {
      formattedPhone = '0' + formattedPhone;
    }
    
    // Log the SMS attempt
    const smsLog = await prisma.smsLog.create({
      data: {
        orderId,
        phone: formattedPhone,
        message,
        status: 'pending',
      },
    });
    
    // In development, just log the SMS
    if (config.nodeEnv === 'development' && !config.sms.apiKey) {
      console.log('📱 SMS (Dev Mode):', { to: formattedPhone, message });
      
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: { status: 'sent', sentAt: new Date() },
      });
      
      return { success: true, mode: 'development' };
    }
    
    // Send via Semaphore API
    const response = await axios.post('https://api.semaphore.co/api/v4/messages', {
      apikey: config.sms.apiKey,
      number: formattedPhone,
      message,
      sendername: config.sms.senderName,
    });
    
    // Update SMS log with success
    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        response: JSON.stringify(response.data),
      },
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('SMS Error:', error.message);
    
    // Log the error
    if (orderId) {
      await prisma.smsLog.updateMany({
        where: {
          orderId,
          status: 'pending',
        },
        data: {
          status: 'failed',
          error: error.message,
        },
      });
    }
    
    throw error;
  }
};

// Exported functions for different notification types
const sendOrderConfirmation = async (phone, orderNumber, amount) => {
  const message = SMS_TEMPLATES.ORDER_CONFIRMATION(orderNumber, amount);
  return sendSMS(phone, message);
};

const sendStatusUpdate = async (phone, orderNumber, status, customMessage = null) => {
  let message;
  
  switch (status) {
    case 'accepted':
      message = SMS_TEMPLATES.ORDER_ACCEPTED(orderNumber);
      break;
    case 'rejected':
      message = SMS_TEMPLATES.ORDER_REJECTED(orderNumber, customMessage);
      break;
    case 'preparing':
      message = SMS_TEMPLATES.ORDER_PREPARING(orderNumber);
      break;
    case 'out_for_delivery':
      message = SMS_TEMPLATES.ORDER_OUT_FOR_DELIVERY(orderNumber, customMessage);
      break;
    case 'delivered':
    case 'completed':
      message = SMS_TEMPLATES.ORDER_DELIVERED(orderNumber);
      break;
    case 'cancelled':
      message = SMS_TEMPLATES.ORDER_CANCELLED(orderNumber, customMessage);
      break;
    default:
      message = customMessage || `Order ${orderNumber} status updated to: ${status}`;
  }
  
  return sendSMS(phone, message);
};

const notifyAdminNewOrder = async (orderNumber, amount) => {
  if (!config.sms.adminPhone) {
    console.log('Admin phone not configured, skipping notification');
    return;
  }
  
  const message = SMS_TEMPLATES.ADMIN_NEW_ORDER(orderNumber, amount);
  return sendSMS(config.sms.adminPhone, message);
};

module.exports = {
  sendSMS,
  sendOrderConfirmation,
  sendStatusUpdate,
  notifyAdminNewOrder,
  SMS_TEMPLATES,
};
