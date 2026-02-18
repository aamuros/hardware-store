const crypto = require('crypto');
const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { validatePasswordStrength } = require('../middleware/sanitizer');

/**
 * POST /api/admin/forgot-password
 * Generate a password-reset token for an admin/staff user by username.
 * Always returns success to prevent username enumeration.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    let resetLink = null;

    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (user && user.isActive) {
      // Invalidate existing unused tokens for this user
      await prisma.adminPasswordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(
        Date.now() + config.passwordReset.tokenExpiryMinutes * 60 * 1000
      );

      await prisma.adminPasswordReset.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
        },
      });

      const frontendUrl = config.cors.origin || 'http://localhost:5173';
      resetLink = `${frontendUrl}/admin/reset-password?token=${resetToken}`;
    }

    const response = {
      success: true,
      message: "If an account exists with that username, a password reset link has been generated.",
    };

    if (resetLink) {
      response.resetLink = resetLink;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/verify-reset-token
 * Check whether a token is still valid before showing the reset form.
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

    const record = await prisma.adminPasswordReset.findUnique({
      where: { token },
      include: {
        user: { select: { username: true, name: true } },
      },
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link. Please request a new one.',
      });
    }

    if (record.usedAt) {
      return res.status(400).json({
        success: false,
        message: 'This reset link has already been used. Please request a new one.',
      });
    }

    if (new Date() > record.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'This reset link has expired. Please request a new one.',
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        username: record.user.username,
        name: record.user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/reset-password
 * Reset the admin user's password using a valid token.
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

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    const record = await prisma.adminPasswordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link. Please request a new one.',
      });
    }

    if (record.usedAt) {
      return res.status(400).json({
        success: false,
        message: 'This reset link has already been used. Please request a new one.',
      });
    }

    if (new Date() > record.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'This reset link has expired. Please request a new one.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      prisma.adminPasswordReset.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { forgotPassword, verifyResetToken, resetPassword };
