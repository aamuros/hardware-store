const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Store Admin',
      role: 'admin',
    },
  });
  console.log('✅ Admin user created:', admin.username);

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      password: staffPassword,
      name: 'Store Staff',
      role: 'staff',
    },
  });
  console.log('✅ Staff user created:', staff.username);

  // Create categories
  const categories = [
    { name: 'Plumbing', description: 'Pipes, fittings, faucets, and plumbing supplies', icon: '🚿' },
    { name: 'Electrical', description: 'Wires, switches, outlets, and electrical components', icon: '⚡' },
    { name: 'Tools', description: 'Hand tools, power tools, and accessories', icon: '🔧' },
    { name: 'Paint', description: 'Paints, brushes, rollers, and painting supplies', icon: '🎨' },
    { name: 'Hardware', description: 'Nails, screws, bolts, hinges, and fasteners', icon: '🔩' },
    { name: 'Building Materials', description: 'Cement, sand, hollow blocks, and construction materials', icon: '🧱' },
    { name: 'Safety Equipment', description: 'Safety gear, protective equipment, and work wear', icon: '🦺' },
    { name: 'Garden & Outdoor', description: 'Garden tools, hoses, and outdoor supplies', icon: '🌱' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
  }
  console.log('✅ Categories created:', categories.length);

  // Get category IDs
  const categoryMap = {};
  const allCategories = await prisma.category.findMany();
  allCategories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  // Create sample products
  const products = [
    // Plumbing
    { name: 'PVC Pipe 1/2"', description: 'Standard 1/2 inch PVC pipe, 10ft length', price: 45.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-PIPE-050' },
    { name: 'PVC Pipe 3/4"', description: 'Standard 3/4 inch PVC pipe, 10ft length', price: 65.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-PIPE-075' },
    { name: 'PVC Elbow 1/2"', description: '1/2 inch PVC elbow fitting', price: 8.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-ELB-050' },
    { name: 'Gate Valve 1/2"', description: 'Brass gate valve, 1/2 inch', price: 180.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'VALVE-GATE-050' },
    { name: 'Teflon Tape', description: 'Thread seal tape for plumbing connections', price: 25.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'TAPE-TEFLON' },

    // Electrical
    { name: 'THHN Wire #14', description: 'THHN copper wire, gauge 14, sold per meter', price: 18.00, unit: 'meter', categoryId: categoryMap['Electrical'], sku: 'WIRE-THHN-14' },
    { name: 'THHN Wire #12', description: 'THHN copper wire, gauge 12, sold per meter', price: 28.00, unit: 'meter', categoryId: categoryMap['Electrical'], sku: 'WIRE-THHN-12' },
    { name: 'Outlet Duplex', description: 'Standard duplex outlet, universal type', price: 65.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'OUTLET-DPX' },
    { name: 'Single Switch', description: 'Single pole light switch', price: 45.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'SWITCH-SGL' },
    { name: 'LED Bulb 9W', description: 'LED bulb, 9 watts, daylight', price: 95.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'LED-9W-DL' },
    { name: 'Circuit Breaker 20A', description: '20 Ampere circuit breaker', price: 250.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'CB-20A' },

    // Tools
    { name: 'Hammer Claw', description: 'Standard claw hammer with wooden handle', price: 180.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-HAMMER-C' },
    { name: 'Screwdriver Set', description: '6-piece screwdriver set, Phillips and flat', price: 220.00, unit: 'set', categoryId: categoryMap['Tools'], sku: 'TOOL-SCRWDR-6' },
    { name: 'Pliers Combination', description: '8-inch combination pliers', price: 150.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-PLIER-8' },
    { name: 'Measuring Tape 5m', description: '5 meter steel measuring tape', price: 85.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-TAPE-5M' },
    { name: 'Level 24"', description: '24-inch spirit level', price: 280.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-LEVEL-24' },
    { name: 'Hacksaw Frame', description: 'Adjustable hacksaw frame with blade', price: 165.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-HACKSAW' },

    // Paint
    { name: 'Latex Paint White 4L', description: 'White latex paint, 4 liters', price: 450.00, unit: 'gallon', categoryId: categoryMap['Paint'], sku: 'PAINT-LAT-W4' },
    { name: 'Paint Brush 4"', description: '4-inch paint brush', price: 85.00, unit: 'piece', categoryId: categoryMap['Paint'], sku: 'BRUSH-4IN' },
    { name: 'Paint Roller 7"', description: '7-inch paint roller with handle', price: 120.00, unit: 'piece', categoryId: categoryMap['Paint'], sku: 'ROLLER-7IN' },
    { name: 'Primer 4L', description: 'Wall primer/undercoat, 4 liters', price: 380.00, unit: 'gallon', categoryId: categoryMap['Paint'], sku: 'PAINT-PRIM-4' },
    { name: 'Thinner 1L', description: 'Paint thinner, 1 liter', price: 150.00, unit: 'liter', categoryId: categoryMap['Paint'], sku: 'PAINT-THIN-1' },

    // Hardware
    { name: 'Common Nails 2"', description: '2-inch common nails, per kg', price: 85.00, unit: 'kg', categoryId: categoryMap['Hardware'], sku: 'NAIL-COM-2' },
    { name: 'Common Nails 3"', description: '3-inch common nails, per kg', price: 85.00, unit: 'kg', categoryId: categoryMap['Hardware'], sku: 'NAIL-COM-3' },
    { name: 'Wood Screw #8 1"', description: '#8 x 1" wood screws, pack of 100', price: 65.00, unit: 'pack', categoryId: categoryMap['Hardware'], sku: 'SCREW-W8-1' },
    { name: 'Door Hinge 3"', description: '3-inch door hinge, pair', price: 45.00, unit: 'pair', categoryId: categoryMap['Hardware'], sku: 'HINGE-DR-3' },
    { name: 'Padlock 40mm', description: '40mm brass padlock with keys', price: 180.00, unit: 'piece', categoryId: categoryMap['Hardware'], sku: 'LOCK-PAD-40' },

    // Building Materials
    { name: 'Portland Cement 40kg', description: '40kg bag of Portland cement', price: 285.00, unit: 'bag', categoryId: categoryMap['Building Materials'], sku: 'CEMENT-PORT-40' },
    { name: 'Hollow Block 4"', description: '4-inch concrete hollow block', price: 14.00, unit: 'piece', categoryId: categoryMap['Building Materials'], sku: 'BLOCK-HLW-4' },
    { name: 'Steel Bar 10mm', description: '10mm deformed steel bar, 6m length', price: 185.00, unit: 'piece', categoryId: categoryMap['Building Materials'], sku: 'STEEL-10MM' },
    { name: 'GI Tie Wire #16', description: 'Galvanized iron tie wire, #16 gauge, per kg', price: 75.00, unit: 'kg', categoryId: categoryMap['Building Materials'], sku: 'WIRE-TIE-16' },

    // Safety Equipment
    { name: 'Hard Hat Yellow', description: 'Yellow safety hard hat', price: 180.00, unit: 'piece', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-HAT-Y' },
    { name: 'Safety Goggles', description: 'Clear safety goggles', price: 85.00, unit: 'piece', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-GOGGLES' },
    { name: 'Work Gloves', description: 'Cotton work gloves, pair', price: 45.00, unit: 'pair', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-GLOVE-C' },

    // Garden & Outdoor
    { name: 'Garden Hose 10m', description: '10 meter garden hose with fittings', price: 450.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-HOSE-10' },
    { name: 'Shovel Round', description: 'Round point shovel with handle', price: 350.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-SHOVEL' },
    { name: 'Rake', description: 'Garden rake with steel head', price: 220.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-RAKE' },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }
  console.log('✅ Products created:', products.length);

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Default login credentials:');
  console.log('   Admin: username="admin", password="admin123"');
  console.log('   Staff: username="staff", password="staff123"');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
