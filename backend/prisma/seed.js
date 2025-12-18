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

  // Create sample products with stock quantities
  const products = [
    // Plumbing - well stocked items
    { name: 'PVC Pipe 1/2"', description: 'Standard 1/2 inch PVC pipe, 10ft length', price: 45.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-PIPE-050', stockQuantity: 150, lowStockThreshold: 20 },
    { name: 'PVC Pipe 3/4"', description: 'Standard 3/4 inch PVC pipe, 10ft length', price: 65.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-PIPE-075', stockQuantity: 120, lowStockThreshold: 15 },
    { name: 'PVC Elbow 1/2"', description: '1/2 inch PVC elbow fitting', price: 8.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-ELB-050', stockQuantity: 200, lowStockThreshold: 30 },
    { name: 'Gate Valve 1/2"', description: 'Brass gate valve, 1/2 inch', price: 180.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'VALVE-GATE-050', stockQuantity: 45, lowStockThreshold: 10 },
    { name: 'Teflon Tape', description: 'Thread seal tape for plumbing connections', price: 25.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'TAPE-TEFLON', stockQuantity: 300, lowStockThreshold: 50 },

    // Electrical - mixed stock levels
    { name: 'THHN Wire #14', description: 'THHN copper wire, gauge 14, sold per meter', price: 18.00, unit: 'meter', categoryId: categoryMap['Electrical'], sku: 'WIRE-THHN-14', stockQuantity: 500, lowStockThreshold: 100 },
    { name: 'THHN Wire #12', description: 'THHN copper wire, gauge 12, sold per meter', price: 28.00, unit: 'meter', categoryId: categoryMap['Electrical'], sku: 'WIRE-THHN-12', stockQuantity: 400, lowStockThreshold: 80 },
    { name: 'Outlet Duplex', description: 'Standard duplex outlet, universal type', price: 65.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'OUTLET-DPX', stockQuantity: 85, lowStockThreshold: 20 },
    { name: 'Single Switch', description: 'Single pole light switch', price: 45.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'SWITCH-SGL', stockQuantity: 90, lowStockThreshold: 15 },
    { name: 'LED Bulb 9W', description: 'LED bulb, 9 watts, daylight', price: 95.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'LED-9W-DL', stockQuantity: 150, lowStockThreshold: 25 },
    { name: 'Circuit Breaker 20A', description: '20 Ampere circuit breaker', price: 250.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'CB-20A', stockQuantity: 30, lowStockThreshold: 10 },

    // Tools - good stock
    { name: 'Hammer Claw', description: 'Standard claw hammer with wooden handle', price: 180.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-HAMMER-C', stockQuantity: 35, lowStockThreshold: 8 },
    { name: 'Screwdriver Set', description: '6-piece screwdriver set, Phillips and flat', price: 220.00, unit: 'set', categoryId: categoryMap['Tools'], sku: 'TOOL-SCRWDR-6', stockQuantity: 25, lowStockThreshold: 5 },
    { name: 'Pliers Combination', description: '8-inch combination pliers', price: 150.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-PLIER-8', stockQuantity: 40, lowStockThreshold: 10 },
    { name: 'Measuring Tape 5m', description: '5 meter steel measuring tape', price: 85.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-TAPE-5M', stockQuantity: 50, lowStockThreshold: 12 },
    { name: 'Level 24"', description: '24-inch spirit level', price: 280.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-LEVEL-24', stockQuantity: 18, lowStockThreshold: 5 },
    { name: 'Hacksaw Frame', description: 'Adjustable hacksaw frame with blade', price: 165.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-HACKSAW', stockQuantity: 22, lowStockThreshold: 6 },

    // Paint - moderate stock
    { name: 'Latex Paint White 4L', description: 'White latex paint, 4 liters', price: 450.00, unit: 'gallon', categoryId: categoryMap['Paint'], sku: 'PAINT-LAT-W4', stockQuantity: 40, lowStockThreshold: 10 },
    { name: 'Paint Brush 4"', description: '4-inch paint brush', price: 85.00, unit: 'piece', categoryId: categoryMap['Paint'], sku: 'BRUSH-4IN', stockQuantity: 60, lowStockThreshold: 15 },
    { name: 'Paint Roller 7"', description: '7-inch paint roller with handle', price: 120.00, unit: 'piece', categoryId: categoryMap['Paint'], sku: 'ROLLER-7IN', stockQuantity: 45, lowStockThreshold: 10 },
    { name: 'Primer 4L', description: 'Wall primer/undercoat, 4 liters', price: 380.00, unit: 'gallon', categoryId: categoryMap['Paint'], sku: 'PAINT-PRIM-4', stockQuantity: 35, lowStockThreshold: 8 },
    { name: 'Thinner 1L', description: 'Paint thinner, 1 liter', price: 150.00, unit: 'liter', categoryId: categoryMap['Paint'], sku: 'PAINT-THIN-1', stockQuantity: 55, lowStockThreshold: 12 },

    // Hardware - high turnover items
    { name: 'Common Nails 2"', description: '2-inch common nails, per kg', price: 85.00, unit: 'kg', categoryId: categoryMap['Hardware'], sku: 'NAIL-COM-2', stockQuantity: 100, lowStockThreshold: 20 },
    { name: 'Common Nails 3"', description: '3-inch common nails, per kg', price: 85.00, unit: 'kg', categoryId: categoryMap['Hardware'], sku: 'NAIL-COM-3', stockQuantity: 80, lowStockThreshold: 15 },
    { name: 'Wood Screw #8 1"', description: '#8 x 1" wood screws, pack of 100', price: 65.00, unit: 'pack', categoryId: categoryMap['Hardware'], sku: 'SCREW-W8-1', stockQuantity: 120, lowStockThreshold: 25 },
    { name: 'Door Hinge 3"', description: '3-inch door hinge, pair', price: 45.00, unit: 'pair', categoryId: categoryMap['Hardware'], sku: 'HINGE-DR-3', stockQuantity: 70, lowStockThreshold: 15 },
    { name: 'Padlock 40mm', description: '40mm brass padlock with keys', price: 180.00, unit: 'piece', categoryId: categoryMap['Hardware'], sku: 'LOCK-PAD-40', stockQuantity: 50, lowStockThreshold: 10 },

    // Building Materials - bulk items
    { name: 'Portland Cement 40kg', description: '40kg bag of Portland cement', price: 285.00, unit: 'bag', categoryId: categoryMap['Building Materials'], sku: 'CEMENT-PORT-40', stockQuantity: 200, lowStockThreshold: 50 },
    { name: 'Hollow Block 4"', description: '4-inch concrete hollow block', price: 14.00, unit: 'piece', categoryId: categoryMap['Building Materials'], sku: 'BLOCK-HLW-4', stockQuantity: 500, lowStockThreshold: 100 },
    { name: 'Steel Bar 10mm', description: '10mm deformed steel bar, 6m length', price: 185.00, unit: 'piece', categoryId: categoryMap['Building Materials'], sku: 'STEEL-10MM', stockQuantity: 75, lowStockThreshold: 20 },
    { name: 'GI Tie Wire #16', description: 'Galvanized iron tie wire, #16 gauge, per kg', price: 75.00, unit: 'kg', categoryId: categoryMap['Building Materials'], sku: 'WIRE-TIE-16', stockQuantity: 60, lowStockThreshold: 15 },

    // Safety Equipment - LOW STOCK items for testing alerts
    { name: 'Hard Hat Yellow', description: 'Yellow safety hard hat', price: 180.00, unit: 'piece', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-HAT-Y', stockQuantity: 5, lowStockThreshold: 10 },
    { name: 'Safety Goggles', description: 'Clear safety goggles', price: 85.00, unit: 'piece', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-GOGGLES', stockQuantity: 8, lowStockThreshold: 15 },
    { name: 'Work Gloves', description: 'Cotton work gloves, pair', price: 45.00, unit: 'pair', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-GLOVE-C', stockQuantity: 12, lowStockThreshold: 20 },

    // Garden & Outdoor - moderate stock
    { name: 'Garden Hose 10m', description: '10 meter garden hose with fittings', price: 450.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-HOSE-10', stockQuantity: 25, lowStockThreshold: 5 },
    { name: 'Shovel Round', description: 'Round point shovel with handle', price: 350.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-SHOVEL', stockQuantity: 15, lowStockThreshold: 4 },
    { name: 'Rake', description: 'Garden rake with steel head', price: 220.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-RAKE', stockQuantity: 18, lowStockThreshold: 5 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }
  console.log('✅ Products created:', products.length);

  // Create sample customers
  const customerPassword = await bcrypt.hash('test123', 10);

  const customer1 = await prisma.customer.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: customerPassword,
      name: 'Juan Dela Cruz',
      phone: '09171234567',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: 'customer@hardware.ph' },
    update: {},
    create: {
      email: 'customer@hardware.ph',
      password: customerPassword,
      name: 'Maria Santos',
      phone: '09281234567',
    },
  });

  console.log('✅ Sample customers created: 2');

  // Create saved addresses for customer 1
  await prisma.savedAddress.upsert({
    where: { id: 1 },
    update: {},
    create: {
      customerId: customer1.id,
      label: 'Home',
      address: '123 Rizal Street',
      barangay: 'Barangay San Jose',
      landmarks: 'Near the public market',
      isDefault: true,
    },
  });

  await prisma.savedAddress.upsert({
    where: { id: 2 },
    update: {},
    create: {
      customerId: customer1.id,
      label: 'Office',
      address: '456 Bonifacio Avenue, 2nd Floor',
      barangay: 'Barangay Centro',
      landmarks: 'Above Mercury Drug',
      isDefault: false,
    },
  });

  console.log('✅ Sample addresses created: 2');

  // Get all products for orders
  const allProducts = await prisma.product.findMany();
  const productMap = new Map(allProducts.map(p => [p.sku, p]));

  // Helper to generate order number
  const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `HD-${timestamp}-${random}`;
  };

  // Create sample orders
  const sampleOrders = [
    // Pending order - customer 1
    {
      orderNumber: generateOrderNumber(),
      customerId: customer1.id,
      customerName: customer1.name,
      phone: customer1.phone,
      address: '123 Rizal Street',
      barangay: 'Barangay San Jose',
      landmarks: 'Near the public market',
      status: 'pending',
      notes: 'Please call before delivery',
      items: [
        { sku: 'PVC-PIPE-050', quantity: 10 },
        { sku: 'PVC-ELB-050', quantity: 20 },
        { sku: 'TAPE-TEFLON', quantity: 5 },
      ],
    },
    // Preparing order - customer 2
    {
      orderNumber: generateOrderNumber(),
      customerId: customer2.id,
      customerName: customer2.name,
      phone: customer2.phone,
      address: '789 Mabini Street',
      barangay: 'Barangay Poblacion',
      landmarks: 'Near the church',
      status: 'preparing',
      notes: null,
      items: [
        { sku: 'TOOL-HAMMER-C', quantity: 2 },
        { sku: 'NAIL-COM-3', quantity: 5 },
        { sku: 'SCREW-W8-1', quantity: 3 },
      ],
    },
    // Completed order - guest customer
    {
      orderNumber: generateOrderNumber(),
      customerId: null,
      customerName: 'Pedro Reyes',
      phone: '09391234567',
      address: '321 Aguinaldo Highway',
      barangay: 'Barangay Tejeros',
      landmarks: 'Beside 7-Eleven',
      status: 'completed',
      notes: 'Rush order',
      items: [
        { sku: 'CEMENT-PORT-40', quantity: 20 },
        { sku: 'STEEL-10MM', quantity: 50 },
        { sku: 'WIRE-TIE-16', quantity: 10 },
      ],
    },
    // Delivered order - customer 1
    {
      orderNumber: generateOrderNumber(),
      customerId: customer1.id,
      customerName: customer1.name,
      phone: customer1.phone,
      address: '456 Bonifacio Avenue, 2nd Floor',
      barangay: 'Barangay Centro',
      landmarks: 'Above Mercury Drug',
      status: 'delivered',
      notes: null,
      items: [
        { sku: 'OUTLET-DPX', quantity: 10 },
        { sku: 'SWITCH-SGL', quantity: 10 },
        { sku: 'WIRE-THHN-14', quantity: 100 },
      ],
    },
    // Another pending order - guest
    {
      orderNumber: generateOrderNumber(),
      customerId: null,
      customerName: 'Ana Gonzales',
      phone: '09451234567',
      address: '555 Quezon Boulevard',
      barangay: 'Barangay Magsaysay',
      landmarks: 'Across from the plaza',
      status: 'pending',
      notes: 'Deliver in the morning',
      items: [
        { sku: 'PAINT-LAT-W4', quantity: 4 },
        { sku: 'BRUSH-4IN', quantity: 3 },
        { sku: 'ROLLER-7IN', quantity: 2 },
        { sku: 'PAINT-PRIM-4', quantity: 2 },
      ],
    },
  ];

  for (const orderData of sampleOrders) {
    // Calculate order items and total
    const orderItems = orderData.items.map(item => {
      const product = productMap.get(item.sku);
      if (!product) {
        console.warn(`Product with SKU ${item.sku} not found, skipping`);
        return null;
      }
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: product.price * item.quantity,
      };
    }).filter(Boolean);

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    await prisma.order.create({
      data: {
        orderNumber: orderData.orderNumber,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        phone: orderData.phone,
        address: orderData.address,
        barangay: orderData.barangay,
        landmarks: orderData.landmarks,
        status: orderData.status,
        notes: orderData.notes,
        totalAmount,
        items: {
          create: orderItems,
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'pending',
            notes: 'Order placed (seed data)',
          },
        },
      },
    });
  }
  console.log('✅ Sample orders created:', sampleOrders.length);

  // Add wishlist items for customer 1
  const wishlistProducts = await prisma.product.findMany({
    where: { sku: { in: ['TOOL-HAMMER-C', 'TOOL-SCRWDR-6', 'GARDEN-HOSE-10'] } },
  });

  for (const product of wishlistProducts) {
    await prisma.wishlistItem.upsert({
      where: {
        customerId_productId: {
          customerId: customer1.id,
          productId: product.id,
        },
      },
      update: {},
      create: {
        customerId: customer1.id,
        productId: product.id,
      },
    });
  }
  console.log('✅ Sample wishlist items created:', wishlistProducts.length);

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Default login credentials:');
  console.log('   Admin: username="admin", password="admin123"');
  console.log('   Staff: username="staff", password="staff123"');
  console.log('   Customer 1: email="test@example.com", password="test123"');
  console.log('   Customer 2: email="customer@hardware.ph", password="test123"');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
