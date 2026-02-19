const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── CHECK IF ADMIN ALREADY EXISTS ────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('ℹ️  Admin user already exists — skipping seed.');
    console.log('\n📊 Current database summary:');
    const [users, customers, categories, products, orders] = await Promise.all([
      prisma.user.count(),
      prisma.customer.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.order.count(),
    ]);
    console.log(`   Users: ${users}`);
    console.log(`   Customers: ${customers}`);
    console.log(`   Categories: ${categories}`);
    console.log(`   Products: ${products}`);
    console.log(`   Orders: ${orders}`);
    return;
  }

  // ─── CREATE ADMIN USER ────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: 'Store Admin',
      role: 'admin',
    },
  });
  console.log('✅ Admin user created:', admin.username);

  console.log(`
🎉 Database seeded successfully!

📝 Admin login credentials:
   Username: admin
   Password: admin123

⚠️  Change this password immediately after your first login.

The store is a blank slate — add categories, products, and staff
accounts through the admin dashboard.
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    // Exit 0 so seed failures don't block server startup in production
    process.exit(0);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
