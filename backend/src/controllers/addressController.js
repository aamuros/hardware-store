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

        // Use a transaction to prevent race conditions with default address setting
        const savedAddress = await prisma.$transaction(async (tx) => {
            // Check if this is the first address (make it default)
            const existingCount = await tx.savedAddress.count({
                where: { customerId: req.customer.id },
            });

            const shouldBeDefault = isDefault || existingCount === 0;

            // If this is set as default, unset other defaults
            if (shouldBeDefault && existingCount > 0) {
                await tx.savedAddress.updateMany({
                    where: { customerId: req.customer.id },
                    data: { isDefault: false },
                });
            }

            return tx.savedAddress.create({
                data: {
                    customerId: req.customer.id,
                    label,
                    address,
                    barangay,
                    landmarks: landmarks || null,
                    isDefault: shouldBeDefault,
                },
            });
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

        // Prevent unsetting default without replacement
        if (isDefault === false && existingAddress.isDefault) {
            const otherAddresses = await prisma.savedAddress.count({
                where: { customerId: req.customer.id, id: { not: parseInt(id, 10) } },
            });
            if (otherAddresses > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot unset default address. Set another address as default first.',
                });
            }
        }

        const updateData = {};
        if (label !== undefined) {
            if (!label) return res.status(400).json({ success: false, message: 'Label cannot be empty' });
            updateData.label = label;
        }
        if (address !== undefined) {
            if (!address) return res.status(400).json({ success: false, message: 'Address cannot be empty' });
            updateData.address = address;
        }
        if (barangay !== undefined) {
            if (!barangay) return res.status(400).json({ success: false, message: 'Barangay cannot be empty' });
            updateData.barangay = barangay;
        }
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

        // Use transaction to prevent race conditions
        const updatedAddress = await prisma.$transaction(async (tx) => {
            // Unset all defaults
            await tx.savedAddress.updateMany({
                where: { customerId: req.customer.id },
                data: { isDefault: false },
            });

            // Set this as default
            return tx.savedAddress.update({
                where: { id: parseInt(id, 10) },
                data: { isDefault: true },
            });
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
