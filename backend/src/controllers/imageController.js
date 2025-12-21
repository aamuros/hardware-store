const prisma = require('../utils/prismaClient');
const { invalidateProducts } = require('../utils/cache');
const fs = require('fs');
const path = require('path');

// GET /api/products/:productId/images
const getProductImages = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const parsedProductId = parseInt(productId, 10);

        if (isNaN(parsedProductId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }

        const images = await prisma.productImage.findMany({
            where: { productId: parsedProductId },
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        });

        res.json({
            success: true,
            data: images,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/admin/products/:productId/images
const uploadImages = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const parsedProductId = parseInt(productId, 10);

        if (isNaN(parsedProductId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: parsedProductId },
        });

        if (!product || product.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images provided',
            });
        }

        // Get current max sort order
        const maxSortOrder = await prisma.productImage.findFirst({
            where: { productId: parsedProductId },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        });

        const startOrder = (maxSortOrder?.sortOrder || 0) + 1;

        // Check if this is the first image (should be primary)
        const existingImages = await prisma.productImage.count({
            where: { productId: parsedProductId },
        });

        // Create image records
        const images = await Promise.all(
            req.files.map((file, index) =>
                prisma.productImage.create({
                    data: {
                        productId: parsedProductId,
                        imageUrl: `/uploads/${file.filename}`,
                        altText: req.body.altText || product.name,
                        sortOrder: startOrder + index,
                        isPrimary: existingImages === 0 && index === 0, // First image is primary
                    },
                })
            )
        );

        // If first image was set as primary, update product's main imageUrl
        if (existingImages === 0 && images.length > 0) {
            await prisma.product.update({
                where: { id: parsedProductId },
                data: { imageUrl: images[0].imageUrl },
            });
        }

        invalidateProducts();

        res.status(201).json({
            success: true,
            message: `${images.length} image(s) uploaded successfully`,
            data: images,
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/admin/images/:id
const deleteImage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);

        if (isNaN(parsedId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image ID format',
            });
        }

        const image = await prisma.productImage.findUnique({
            where: { id: parsedId },
        });

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found',
            });
        }

        // Delete the file from disk with path traversal protection
        const uploadsDir = path.resolve(__dirname, '../../uploads');
        const fileName = path.basename(image.imageUrl);

        // Validate filename doesn't contain path traversal sequences
        if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file path',
            });
        }

        const filePath = path.join(uploadsDir, fileName);
        const resolvedPath = path.resolve(filePath);

        // Ensure the resolved path is within the uploads directory
        if (!resolvedPath.startsWith(uploadsDir)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file path',
            });
        }

        if (fs.existsSync(resolvedPath)) {
            fs.unlinkSync(resolvedPath);
        }

        // If this was the primary image, make the next one primary
        if (image.isPrimary) {
            const nextImage = await prisma.productImage.findFirst({
                where: { productId: image.productId, id: { not: parsedId } },
                orderBy: { sortOrder: 'asc' },
            });

            if (nextImage) {
                await prisma.productImage.update({
                    where: { id: nextImage.id },
                    data: { isPrimary: true },
                });
                // Update product's main imageUrl
                await prisma.product.update({
                    where: { id: image.productId },
                    data: { imageUrl: nextImage.imageUrl },
                });
            } else {
                // No more images, clear product's imageUrl
                await prisma.product.update({
                    where: { id: image.productId },
                    data: { imageUrl: null },
                });
            }
        }

        await prisma.productImage.delete({
            where: { id: parsedId },
        });

        invalidateProducts();

        res.json({
            success: true,
            message: 'Image deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/admin/products/:productId/images/reorder
const reorderImages = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { orderedIds } = req.body;
        const parsedProductId = parseInt(productId, 10);

        if (isNaN(parsedProductId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }

        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({
                success: false,
                message: 'orderedIds must be an array',
            });
        }

        // Validate all image IDs belong to this product
        const imageIds = orderedIds.map(id => parseInt(id, 10));
        const validImages = await prisma.productImage.findMany({
            where: { productId: parsedProductId },
            select: { id: true },
        });
        const validImageIds = new Set(validImages.map(img => img.id));

        const invalidIds = imageIds.filter(id => !validImageIds.has(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some image IDs do not belong to this product',
                invalidIds,
            });
        }

        // Update sort order for each image
        await Promise.all(
            orderedIds.map((id, index) =>
                prisma.productImage.update({
                    where: { id: parseInt(id, 10) },
                    data: { sortOrder: index },
                })
            )
        );

        invalidateProducts();

        res.json({
            success: true,
            message: 'Images reordered successfully',
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/admin/images/:id/primary
const setPrimaryImage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);

        if (isNaN(parsedId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image ID format',
            });
        }

        const image = await prisma.productImage.findUnique({
            where: { id: parsedId },
        });

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found',
            });
        }

        // Remove primary from all other images of this product
        await prisma.productImage.updateMany({
            where: { productId: image.productId },
            data: { isPrimary: false },
        });

        // Set this image as primary
        await prisma.productImage.update({
            where: { id: parsedId },
            data: { isPrimary: true },
        });

        // Update product's main imageUrl
        await prisma.product.update({
            where: { id: image.productId },
            data: { imageUrl: image.imageUrl },
        });

        invalidateProducts();

        res.json({
            success: true,
            message: 'Primary image updated successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProductImages,
    uploadImages,
    deleteImage,
    reorderImages,
    setPrimaryImage,
};
