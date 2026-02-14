const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── CLEAR ALL EXISTING DATA ──────────────────────────────────────
  console.log('🗑️  Clearing existing data...');
  await prisma.orderStatusHistory.deleteMany();
  await prisma.smsLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.savedAddress.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.bulkPricingTier.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ All existing data cleared');

  // ─── ADMIN USER ───────────────────────────────────────────────────
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

  // ─── CATEGORIES ───────────────────────────────────────────────────
  const categoriesData = [
    { name: 'Steel & Metal', description: 'Steel bars, angle bars, flat bars, tubular bars, and metal structural components', icon: '🔩' },
    { name: 'Lumber & Wood', description: 'Coco lumber, good lumber, KD wood, plywood, and phenolic boards', icon: '🪵' },
    { name: 'Roofing & Ceiling', description: 'Longspan roofing, metal furring, metal studs, purlins, and ceiling accessories', icon: '🏠' },
    { name: 'Cement & Masonry', description: 'Cement, hollow blocks, sand, gravel, and masonry supplies', icon: '🧱' },
    { name: 'Plumbing', description: 'PVC pipes, PPR pipes, fittings, traps, and plumbing accessories', icon: '🚿' },
    { name: 'Electrical', description: 'Wires, circuit breakers, electrical pipes, and electrical accessories', icon: '⚡' },
    { name: 'Paint & Coatings', description: 'Paints, primers, thinners, sealers, and coating products', icon: '🎨' },
    { name: 'Fasteners & Nails', description: 'Screws, nails, teks screws, tox, wire clips, and fastening hardware', icon: '📌' },
    { name: 'Tools', description: 'Hand tools, power tool accessories, and workshop equipment', icon: '🔧' },
    { name: 'Hardware & Accessories', description: 'Locks, welding supplies, wire brushes, and general hardware items', icon: '🔒' },
  ];

  for (const cat of categoriesData) {
    await prisma.category.create({ data: cat });
  }
  console.log(`✅ Categories created: ${categoriesData.length}`);

  // Get category IDs
  const categoryMap = {};
  const allCategories = await prisma.category.findMany();
  allCategories.forEach(cat => { categoryMap[cat.name] = cat.id; });

  // ─── PRODUCT IMAGE MAPPING ─────────────────────────────────────────
  const productImages = {
    'Angle Bar': '/uploads/angle-bar.jpg',
    'Deformed Bar G33': '/uploads/deformed-bar-g33.jpg',
    'Deformed Bar G40': '/uploads/deformed-bar-g40.jpg',
    'Flat Bar': '/uploads/flat-bar.jpg',
    'C-Purlins GI': '/uploads/c-purlins-gi.jpg',
    'Tubular Bar GI': '/uploads/tubular-bar-gi.jpg',
    'G.I Pipe Local S20': '/uploads/g.i-pipe-local-s20.jpg',
    'Coco Lumber': '/uploads/coco-lumber.jpg',
    'Good Lumber S4S': '/uploads/good-lumber-s4s.jpg',
    'KD S4S Wood PL': '/uploads/kd-s4s-wood-pl.jpg',
    'Marine Plywood Local': '/uploads/marine-plywood-local.jpg',
    'Plywood Ordinary': '/uploads/plywood-ordinary.jpg',
    'Phenolic Board 1/2 Croco': '/uploads/phenolic-board-one-half-croco.jpg',
    'Phenolic Board 18mm': '/uploads/phenolic-board-18mm.jpg',
    'Longspan RIB22': '/uploads/longspan-rib22.png',
    'Metal Furring': '/uploads/metal-furring.jpg',
    'Metal Studs': '/uploads/metal-studs.png',
    'Carrying Channel': '/uploads/carrying-channel.jpg',
    'Shadow Line': '/uploads/shadow-line.jpg',
    'Eagle Cement Advance': '/uploads/eagle-cement-advance.jpg',
    'Republic Cement': '/uploads/republic-cement.jpg',
    'Concrete Hollow Block': '/uploads/concrete-hollow-block.jpg',
    'Bistay per Sack': '/uploads/bistay-per-sack.jpg',
    'White Sand': '/uploads/white-sand.jpg',
    'Gravel 3/4': '/uploads/gravel-three-fourth.jpg',
    'Neltex PPR PVC Pipe': '/uploads/neltex-ppr-pvc-pipe.jpg',
    'Neltex Sanitary PVC Pipe S600': '/uploads/neltex-sanitary-pvc-pipe-s600.jpg',
    'Neltex PVC Sanitary P-Trap': '/uploads/neltex-pvc-sanitary-p-trap.jpg',
    'Lucky PPR Elbow Female 1/2': '/uploads/lucky-ppr-elbow-female-one-half.jpg',
    'Royu THHN Wire 8.0mm': '/uploads/royu-thhn-wire-8.0mm.jpg',
    'Circuit Breaker Bolt-On': '/uploads/circuit-breaker-bolt-on.jpg',
    'Neltex Electrical Pipe Thickwall 1/2"': '/uploads/neltex-electrical-pipe-thickwall-one-half.jpg',
    'Neltex Electrical Pipe Thinwall': '/uploads/neltex-electrical-pipe-thinwall.jpg',
    'Boysen Lacquer Thinner B50': '/uploads/boysen-lacquer-thinner-b50.jpg',
    'Boysen Permacoat Flat Latex White': '/uploads/boysen-permacoat-flat-latex-white.jpg',
    'Novtek Concrete Sealer 4 Liters': '/uploads/novtek-concrete-sealer-4-liters.jpg',
    'Gardner': '/uploads/gardener.png',
    'Black Screw Metal': '/uploads/black-screw-metal.jpg',
    'Black Screw Pointed': '/uploads/black-screw-pointed.jpg',
    'Common Wire Nail': '/uploads/common-wire-nail.jpg',
    'Concrete Nail': '/uploads/concrete-nail.jpg',
    'Hardiflex Screw 1"': '/uploads/hardiflex-screw-1.jpg',
    'Tekscrew': '/uploads/tekscrew.jpg',
    'Tox': '/uploads/tox.jpg',
    'W-Clip': '/uploads/w-clip.jpg',
    'Wood Screw Flat Head': '/uploads/wood-screw-flat-head.jpg',
    'GI Wire #16': '/uploads/gi-wire-16.jpg',
    'Adjustable Hacksaw': '/uploads/adjustable-hacksaw.jpg',
    'Claw Hammer Wood Handle': '/uploads/claw-hammer-wood-handle.jpg',
    'Twisted Wire Cup Brush 4"': '/uploads/twisted-wire-cup-brush-4.jpg',
    'Camel Drawer Lock': '/uploads/camel-drawer-lock.jpg',
    'Nihonweld Welding Rod N6013': '/uploads/nihonweld-welding-rod-n6013.jpg',
  };

  // ─── HELPER: CREATE PRODUCT WITH OPTIONAL VARIANTS ────────────────
  let productCount = 0;
  let variantCount = 0;

  async function createProduct(data) {
    const { variants, ...productData } = data;
    const hasVariants = variants && variants.length > 0;

    // Auto-assign image URL from the mapping
    if (!productData.imageUrl && productImages[productData.name]) {
      productData.imageUrl = productImages[productData.name];
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        hasVariants,
        stockQuantity: hasVariants ? 0 : productData.stockQuantity,
      },
    });

    if (hasVariants) {
      for (const variant of variants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            stockQuantity: variant.stockQuantity,
            isAvailable: true,
          },
        });
        variantCount++;
      }
    }
    productCount++;
    return product;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRODUCTS — 53 real hardware store products
  // ═══════════════════════════════════════════════════════════════════

  // ─── 1. STEEL & METAL ─────────────────────────────────────────────

  // #2 – Angle Bar (₱295–₱7,467)
  await createProduct({
    name: 'Angle Bar',
    description: 'Hot-rolled steel angle bar for structural framing, bracing, and fabrication. Available in various sizes.',
    price: 295.00,
    unit: 'piece',
    sku: 'STL-ANGLE',
    categoryId: categoryMap['Steel & Metal'],
    lowStockThreshold: 10,
    stockQuantity: 0,
    variants: [
      { name: '1" x 1" x 2mm (20ft)', sku: 'STL-ANGLE-1X1', price: 295.00, stockQuantity: 40 },
      { name: '1.5" x 1.5" x 3mm (20ft)', sku: 'STL-ANGLE-15X15', price: 650.00, stockQuantity: 30 },
      { name: '2" x 2" x 3mm (20ft)', sku: 'STL-ANGLE-2X2', price: 1250.00, stockQuantity: 25 },
      { name: '2" x 2" x 5mm (20ft)', sku: 'STL-ANGLE-2X2-5', price: 2100.00, stockQuantity: 15 },
      { name: '3" x 3" x 5mm (20ft)', sku: 'STL-ANGLE-3X3', price: 4500.00, stockQuantity: 10 },
      { name: '4" x 4" x 6mm (20ft)', sku: 'STL-ANGLE-4X4', price: 7467.00, stockQuantity: 5 },
    ],
  });

  // #17 – Deformed Bar G33 (₱80–₱598)
  await createProduct({
    name: 'Deformed Bar G33',
    description: 'Grade 33 deformed reinforcing steel bar for light structural work and residential construction.',
    price: 80.00,
    unit: 'piece',
    sku: 'STL-DBAR-G33',
    categoryId: categoryMap['Steel & Metal'],
    lowStockThreshold: 15,
    stockQuantity: 0,
    variants: [
      { name: '10mm (6m)', sku: 'STL-DBAR-G33-10', price: 80.00, stockQuantity: 100 },
      { name: '12mm (6m)', sku: 'STL-DBAR-G33-12', price: 135.00, stockQuantity: 80 },
      { name: '16mm (6m)', sku: 'STL-DBAR-G33-16', price: 260.00, stockQuantity: 50 },
      { name: '20mm (6m)', sku: 'STL-DBAR-G33-20', price: 420.00, stockQuantity: 30 },
      { name: '25mm (6m)', sku: 'STL-DBAR-G33-25', price: 598.00, stockQuantity: 20 },
    ],
  });

  // #18 – Deformed Bar G40 (₱180–₱675)
  await createProduct({
    name: 'Deformed Bar G40',
    description: 'Grade 40 deformed reinforcing steel bar for heavy structural work and commercial construction.',
    price: 180.00,
    unit: 'piece',
    sku: 'STL-DBAR-G40',
    categoryId: categoryMap['Steel & Metal'],
    lowStockThreshold: 15,
    stockQuantity: 0,
    variants: [
      { name: '10mm (6m)', sku: 'STL-DBAR-G40-10', price: 180.00, stockQuantity: 80 },
      { name: '12mm (6m)', sku: 'STL-DBAR-G40-12', price: 250.00, stockQuantity: 60 },
      { name: '16mm (6m)', sku: 'STL-DBAR-G40-16', price: 400.00, stockQuantity: 40 },
      { name: '20mm (6m)', sku: 'STL-DBAR-G40-20', price: 540.00, stockQuantity: 25 },
      { name: '25mm (6m)', sku: 'STL-DBAR-G40-25', price: 675.00, stockQuantity: 15 },
    ],
  });

  // #21 – Flat Bar (₱0–₱3,060 → using realistic lower bound)
  await createProduct({
    name: 'Flat Bar',
    description: 'Mild steel flat bar for fabrication, brackets, and general metalwork. Available in various widths and thicknesses.',
    price: 120.00,
    unit: 'piece',
    sku: 'STL-FLAT',
    categoryId: categoryMap['Steel & Metal'],
    lowStockThreshold: 10,
    stockQuantity: 0,
    variants: [
      { name: '1" x 3mm (20ft)', sku: 'STL-FLAT-1X3', price: 120.00, stockQuantity: 35 },
      { name: '1.5" x 3mm (20ft)', sku: 'STL-FLAT-15X3', price: 250.00, stockQuantity: 30 },
      { name: '2" x 5mm (20ft)', sku: 'STL-FLAT-2X5', price: 680.00, stockQuantity: 20 },
      { name: '3" x 5mm (20ft)', sku: 'STL-FLAT-3X5', price: 1450.00, stockQuantity: 15 },
      { name: '4" x 6mm (20ft)', sku: 'STL-FLAT-4X6', price: 3060.00, stockQuantity: 8 },
    ],
  });

  // #8 – C-Purlins GI (₱554–₱1,060)
  await createProduct({
    name: 'C-Purlins GI',
    description: 'Galvanized C-purlins for roof and wall framing. Lightweight yet strong structural support.',
    price: 554.00,
    unit: 'piece',
    sku: 'STL-CPURL',
    categoryId: categoryMap['Steel & Metal'],
    lowStockThreshold: 10,
    stockQuantity: 0,
    variants: [
      { name: '2" x 3" x 1.0mm (20ft)', sku: 'STL-CPURL-2X3-10', price: 554.00, stockQuantity: 30 },
      { name: '2" x 3" x 1.2mm (20ft)', sku: 'STL-CPURL-2X3-12', price: 680.00, stockQuantity: 25 },
      { name: '2" x 4" x 1.2mm (20ft)', sku: 'STL-CPURL-2X4-12', price: 820.00, stockQuantity: 20 },
      { name: '2" x 4" x 1.5mm (20ft)', sku: 'STL-CPURL-2X4-15', price: 1060.00, stockQuantity: 15 },
    ],
  });

  // #49 – Tubular Bar GI (₱254–₱2,247)
  await createProduct({
    name: 'Tubular Bar GI',
    description: 'Galvanized iron square tubular bar for fencing, gates, frames, and structural fabrication.',
    price: 254.00,
    unit: 'piece',
    sku: 'STL-TUBE-GI',
    categoryId: categoryMap['Steel & Metal'],
    lowStockThreshold: 8,
    stockQuantity: 0,
    variants: [
      { name: '1" x 1" x 1.0mm (20ft)', sku: 'STL-TUBE-1X1', price: 254.00, stockQuantity: 35 },
      { name: '1.5" x 1.5" x 1.2mm (20ft)', sku: 'STL-TUBE-15X15', price: 520.00, stockQuantity: 25 },
      { name: '2" x 2" x 1.5mm (20ft)', sku: 'STL-TUBE-2X2', price: 980.00, stockQuantity: 20 },
      { name: '2" x 3" x 1.5mm (20ft)', sku: 'STL-TUBE-2X3', price: 1450.00, stockQuantity: 15 },
      { name: '2" x 4" x 2.0mm (20ft)', sku: 'STL-TUBE-2X4', price: 2247.00, stockQuantity: 8 },
    ],
  });

  // #22 – G.I Pipe Local S20 (₱0–₱1,460 → using realistic range)
  await createProduct({
    name: 'G.I Pipe Local S20',
    description: 'Galvanized iron pipe Schedule 20 for plumbing, water supply, and light structural applications.',
    price: 180.00,
    unit: 'piece',
    sku: 'STL-GIPIPE-S20',
    categoryId: categoryMap['Steel & Metal'],
    lowStockThreshold: 10,
    stockQuantity: 0,
    variants: [
      { name: '1/2" (20ft)', sku: 'STL-GIPIPE-S20-05', price: 180.00, stockQuantity: 50 },
      { name: '3/4" (20ft)', sku: 'STL-GIPIPE-S20-075', price: 320.00, stockQuantity: 40 },
      { name: '1" (20ft)', sku: 'STL-GIPIPE-S20-1', price: 540.00, stockQuantity: 30 },
      { name: '1.5" (20ft)', sku: 'STL-GIPIPE-S20-15', price: 880.00, stockQuantity: 20 },
      { name: '2" (20ft)', sku: 'STL-GIPIPE-S20-2', price: 1460.00, stockQuantity: 12 },
    ],
  });

  // ─── 2. LUMBER & WOOD ─────────────────────────────────────────────

  // #13 – Coco Lumber (₱86–₱250)
  await createProduct({
    name: 'Coco Lumber',
    description: 'Coconut lumber for formwork, scaffolding, and light construction. Various sizes available.',
    price: 86.00,
    unit: 'piece',
    sku: 'WOOD-COCO',
    categoryId: categoryMap['Lumber & Wood'],
    lowStockThreshold: 20,
    stockQuantity: 0,
    variants: [
      { name: '2" x 2" x 10ft', sku: 'WOOD-COCO-2X2', price: 86.00, stockQuantity: 100 },
      { name: '2" x 3" x 10ft', sku: 'WOOD-COCO-2X3', price: 130.00, stockQuantity: 80 },
      { name: '2" x 4" x 10ft', sku: 'WOOD-COCO-2X4', price: 180.00, stockQuantity: 60 },
      { name: '2" x 6" x 10ft', sku: 'WOOD-COCO-2X6', price: 250.00, stockQuantity: 40 },
    ],
  });

  // #25 – Good Lumber S4S (₱56–₱2,142)
  await createProduct({
    name: 'Good Lumber S4S',
    description: 'Surfaced four sides (S4S) kiln-dried lumber for furniture, framing, and finish carpentry.',
    price: 56.00,
    unit: 'piece',
    sku: 'WOOD-S4S',
    categoryId: categoryMap['Lumber & Wood'],
    lowStockThreshold: 10,
    stockQuantity: 0,
    variants: [
      { name: '1" x 2" x 8ft', sku: 'WOOD-S4S-1X2', price: 56.00, stockQuantity: 80 },
      { name: '1" x 3" x 8ft', sku: 'WOOD-S4S-1X3', price: 120.00, stockQuantity: 60 },
      { name: '2" x 2" x 8ft', sku: 'WOOD-S4S-2X2', price: 210.00, stockQuantity: 50 },
      { name: '2" x 3" x 8ft', sku: 'WOOD-S4S-2X3', price: 380.00, stockQuantity: 40 },
      { name: '2" x 4" x 8ft', sku: 'WOOD-S4S-2X4', price: 580.00, stockQuantity: 30 },
      { name: '2" x 6" x 10ft', sku: 'WOOD-S4S-2X6', price: 1200.00, stockQuantity: 15 },
      { name: '4" x 4" x 10ft', sku: 'WOOD-S4S-4X4', price: 2142.00, stockQuantity: 8 },
    ],
  });

  // #28 – KD S4S Wood PL (₱212–₱331)
  await createProduct({
    name: 'KD S4S Wood PL',
    description: 'Kiln-dried S4S Philippine lumber. Premium quality for interior and exterior use.',
    price: 212.00,
    unit: 'piece',
    sku: 'WOOD-KD-S4S',
    categoryId: categoryMap['Lumber & Wood'],
    lowStockThreshold: 10,
    stockQuantity: 0,
    variants: [
      { name: '1" x 3" x 8ft', sku: 'WOOD-KD-1X3', price: 212.00, stockQuantity: 45 },
      { name: '1" x 4" x 8ft', sku: 'WOOD-KD-1X4', price: 265.00, stockQuantity: 35 },
      { name: '2" x 2" x 8ft', sku: 'WOOD-KD-2X2', price: 331.00, stockQuantity: 30 },
    ],
  });

  // #31 – Marine Plywood Local (₱488–₱1,747)
  await createProduct({
    name: 'Marine Plywood Local',
    description: 'High-quality local marine plywood. Water-resistant for exterior and wet-area applications. 4x8ft sheets.',
    price: 488.00,
    unit: 'sheet',
    sku: 'WOOD-MPLY',
    categoryId: categoryMap['Lumber & Wood'],
    lowStockThreshold: 5,
    stockQuantity: 0,
    variants: [
      { name: '1/4" (6mm)', sku: 'WOOD-MPLY-025', price: 488.00, stockQuantity: 30 },
      { name: '1/2" (12mm)', sku: 'WOOD-MPLY-050', price: 980.00, stockQuantity: 20 },
      { name: '3/4" (18mm)', sku: 'WOOD-MPLY-075', price: 1747.00, stockQuantity: 12 },
    ],
  });

  // #43 – Plywood Ordinary (₱295–₱985)
  await createProduct({
    name: 'Plywood Ordinary',
    description: 'Standard ordinary plywood for general construction, partitions, and formwork. 4x8ft sheets.',
    price: 295.00,
    unit: 'sheet',
    sku: 'WOOD-PLY-ORD',
    categoryId: categoryMap['Lumber & Wood'],
    lowStockThreshold: 5,
    stockQuantity: 0,
    variants: [
      { name: '1/4" (6mm)', sku: 'WOOD-PLY-ORD-025', price: 295.00, stockQuantity: 35 },
      { name: '1/2" (12mm)', sku: 'WOOD-PLY-ORD-050', price: 620.00, stockQuantity: 25 },
      { name: '3/4" (18mm)', sku: 'WOOD-PLY-ORD-075', price: 985.00, stockQuantity: 15 },
    ],
  });

  // #41 – Phenolic Board 1/2 Croco (single price)
  await createProduct({
    name: 'Phenolic Board 1/2 Croco',
    description: 'Phenolic board with croco (textured) finish, 1/2" thick. Ideal for concrete formwork. 4x8ft sheet.',
    price: 685.00,
    unit: 'sheet',
    sku: 'WOOD-PHEN-CROCO',
    categoryId: categoryMap['Lumber & Wood'],
    lowStockThreshold: 5,
    stockQuantity: 20,
  });

  // #42 – Phenolic Board 18mm (single price)
  await createProduct({
    name: 'Phenolic Board 18mm',
    description: 'Phenolic board 18mm thick. Smooth finish for high-quality concrete formwork. 4x8ft sheet.',
    price: 945.00,
    unit: 'sheet',
    sku: 'WOOD-PHEN-18',
    categoryId: categoryMap['Lumber & Wood'],
    lowStockThreshold: 5,
    stockQuantity: 15,
  });

  // ─── 3. ROOFING & CEILING ─────────────────────────────────────────

  // #29 – Longspan RIB22 (₱973–₱5,742)
  await createProduct({
    name: 'Longspan RIB22',
    description: 'Ribtype 22 (RIB22) longspan roofing sheets. Pre-painted galvanized steel. Available in various lengths.',
    price: 973.00,
    unit: 'sheet',
    sku: 'ROOF-LONG-R22',
    categoryId: categoryMap['Roofing & Ceiling'],
    lowStockThreshold: 5,
    stockQuantity: 0,
    variants: [
      { name: '8ft', sku: 'ROOF-LONG-R22-8', price: 973.00, stockQuantity: 30 },
      { name: '10ft', sku: 'ROOF-LONG-R22-10', price: 1216.00, stockQuantity: 25 },
      { name: '12ft', sku: 'ROOF-LONG-R22-12', price: 1460.00, stockQuantity: 20 },
      { name: '16ft', sku: 'ROOF-LONG-R22-16', price: 2920.00, stockQuantity: 15 },
      { name: '20ft', sku: 'ROOF-LONG-R22-20', price: 4380.00, stockQuantity: 10 },
      { name: '24ft', sku: 'ROOF-LONG-R22-24', price: 5742.00, stockQuantity: 5 },
    ],
  });

  // #32 – Metal Furring (₱115–₱135)
  await createProduct({
    name: 'Metal Furring',
    description: 'Galvanized metal furring channel for ceiling and wall installations.',
    price: 115.00,
    unit: 'piece',
    sku: 'ROOF-FURR',
    categoryId: categoryMap['Roofing & Ceiling'],
    lowStockThreshold: 20,
    stockQuantity: 0,
    variants: [
      { name: '19mm x 50mm (10ft)', sku: 'ROOF-FURR-19X50', price: 115.00, stockQuantity: 80 },
      { name: '25mm x 50mm (10ft)', sku: 'ROOF-FURR-25X50', price: 135.00, stockQuantity: 60 },
    ],
  });

  // #33 – Metal Studs (₱115–₱175)
  await createProduct({
    name: 'Metal Studs',
    description: 'Light gauge steel metal studs for drywall framing and partition walls.',
    price: 115.00,
    unit: 'piece',
    sku: 'ROOF-STUD',
    categoryId: categoryMap['Roofing & Ceiling'],
    lowStockThreshold: 20,
    stockQuantity: 0,
    variants: [
      { name: '50mm x 0.5mm (10ft)', sku: 'ROOF-STUD-50-05', price: 115.00, stockQuantity: 70 },
      { name: '65mm x 0.5mm (10ft)', sku: 'ROOF-STUD-65-05', price: 140.00, stockQuantity: 50 },
      { name: '65mm x 0.8mm (10ft)', sku: 'ROOF-STUD-65-08', price: 175.00, stockQuantity: 40 },
    ],
  });

  // #10 – Carrying Channel (₱95–₱130)
  await createProduct({
    name: 'Carrying Channel',
    description: 'Carrying channel for suspended ceiling grid systems.',
    price: 95.00,
    unit: 'piece',
    sku: 'ROOF-CARRY',
    categoryId: categoryMap['Roofing & Ceiling'],
    lowStockThreshold: 15,
    stockQuantity: 0,
    variants: [
      { name: 'Light Duty (10ft)', sku: 'ROOF-CARRY-LT', price: 95.00, stockQuantity: 60 },
      { name: 'Heavy Duty (10ft)', sku: 'ROOF-CARRY-HV', price: 130.00, stockQuantity: 40 },
    ],
  });

  // #46 – Shadow Line (₱120–₱150)
  await createProduct({
    name: 'Shadow Line',
    description: 'Shadow line molding for clean ceiling-to-wall transitions. Galvanized steel.',
    price: 120.00,
    unit: 'piece',
    sku: 'ROOF-SHADOW',
    categoryId: categoryMap['Roofing & Ceiling'],
    lowStockThreshold: 15,
    stockQuantity: 0,
    variants: [
      { name: 'Standard (10ft)', sku: 'ROOF-SHADOW-STD', price: 120.00, stockQuantity: 50 },
      { name: 'Wide (10ft)', sku: 'ROOF-SHADOW-WIDE', price: 150.00, stockQuantity: 35 },
    ],
  });

  // ─── 4. CEMENT & MASONRY ──────────────────────────────────────────

  // #19 – Eagle Cement Advance (single price)
  await createProduct({
    name: 'Eagle Cement Advance',
    description: 'Eagle Cement Advance 40kg bag. High early strength Portland cement for general construction.',
    price: 225.00,
    unit: 'bag',
    sku: 'CEM-EAGLE',
    categoryId: categoryMap['Cement & Masonry'],
    lowStockThreshold: 50,
    stockQuantity: 200,
  });

  // #44 – Republic Cement (single price)
  await createProduct({
    name: 'Republic Cement',
    description: 'Republic Cement 40kg bag. Premium Portland cement for structural and general construction.',
    price: 240.00,
    unit: 'bag',
    sku: 'CEM-REPUBLIC',
    categoryId: categoryMap['Cement & Masonry'],
    lowStockThreshold: 50,
    stockQuantity: 180,
  });

  // #15 – Concrete Hollow Block (₱19–₱24)
  await createProduct({
    name: 'Concrete Hollow Block',
    description: 'Standard concrete hollow blocks (CHB) for wall construction.',
    price: 19.00,
    unit: 'piece',
    sku: 'CEM-CHB',
    categoryId: categoryMap['Cement & Masonry'],
    lowStockThreshold: 100,
    stockQuantity: 0,
    variants: [
      { name: '4" CHB', sku: 'CEM-CHB-4', price: 19.00, stockQuantity: 500 },
      { name: '6" CHB', sku: 'CEM-CHB-6', price: 24.00, stockQuantity: 300 },
    ],
  });

  // #3 – Bistay per Sack (single price)
  await createProduct({
    name: 'Bistay per Sack',
    description: 'Bistay (crushed aggregate/sand mix) per sack for concrete mixing and masonry.',
    price: 35.00,
    unit: 'sack',
    sku: 'CEM-BISTAY',
    categoryId: categoryMap['Cement & Masonry'],
    lowStockThreshold: 30,
    stockQuantity: 150,
  });

  // #52 – White Sand (₱27–₱2,000)
  await createProduct({
    name: 'White Sand',
    description: 'Fine white sand for plastering, masonry, and finishing. Available per sack or per cubic meter.',
    price: 27.00,
    unit: 'sack',
    sku: 'CEM-WSAND',
    categoryId: categoryMap['Cement & Masonry'],
    lowStockThreshold: 20,
    stockQuantity: 0,
    variants: [
      { name: 'Per Sack', sku: 'CEM-WSAND-SACK', price: 27.00, stockQuantity: 200 },
      { name: 'Per Cubic Meter', sku: 'CEM-WSAND-CUM', price: 2000.00, stockQuantity: 10 },
    ],
  });

  // #26 – Gravel 3/4 (₱75–₱2,000)
  await createProduct({
    name: 'Gravel 3/4',
    description: '3/4" gravel aggregate for concrete mixing and drainage. Available per sack or per cubic meter.',
    price: 75.00,
    unit: 'sack',
    sku: 'CEM-GRAVEL',
    categoryId: categoryMap['Cement & Masonry'],
    lowStockThreshold: 20,
    stockQuantity: 0,
    variants: [
      { name: 'Per Sack', sku: 'CEM-GRAVEL-SACK', price: 75.00, stockQuantity: 150 },
      { name: 'Per Cubic Meter', sku: 'CEM-GRAVEL-CUM', price: 2000.00, stockQuantity: 8 },
    ],
  });

  // ─── 5. PLUMBING ──────────────────────────────────────────────────

  // #36 – Neltex PPR PVC Pipe (₱265–₱665)
  await createProduct({
    name: 'Neltex PPR PVC Pipe',
    description: 'Neltex PPR (Polypropylene Random) pipe for hot and cold water supply. High pressure rating.',
    price: 265.00,
    unit: 'piece',
    sku: 'PLB-NELTEX-PPR',
    categoryId: categoryMap['Plumbing'],
    lowStockThreshold: 10,
    stockQuantity: 0,
    variants: [
      { name: '1/2" (20mm) x 3m', sku: 'PLB-NPPR-05', price: 265.00, stockQuantity: 50 },
      { name: '3/4" (25mm) x 3m', sku: 'PLB-NPPR-075', price: 385.00, stockQuantity: 35 },
      { name: '1" (32mm) x 3m', sku: 'PLB-NPPR-1', price: 665.00, stockQuantity: 20 },
    ],
  });

  // #38 – Neltex Sanitary PVC Pipe S600 (₱364–₱875)
  await createProduct({
    name: 'Neltex Sanitary PVC Pipe S600',
    description: 'Neltex Series 600 sanitary PVC pipe for drainage and sewage systems.',
    price: 364.00,
    unit: 'piece',
    sku: 'PLB-NELTEX-S600',
    categoryId: categoryMap['Plumbing'],
    lowStockThreshold: 8,
    stockQuantity: 0,
    variants: [
      { name: '2" (3m)', sku: 'PLB-NS600-2', price: 364.00, stockQuantity: 40 },
      { name: '3" (3m)', sku: 'PLB-NS600-3', price: 560.00, stockQuantity: 30 },
      { name: '4" (3m)', sku: 'PLB-NS600-4', price: 875.00, stockQuantity: 20 },
    ],
  });

  // #37 – Neltex PVC Sanitary P-Trap (₱0–₱330 → realistic range)
  await createProduct({
    name: 'Neltex PVC Sanitary P-Trap',
    description: 'Neltex PVC sanitary P-trap fitting for drain connections. Prevents sewer gas backflow.',
    price: 85.00,
    unit: 'piece',
    sku: 'PLB-NELTEX-PTRAP',
    categoryId: categoryMap['Plumbing'],
    lowStockThreshold: 10,
    stockQuantity: 0,
    variants: [
      { name: '1-1/4"', sku: 'PLB-PTRAP-114', price: 85.00, stockQuantity: 30 },
      { name: '1-1/2"', sku: 'PLB-PTRAP-112', price: 120.00, stockQuantity: 25 },
      { name: '2"', sku: 'PLB-PTRAP-2', price: 195.00, stockQuantity: 20 },
      { name: '3"', sku: 'PLB-PTRAP-3', price: 330.00, stockQuantity: 15 },
    ],
  });

  // #30 – Lucky PPR Elbow Female 1/2 (single price)
  await createProduct({
    name: 'Lucky PPR Elbow Female 1/2',
    description: 'Lucky brand PPR female elbow fitting, 1/2" size. For PPR piping connections.',
    price: 102.00,
    unit: 'piece',
    sku: 'PLB-LUCKY-FELBOW',
    categoryId: categoryMap['Plumbing'],
    lowStockThreshold: 15,
    stockQuantity: 60,
  });

  // ─── 6. ELECTRICAL ────────────────────────────────────────────────

  // #45 – Royu THHN Wire 8.0mm (₱100–₱8,180)
  await createProduct({
    name: 'Royu THHN Wire 8.0mm',
    description: 'Royu THHN stranded copper wire 8.0mm² (AWG 8). For heavy-duty electrical circuits and sub-panels.',
    price: 100.00,
    unit: 'meter',
    sku: 'ELEC-ROYU-8',
    categoryId: categoryMap['Electrical'],
    lowStockThreshold: 10,
    stockQuantity: 0,
    variants: [
      { name: 'Per Meter', sku: 'ELEC-ROYU-8-M', price: 100.00, stockQuantity: 200 },
      { name: 'Per Box (75m)', sku: 'ELEC-ROYU-8-BOX', price: 8180.00, stockQuantity: 5 },
    ],
  });

  // #11 – Circuit Breaker Bolt-On (₱1,060–₱2,455)
  await createProduct({
    name: 'Circuit Breaker Bolt-On',
    description: 'Bolt-on type circuit breaker for panel board protection. Various ampere ratings available.',
    price: 1060.00,
    unit: 'piece',
    sku: 'ELEC-CB-BOLT',
    categoryId: categoryMap['Electrical'],
    lowStockThreshold: 5,
    stockQuantity: 0,
    variants: [
      { name: '15A', sku: 'ELEC-CB-BOLT-15', price: 1060.00, stockQuantity: 10 },
      { name: '20A', sku: 'ELEC-CB-BOLT-20', price: 1060.00, stockQuantity: 12 },
      { name: '30A', sku: 'ELEC-CB-BOLT-30', price: 1350.00, stockQuantity: 8 },
      { name: '60A', sku: 'ELEC-CB-BOLT-60', price: 1850.00, stockQuantity: 6 },
      { name: '100A', sku: 'ELEC-CB-BOLT-100', price: 2455.00, stockQuantity: 4 },
    ],
  });

  // #20 – Electrical Pipe Thickwall — REMOVED (overlaps with Neltex branded products #34 and #35)

  // #34 – Neltex Electrical Pipe Thickwall 1/2" (single price)
  await createProduct({
    name: 'Neltex Electrical Pipe Thickwall 1/2"',
    description: 'Neltex brand PVC electrical conduit pipe, thickwall type 1/2". Premium quality for concealed wiring.',
    price: 110.00,
    unit: 'piece',
    sku: 'ELEC-NELTEX-TK-05',
    categoryId: categoryMap['Electrical'],
    lowStockThreshold: 15,
    stockQuantity: 50,
  });

  // #35 – Neltex Electrical Pipe Thinwall (₱105–₱160)
  await createProduct({
    name: 'Neltex Electrical Pipe Thinwall',
    description: 'Neltex brand PVC electrical conduit pipe, thinwall type. For exposed and surface wiring.',
    price: 105.00,
    unit: 'piece',
    sku: 'ELEC-NELTEX-TN',
    categoryId: categoryMap['Electrical'],
    lowStockThreshold: 15,
    stockQuantity: 0,
    variants: [
      { name: '1/2" x 10ft', sku: 'ELEC-NELTEX-TN-05', price: 105.00, stockQuantity: 55 },
      { name: '3/4" x 10ft', sku: 'ELEC-NELTEX-TN-075', price: 135.00, stockQuantity: 40 },
      { name: '1" x 10ft', sku: 'ELEC-NELTEX-TN-1', price: 160.00, stockQuantity: 25 },
    ],
  });

  // ─── 7. PAINT & COATINGS ──────────────────────────────────────────

  // #6 – Boysen Lacquer Thinner B50 (₱0–₱2,278 → realistic range)
  await createProduct({
    name: 'Boysen Lacquer Thinner B50',
    description: 'Boysen Lacquer Thinner B-50. For thinning lacquer-based paints and cleaning spray equipment.',
    price: 95.00,
    unit: 'can',
    sku: 'PAINT-BOYSEN-B50',
    categoryId: categoryMap['Paint & Coatings'],
    lowStockThreshold: 10,
    stockQuantity: 0,
    variants: [
      { name: '1/4 Liter', sku: 'PAINT-B50-025', price: 95.00, stockQuantity: 40 },
      { name: '1 Liter', sku: 'PAINT-B50-1', price: 280.00, stockQuantity: 30 },
      { name: '4 Liters (Gallon)', sku: 'PAINT-B50-4', price: 830.00, stockQuantity: 20 },
      { name: '16 Liters (Pail)', sku: 'PAINT-B50-16', price: 2278.00, stockQuantity: 8 },
    ],
  });

  // #7 – Boysen Permacoat Flat Latex White (₱167–₱2,600)
  await createProduct({
    name: 'Boysen Permacoat Flat Latex White',
    description: 'Boysen Permacoat Flat Latex B-701 White. Premium acrylic latex paint for interior and exterior walls.',
    price: 167.00,
    unit: 'can',
    sku: 'PAINT-BOYSEN-B701',
    categoryId: categoryMap['Paint & Coatings'],
    lowStockThreshold: 8,
    stockQuantity: 0,
    variants: [
      { name: '1/4 Liter', sku: 'PAINT-B701-025', price: 167.00, stockQuantity: 35 },
      { name: '1 Liter', sku: 'PAINT-B701-1', price: 430.00, stockQuantity: 25 },
      { name: '4 Liters (Gallon)', sku: 'PAINT-B701-4', price: 1350.00, stockQuantity: 15 },
      { name: '16 Liters (Pail)', sku: 'PAINT-B701-16', price: 2600.00, stockQuantity: 6 },
    ],
  });

  // #40 – Novtek Concrete Sealer 4 Liters (single price)
  await createProduct({
    name: 'Novtek Concrete Sealer 4 Liters',
    description: 'Novtek Concrete Sealer 4-liter can. Acrylic-based sealer for concrete floors and surfaces.',
    price: 460.00,
    unit: 'can',
    sku: 'PAINT-NOVTEK-SEAL',
    categoryId: categoryMap['Paint & Coatings'],
    lowStockThreshold: 5,
    stockQuantity: 18,
  });

  // #23 – Gardner (₱385–₱1,375)
  await createProduct({
    name: 'Gardner',
    description: 'Gardner waterproofing and roof coating. Protects and seals roofs, gutters, and foundations.',
    price: 385.00,
    unit: 'can',
    sku: 'PAINT-GARDNER',
    categoryId: categoryMap['Paint & Coatings'],
    lowStockThreshold: 5,
    stockQuantity: 0,
    variants: [
      { name: '1 Liter', sku: 'PAINT-GARDNER-1', price: 385.00, stockQuantity: 20 },
      { name: '4 Liters (Gallon)', sku: 'PAINT-GARDNER-4', price: 1375.00, stockQuantity: 10 },
    ],
  });

  // ─── 8. FASTENERS & NAILS ─────────────────────────────────────────

  // #4 – Black Screw Metal (₱1–₱2)
  await createProduct({
    name: 'Black Screw Metal',
    description: 'Black oxide self-tapping screws for metal-to-metal fastening.',
    price: 1.00,
    unit: 'piece',
    sku: 'FAST-BSCREW-M',
    categoryId: categoryMap['Fasteners & Nails'],
    lowStockThreshold: 100,
    stockQuantity: 0,
    variants: [
      { name: '1" (#6)', sku: 'FAST-BSCREW-M-1', price: 1.00, stockQuantity: 1000 },
      { name: '1.5" (#8)', sku: 'FAST-BSCREW-M-15', price: 1.50, stockQuantity: 800 },
      { name: '2" (#8)', sku: 'FAST-BSCREW-M-2', price: 2.00, stockQuantity: 600 },
    ],
  });

  // #5 – Black Screw Pointed (single price)
  await createProduct({
    name: 'Black Screw Pointed',
    description: 'Black oxide pointed tip screws for drywall-to-wood fastening.',
    price: 1.00,
    unit: 'piece',
    sku: 'FAST-BSCREW-P',
    categoryId: categoryMap['Fasteners & Nails'],
    lowStockThreshold: 100,
    stockQuantity: 1500,
  });

  // #14 – Common Wire Nail (₱95–₱1,695)
  await createProduct({
    name: 'Common Wire Nail',
    description: 'Standard common wire nails for general construction and woodworking. Sold per kg.',
    price: 95.00,
    unit: 'kg',
    sku: 'FAST-CNAIL',
    categoryId: categoryMap['Fasteners & Nails'],
    lowStockThreshold: 15,
    stockQuantity: 0,
    variants: [
      { name: '1" per kg', sku: 'FAST-CNAIL-1', price: 95.00, stockQuantity: 50 },
      { name: '2" per kg', sku: 'FAST-CNAIL-2', price: 90.00, stockQuantity: 80 },
      { name: '3" per kg', sku: 'FAST-CNAIL-3', price: 88.00, stockQuantity: 70 },
      { name: '4" per kg', sku: 'FAST-CNAIL-4', price: 85.00, stockQuantity: 50 },
      { name: '25kg Box (assorted)', sku: 'FAST-CNAIL-BOX', price: 1695.00, stockQuantity: 10 },
    ],
  });

  // #16 – Concrete Nail (₱0–₱100 → realistic range)
  await createProduct({
    name: 'Concrete Nail',
    description: 'Hardened steel concrete nails for securing into concrete and masonry. Sold per kg.',
    price: 15.00,
    unit: 'kg',
    sku: 'FAST-CONC-NAIL',
    categoryId: categoryMap['Fasteners & Nails'],
    lowStockThreshold: 10,
    stockQuantity: 0,
    variants: [
      { name: '1" per kg', sku: 'FAST-CONC-1', price: 15.00, stockQuantity: 40 },
      { name: '1.5" per kg', sku: 'FAST-CONC-15', price: 40.00, stockQuantity: 50 },
      { name: '2" per kg', sku: 'FAST-CONC-2', price: 65.00, stockQuantity: 60 },
      { name: '3" per kg', sku: 'FAST-CONC-3', price: 100.00, stockQuantity: 35 },
    ],
  });

  // #27 – Hardiflex Screw 1" (single price)
  await createProduct({
    name: 'Hardiflex Screw 1"',
    description: 'Specialized screws for attaching Hardiflex (fiber cement board) to metal frames.',
    price: 1.00,
    unit: 'piece',
    sku: 'FAST-HARDIFLEX',
    categoryId: categoryMap['Fasteners & Nails'],
    lowStockThreshold: 200,
    stockQuantity: 2000,
  });

  // #47 – Tekscrew (₱2–₱3)
  await createProduct({
    name: 'Tekscrew',
    description: 'Self-drilling tek screws for roofing and metal-to-metal connections with EPDM washer.',
    price: 2.00,
    unit: 'piece',
    sku: 'FAST-TEKSCREW',
    categoryId: categoryMap['Fasteners & Nails'],
    lowStockThreshold: 100,
    stockQuantity: 0,
    variants: [
      { name: '1" (Tek #2)', sku: 'FAST-TEK-1', price: 2.00, stockQuantity: 800 },
      { name: '2" (Tek #3)', sku: 'FAST-TEK-2', price: 3.00, stockQuantity: 600 },
    ],
  });

  // #48 – Tox (₱3–₱35)
  await createProduct({
    name: 'Tox',
    description: 'Plastic wall anchors (tox/toggler) for mounting in hollow walls and concrete.',
    price: 3.00,
    unit: 'piece',
    sku: 'FAST-TOX',
    categoryId: categoryMap['Fasteners & Nails'],
    lowStockThreshold: 50,
    stockQuantity: 0,
    variants: [
      { name: 'Small (6mm)', sku: 'FAST-TOX-S', price: 3.00, stockQuantity: 500 },
      { name: 'Medium (8mm)', sku: 'FAST-TOX-M', price: 5.00, stockQuantity: 400 },
      { name: 'Large (10mm)', sku: 'FAST-TOX-L', price: 10.00, stockQuantity: 300 },
      { name: 'Extra Large (14mm)', sku: 'FAST-TOX-XL', price: 35.00, stockQuantity: 150 },
    ],
  });

  // #51 – W-Clip (single price) — ceiling accessory, belongs in Roofing & Ceiling
  await createProduct({
    name: 'W-Clip',
    description: 'W-clip connectors for joining carrying channels in suspended ceiling installations.',
    price: 5.00,
    unit: 'piece',
    sku: 'FAST-WCLIP',
    categoryId: categoryMap['Roofing & Ceiling'],
    lowStockThreshold: 50,
    stockQuantity: 500,
  });

  // #53 – Wood Screw Flat Head (₱1–₱10)
  await createProduct({
    name: 'Wood Screw Flat Head',
    description: 'Flat head wood screws for woodworking and general carpentry.',
    price: 1.00,
    unit: 'piece',
    sku: 'FAST-WSCREW',
    categoryId: categoryMap['Fasteners & Nails'],
    lowStockThreshold: 100,
    stockQuantity: 0,
    variants: [
      { name: '1" (#6)', sku: 'FAST-WSCREW-1', price: 1.00, stockQuantity: 800 },
      { name: '1.5" (#8)', sku: 'FAST-WSCREW-15', price: 2.00, stockQuantity: 700 },
      { name: '2" (#10)', sku: 'FAST-WSCREW-2', price: 3.50, stockQuantity: 600 },
      { name: '3" (#12)', sku: 'FAST-WSCREW-3', price: 7.00, stockQuantity: 400 },
      { name: '4" (#14)', sku: 'FAST-WSCREW-4', price: 10.00, stockQuantity: 250 },
    ],
  });

  // #24 – GI Wire #16 (₱85–₱1,050) — steel/iron product, belongs in Steel & Metal
  await createProduct({
    name: 'GI Wire #16',
    description: 'Galvanized iron tie wire gauge 16. For tying rebar, general construction binding.',
    price: 85.00,
    unit: 'kg',
    sku: 'FAST-GIWIRE',
    categoryId: categoryMap['Steel & Metal'],
    lowStockThreshold: 10,
    stockQuantity: 0,
    variants: [
      { name: 'Per Kilo', sku: 'FAST-GIWIRE-KG', price: 85.00, stockQuantity: 60 },
      { name: 'Per Roll (10kg)', sku: 'FAST-GIWIRE-ROLL10', price: 720.00, stockQuantity: 15 },
      { name: 'Per Roll (15kg)', sku: 'FAST-GIWIRE-ROLL15', price: 1050.00, stockQuantity: 8 },
    ],
  });

  // ─── 9. TOOLS ─────────────────────────────────────────────────────

  // #1 – Adjustable Hacksaw (single price)
  await createProduct({
    name: 'Adjustable Hacksaw',
    description: 'Adjustable hacksaw frame with 12" blade. Cuts metal, PVC, and other materials.',
    price: 112.00,
    unit: 'piece',
    sku: 'TOOL-HACKSAW',
    categoryId: categoryMap['Tools'],
    lowStockThreshold: 5,
    stockQuantity: 25,
  });

  // #12 – Claw Hammer Wood Handle (single price)
  await createProduct({
    name: 'Claw Hammer Wood Handle',
    description: 'Standard claw hammer with hardwood handle. For driving and removing nails.',
    price: 190.00,
    unit: 'piece',
    sku: 'TOOL-HAMMER',
    categoryId: categoryMap['Tools'],
    lowStockThreshold: 5,
    stockQuantity: 30,
  });

  // #50 – Twisted Wire Cup Brush 4" (single price)
  await createProduct({
    name: 'Twisted Wire Cup Brush 4"',
    description: '4" twisted wire cup brush for angle grinders. Removes rust, paint, and scale.',
    price: 120.00,
    unit: 'piece',
    sku: 'TOOL-CUPBRUSH',
    categoryId: categoryMap['Tools'],
    lowStockThreshold: 5,
    stockQuantity: 20,
  });

  // ─── 10. HARDWARE & ACCESSORIES ───────────────────────────────────

  // #9 – Camel Drawer Lock (single price)
  await createProduct({
    name: 'Camel Drawer Lock',
    description: 'Camel brand drawer lock for cabinets and drawers. Comes with 2 keys.',
    price: 78.00,
    unit: 'piece',
    sku: 'HW-CAMEL-LOCK',
    categoryId: categoryMap['Hardware & Accessories'],
    lowStockThreshold: 10,
    stockQuantity: 40,
  });

  // #39 – Nihonweld Welding Rod N6013 (₱165–₱616)
  await createProduct({
    name: 'Nihonweld Welding Rod N6013',
    description: 'Nihonweld N6013 general purpose welding electrode. Mild steel. Good for all-position welding.',
    price: 165.00,
    unit: 'kg',
    sku: 'HW-NIHON-6013',
    categoryId: categoryMap['Hardware & Accessories'],
    lowStockThreshold: 5,
    stockQuantity: 0,
    variants: [
      { name: '1/8" (3.2mm) per kg', sku: 'HW-NIHON-6013-18', price: 165.00, stockQuantity: 30 },
      { name: '5/32" (4.0mm) per kg', sku: 'HW-NIHON-6013-532', price: 175.00, stockQuantity: 25 },
      { name: '1/8" (3.2mm) 5kg pack', sku: 'HW-NIHON-6013-5KG', price: 616.00, stockQuantity: 10 },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n✅ Products created: ${productCount}`);
  console.log(`✅ Product variants created: ${variantCount}`);
  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Default login credentials:');
  console.log('   Admin: username="admin", password="admin123"');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
