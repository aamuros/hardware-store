const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

// POST /api/customers/register
const register = async (req, res, next) => {
    try {
        const { email, password, name, phone } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required',
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long',
            });
        }

        // Check if email already exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered',
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

        // Update last login
        await prisma.customer.update({
            where: { id: customer.id },
            data: { lastLogin: new Date() },
        });

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

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long',
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
