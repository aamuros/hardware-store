// Test script to add bulk pricing tiers to products
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBulkPricingTestData() {
    console.log('🌱 Adding bulk pricing tiers to products...\n');

    try {
        // Find products to add bulk pricing to
        const products = await prisma.product.findMany({
            where: { isDeleted: false },
            take: 3
        });

        if (products.length === 0) {
            console.log('❌ No products found. Please run seeds first.');
            return;
        }

        for (const product of products) {
            // Check if already has bulk pricing
            const existingTiers = await prisma.bulkPricingTier.count({
                where: { productId: product.id }
            });

            if (existingTiers > 0) {
                console.log(`⏭️  Skipping ${product.name} - already has bulk pricing`);
                continue;
            }

            // Add bulk pricing tiers
            await prisma.bulkPricingTier.createMany({
                data: [
                    { productId: product.id, minQuantity: 10, discountType: 'percentage', discountValue: 5 },
                    { productId: product.id, minQuantity: 25, discountType: 'percentage', discountValue: 10 },
                    { productId: product.id, minQuantity: 50, discountType: 'percentage', discountValue: 15 },
                    { productId: product.id, minQuantity: 100, discountType: 'percentage', discountValue: 20 },
                ]
            });

            // Enable bulk pricing flag
            await prisma.product.update({
                where: { id: product.id },
                data: { hasBulkPricing: true }
            });

            console.log(`✅ Added bulk pricing to: ${product.name}`);
            console.log(`   • 10+ units: 5% off`);
            console.log(`   • 25+ units: 10% off`);
            console.log(`   • 50+ units: 15% off`);
            console.log(`   • 100+ units: 20% off\n`);
        }

        console.log('🎉 Bulk pricing test data created successfully!');
        console.log('\n📝 To test: Navigate to any of these products and see the volume discounts table.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createBulkPricingTestData();
