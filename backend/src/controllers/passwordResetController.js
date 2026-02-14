const crypto = require('crypto');
const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { validatePasswordStrength } = require('../middleware/sanitizer');

/**
 * POST /api/customers/forgot-password
 * Request a password reset link (no email — link returned directly)
 */
const forgotPassword = async (req, res, next) => {
    try {
        // Accept either 'username' or 'email' field for backwards compatibility
        const email = req.body.username || req.body.email;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Username is required',
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid username (email address)',
            });
        }

        // Always respond with success to prevent username enumeration attacks
        let resetLink = null;
        const customer = await prisma.customer.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (customer && customer.isActive) {
            // Invalidate any existing unused reset tokens for this customer
            await prisma.passwordReset.updateMany({
                where: {
                    customerId: customer.id,
                    usedAt: null,
                },
                data: {
                    usedAt: new Date(), // Mark as used so they can't be used
                },
            });

            // Generate a secure random token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(
                Date.now() + config.passwordReset.tokenExpiryMinutes * 60 * 1000
            );

            // Save the reset token
            await prisma.passwordReset.create({
                data: {
                    customerId: customer.id,
                    token: resetToken,
                    expiresAt,
                },
            });

            // Build the reset link (returned directly — no email integration)
            const frontendUrl = config.cors.origin || 'http://localhost:5173';
            resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
        }

        // Always return success to prevent username enumeration
        const response = {
            success: true,
            message: 'If an account exists with that username, we\'ve sent a password reset link.',
        };

        // Include the reset link so the frontend can navigate directly
        if (resetLink) {
            response.resetLink = resetLink;
        }

        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/customers/verify-reset-token
 * Verify that a reset token is valid (used by frontend to show/hide reset form)
 */
const verifyResetToken = async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Reset token is required',
            });
        }

        const resetRecord = await prisma.passwordReset.findUnique({
            where: { token },
            include: {
                customer: {
                    select: { email: true, name: true },
                },
            },
        });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset link. Please request a new password reset.',
            });
        }

        if (resetRecord.usedAt) {
            return res.status(400).json({
                success: false,
                message: 'This reset link has already been used. Please request a new password reset.',
            });
        }

        if (new Date() > resetRecord.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'This reset link has expired. Please request a new password reset.',
            });
        }

        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                email: resetRecord.customer.email,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/customers/reset-password
 * Reset the password using a valid token
 */
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Reset token and new password are required',
            });
        }

        // Validate password strength with detailed feedback
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Your new password does not meet the security requirements',
                errors: passwordValidation.errors,
                requirements: getPasswordRequirements(newPassword),
            });
        }

        // Find and validate the reset token
        const resetRecord = await prisma.passwordReset.findUnique({
            where: { token },
            include: { customer: true },
        });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset link. Please request a new password reset.',
            });
        }

        if (resetRecord.usedAt) {
            return res.status(400).json({
                success: false,
                message: 'This reset link has already been used. Please request a new password reset.',
            });
        }

        if (new Date() > resetRecord.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'This reset link has expired. Please request a new password reset.',
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and mark token as used in a transaction
        await prisma.$transaction([
            prisma.customer.update({
                where: { id: resetRecord.customerId },
                data: { password: hashedPassword },
            }),
            prisma.passwordReset.update({
                where: { id: resetRecord.id },
                data: { usedAt: new Date() },
            }),
        ]);

        res.json({
            success: true,
            message: 'Your password has been reset successfully. You can now log in with your new password.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Helper: Get detailed password requirements with pass/fail status
 * Used to give users specific, actionable feedback
 */
const getPasswordRequirements = (password) => {
    const pwd = password || '';
    return [
        {
            label: 'At least 8 characters',
            met: pwd.length >= 8,
            tip: pwd.length < 8
                ? `Add ${8 - pwd.length} more character${8 - pwd.length === 1 ? '' : 's'}`
                : null,
        },
        {
            label: 'At least one uppercase letter (A-Z)',
            met: /[A-Z]/.test(pwd),
            tip: !/[A-Z]/.test(pwd)
                ? 'Try capitalizing the first letter or adding an uppercase letter'
                : null,
        },
        {
            label: 'At least one lowercase letter (a-z)',
            met: /[a-z]/.test(pwd),
            tip: !/[a-z]/.test(pwd)
                ? 'Add a lowercase letter to your password'
                : null,
        },
        {
            label: 'At least one number (0-9)',
            met: /[0-9]/.test(pwd),
            tip: !/[0-9]/.test(pwd)
                ? 'Add a number like 1, 2, or 3'
                : null,
        },
        {
            label: 'At least one special character (!@#$%^&*)',
            met: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
            tip: !/[!@#$%^&*(),.?":{}|<>]/.test(pwd)
                ? 'Add a special character like !, @, #, or $'
                : null,
        },
    ];
};

module.exports = {
    forgotPassword,
    verifyResetToken,
    resetPassword,
    getPasswordRequirements,
};
