const prisma = require('../utils/prismaClient');

// GET /api/customers/addresses
const getAddresses = async (req, res, next) => {
    try {
        const addresses = await prisma.savedAddress.findMany({
            where: { customerId: req.customer.id },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        res.json({
            success: true,
            data: addresses,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/customers/addresses
const createAddress = async (req, res, next) => {
    try {
        const { label, address, barangay, landmarks, isDefault } = req.body;

        if (!label || !address || !barangay) {
            return res.status(400).json({
                success: false,
                message: 'Label, address, and barangay are required',
            });
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            await prisma.savedAddress.updateMany({
                where: { customerId: req.customer.id },
                data: { isDefault: false },
            });
        }

        // Check if this is the first address (make it default)
        const existingCount = await prisma.savedAddress.count({
            where: { customerId: req.customer.id },
        });

        const savedAddress = await prisma.savedAddress.create({
            data: {
                customerId: req.customer.id,
                label,
                address,
                barangay,
                landmarks: landmarks || null,
                isDefault: isDefault || existingCount === 0,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Address saved successfully',
            data: savedAddress,
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/customers/addresses/:id
const updateAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { label, address, barangay, landmarks, isDefault } = req.body;

        // Verify ownership
        const existingAddress = await prisma.savedAddress.findFirst({
            where: {
                id: parseInt(id, 10),
                customerId: req.customer.id,
            },
        });

        if (!existingAddress) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // If setting as default, unset other defaults
        if (isDefault && !existingAddress.isDefault) {
            await prisma.savedAddress.updateMany({
                where: { customerId: req.customer.id },
                data: { isDefault: false },
            });
        }

        const updateData = {};
        if (label) updateData.label = label;
        if (address) updateData.address = address;
        if (barangay) updateData.barangay = barangay;
        if (landmarks !== undefined) updateData.landmarks = landmarks || null;
        if (isDefault !== undefined) updateData.isDefault = isDefault;

        const updatedAddress = await prisma.savedAddress.update({
            where: { id: parseInt(id, 10) },
            data: updateData,
        });

        res.json({
            success: true,
            message: 'Address updated successfully',
            data: updatedAddress,
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/customers/addresses/:id
const deleteAddress = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const existingAddress = await prisma.savedAddress.findFirst({
            where: {
                id: parseInt(id, 10),
                customerId: req.customer.id,
            },
        });

        if (!existingAddress) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        await prisma.savedAddress.delete({
            where: { id: parseInt(id, 10) },
        });

        // If deleted address was default, set another as default
        if (existingAddress.isDefault) {
            const firstAddress = await prisma.savedAddress.findFirst({
                where: { customerId: req.customer.id },
                orderBy: { createdAt: 'asc' },
            });

            if (firstAddress) {
                await prisma.savedAddress.update({
                    where: { id: firstAddress.id },
                    data: { isDefault: true },
                });
            }
        }

        res.json({
            success: true,
            message: 'Address deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/customers/addresses/:id/default
const setDefaultAddress = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const existingAddress = await prisma.savedAddress.findFirst({
            where: {
                id: parseInt(id, 10),
                customerId: req.customer.id,
            },
        });

        if (!existingAddress) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // Unset all defaults
        await prisma.savedAddress.updateMany({
            where: { customerId: req.customer.id },
            data: { isDefault: false },
        });

        // Set this as default
        const updatedAddress = await prisma.savedAddress.update({
            where: { id: parseInt(id, 10) },
            data: { isDefault: true },
        });

        res.json({
            success: true,
            message: 'Default address updated',
            data: updatedAddress,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
};
