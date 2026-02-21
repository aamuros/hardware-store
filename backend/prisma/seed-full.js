const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ─── COPY SEED IMAGES TO UPLOADS ──────────────────────────────────
// Ensures all seed-referenced images exist in backend/uploads/
// regardless of which branch or device the code is cloned on.
function copySeedImages() {
  const uploadsDir = path.resolve(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  let copied = 0;

  // 1. Copy category SVG icons from seed-images/categories/ (always overwrite to keep built-in icons current)
  const categorySeedDir = path.resolve(__dirname, 'seed-images', 'categories');
  if (fs.existsSync(categorySeedDir)) {
    const categoryFiles = fs.readdirSync(categorySeedDir);
    for (const file of categoryFiles) {
      const src = path.join(categorySeedDir, file);
      const dest = path.join(uploadsDir, file);
      fs.copyFileSync(src, dest);
      copied++;
    }
  }

  // 2. Copy extra product images from seed-images/products/
  const productSeedDir = path.resolve(__dirname, 'seed-images', 'products');
  if (fs.existsSync(productSeedDir)) {
    const productSeedFiles = fs.readdirSync(productSeedDir);
    for (const file of productSeedFiles) {
      const src = path.join(productSeedDir, file);
      const dest = path.join(uploadsDir, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        copied++;
      }
    }
  }

  return copied;
}

// Category-to-image mapping used during seeding and image-url patching
const CATEGORY_IMAGE_MAP = {
  'Steel & Metal': '/uploads/steel-metal.svg',
  'Lumber & Wood': '/uploads/lumber-wood.svg',
  'Roofing & Ceiling': '/uploads/roofing-ceiling.svg',
  'Cement & Masonry': '/uploads/cement-masonry.svg',
  'Plumbing': '/uploads/plumbing.svg',
  'Electrical': '/uploads/electrical.svg',
  'Paint & Coatings': '/uploads/paint-coatings.svg',
  'Fasteners & Nails': '/uploads/fasteners-nails.svg',
  'Tools': '/uploads/tools.svg',
  'Hardware & Accessories': '/uploads/hardware-accessories.svg',
};

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── COPY SEED IMAGES TO UPLOADS ────────────────────────────────
  const copiedImages = copySeedImages();
  if (copiedImages > 0) {
    console.log(`📸 Copied ${copiedImages} seed images to uploads/`);
  } else {
    console.log('📸 All seed images already in uploads/');
  }

  // ─── ENSURE CATEGORY IMAGES ARE SET ─────────────────────────────
  // Always patch category imageUrl so icons appear even on existing DBs
  const existingCategories = await prisma.category.findMany();
  let patched = 0;
  for (const cat of existingCategories) {
    const expectedUrl = CATEGORY_IMAGE_MAP[cat.name];
    if (expectedUrl && cat.imageUrl !== expectedUrl) {
      await prisma.category.update({ where: { id: cat.id }, data: { imageUrl: expectedUrl } });
      patched++;
    }
  }
  if (patched > 0) {
    console.log(`🖼️  Patched imageUrl for ${patched} categories`);
  }

  // ─── IDEMPOTENCY CHECK ────────────────────────────────────────────
  // Skip seeding if products already exist. This protects production data
  // on Railway redeployments — seed only runs once on a fresh database.
  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log(`ℹ️  Database already has ${existingProducts} products — skipping full seed.`);
    const [users, categories, orders] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.order.count(),
    ]);
    console.log(`\n📊 Current database:`);
    console.log(`   Users: ${users}, Categories: ${categories}, Products: ${existingProducts}, Orders: ${orders}`);
    return;
  }

  // ─── CLEAR ANY PARTIAL DATA ───────────────────────────────────────
  console.log('🗑️  Clearing any partial existing data...');
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
  console.log('✅ Existing data cleared');

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
    { name: 'Steel & Metal', description: 'Steel bars, angle bars, flat bars, tubular bars, and metal structural components', icon: '🔩', imageUrl: CATEGORY_IMAGE_MAP['Steel & Metal'] },
    { name: 'Lumber & Wood', description: 'Coco lumber, good lumber, KD wood, plywood, and phenolic boards', icon: '🪵', imageUrl: CATEGORY_IMAGE_MAP['Lumber & Wood'] },
    { name: 'Roofing & Ceiling', description: 'Longspan roofing, metal furring, metal studs, purlins, and ceiling accessories', icon: '🏠', imageUrl: CATEGORY_IMAGE_MAP['Roofing & Ceiling'] },
    { name: 'Cement & Masonry', description: 'Cement, hollow blocks, sand, gravel, and masonry supplies', icon: '🧱', imageUrl: CATEGORY_IMAGE_MAP['Cement & Masonry'] },
    { name: 'Plumbing', description: 'PVC pipes, PPR pipes, fittings, traps, and plumbing accessories', icon: '🚿', imageUrl: CATEGORY_IMAGE_MAP['Plumbing'] },
    { name: 'Electrical', description: 'Wires, circuit breakers, electrical pipes, and electrical accessories', icon: '⚡', imageUrl: CATEGORY_IMAGE_MAP['Electrical'] },
    { name: 'Paint & Coatings', description: 'Paints, primers, thinners, sealers, and coating products', icon: '🎨', imageUrl: CATEGORY_IMAGE_MAP['Paint & Coatings'] },
    { name: 'Fasteners & Nails', description: 'Screws, nails, teks screws, tox, wire clips, and fastening hardware', icon: '📌', imageUrl: CATEGORY_IMAGE_MAP['Fasteners & Nails'] },
    { name: 'Tools', description: 'Hand tools, power tool accessories, and workshop equipment', icon: '🔧', imageUrl: CATEGORY_IMAGE_MAP['Tools'] },
    { name: 'Hardware & Accessories', description: 'Locks, welding supplies, wire brushes, and general hardware items', icon: '🔒', imageUrl: CATEGORY_IMAGE_MAP['Hardware & Accessories'] },
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
    'Deformed Bar G40': '/uploads/deformed-bar-g40.jpg',
    'Flat Bar': '/uploads/flat-bar.jpg',
    'C-Purlins GI': '/uploads/c-purlins-gi.jpg',
    'Tubular Bar GI': '/uploads/tubular-bar-gi.jpg',
    'G.I Pipe Local S20': '/uploads/g.i-pipe-local-s20.jpg',
    'Coco Lumber': '/uploads/coco-lumber.jpg',
    'Good Lumber S4S': '/uploads/good-lumber-s4s.jpg',
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

  // ═══════════════════════════════════════════════════════════════════
  // STAFF USERS — additional staff for order processing
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔄 Creating staff users...');
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staffList = [
    { username: 'juan_staff', name: 'Juan dela Cruz', role: 'staff' },
    { username: 'maria_staff', name: 'Maria Santos', role: 'staff' },
    { username: 'pedro_staff', name: 'Pedro Garcia', role: 'staff' },
    { username: 'ana_staff', name: 'Ana Reyes', role: 'staff' },
    { username: 'carlos_mgr', name: 'Carlos Mendoza', role: 'admin' },
  ];
  for (const s of staffList) {
    await prisma.user.create({ data: { ...s, password: staffPassword } });
  }
  console.log(`✅ Staff users created: ${staffList.length}`);

  // ═══════════════════════════════════════════════════════════════════
  // CUSTOMERS — 80 realistic customer accounts (happy customer base)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔄 Creating customer accounts...');
  const customerPassword = await bcrypt.hash('customer123', 10);

  const customerDataList = [
    // ── Regular homeowners ──
    { email: 'juan.delacruz@gmail.com', name: 'Juan dela Cruz', phone: '09171234567' },
    { email: 'maria.santos@yahoo.com', name: 'Maria Santos', phone: '09189876543' },
    { email: 'pedro.garcia@gmail.com', name: 'Pedro Garcia', phone: '09201112222' },
    { email: 'ana.reyes@outlook.com', name: 'Ana Reyes', phone: '09163334444' },
    { email: 'carlos.mendoza@gmail.com', name: 'Carlos Mendoza', phone: '09175556666' },
    { email: 'sofia.cruz@yahoo.com', name: 'Sofia Cruz', phone: '09187778888' },
    { email: 'roberto.villanueva@gmail.com', name: 'Roberto Villanueva', phone: '09199990000' },
    { email: 'elena.fernandez@gmail.com', name: 'Elena Fernandez', phone: '09161231234' },
    { email: 'miguel.tan@outlook.com', name: 'Miguel Tan', phone: '09174564567' },
    { email: 'patricia.lim@gmail.com', name: 'Patricia Lim', phone: '09187897890' },
    { email: 'antonio.bautista@yahoo.com', name: 'Antonio Bautista', phone: '09203213210' },
    { email: 'rosa.gonzales@gmail.com', name: 'Rosa Gonzales', phone: '09176546543' },
    { email: 'fernando.castro@gmail.com', name: 'Fernando Castro', phone: '09189879876' },
    { email: 'carmen.aquino@yahoo.com', name: 'Carmen Aquino', phone: '09161011010' },
    { email: 'ricardo.torres@gmail.com', name: 'Ricardo Torres', phone: '09172022020' },
    // ── Contractors / repeat buyers ──
    { email: 'jenny.lozano@gmail.com', name: 'Jenny Lozano', phone: '09183033030' },
    { email: 'mark.ramos@outlook.com', name: 'Mark Ramos', phone: '09194044040' },
    { email: 'grace.dizon@gmail.com', name: 'Grace Dizon', phone: '09205055050' },
    { email: 'danny.villar@yahoo.com', name: 'Danny Villar', phone: '09166066060' },
    { email: 'cherry.lopez@gmail.com', name: 'Cherry Lopez', phone: '09177077070' },
    { email: 'rex.manalo@gmail.com', name: 'Rex Manalo', phone: '09188088080' },
    { email: 'beth.navarro@outlook.com', name: 'Beth Navarro', phone: '09199099090' },
    { email: 'joey.flores@gmail.com', name: 'Joey Flores', phone: '09201100110' },
    { email: 'lorna.padilla@yahoo.com', name: 'Lorna Padilla', phone: '09162110211' },
    { email: 'arnel.delos_santos@gmail.com', name: 'Arnel delos Santos', phone: '09173220322' },
    { email: 'mila.sarmiento@gmail.com', name: 'Mila Sarmiento', phone: '09184330433' },
    { email: 'ruben.corpuz@outlook.com', name: 'Ruben Corpuz', phone: '09195440544' },
    { email: 'alma.pangilinan@gmail.com', name: 'Alma Pangilinan', phone: '09206550655' },
    { email: 'edgar.soriano@yahoo.com', name: 'Edgar Soriano', phone: '09167660766' },
    { email: 'nora.bondoc@gmail.com', name: 'Nora Bondoc', phone: '09178770877' },
    // ── Additional happy customers ──
    { email: 'ramon.delas_alas@gmail.com', name: 'Ramon delas Alas', phone: '09179881234' },
    { email: 'lynette.manansala@yahoo.com', name: 'Lynette Manansala', phone: '09181992345' },
    { email: 'benjamin.ocampo@gmail.com', name: 'Benjamin Ocampo', phone: '09192003456' },
    { email: 'divina.pascual@outlook.com', name: 'Divina Pascual', phone: '09163014567' },
    { email: 'ernesto.salazar@gmail.com', name: 'Ernesto Salazar', phone: '09174025678' },
    { email: 'felisa.trinidad@yahoo.com', name: 'Felisa Trinidad', phone: '09185036789' },
    { email: 'gilbert.umali@gmail.com', name: 'Gilbert Umali', phone: '09196047890' },
    { email: 'helen.viray@outlook.com', name: 'Helen Viray', phone: '09207058901' },
    { email: 'isidro.wenceslao@gmail.com', name: 'Isidro Wenceslao', phone: '09168069012' },
    { email: 'josefina.yap@yahoo.com', name: 'Josefina Yap', phone: '09179070123' },
    { email: 'kristine.zamora@gmail.com', name: 'Kristine Zamora', phone: '09180081234' },
    { email: 'leonardo.abadilla@outlook.com', name: 'Leonardo Abadilla', phone: '09191092345' },
    { email: 'maricel.buenaventura@gmail.com', name: 'Maricel Buenaventura', phone: '09202103456' },
    { email: 'nestor.concepcion@yahoo.com', name: 'Nestor Concepcion', phone: '09163114567' },
    { email: 'olivia.dimaculangan@gmail.com', name: 'Olivia Dimaculangan', phone: '09174125678' },
    { email: 'paolo.enriquez@outlook.com', name: 'Paolo Enriquez', phone: '09185136789' },
    { email: 'queenie.francisco@gmail.com', name: 'Queenie Francisco', phone: '09196147890' },
    { email: 'romeo.genuino@yahoo.com', name: 'Romeo Genuino', phone: '09207158901' },
    { email: 'socorro.hernandez@gmail.com', name: 'Socorro Hernandez', phone: '09168169012' },
    { email: 'teodoro.ignacio@outlook.com', name: 'Teodoro Ignacio', phone: '09179170123' },
    // ── Small business owners ──
    { email: 'ursula.javillonar@gmail.com', name: 'Ursula Javillonar', phone: '09180181234' },
    { email: 'virgilio.katigbak@yahoo.com', name: 'Virgilio Katigbak', phone: '09191192345' },
    { email: 'wilma.lacsamana@gmail.com', name: 'Wilma Lacsamana', phone: '09202203456' },
    { email: 'xander.macapagal@outlook.com', name: 'Xander Macapagal', phone: '09163214567' },
    { email: 'yolanda.napoles@gmail.com', name: 'Yolanda Napoles', phone: '09174225678' },
    { email: 'zenaida.olmedo@yahoo.com', name: 'Zenaida Olmedo', phone: '09185236789' },
    { email: 'alfredo.penaflor@gmail.com', name: 'Alfredo Penaflor', phone: '09196247890' },
    { email: 'brenda.quiambao@outlook.com', name: 'Brenda Quiambao', phone: '09207258901' },
    { email: 'crisanto.recio@gmail.com', name: 'Crisanto Recio', phone: '09168269012' },
    { email: 'dolores.samson@yahoo.com', name: 'Dolores Samson', phone: '09179270123' },
    // ── Construction company accounts ──
    { email: 'orders@jmbuilders.ph', name: 'JM Builders Corp', phone: '09180281234' },
    { email: 'procurement@manilaconst.ph', name: 'Manila Construction Inc', phone: '09191292345' },
    { email: 'supply@solidfound.ph', name: 'Solid Foundation Builders', phone: '09202303456' },
    { email: 'buying@topnotch.ph', name: 'Top Notch Renovations', phone: '09163314567' },
    { email: 'materials@primedev.ph', name: 'Prime Development Co', phone: '09174325678' },
    // ── Barangay / institutional ──
    { email: 'brgy.maintenance@makati.gov.ph', name: 'Brgy Poblacion Makati', phone: '09185336789' },
    { email: 'facilities@smdept.com', name: 'SM Facilities Dept', phone: '09196347890' },
    { email: 'maintenance@condoliving.ph', name: 'Condo Living Admin', phone: '09207358901' },
    // ── Walk-in regulars who eventually signed up ──
    { email: 'mang.jose@gmail.com', name: 'Jose "Mang Jose" Ramos', phone: '09168369012' },
    { email: 'aling.nena@yahoo.com', name: 'Nena "Aling Nena" Cruz', phone: '09179370123' },
    { email: 'kuya.ben@gmail.com', name: 'Benjamin "Kuya Ben" Santos', phone: '09180381234' },
    { email: 'ate.luz@outlook.com', name: 'Luz "Ate Luz" Garcia', phone: '09191392345' },
    { email: 'tatay.dong@gmail.com', name: 'Eduardo "Tatay Dong" Reyes', phone: '09202403456' },
    { email: 'nanay.rosa@yahoo.com', name: 'Rosa "Nanay Rosa" Mendoza', phone: '09163414567' },
    { email: 'kuya.nonoy@gmail.com', name: 'Reynaldo "Kuya Nonoy" Dela Cruz', phone: '09174425678' },
    { email: 'tisoy.builder@gmail.com', name: 'Francis "Tisoy" Villanueva', phone: '09185436789' },
    { email: 'engineer.mike@outlook.com', name: 'Engr. Michael Tan', phone: '09196447890' },
    { email: 'architect.anna@gmail.com', name: 'Arch. Anna Lim', phone: '09207458901' },
    { email: 'foreman.ricky@yahoo.com', name: 'Ricardo "Foreman Ricky" Torres', phone: '09168469012' },
    { email: 'master.plumber.eddie@gmail.com', name: 'Eduardo "Master Plumber" Flores', phone: '09179470123' },
  ];

  const createdCustomers = [];
  for (const cust of customerDataList) {
    const c = await prisma.customer.create({
      data: {
        email: cust.email,
        password: customerPassword,
        name: cust.name,
        phone: cust.phone,
        isActive: true,
      },
    });
    createdCustomers.push(c);
  }
  console.log(`✅ Customers created: ${createdCustomers.length}`);

  // ═══════════════════════════════════════════════════════════════════
  // SAVED ADDRESSES — give customers saved delivery addresses
  // ═══════════════════════════════════════════════════════════════════
  console.log('🔄 Creating saved addresses for customers...');
  const savedAddressTemplates = [
    { label: 'Home', address: '123 Sampaguita St, Brgy. San Jose', barangay: 'San Jose', landmarks: 'Near sari-sari store' },
    { label: 'Office', address: '456 Rizal Ave, Brgy. Poblacion', barangay: 'Poblacion', landmarks: 'Ground floor, beside BDO' },
    { label: 'Construction Site', address: '789 National Hwy, Brgy. Bagumbayan', barangay: 'Bagumbayan', landmarks: 'Blue gate, ask for foreman' },
    { label: 'Warehouse', address: '321 Industrial Rd, Brgy. Malanday', barangay: 'Malanday', landmarks: 'Near Petron gas station' },
    { label: 'Home', address: '654 Mabini St, Brgy. Concepcion', barangay: 'Concepcion', landmarks: 'Yellow house with carport' },
    { label: 'Project Site', address: '987 Bonifacio Ave, Brgy. Kapitolyo', barangay: 'Kapitolyo', landmarks: 'Active construction, blue tarp' },
  ];

  let savedAddrCount = 0;
  for (const customer of createdCustomers) {
    // Each customer gets 1-3 saved addresses
    const numAddr = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...savedAddressTemplates].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numAddr && i < shuffled.length; i++) {
      await prisma.savedAddress.create({
        data: {
          customerId: customer.id,
          label: shuffled[i].label,
          address: shuffled[i].address,
          barangay: shuffled[i].barangay,
          landmarks: shuffled[i].landmarks,
          isDefault: i === 0,
        },
      });
      savedAddrCount++;
    }
  }
  console.log(`✅ Saved addresses created: ${savedAddrCount}`);

  // ═══════════════════════════════════════════════════════════════════
  // WISHLIST ITEMS — customers have wishlisted products
  // ═══════════════════════════════════════════════════════════════════
  console.log('🔄 Creating wishlist items...');
  const allProductsForWishlist = await prisma.product.findMany();
  let wishlistCount = 0;
  for (const customer of createdCustomers) {
    // ~40% of customers have wishlists
    if (Math.random() < 0.4) {
      const numWishlist = 1 + Math.floor(Math.random() * 5);
      const shuffledProducts = [...allProductsForWishlist].sort(() => Math.random() - 0.5);
      for (let i = 0; i < numWishlist && i < shuffledProducts.length; i++) {
        await prisma.wishlistItem.create({
          data: {
            customerId: customer.id,
            productId: shuffledProducts[i].id,
          },
        });
        wishlistCount++;
      }
    }
  }
  console.log(`✅ Wishlist items created: ${wishlistCount}`);

  // ═══════════════════════════════════════════════════════════════════
  // ORDERS — Load from CSV files (prisma/data/orders.csv + order-items.csv)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔄 Loading orders from CSV files...');

  const ordersCSVPath = path.join(__dirname, 'data', 'orders.csv');
  const itemsCSVPath  = path.join(__dirname, 'data', 'order-items.csv');

  if (!fs.existsSync(ordersCSVPath) || !fs.existsSync(itemsCSVPath)) {
    console.log('⚠️  CSV files not found! Generate them first:');
    console.log('   node prisma/generate-orders-csv.js');
    console.log('   Skipping order creation...');
  } else {
    // ── CSV parser (handles quoted fields with commas/newlines) ──────
    function parseCSV(filePath) {
      const content = fs.readFileSync(filePath, 'utf8');
      const rows = [];
      let row = [];
      let field = '';
      let inQuotes = false;
      let i = 0;

      while (i < content.length) {
        const ch = content[i];
        if (inQuotes) {
          if (ch === '"' && content[i + 1] === '"') {
            field += '"';
            i += 2;
          } else if (ch === '"') {
            inQuotes = false;
            i++;
          } else {
            field += ch;
            i++;
          }
        } else {
          if (ch === '"') {
            inQuotes = true;
            i++;
          } else if (ch === ',') {
            row.push(field);
            field = '';
            i++;
          } else if (ch === '\n' || ch === '\r') {
            row.push(field);
            field = '';
            if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
              rows.push(row);
            }
            row = [];
            if (ch === '\r' && content[i + 1] === '\n') i++;
            i++;
          } else {
            field += ch;
            i++;
          }
        }
      }
      // Last field/row
      if (field || row.length > 0) {
        row.push(field);
        rows.push(row);
      }

      // First row is header
      const headers = rows[0];
      return rows.slice(1).map(r => {
        const obj = {};
        headers.forEach((h, idx) => { obj[h.trim()] = (r[idx] || '').trim(); });
        return obj;
      });
    }

    const orderRows = parseCSV(ordersCSVPath);
    const itemRows  = parseCSV(itemsCSVPath);
    console.log(`   📄 Loaded ${orderRows.length} orders and ${itemRows.length} items from CSV`);

    // ── Build lookup maps ────────────────────────────────────────────
    const allProducts = await prisma.product.findMany({ include: { variants: true } });
    const allUsers    = await prisma.user.findMany();

    // product name → { id, variants: { variantName → { id } } }
    const productMap = {};
    for (const p of allProducts) {
      productMap[p.name] = {
        id: p.id,
        price: p.price,
        variants: {},
      };
      if (p.variants) {
        for (const v of p.variants) {
          productMap[p.name].variants[v.name] = { id: v.id, price: v.price };
        }
      }
    }

    // customer email → customer record
    const customerMap = {};
    for (const c of createdCustomers) {
      customerMap[c.email] = c;
    }

    // Group items by order_number
    const itemsByOrder = {};
    for (const item of itemRows) {
      const key = item.order_number;
      if (!itemsByOrder[key]) itemsByOrder[key] = [];
      itemsByOrder[key].push(item);
    }

    // ── Insert orders in batches ─────────────────────────────────────
    let totalOrderCount = 0;
    let totalItemCount  = 0;
    let skippedItems    = 0;
    const batchSize     = 60;
    let batch           = [];

    for (const row of orderRows) {
      const items = itemsByOrder[row.order_number] || [];
      if (items.length === 0) continue;

      const customer = row.customer_email ? customerMap[row.customer_email] : null;

      // Parse date + time
      const [y, mo, d] = row.date.split('-').map(Number);
      const [h, mi, s] = (row.time || '10:00:00').split(':').map(Number);
      const orderDate = new Date(y, mo - 1, d, h || 10, mi || 0, s || 0);

      // Resolve items to product/variant IDs
      const resolvedItems = [];
      for (const it of items) {
        const product = productMap[it.product_name];
        if (!product) {
          skippedItems++;
          continue;
        }

        let variantId   = null;
        let variantName = null;
        if (it.variant_name) {
          const variant = product.variants[it.variant_name];
          if (variant) {
            variantId   = variant.id;
            variantName = it.variant_name;
          }
        }

        resolvedItems.push({
          productId: product.id,
          variantId,
          variantName,
          quantity:  parseInt(it.quantity, 10) || 1,
          unitPrice: parseFloat(it.unit_price) || 0,
          subtotal:  parseFloat(it.subtotal)   || 0,
        });
      }

      if (resolvedItems.length === 0) continue;

      batch.push({
        orderNumber:  row.order_number,
        customerId:   customer ? customer.id : null,
        customerName: row.customer_name || 'Walk-in Customer',
        phone:        row.phone || '',
        address:      row.address || '',
        barangay:     row.barangay || '',
        landmarks:    row.landmarks || '',
        status:       row.status || 'pending',
        totalAmount:  parseFloat(row.total_amount) || 0,
        notes:        row.notes || null,
        createdAt:    orderDate,
        updatedAt:    orderDate,
        items:        resolvedItems,
      });

      if (batch.length >= batchSize) {
        await flushOrderBatch(batch, allUsers);
        totalOrderCount += batch.length;
        totalItemCount  += batch.reduce((s, o) => s + o.items.length, 0);
        batch = [];

        if (totalOrderCount % 500 < batchSize) {
          console.log(`   📦 ${totalOrderCount} orders inserted so far...`);
        }
      }
    }

    // Flush remaining
    if (batch.length > 0) {
      await flushOrderBatch(batch, allUsers);
      totalOrderCount += batch.length;
      totalItemCount  += batch.reduce((s, o) => s + o.items.length, 0);
    }

    console.log(`\n✅ Orders created: ${totalOrderCount}`);
    console.log(`✅ Order items created: ${totalItemCount}`);
    if (skippedItems > 0) {
      console.log(`⚠️  Skipped ${skippedItems} items (product not found in DB)`);
    }
  }

  // ── SUMMARY ────────────────────────────────────────────────────────
  const counts = {
    users: await prisma.user.count(),
    customers: await prisma.customer.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    statusHistory: await prisma.orderStatusHistory.count(),
    savedAddresses: await prisma.savedAddress.count(),
    wishlistItems: await prisma.wishlistItem.count(),
  };

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📊 Database Summary:');
  console.log('   Admin + Staff Users:', counts.users);
  console.log('   Customers:', counts.customers);
  console.log('   Categories:', counts.categories);
  console.log('   Products:', counts.products);
  console.log('   Product Variants:', counts.variants);
  console.log('   Orders:', counts.orders);
  console.log('   Order Items:', counts.orderItems);
  console.log('   Status History Records:', counts.statusHistory);
  console.log('   Saved Addresses:', counts.savedAddresses);
  console.log('   Wishlist Items:', counts.wishlistItems);
  console.log('\n📝 Default login credentials:');
  console.log('   Admin:    username="admin", password="admin123"');
  console.log('   Staff:    username="juan_staff", password="staff123"');
  console.log('   Customer: email="juan.delacruz@gmail.com", password="customer123"');
}

// ── BATCH INSERT HELPER ──────────────────────────────────────────────
async function flushOrderBatch(batch, allUsers) {
  for (const orderData of batch) {
    const { items, ...orderFields } = orderData;

    const order = await prisma.order.create({
      data: {
        ...orderFields,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
      },
    });

    // Create status history
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

    const flow = statusFlow[orderData.status] || ['pending'];
    let prevStatus = null;
    let historyDate = new Date(orderData.createdAt);

    for (const flowStatus of flow) {
      // Time between status changes: 15min to 4 hours
      historyDate = new Date(historyDate.getTime() + (15 + Math.floor(Math.random() * 225)) * 60000);

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: prevStatus,
          toStatus: flowStatus,
          changedById: allUsers[Math.floor(Math.random() * allUsers.length)].id,
          notes: flowStatus === 'rejected' ? 'Out of stock items' :
                 flowStatus === 'cancelled' ? 'Customer requested cancellation' : null,
          createdAt: historyDate,
        },
      });
      prevStatus = flowStatus;
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
