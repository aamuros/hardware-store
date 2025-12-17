// Test script to create products with variants
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestVariants() {
    console.log('🌱 Creating test products with variants...\n');

    try {
        // Find or create a category
        let category = await prisma.category.findFirst({
            where: { name: 'Tools' }
        });

        if (!category) {
            category = await prisma.category.create({
                data: {
                    name: 'Tools',
                    description: 'Hand and power tools',
                    icon: '🔨'
                }
            });
        }

        // Create a product with variants (T-shirt example)
        const tshirt = await prisma.product.create({
            data: {
                name: 'Work T-Shirt',
                description: 'Durable cotton work t-shirt available in multiple sizes',
                price: 299.00, // Base price
                unit: 'piece',
                sku: 'TSHIRT-001',
                categoryId: category.id,
                hasVariants: true,
                stockQuantity: 0, // Stock managed at variant level
                isAvailable: true,
            }
        });

        // Create variants for the t-shirt
        const variants = [
            { name: 'Small - Red', price: 299.00, stock: 15, attributes: { size: 'S', color: 'Red' } },
            { name: 'Medium - Red', price: 299.00, stock: 25, attributes: { size: 'M', color: 'Red' } },
            { name: 'Large - Red', price: 299.00, stock: 20, attributes: { size: 'L', color: 'Red' } },
            { name: 'Small - Blue', price: 299.00, stock: 10, attributes: { size: 'S', color: 'Blue' } },
            { name: 'Medium - Blue', price: 299.00, stock: 30, attributes: { size: 'M', color: 'Blue' } },
            { name: 'Large - Blue', price: 299.00, stock: 18, attributes: { size: 'L', color: 'Blue' } },
        ];

        for (const variant of variants) {
            await prisma.productVariant.create({
                data: {
                    productId: tshirt.id,
                    name: variant.name,
                    sku: `TSHIRT-001-${variant.name.replace(/\s/g, '-').toUpperCase()}`,
                    price: variant.price,
                    stockQuantity: variant.stock,
                    attributes: JSON.stringify(variant.attributes),
                    isAvailable: true,
                }
            });
        }

        console.log(`✅ Created product: ${tshirt.name} with ${variants.length} variants`);

        // Create another product with variants (Paint example)
        const paint = await prisma.product.create({
            data: {
                name: 'Premium Wall Paint',
                description: 'High-quality wall paint available in different sizes',
                price: 450.00, // Base price for 1L
                unit: 'liter',
                sku: 'PAINT-001',
                categoryId: category.id,
                hasVariants: true,
                stockQuantity: 0,
                isAvailable: true,
            }
        });

        const paintVariants = [
            { name: '1 Liter', price: 450.00, stock: 50 },
            { name: '4 Liters', price: 1600.00, stock: 30 },
            { name: '16 Liters', price: 5800.00, stock: 15 },
        ];

        for (const variant of paintVariants) {
            await prisma.productVariant.create({
                data: {
                    productId: paint.id,
                    name: variant.name,
                    sku: `PAINT-001-${variant.name.replace(/\s/g, '-').toUpperCase()}`,
                    price: variant.price,
                    stockQuantity: variant.stock,
                    isAvailable: true,
                }
            });
        }

        console.log(`✅ Created product: ${paint.name} with ${paintVariants.length} variants`);

        // Create a regular product without variants for comparison
        const hammer = await prisma.product.create({
            data: {
                name: 'Claw Hammer',
                description: 'Standard claw hammer - no variants',
                price: 350.00,
                unit: 'piece',
                sku: 'HAMMER-001',
                categoryId: category.id,
                hasVariants: false,
                stockQuantity: 100,
                isAvailable: true,
            }
        });

        console.log(`✅ Created regular product: ${hammer.name} (no variants)`);

        console.log('\n🎉 Test data created successfully!');
        console.log('\n📝 You can now test:');
        console.log('   1. Browse products and see variant selector on Work T-Shirt and Paint');
        console.log('   2. Select different variants and add to cart');
        console.log('   3. Verify cart shows separate line items for different variants');
        console.log('   4. Complete checkout with variant items');

    } catch (error) {
        console.error('❌ Error creating test data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestVariants();
