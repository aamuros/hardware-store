const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Email Service
 * Handles sending emails for password resets and other notifications.
 * Defaults to test mode (logs only) unless EMAIL_TEST_MODE=false is set.
 */

// Create reusable transporter
let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    if (config.email.testMode) {
        const hasCredentials = config.email.user && config.email.password;
        if (!hasCredentials) {
            console.warn('\n⚠️  [Email Service] TEST MODE — No email credentials configured.');
            console.warn('   Emails will be logged to the console but NOT actually sent.');
            console.warn('   To send real emails, add EMAIL_USER and EMAIL_PASSWORD to your .env file.');
            console.warn('   For Gmail, use an App Password: https://myaccount.google.com/apppasswords\n');
        } else {
            console.log('[Email Service] Running in TEST MODE (EMAIL_TEST_MODE=true) — emails will be logged, not sent.');
        }
        transporter = {
            sendMail: async (mailOptions) => {
                console.log('\n📧 === EMAIL (TEST MODE — not actually sent) ===');
                console.log(`   To:      ${mailOptions.to}`);
                console.log(`   Subject: ${mailOptions.subject}`);
                console.log(`   Body:    ${mailOptions.text ? mailOptions.text.substring(0, 200) + '...' : '(HTML only)'}`);
                console.log('   ================================================\n');
                return { messageId: `test-${Date.now()}`, testMode: true };
            },
        };
        return transporter;
    }

    // Real email transport
    console.log(`[Email Service] Configured to send real emails via ${config.email.host}:${config.email.port}`);
    transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
            user: config.email.user,
            pass: config.email.password,
        },
    });

    return transporter;
};

/**
 * Send a password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - The reset token
 * @param {string} customerName - Customer's name
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendPasswordResetEmail = async (email, resetToken, customerName) => {
    try {
        const frontendUrl = config.frontendUrl || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
        const storeName = config.store.name;
        const expiryMinutes = config.passwordReset.tokenExpiryMinutes;

        const mailOptions = {
            from: `"${storeName}" <${config.email.from}>`,
            to: email,
            subject: `Password Reset Request - ${storeName}`,
            text: `
Hi ${customerName},

We received a request to reset your password for your ${storeName} account.

Click the link below to reset your password:
${resetLink}

This link will expire in ${expiryMinutes} minutes.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
${storeName} Team
            `.trim(),
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a365d; margin: 0; font-size: 24px;">🔐 Password Reset</h1>
                <p style="color: #718096; margin-top: 8px; font-size: 14px;">${storeName}</p>
            </div>
            
            <!-- Body -->
            <p style="color: #2d3748; font-size: 16px; line-height: 1.6;">
                Hi <strong>${customerName}</strong>,
            </p>
            <p style="color: #2d3748; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your ${storeName} account. 
                Click the button below to create a new password:
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background-color: #2b6cb0; color: #ffffff; text-decoration: none; 
                          padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;
                          box-shadow: 0 2px 4px rgba(43, 108, 176, 0.3);">
                    Reset My Password
                </a>
            </div>
            
            <!-- Expiry Notice -->
            <div style="background-color: #fffbeb; border: 1px solid #f6e05e; border-radius: 6px; padding: 12px 16px; margin: 20px 0;">
                <p style="color: #975a16; font-size: 14px; margin: 0;">
                    ⏰ This link will expire in <strong>${expiryMinutes} minutes</strong>.
                </p>
            </div>
            
            <!-- Fallback Link -->
            <p style="color: #718096; font-size: 13px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetLink}" style="color: #2b6cb0; word-break: break-all;">${resetLink}</a>
            </p>
            
            <!-- Security Notice -->
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #a0aec0; font-size: 13px; line-height: 1.6;">
                If you did not request a password reset, you can safely ignore this email. 
                Your password will remain unchanged.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 20px;">
            <p style="color: #a0aec0; font-size: 12px;">
                © ${new Date().getFullYear()} ${storeName}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
            `.trim(),
        };

        const transport = getTransporter();
        const result = await transport.sendMail(mailOptions);

        console.log(`[Email Service] Password reset email sent to ${email} (messageId: ${result.messageId})`);

        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error(`[Email Service] Failed to send password reset email to ${email}:`, error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail,
};
