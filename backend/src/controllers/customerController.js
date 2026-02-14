const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { validatePasswordStrength } = require('../middleware/sanitizer');
const { getPasswordRequirements } = require('./passwordResetController');

// POST /api/customers/register
const register = async (req, res, next) => {
    try {
        const { email, password, name, phone } = req.body;

        // Validate required fields with specific messages
        const missingFields = [];
        if (!name || !name.trim()) missingFields.push('name');
        if (!email || !email.trim()) missingFields.push('email');
        if (!password) missingFields.push('password');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `The following required field${missingFields.length > 1 ? 's are' : ' is'} missing: ${missingFields.join(', ')}`,
                errors: missingFields.map(field => ({
                    field,
                    message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
                })),
            });
        }

        // Validate name length
        if (name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long',
                errors: [{ field: 'name', message: 'Name must be at least 2 characters long' }],
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address (e.g., name@example.com)',
                errors: [{ field: 'email', message: 'Invalid email format. Please use a format like name@example.com' }],
            });
        }

        // Validate phone format if provided
        if (phone && phone.trim()) {
            const cleanPhone = phone.replace(/\s/g, '');
            if (!/^(09|\+639)\d{9}$/.test(cleanPhone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid phone number format. Please use 09XXXXXXXXX or +639XXXXXXXXX',
                    errors: [{ field: 'phone', message: 'Phone number must be a valid Philippine mobile number (e.g., 09171234567)' }],
                });
            }
        }

        // Validate password strength with detailed, actionable feedback
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            const requirements = getPasswordRequirements(password);
            return res.status(400).json({
                success: false,
                message: 'Your password is too weak. Please review the requirements below:',
                errors: passwordValidation.errors,
                requirements,
                field: 'password',
            });
        }

        // Check if email already exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email address already exists. Please try logging in instead, or use a different email.',
                errors: [{ field: 'email', message: 'This email is already registered' }],
                suggestion: 'login',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create customer
        const customer = await prisma.customer.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
                phone: phone || null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                createdAt: true,
            },
        });

        // Generate JWT token
        const token = jwt.sign(
            {
                id: customer.id,
                email: customer.email,
                type: 'customer',
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                token,
                customer,
            },
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/customers/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        const customer = await prisma.customer.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!customer || !customer.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const isValidPassword = await bcrypt.compare(password, customer.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: customer.id,
                email: customer.email,
                type: 'customer',
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        // Send login response immediately so transient DB errors
        // (e.g. lock contention) on the lastLogin update don't block the user
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                customer: {
                    id: customer.id,
                    email: customer.email,
                    name: customer.name,
                    phone: customer.phone,
                },
            },
        });

        // Update last login (fire-and-forget – must not prevent login)
        prisma.customer.update({
            where: { id: customer.id },
            data: { lastLogin: new Date() },
        }).catch(err => {
            console.error('Failed to update lastLogin for customer', customer.id, err);
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/customers/profile
const getProfile = async (req, res, next) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: req.customer.id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true,
                        savedAddresses: true,
                        wishlistItems: true,
                    },
                },
            },
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        res.json({
            success: true,
            data: customer,
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/customers/profile
const updateProfile = async (req, res, next) => {
    try {
        const { name, phone } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone || null;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update',
            });
        }

        const customer = await prisma.customer.update({
            where: { id: req.customer.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
            },
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: customer,
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/customers/change-password
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required',
            });
        }

        // Validate new password strength
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
            const requirements = getPasswordRequirements(newPassword);
            return res.status(400).json({
                success: false,
                message: 'Your new password does not meet security requirements. Please review the requirements below:',
                errors: passwordValidation.errors,
                requirements,
                field: 'newPassword',
            });
        }

        const customer = await prisma.customer.findUnique({
            where: { id: req.customer.id },
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, customer.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.customer.update({
            where: { id: req.customer.id },
            data: { password: hashedPassword },
        });

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
};
