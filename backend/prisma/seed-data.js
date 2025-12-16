const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper function to generate random order number
function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// Helper to get random item from array
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random number between min and max
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to generate random date within last n days
function randomDate(daysBack) {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function main() {
  console.log('🌱 Starting COMPREHENSIVE database seed...');
  console.log('⏳ This will add lots of data for testing...\n');

  // Create admin users
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

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

  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      password: staffPassword,
      name: 'Juan dela Cruz',
      role: 'staff',
    },
  });

  // Create more staff members
  const staffMembers = [
    { username: 'maria', name: 'Maria Santos', role: 'staff' },
    { username: 'pedro', name: 'Pedro Garcia', role: 'staff' },
    { username: 'ana', name: 'Ana Reyes', role: 'staff' },
  ];

  for (const member of staffMembers) {
    await prisma.user.upsert({
      where: { username: member.username },
      update: {},
      create: {
        ...member,
        password: staffPassword,
      },
    });
  }
  console.log('✅ Staff users created:', staffMembers.length + 1);

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
    { name: 'Lighting', description: 'Bulbs, fixtures, and lighting accessories', icon: '💡' },
    { name: 'Flooring', description: 'Tiles, adhesives, and flooring materials', icon: '🏠' },
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

  // EXTENSIVE Products list
  const products = [
    // Plumbing (15 products)
    { name: 'PVC Pipe 1/2"', description: 'Standard 1/2 inch PVC pipe, 10ft length', price: 45.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-PIPE-050', stockQuantity: 150 },
    { name: 'PVC Pipe 3/4"', description: 'Standard 3/4 inch PVC pipe, 10ft length', price: 65.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-PIPE-075', stockQuantity: 120 },
    { name: 'PVC Pipe 1"', description: 'Standard 1 inch PVC pipe, 10ft length', price: 85.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-PIPE-100', stockQuantity: 100 },
    { name: 'PVC Elbow 1/2"', description: '1/2 inch PVC elbow fitting', price: 8.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-ELB-050', stockQuantity: 300 },
    { name: 'PVC Elbow 3/4"', description: '3/4 inch PVC elbow fitting', price: 12.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-ELB-075', stockQuantity: 250 },
    { name: 'PVC Tee 1/2"', description: '1/2 inch PVC tee fitting', price: 10.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-TEE-050', stockQuantity: 200 },
    { name: 'Gate Valve 1/2"', description: 'Brass gate valve, 1/2 inch', price: 180.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'VALVE-GATE-050', stockQuantity: 50 },
    { name: 'Gate Valve 3/4"', description: 'Brass gate valve, 3/4 inch', price: 250.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'VALVE-GATE-075', stockQuantity: 40 },
    { name: 'Ball Valve 1/2"', description: 'Brass ball valve, 1/2 inch', price: 220.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'VALVE-BALL-050', stockQuantity: 45 },
    { name: 'Teflon Tape', description: 'Thread seal tape for plumbing connections', price: 25.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'TAPE-TEFLON', stockQuantity: 500 },
    { name: 'PVC Cement 200ml', description: 'PVC solvent cement for pipe joints', price: 85.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'PVC-CEMENT-200', stockQuantity: 100 },
    { name: 'Faucet Standard', description: 'Standard chrome faucet for sink', price: 350.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'FAUCET-STD', stockQuantity: 30 },
    { name: 'Faucet Premium', description: 'Premium stainless steel faucet', price: 850.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'FAUCET-PREM', stockQuantity: 20 },
    { name: 'Flexible Hose 16"', description: 'Braided flexible hose, 16 inches', price: 120.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'FLEX-HOSE-16', stockQuantity: 80 },
    { name: 'Toilet Flapper', description: 'Universal toilet flapper valve', price: 95.00, unit: 'piece', categoryId: categoryMap['Plumbing'], sku: 'TOILET-FLAP', stockQuantity: 60 },

    // Electrical (20 products)
    { name: 'THHN Wire #14', description: 'THHN copper wire, gauge 14, sold per meter', price: 18.00, unit: 'meter', categoryId: categoryMap['Electrical'], sku: 'WIRE-THHN-14', stockQuantity: 1000 },
    { name: 'THHN Wire #12', description: 'THHN copper wire, gauge 12, sold per meter', price: 28.00, unit: 'meter', categoryId: categoryMap['Electrical'], sku: 'WIRE-THHN-12', stockQuantity: 800 },
    { name: 'THHN Wire #10', description: 'THHN copper wire, gauge 10, sold per meter', price: 45.00, unit: 'meter', categoryId: categoryMap['Electrical'], sku: 'WIRE-THHN-10', stockQuantity: 500 },
    { name: 'THHN Wire #8', description: 'THHN copper wire, gauge 8, sold per meter', price: 75.00, unit: 'meter', categoryId: categoryMap['Electrical'], sku: 'WIRE-THHN-8', stockQuantity: 300 },
    { name: 'Outlet Duplex', description: 'Standard duplex outlet, universal type', price: 65.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'OUTLET-DPX', stockQuantity: 200 },
    { name: 'Outlet GFCI', description: 'Ground fault circuit interrupter outlet', price: 450.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'OUTLET-GFCI', stockQuantity: 50 },
    { name: 'Single Switch', description: 'Single pole light switch', price: 45.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'SWITCH-SGL', stockQuantity: 180 },
    { name: 'Two Gang Switch', description: 'Two gang light switch', price: 85.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'SWITCH-2G', stockQuantity: 120 },
    { name: 'Three Gang Switch', description: 'Three gang light switch', price: 120.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'SWITCH-3G', stockQuantity: 80 },
    { name: 'Dimmer Switch', description: 'LED compatible dimmer switch', price: 380.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'SWITCH-DIM', stockQuantity: 40 },
    { name: 'LED Bulb 7W', description: 'LED bulb, 7 watts, daylight', price: 75.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'LED-7W-DL', stockQuantity: 300 },
    { name: 'LED Bulb 9W', description: 'LED bulb, 9 watts, daylight', price: 95.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'LED-9W-DL', stockQuantity: 280 },
    { name: 'LED Bulb 12W', description: 'LED bulb, 12 watts, daylight', price: 125.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'LED-12W-DL', stockQuantity: 250 },
    { name: 'Circuit Breaker 15A', description: '15 Ampere circuit breaker', price: 220.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'CB-15A', stockQuantity: 60 },
    { name: 'Circuit Breaker 20A', description: '20 Ampere circuit breaker', price: 250.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'CB-20A', stockQuantity: 55 },
    { name: 'Circuit Breaker 30A', description: '30 Ampere circuit breaker', price: 320.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'CB-30A', stockQuantity: 40 },
    { name: 'Panel Board 4-Way', description: '4-way distribution panel board', price: 850.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'PANEL-4W', stockQuantity: 25 },
    { name: 'Panel Board 6-Way', description: '6-way distribution panel board', price: 1200.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'PANEL-6W', stockQuantity: 20 },
    { name: 'Electrical Tape', description: 'Black electrical insulation tape', price: 35.00, unit: 'piece', categoryId: categoryMap['Electrical'], sku: 'TAPE-ELEC', stockQuantity: 400 },
    { name: 'Wire Connector', description: 'Twist-on wire connector, pack of 20', price: 45.00, unit: 'pack', categoryId: categoryMap['Electrical'], sku: 'CONN-WIRE-20', stockQuantity: 150 },

    // Tools (18 products)
    { name: 'Hammer Claw', description: 'Standard claw hammer with wooden handle', price: 180.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-HAMMER-C', stockQuantity: 45 },
    { name: 'Hammer Ball Peen', description: 'Ball peen hammer, 16oz', price: 220.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-HAMMER-BP', stockQuantity: 30 },
    { name: 'Screwdriver Set', description: '6-piece screwdriver set, Phillips and flat', price: 220.00, unit: 'set', categoryId: categoryMap['Tools'], sku: 'TOOL-SCRWDR-6', stockQuantity: 50 },
    { name: 'Precision Screwdriver Set', description: '6-piece precision screwdriver set', price: 180.00, unit: 'set', categoryId: categoryMap['Tools'], sku: 'TOOL-SCRWDR-P6', stockQuantity: 35 },
    { name: 'Pliers Combination', description: '8-inch combination pliers', price: 150.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-PLIER-8', stockQuantity: 55 },
    { name: 'Pliers Long Nose', description: '6-inch long nose pliers', price: 135.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-PLIER-LN', stockQuantity: 45 },
    { name: 'Pliers Cutting', description: '6-inch diagonal cutting pliers', price: 140.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-PLIER-CUT', stockQuantity: 40 },
    { name: 'Measuring Tape 5m', description: '5 meter steel measuring tape', price: 85.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-TAPE-5M', stockQuantity: 70 },
    { name: 'Measuring Tape 7.5m', description: '7.5 meter steel measuring tape', price: 120.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-TAPE-75M', stockQuantity: 50 },
    { name: 'Level 24"', description: '24-inch spirit level', price: 280.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-LEVEL-24', stockQuantity: 25 },
    { name: 'Level 48"', description: '48-inch spirit level', price: 450.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-LEVEL-48', stockQuantity: 15 },
    { name: 'Hacksaw Frame', description: 'Adjustable hacksaw frame with blade', price: 165.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-HACKSAW', stockQuantity: 35 },
    { name: 'Hacksaw Blade', description: 'Bi-metal hacksaw blade, 12 inch', price: 45.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-HACKSAW-B', stockQuantity: 100 },
    { name: 'Adjustable Wrench 10"', description: '10-inch adjustable wrench', price: 320.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-WRENCH-10', stockQuantity: 30 },
    { name: 'Adjustable Wrench 12"', description: '12-inch adjustable wrench', price: 380.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-WRENCH-12', stockQuantity: 25 },
    { name: 'Socket Set 40pc', description: '40-piece socket wrench set', price: 1250.00, unit: 'set', categoryId: categoryMap['Tools'], sku: 'TOOL-SOCKET-40', stockQuantity: 15 },
    { name: 'Drill Bit Set', description: 'HSS drill bit set, 13 pieces', price: 450.00, unit: 'set', categoryId: categoryMap['Tools'], sku: 'TOOL-DRILL-13', stockQuantity: 25 },
    { name: 'Utility Knife', description: 'Retractable utility knife with blades', price: 85.00, unit: 'piece', categoryId: categoryMap['Tools'], sku: 'TOOL-KNIFE', stockQuantity: 60 },

    // Paint (12 products)
    { name: 'Latex Paint White 4L', description: 'White latex paint, 4 liters', price: 450.00, unit: 'gallon', categoryId: categoryMap['Paint'], sku: 'PAINT-LAT-W4', stockQuantity: 40 },
    { name: 'Latex Paint Ivory 4L', description: 'Ivory latex paint, 4 liters', price: 480.00, unit: 'gallon', categoryId: categoryMap['Paint'], sku: 'PAINT-LAT-I4', stockQuantity: 35 },
    { name: 'Latex Paint Beige 4L', description: 'Beige latex paint, 4 liters', price: 480.00, unit: 'gallon', categoryId: categoryMap['Paint'], sku: 'PAINT-LAT-B4', stockQuantity: 30 },
    { name: 'Enamel Paint White 1L', description: 'White enamel paint, 1 liter', price: 280.00, unit: 'liter', categoryId: categoryMap['Paint'], sku: 'PAINT-ENM-W1', stockQuantity: 50 },
    { name: 'Enamel Paint Black 1L', description: 'Black enamel paint, 1 liter', price: 280.00, unit: 'liter', categoryId: categoryMap['Paint'], sku: 'PAINT-ENM-B1', stockQuantity: 45 },
    { name: 'Paint Brush 2"', description: '2-inch paint brush', price: 55.00, unit: 'piece', categoryId: categoryMap['Paint'], sku: 'BRUSH-2IN', stockQuantity: 80 },
    { name: 'Paint Brush 4"', description: '4-inch paint brush', price: 85.00, unit: 'piece', categoryId: categoryMap['Paint'], sku: 'BRUSH-4IN', stockQuantity: 70 },
    { name: 'Paint Roller 7"', description: '7-inch paint roller with handle', price: 120.00, unit: 'piece', categoryId: categoryMap['Paint'], sku: 'ROLLER-7IN', stockQuantity: 55 },
    { name: 'Paint Roller 9"', description: '9-inch paint roller with handle', price: 150.00, unit: 'piece', categoryId: categoryMap['Paint'], sku: 'ROLLER-9IN', stockQuantity: 45 },
    { name: 'Primer 4L', description: 'Wall primer/undercoat, 4 liters', price: 380.00, unit: 'gallon', categoryId: categoryMap['Paint'], sku: 'PAINT-PRIM-4', stockQuantity: 35 },
    { name: 'Thinner 1L', description: 'Paint thinner, 1 liter', price: 150.00, unit: 'liter', categoryId: categoryMap['Paint'], sku: 'PAINT-THIN-1', stockQuantity: 60 },
    { name: 'Sandpaper #80', description: 'Sandpaper, grit 80, per sheet', price: 15.00, unit: 'sheet', categoryId: categoryMap['Paint'], sku: 'SAND-80', stockQuantity: 200 },

    // Hardware (15 products)
    { name: 'Common Nails 2"', description: '2-inch common nails, per kg', price: 85.00, unit: 'kg', categoryId: categoryMap['Hardware'], sku: 'NAIL-COM-2', stockQuantity: 100 },
    { name: 'Common Nails 3"', description: '3-inch common nails, per kg', price: 85.00, unit: 'kg', categoryId: categoryMap['Hardware'], sku: 'NAIL-COM-3', stockQuantity: 90 },
    { name: 'Common Nails 4"', description: '4-inch common nails, per kg', price: 90.00, unit: 'kg', categoryId: categoryMap['Hardware'], sku: 'NAIL-COM-4', stockQuantity: 80 },
    { name: 'Finishing Nails 1.5"', description: '1.5-inch finishing nails, per kg', price: 120.00, unit: 'kg', categoryId: categoryMap['Hardware'], sku: 'NAIL-FIN-15', stockQuantity: 50 },
    { name: 'Wood Screw #8 1"', description: '#8 x 1" wood screws, pack of 100', price: 65.00, unit: 'pack', categoryId: categoryMap['Hardware'], sku: 'SCREW-W8-1', stockQuantity: 75 },
    { name: 'Wood Screw #8 2"', description: '#8 x 2" wood screws, pack of 100', price: 85.00, unit: 'pack', categoryId: categoryMap['Hardware'], sku: 'SCREW-W8-2', stockQuantity: 70 },
    { name: 'Drywall Screw 1.25"', description: '1.25-inch drywall screws, pack of 100', price: 75.00, unit: 'pack', categoryId: categoryMap['Hardware'], sku: 'SCREW-DW-125', stockQuantity: 80 },
    { name: 'Door Hinge 3"', description: '3-inch door hinge, pair', price: 45.00, unit: 'pair', categoryId: categoryMap['Hardware'], sku: 'HINGE-DR-3', stockQuantity: 60 },
    { name: 'Door Hinge 4"', description: '4-inch door hinge, pair', price: 65.00, unit: 'pair', categoryId: categoryMap['Hardware'], sku: 'HINGE-DR-4', stockQuantity: 50 },
    { name: 'Cabinet Hinge', description: 'Self-closing cabinet hinge, pair', price: 35.00, unit: 'pair', categoryId: categoryMap['Hardware'], sku: 'HINGE-CAB', stockQuantity: 100 },
    { name: 'Padlock 40mm', description: '40mm brass padlock with keys', price: 180.00, unit: 'piece', categoryId: categoryMap['Hardware'], sku: 'LOCK-PAD-40', stockQuantity: 40 },
    { name: 'Padlock 50mm', description: '50mm brass padlock with keys', price: 250.00, unit: 'piece', categoryId: categoryMap['Hardware'], sku: 'LOCK-PAD-50', stockQuantity: 35 },
    { name: 'Door Knob Set', description: 'Passage door knob set, chrome', price: 320.00, unit: 'set', categoryId: categoryMap['Hardware'], sku: 'KNOB-PASS', stockQuantity: 25 },
    { name: 'Door Knob Privacy', description: 'Privacy door knob set with lock', price: 450.00, unit: 'set', categoryId: categoryMap['Hardware'], sku: 'KNOB-PRIV', stockQuantity: 20 },
    { name: 'Bolt Slide 6"', description: '6-inch slide bolt latch', price: 85.00, unit: 'piece', categoryId: categoryMap['Hardware'], sku: 'BOLT-SLIDE-6', stockQuantity: 45 },

    // Building Materials (12 products)
    { name: 'Portland Cement 40kg', description: '40kg bag of Portland cement', price: 285.00, unit: 'bag', categoryId: categoryMap['Building Materials'], sku: 'CEMENT-PORT-40', stockQuantity: 200 },
    { name: 'Quick Set Cement 5kg', description: '5kg bag of quick-setting cement', price: 120.00, unit: 'bag', categoryId: categoryMap['Building Materials'], sku: 'CEMENT-QS-5', stockQuantity: 60 },
    { name: 'Hollow Block 4"', description: '4-inch concrete hollow block', price: 14.00, unit: 'piece', categoryId: categoryMap['Building Materials'], sku: 'BLOCK-HLW-4', stockQuantity: 500 },
    { name: 'Hollow Block 6"', description: '6-inch concrete hollow block', price: 18.00, unit: 'piece', categoryId: categoryMap['Building Materials'], sku: 'BLOCK-HLW-6', stockQuantity: 400 },
    { name: 'Steel Bar 10mm', description: '10mm deformed steel bar, 6m length', price: 185.00, unit: 'piece', categoryId: categoryMap['Building Materials'], sku: 'STEEL-10MM', stockQuantity: 150 },
    { name: 'Steel Bar 12mm', description: '12mm deformed steel bar, 6m length', price: 265.00, unit: 'piece', categoryId: categoryMap['Building Materials'], sku: 'STEEL-12MM', stockQuantity: 120 },
    { name: 'Steel Bar 16mm', description: '16mm deformed steel bar, 6m length', price: 480.00, unit: 'piece', categoryId: categoryMap['Building Materials'], sku: 'STEEL-16MM', stockQuantity: 80 },
    { name: 'GI Tie Wire #16', description: 'Galvanized iron tie wire, #16 gauge, per kg', price: 75.00, unit: 'kg', categoryId: categoryMap['Building Materials'], sku: 'WIRE-TIE-16', stockQuantity: 100 },
    { name: 'Plywood 1/4" Marine', description: '1/4 inch marine plywood, 4x8 ft', price: 850.00, unit: 'sheet', categoryId: categoryMap['Building Materials'], sku: 'PLY-14-MAR', stockQuantity: 50 },
    { name: 'Plywood 1/2" Marine', description: '1/2 inch marine plywood, 4x8 ft', price: 1200.00, unit: 'sheet', categoryId: categoryMap['Building Materials'], sku: 'PLY-12-MAR', stockQuantity: 40 },
    { name: 'Plywood 3/4" Marine', description: '3/4 inch marine plywood, 4x8 ft', price: 1650.00, unit: 'sheet', categoryId: categoryMap['Building Materials'], sku: 'PLY-34-MAR', stockQuantity: 30 },
    { name: 'Sand Washed', description: 'Washed sand, per cubic meter', price: 800.00, unit: 'cubic meter', categoryId: categoryMap['Building Materials'], sku: 'SAND-WASH', stockQuantity: 20 },

    // Safety Equipment (10 products)
    { name: 'Hard Hat Yellow', description: 'Yellow safety hard hat', price: 180.00, unit: 'piece', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-HAT-Y', stockQuantity: 30 },
    { name: 'Hard Hat White', description: 'White safety hard hat', price: 180.00, unit: 'piece', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-HAT-W', stockQuantity: 25 },
    { name: 'Hard Hat Blue', description: 'Blue safety hard hat', price: 180.00, unit: 'piece', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-HAT-B', stockQuantity: 20 },
    { name: 'Safety Goggles', description: 'Clear safety goggles', price: 85.00, unit: 'piece', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-GOGGLES', stockQuantity: 50 },
    { name: 'Safety Glasses', description: 'Clear safety glasses', price: 55.00, unit: 'piece', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-GLASSES', stockQuantity: 60 },
    { name: 'Work Gloves Cotton', description: 'Cotton work gloves, pair', price: 45.00, unit: 'pair', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-GLOVE-C', stockQuantity: 80 },
    { name: 'Work Gloves Leather', description: 'Leather work gloves, pair', price: 180.00, unit: 'pair', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-GLOVE-L', stockQuantity: 40 },
    { name: 'Dust Mask N95', description: 'N95 dust mask, pack of 10', price: 250.00, unit: 'pack', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-MASK-N95', stockQuantity: 45 },
    { name: 'Safety Vest', description: 'High visibility safety vest, orange', price: 150.00, unit: 'piece', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-VEST', stockQuantity: 35 },
    { name: 'Ear Plugs', description: 'Foam ear plugs, pack of 10', price: 85.00, unit: 'pack', categoryId: categoryMap['Safety Equipment'], sku: 'SAFE-EARPLUGS', stockQuantity: 70 },

    // Garden & Outdoor (10 products)
    { name: 'Garden Hose 10m', description: '10 meter garden hose with fittings', price: 450.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-HOSE-10', stockQuantity: 25 },
    { name: 'Garden Hose 20m', description: '20 meter garden hose with fittings', price: 750.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-HOSE-20', stockQuantity: 20 },
    { name: 'Shovel Round', description: 'Round point shovel with handle', price: 350.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-SHOVEL', stockQuantity: 20 },
    { name: 'Shovel Square', description: 'Square point shovel with handle', price: 380.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-SHOVEL-SQ', stockQuantity: 15 },
    { name: 'Rake', description: 'Garden rake with steel head', price: 220.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-RAKE', stockQuantity: 18 },
    { name: 'Wheelbarrow', description: 'Steel wheelbarrow, 6 cubic feet', price: 2500.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-WHEEL', stockQuantity: 8 },
    { name: 'Hose Nozzle', description: 'Adjustable spray hose nozzle', price: 120.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-NOZZLE', stockQuantity: 35 },
    { name: 'Sprinkler', description: 'Oscillating lawn sprinkler', price: 350.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-SPRINK', stockQuantity: 15 },
    { name: 'Pruning Shears', description: 'Bypass pruning shears', price: 280.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-PRUNE', stockQuantity: 20 },
    { name: 'Garden Trowel', description: 'Hand trowel for gardening', price: 85.00, unit: 'piece', categoryId: categoryMap['Garden & Outdoor'], sku: 'GARDEN-TROWEL', stockQuantity: 30 },

    // Lighting (8 products)
    { name: 'LED Panel Light 18W', description: '18W LED panel light, square', price: 450.00, unit: 'piece', categoryId: categoryMap['Lighting'], sku: 'LIGHT-PANEL-18', stockQuantity: 30 },
    { name: 'LED Panel Light 24W', description: '24W LED panel light, square', price: 580.00, unit: 'piece', categoryId: categoryMap['Lighting'], sku: 'LIGHT-PANEL-24', stockQuantity: 25 },
    { name: 'Ceiling Lamp Holder', description: 'E27 ceiling lamp holder', price: 35.00, unit: 'piece', categoryId: categoryMap['Lighting'], sku: 'LIGHT-HOLDER-E27', stockQuantity: 100 },
    { name: 'Fluorescent Fixture 2ft', description: '2 feet T8 fluorescent fixture', price: 220.00, unit: 'piece', categoryId: categoryMap['Lighting'], sku: 'LIGHT-FLUOR-2', stockQuantity: 35 },
    { name: 'Fluorescent Fixture 4ft', description: '4 feet T8 fluorescent fixture', price: 320.00, unit: 'piece', categoryId: categoryMap['Lighting'], sku: 'LIGHT-FLUOR-4', stockQuantity: 30 },
    { name: 'LED Tube 18W', description: 'LED tube light, 18W, 4 feet', price: 180.00, unit: 'piece', categoryId: categoryMap['Lighting'], sku: 'LIGHT-TUBE-18', stockQuantity: 50 },
    { name: 'Outdoor Wall Light', description: 'Waterproof outdoor wall light', price: 650.00, unit: 'piece', categoryId: categoryMap['Lighting'], sku: 'LIGHT-OUTDOOR', stockQuantity: 20 },
    { name: 'Motion Sensor Light', description: 'LED light with motion sensor', price: 850.00, unit: 'piece', categoryId: categoryMap['Lighting'], sku: 'LIGHT-MOTION', stockQuantity: 15 },

    // Flooring (8 products)
    { name: 'Floor Tile 30x30', description: '30x30 cm ceramic floor tile', price: 35.00, unit: 'piece', categoryId: categoryMap['Flooring'], sku: 'TILE-FLR-30', stockQuantity: 500 },
    { name: 'Floor Tile 40x40', description: '40x40 cm ceramic floor tile', price: 55.00, unit: 'piece', categoryId: categoryMap['Flooring'], sku: 'TILE-FLR-40', stockQuantity: 400 },
    { name: 'Floor Tile 60x60', description: '60x60 cm ceramic floor tile', price: 85.00, unit: 'piece', categoryId: categoryMap['Flooring'], sku: 'TILE-FLR-60', stockQuantity: 300 },
    { name: 'Wall Tile 20x30', description: '20x30 cm ceramic wall tile', price: 28.00, unit: 'piece', categoryId: categoryMap['Flooring'], sku: 'TILE-WALL-2030', stockQuantity: 400 },
    { name: 'Tile Adhesive 25kg', description: 'Ceramic tile adhesive, 25kg bag', price: 420.00, unit: 'bag', categoryId: categoryMap['Flooring'], sku: 'TILE-ADHES-25', stockQuantity: 60 },
    { name: 'Tile Grout White', description: 'White tile grout, 1kg', price: 85.00, unit: 'kg', categoryId: categoryMap['Flooring'], sku: 'TILE-GROUT-W', stockQuantity: 80 },
    { name: 'Tile Grout Gray', description: 'Gray tile grout, 1kg', price: 85.00, unit: 'kg', categoryId: categoryMap['Flooring'], sku: 'TILE-GROUT-G', stockQuantity: 70 },
    { name: 'Tile Spacer 2mm', description: 'Tile spacer 2mm, pack of 100', price: 35.00, unit: 'pack', categoryId: categoryMap['Flooring'], sku: 'TILE-SPACER-2', stockQuantity: 100 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }
  console.log('✅ Products created:', products.length);

  // Get all products for order creation
  const allProducts = await prisma.product.findMany();

  // Customer data for orders
  const customers = [
    { name: 'Juan dela Cruz', phone: '09171234567', address: '123 Main St, Makati', barangay: 'Poblacion', landmarks: 'Near Mercury Drug' },
    { name: 'Maria Santos', phone: '09189876543', address: '456 Rizal Ave, Quezon City', barangay: 'Tandang Sora', landmarks: 'Behind SM Fairview' },
    { name: 'Pedro Garcia', phone: '09201112222', address: '789 EDSA, Pasig', barangay: 'Kapitolyo', landmarks: 'Across Ace Hardware' },
    { name: 'Ana Reyes', phone: '09163334444', address: '321 Ayala Ave, BGC', barangay: 'Forbes Park', landmarks: 'Near Petron Gas Station' },
    { name: 'Carlos Mendoza', phone: '09175556666', address: '555 Commonwealth Ave, QC', barangay: 'Batasan Hills', landmarks: 'Beside Jollibee' },
    { name: 'Sofia Cruz', phone: '09187778888', address: '777 Shaw Blvd, Mandaluyong', barangay: 'Pleasant Hills', landmarks: 'Near Starmall' },
    { name: 'Roberto Villanueva', phone: '09199990000', address: '888 Ortigas Ave, Pasig', barangay: 'San Antonio', landmarks: 'Across Robinson Metro East' },
    { name: 'Elena Fernandez', phone: '09161231234', address: '999 C5 Road, Taguig', barangay: 'Signal Village', landmarks: 'Near Gate 1' },
    { name: 'Miguel Tan', phone: '09174564567', address: '111 Macapagal Blvd, Pasay', barangay: 'Baclaran', landmarks: 'Near MOA' },
    { name: 'Patricia Lim', phone: '09187897890', address: '222 Taft Ave, Manila', barangay: 'Ermita', landmarks: 'Near De La Salle University' },
    { name: 'Antonio Bautista', phone: '09203213210', address: '333 Espana Blvd, Manila', barangay: 'Sampaloc', landmarks: 'Near UST' },
    { name: 'Rosa Gonzales', phone: '09176546543', address: '444 Aurora Blvd, QC', barangay: 'Project 4', landmarks: 'Behind Gateway Mall' },
    { name: 'Fernando Castro', phone: '09189879876', address: '555 Quirino Hwy, QC', barangay: 'Novaliches', landmarks: 'Near SM Nova' },
    { name: 'Carmen Aquino', phone: '09161011010', address: '666 Congressional Ave, QC', barangay: 'Project 8', landmarks: 'Near Savemore' },
    { name: 'Ricardo Torres', phone: '09172022020', address: '777 Mindanao Ave, QC', barangay: 'Talipapa', landmarks: 'Near Puregold' },
  ];

  // Order statuses to create variety
  const orderStatuses = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'rejected'];

  // Get all users for audit trail
  const allUsers = await prisma.user.findMany();

  console.log('🔄 Creating orders...');

  // Create 50 orders with varying data
  for (let i = 0; i < 50; i++) {
    const customer = randomItem(customers);
    const orderDate = randomDate(60); // Within last 60 days
    const status = randomItem(orderStatuses);
    
    // Random number of items per order (1-6)
    const numItems = randomInt(1, 6);
    const selectedProducts = [];
    const usedProductIds = new Set();
    
    for (let j = 0; j < numItems; j++) {
      let product;
      do {
        product = randomItem(allProducts);
      } while (usedProductIds.has(product.id));
      usedProductIds.add(product.id);
      
      const quantity = randomInt(1, 10);
      selectedProducts.push({
        productId: product.id,
        quantity,
        unitPrice: product.price,
        subtotal: quantity * product.price,
      });
    }
    
    const totalAmount = selectedProducts.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: customer.name,
        phone: customer.phone,
        address: customer.address,
        barangay: customer.barangay,
        landmarks: customer.landmarks,
        status,
        totalAmount,
        notes: randomInt(1, 3) === 1 ? 'Please call before delivery' : null,
        createdAt: orderDate,
        items: {
          create: selectedProducts,
        },
      },
    });

    // Create status history based on current status
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

    const flow = statusFlow[status];
    let prevStatus = null;
    let historyDate = new Date(orderDate);

    for (const flowStatus of flow) {
      historyDate = new Date(historyDate.getTime() + randomInt(30, 180) * 60000); // Add 30-180 minutes
      
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: prevStatus,
          toStatus: flowStatus,
          changedById: randomItem(allUsers).id,
          notes: flowStatus === 'rejected' ? 'Out of stock items' : 
                 flowStatus === 'cancelled' ? 'Customer requested cancellation' : null,
          createdAt: historyDate,
        },
      });
      prevStatus = flowStatus;
    }
  }

  console.log('✅ Orders created: 50 orders with items and status history');

  // Create some SMS logs
  const recentOrders = await prisma.order.findMany({
    take: 30,
    orderBy: { createdAt: 'desc' },
  });

  for (const order of recentOrders) {
    await prisma.smsLog.create({
      data: {
        orderId: order.id,
        phone: order.phone,
        message: `Your order ${order.orderNumber} status: ${order.status}`,
        status: randomItem(['sent', 'sent', 'sent', 'failed']),
        sentAt: new Date(),
      },
    });
  }
  console.log('✅ SMS logs created for recent orders');

  // Summary
  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    statusHistory: await prisma.orderStatusHistory.count(),
    smsLogs: await prisma.smsLog.count(),
  };

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📊 Database Summary:');
  console.log('   Users:', counts.users);
  console.log('   Categories:', counts.categories);
  console.log('   Products:', counts.products);
  console.log('   Orders:', counts.orders);
  console.log('   Order Items:', counts.orderItems);
  console.log('   Status History Records:', counts.statusHistory);
  console.log('   SMS Logs:', counts.smsLogs);
  console.log('\n📝 Login credentials:');
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
