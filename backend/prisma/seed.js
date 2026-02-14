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

  // Create products with VARIANTS for testing variant selection
  const variantProducts = [
    {
      product: {
        name: 'Latex Paint Premium',
        description: 'Premium quality latex paint for interior and exterior use. Available in multiple sizes.',
        price: 280.00,
        unit: 'can',
        categoryId: categoryMap['Paint'],
        sku: 'PAINT-LAT-PREM',
        stockQuantity: 0, // Stock managed at variant level
        lowStockThreshold: 5,
        isAvailable: true,
        hasVariants: true,
      },
      variants: [
        { name: '1 Liter', sku: 'PAINT-LAT-PREM-1L', price: 280.00, stockQuantity: 45 },
        { name: '4 Liters', sku: 'PAINT-LAT-PREM-4L', price: 950.00, stockQuantity: 30 },
        { name: '16 Liters (1 Pail)', sku: 'PAINT-LAT-PREM-16L', price: 3200.00, stockQuantity: 12 },
      ],
    },
    {
      product: {
        name: 'GI Pipe',
        description: 'Galvanized iron pipe for plumbing and structural use. Available in different diameters.',
        price: 185.00,
        unit: 'piece',
        categoryId: categoryMap['Plumbing'],
        sku: 'GI-PIPE',
        stockQuantity: 0,
        lowStockThreshold: 10,
        isAvailable: true,
        hasVariants: true,
      },
      variants: [
        { name: '1/2 inch (6ft)', sku: 'GI-PIPE-050', price: 185.00, stockQuantity: 80 },
        { name: '3/4 inch (6ft)', sku: 'GI-PIPE-075', price: 265.00, stockQuantity: 55 },
        { name: '1 inch (6ft)', sku: 'GI-PIPE-100', price: 380.00, stockQuantity: 40 },
        { name: '1-1/2 inch (6ft)', sku: 'GI-PIPE-150', price: 520.00, stockQuantity: 25 },
      ],
    },
    {
      product: {
        name: 'Marine Plywood',
        description: 'High-quality marine plywood, 4x8 ft sheet. Available in different thicknesses.',
        price: 650.00,
        unit: 'sheet',
        categoryId: categoryMap['Building Materials'],
        sku: 'PLY-MARINE',
        stockQuantity: 0,
        lowStockThreshold: 5,
        isAvailable: true,
        hasVariants: true,
      },
      variants: [
        { name: '1/4 inch (6mm)', sku: 'PLY-MARINE-025', price: 650.00, stockQuantity: 35 },
        { name: '1/2 inch (12mm)', sku: 'PLY-MARINE-050', price: 1100.00, stockQuantity: 20 },
        { name: '3/4 inch (18mm)', sku: 'PLY-MARINE-075', price: 1550.00, stockQuantity: 15 },
      ],
    },
    {
      product: {
        name: 'Work Gloves Pro',
        description: 'Professional work gloves available in multiple sizes for the perfect fit.',
        price: 95.00,
        unit: 'pair',
        categoryId: categoryMap['Safety Equipment'],
        sku: 'SAFE-GLOVE-PRO',
        stockQuantity: 0,
        lowStockThreshold: 10,
        isAvailable: true,
        hasVariants: true,
      },
      variants: [
        { name: 'Small', sku: 'SAFE-GLOVE-PRO-S', price: 95.00, stockQuantity: 25 },
        { name: 'Medium', sku: 'SAFE-GLOVE-PRO-M', price: 95.00, stockQuantity: 40 },
        { name: 'Large', sku: 'SAFE-GLOVE-PRO-L', price: 95.00, stockQuantity: 35 },
        { name: 'X-Large', sku: 'SAFE-GLOVE-PRO-XL', price: 105.00, stockQuantity: 20 },
      ],
    },
  ];

  for (const { product: prodData, variants } of variantProducts) {
    const created = await prisma.product.upsert({
      where: { sku: prodData.sku },
      update: prodData,
      create: prodData,
    });

    for (const variant of variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: { ...variant, productId: created.id },
        create: {
          ...variant,
          productId: created.id,
          isAvailable: true,
        },
      });
    }
  }
  console.log('✅ Variant products created:', variantProducts.length, 'with', variantProducts.reduce((sum, p) => sum + p.variants.length, 0), 'variants');

  // Create sample customers
  const customerPassword = await bcrypt.hash('Test1234!', 10);

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

  // Create Bulk Pricing Tiers for selected products
  const bulkPricingProducts = [
    {
      sku: 'CEMENT-PORT-40',
      tiers: [
        { minQuantity: 10, discountType: 'percentage', discountValue: 5 },   // 10+ bags: 5% off
        { minQuantity: 50, discountType: 'percentage', discountValue: 10 },  // 50+ bags: 10% off
        { minQuantity: 100, discountType: 'percentage', discountValue: 15 }, // 100+ bags: 15% off
      ],
    },
    {
      sku: 'BLOCK-HLW-4',
      tiers: [
        { minQuantity: 50, discountType: 'fixed', discountValue: 1 },    // 50+ pcs: ₱1 off each
        { minQuantity: 100, discountType: 'fixed', discountValue: 2 },   // 100+ pcs: ₱2 off each
        { minQuantity: 500, discountType: 'fixed', discountValue: 3 },   // 500+ pcs: ₱3 off each
      ],
    },
    {
      sku: 'NAIL-COM-2',
      tiers: [
        { minQuantity: 5, discountType: 'percentage', discountValue: 5 },   // 5+ kg: 5% off
        { minQuantity: 20, discountType: 'percentage', discountValue: 10 },  // 20+ kg: 10% off
        { minQuantity: 50, discountType: 'percentage', discountValue: 15 },  // 50+ kg: 15% off
      ],
    },
    {
      sku: 'STEEL-10MM',
      tiers: [
        { minQuantity: 10, discountType: 'fixed', discountValue: 10 },  // 10+ pcs: ₱10 off each
        { minQuantity: 25, discountType: 'fixed', discountValue: 20 },  // 25+ pcs: ₱20 off each
        { minQuantity: 50, discountType: 'fixed', discountValue: 30 },  // 50+ pcs: ₱30 off each
      ],
    },
    {
      sku: 'SCREW-W8-1',
      tiers: [
        { minQuantity: 10, discountType: 'percentage', discountValue: 8 },   // 10+ packs: 8% off
        { minQuantity: 25, discountType: 'percentage', discountValue: 12 },  // 25+ packs: 12% off
      ],
    },
  ];

  for (const { sku, tiers } of bulkPricingProducts) {
    const product = productMap.get(sku);
    if (!product) {
      console.warn(`Bulk pricing: Product with SKU ${sku} not found, skipping`);
      continue;
    }

    // Enable hasBulkPricing on the product
    await prisma.product.update({
      where: { id: product.id },
      data: { hasBulkPricing: true },
    });

    // Create tiers (delete existing first to avoid duplicates on re-seed)
    await prisma.bulkPricingTier.deleteMany({ where: { productId: product.id } });

    for (const tier of tiers) {
      await prisma.bulkPricingTier.create({
        data: {
          productId: product.id,
          ...tier,
        },
      });
    }
  }
  console.log('✅ Bulk pricing tiers created for', bulkPricingProducts.length, 'products');

  // Helper to generate order number
  const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `HD-${timestamp}-${random}`;
  };

  // Helper functions for realistic data generation
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomDate = (daysBack) => {
    const now = new Date();
    const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
  };

  // Guest customer profiles for realistic orders
  const guestCustomers = [
    { name: 'Juan Dela Cruz', phone: '09171234567', address: '123 Rizal Street', barangay: 'Barangay San Jose', landmarks: 'Near the public market' },
    { name: 'Maria Santos', phone: '09281234567', address: '789 Mabini Street', barangay: 'Barangay Poblacion', landmarks: 'Near the church' },
    { name: 'Pedro Reyes', phone: '09391234567', address: '321 Aguinaldo Highway', barangay: 'Barangay Tejeros', landmarks: 'Beside 7-Eleven' },
    { name: 'Ana Gonzales', phone: '09451234567', address: '555 Quezon Boulevard', barangay: 'Barangay Magsaysay', landmarks: 'Across from the plaza' },
    { name: 'Carlos Mendoza', phone: '09175556666', address: '777 Commonwealth Ave', barangay: 'Batasan Hills', landmarks: 'Beside Jollibee' },
    { name: 'Sofia Cruz', phone: '09187778888', address: '888 Shaw Blvd', barangay: 'Pleasant Hills', landmarks: 'Near Starmall' },
    { name: 'Roberto Villanueva', phone: '09199990000', address: '999 Ortigas Ave', barangay: 'San Antonio', landmarks: 'Across Robinson' },
    { name: 'Elena Fernandez', phone: '09161231234', address: '111 C5 Road', barangay: 'Signal Village', landmarks: 'Near Gate 1' },
    { name: 'Miguel Tan', phone: '09174564567', address: '222 Macapagal Blvd', barangay: 'Baclaran', landmarks: 'Near MOA' },
    { name: 'Patricia Lim', phone: '09187897890', address: '333 Taft Ave', barangay: 'Ermita', landmarks: 'Near university' },
    { name: 'Antonio Bautista', phone: '09203213210', address: '444 Espana Blvd', barangay: 'Sampaloc', landmarks: 'Near UST' },
    { name: 'Rosa Garcia', phone: '09176546543', address: '555 Aurora Blvd', barangay: 'Project 4', landmarks: 'Behind Gateway Mall' },
    { name: 'Fernando Castro', phone: '09189879876', address: '666 Quirino Hwy', barangay: 'Novaliches', landmarks: 'Near SM Nova' },
    { name: 'Carmen Aquino', phone: '09161011010', address: '777 Congressional Ave', barangay: 'Project 8', landmarks: 'Near Savemore' },
    { name: 'Ricardo Torres', phone: '09172022020', address: '888 Mindanao Ave', barangay: 'Talipapa', landmarks: 'Near Puregold' },
  ];

  // Create sample orders (original 5 + 80 new = 85 total)
  const sampleOrders = [
    // Original 5 seed orders
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

  // Create the original 5 orders
  for (const orderData of sampleOrders) {
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

  // -------------------------------------------------------
  // Generate 300+ orders spanning 18 months (Aug 2024 – Feb 2026)
  // with seasonal trends and month-over-month growth
  // -------------------------------------------------------
  const productSkus = allProducts.map(p => p.sku).filter(Boolean);

  // Monthly order targets — simulates growth + seasonal variation
  // Construction season peaks May-Oct, holiday spike Dec
  const monthlyPlan = [
    // 2024
    { year: 2024, month: 7, count: 8 },  // Aug 2024 — store just opened
    { year: 2024, month: 8, count: 10 },  // Sep
    { year: 2024, month: 9, count: 12 },  // Oct — end of construction peak
    { year: 2024, month: 10, count: 10 },  // Nov — cooler season
    { year: 2024, month: 11, count: 18 },  // Dec — holiday rush
    // 2025
    { year: 2025, month: 0, count: 12 },  // Jan — post-holiday dip
    { year: 2025, month: 1, count: 14 },  // Feb
    { year: 2025, month: 2, count: 16 },  // Mar — spring projects
    { year: 2025, month: 3, count: 18 },  // Apr
    { year: 2025, month: 4, count: 24 },  // May — construction peak starts
    { year: 2025, month: 5, count: 28 },  // Jun — peak
    { year: 2025, month: 6, count: 30 },  // Jul — peak
    { year: 2025, month: 7, count: 28 },  // Aug — peak
    { year: 2025, month: 8, count: 24 },  // Sep — peak tapering
    { year: 2025, month: 9, count: 20 },  // Oct — end peak
    { year: 2025, month: 10, count: 16 },  // Nov
    { year: 2025, month: 11, count: 25 },  // Dec — holiday rush
    // 2026
    { year: 2026, month: 0, count: 14 },  // Jan
    { year: 2026, month: 1, count: 8 },  // Feb (partial month — up to today)
  ];

  const totalPlanned = monthlyPlan.reduce((s, m) => s + m.count, 0);
  console.log(`🔄 Creating ${totalPlanned} historical orders across 18 months...`);

  const statusFlow = {
    'pending': ['pending'],
    'accepted': ['pending', 'accepted'],
    'rejected': ['pending', 'rejected'],
    'preparing': ['pending', 'accepted', 'preparing'],
    'out_for_delivery': ['pending', 'accepted', 'preparing', 'out_for_delivery'],
    'delivered': ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered'],
    'completed': ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed'],
    'cancelled': ['pending', 'cancelled'],
  };

  let createdCount = 0;
  const now = new Date();

  for (const { year, month, count } of monthlyPlan) {
    for (let i = 0; i < count; i++) {
      // Random date within the month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const maxDay = (year === 2026 && month === 1) ? Math.min(14, daysInMonth) : daysInMonth;
      const day = randomInt(1, maxDay);
      const hour = randomInt(7, 19);
      const minute = randomInt(0, 59);
      const orderDate = new Date(year, month, day, hour, minute);

      // Don't create orders in the future
      if (orderDate > now) continue;

      // Status: older orders almost always completed; recent ones more varied
      const ageInDays = (now - orderDate) / (1000 * 60 * 60 * 24);
      let status;
      if (ageInDays > 180) {
        // Very old → heavily completed
        const r = Math.random();
        status = r < 0.72 ? 'completed' : r < 0.88 ? 'delivered' : r < 0.94 ? 'cancelled' : 'rejected';
      } else if (ageInDays > 30) {
        // Medium age → mostly complete, some cancelled
        const r = Math.random();
        status = r < 0.55 ? 'completed' : r < 0.75 ? 'delivered' : r < 0.85 ? 'cancelled' : r < 0.90 ? 'rejected' : r < 0.95 ? 'out_for_delivery' : 'preparing';
      } else {
        // Recent — mix of all statuses
        const r = Math.random();
        status = r < 0.20 ? 'pending' : r < 0.35 ? 'accepted' : r < 0.50 ? 'preparing' : r < 0.60 ? 'out_for_delivery' : r < 0.75 ? 'delivered' : r < 0.90 ? 'completed' : r < 0.96 ? 'cancelled' : 'rejected';
      }

      const customer = randomItem(guestCustomers);
      const numItems = randomInt(1, 6);

      // Pick random unique products
      const pickedSkus = new Set();
      const items = [];
      for (let j = 0; j < numItems; j++) {
        let sku;
        let attempts = 0;
        do {
          sku = randomItem(productSkus);
          attempts++;
        } while (pickedSkus.has(sku) && attempts < 20);
        if (pickedSkus.has(sku)) continue;
        pickedSkus.add(sku);

        const product = productMap.get(sku);
        if (!product) continue;
        const quantity = randomInt(1, 10);
        items.push({
          productId: product.id,
          quantity,
          unitPrice: product.price,
          subtotal: product.price * quantity,
        });
      }
      if (items.length === 0) continue;

      const totalAmount = items.reduce((sum, it) => sum + it.subtotal, 0);
      const isRegistered = randomInt(1, 4) === 1;

      const flow = statusFlow[status] || ['pending'];
      const historyEntries = [];
      let prevStatus = null;
      let historyDate = new Date(orderDate);
      for (const flowStatus of flow) {
        historyDate = new Date(historyDate.getTime() + randomInt(30, 180) * 60000);
        historyEntries.push({
          fromStatus: prevStatus,
          toStatus: flowStatus,
          notes: flowStatus === 'rejected' ? 'Out of stock items' :
            flowStatus === 'cancelled' ? 'Customer requested cancellation' :
              flowStatus === 'pending' ? 'Order placed (seed data)' : null,
          createdAt: historyDate,
        });
        prevStatus = flowStatus;
      }

      await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: isRegistered ? randomItem([customer1.id, customer2.id]) : null,
          customerName: customer.name,
          phone: customer.phone,
          address: customer.address,
          barangay: customer.barangay,
          landmarks: customer.landmarks,
          status,
          totalAmount,
          notes: randomInt(1, 4) === 1 ? randomItem([
            'Please call before delivery',
            'Leave at the gate',
            'Rush order - need ASAP',
            'Deliver in the morning only',
            'Construction site - ask for foreman',
          ]) : null,
          createdAt: orderDate,
          items: { create: items },
          statusHistory: { create: historyEntries },
        },
      });
      createdCount++;
    }
  }
  console.log(`✅ Historical orders created: ${createdCount}`);

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
  console.log('   Customer 1: email="test@example.com", password="Test1234!"');
  console.log('   Customer 2: email="customer@hardware.ph", password="Test1234!"');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
