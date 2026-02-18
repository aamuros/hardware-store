/**
 * ════════════════════════════════════════════════════════════════════
 *  CSV Order Data Generator for Hardware Store
 * ════════════════════════════════════════════════════════════════════
 *
 *  Generates two CSV files:
 *    prisma/data/orders.csv       — order header rows
 *    prisma/data/order-items.csv  — line items per order
 *
 *  The generated CSVs can be manually edited in Excel / Google Sheets
 *  to adjust values before running `npx prisma db seed`.
 *
 *  Usage:  node prisma/generate-orders-csv.js
 * ════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// ─── OUTPUT PATHS ────────────────────────────────────────────────────
const DATA_DIR     = path.join(__dirname, 'data');
const ORDERS_CSV   = path.join(DATA_DIR, 'orders.csv');
const ITEMS_CSV    = path.join(DATA_DIR, 'order-items.csv');

// ─── PRODUCT CATALOG (must match seed.js products) ───────────────────
// Format: { name, variants: [{ name, price }] | null, price }
const PRODUCTS = [
  // ── Steel & Metal ──
  { name: 'Angle Bar', variants: [
    { name: '1" x 1" x 2mm (20ft)', price: 360 },
    { name: '1.5" x 1.5" x 2mm (20ft)', price: 530 },
    { name: '2" x 2" x 3mm (20ft)', price: 1100 },
    { name: '3/4" x 3/4" x 2mm (20ft)', price: 300 },
  ]},
  { name: 'Deformed Bar G33', variants: [
    { name: '10mm x 6m', price: 93 },
    { name: '12mm x 6m', price: 130 },
    { name: '16mm x 6m', price: 235 },
    { name: '9mm x 6m', price: 75 },
  ]},
  { name: 'Deformed Bar G40', variants: [
    { name: '10mm x 6m', price: 115 },
    { name: '12mm x 6m', price: 165 },
    { name: '16mm x 6m', price: 293 },
    { name: '20mm x 6m', price: 458 },
  ]},
  { name: 'Flat Bar', variants: [
    { name: '1" x 3mm (20ft)', price: 195 },
    { name: '1.5" x 3mm (20ft)', price: 265 },
    { name: '2" x 3mm (20ft)', price: 330 },
  ]},
  { name: 'C-Purlins GI', variants: [
    { name: '2" x 3" x 6m (1.0mm)', price: 380 },
    { name: '2" x 3" x 6m (1.2mm)', price: 450 },
    { name: '2" x 4" x 6m (1.0mm)', price: 410 },
    { name: '2" x 4" x 6m (1.2mm)', price: 510 },
    { name: '2" x 4" x 6m (1.5mm)', price: 650 },
  ]},
  { name: 'Tubular Bar GI', variants: [
    { name: '1" x 1" (20ft) 1.0mm', price: 270 },
    { name: '1" x 1" (20ft) 1.2mm', price: 320 },
    { name: '1" x 2" (20ft) 1.0mm', price: 380 },
    { name: '1" x 2" (20ft) 1.2mm', price: 450 },
    { name: '2" x 2" (20ft) 1.0mm', price: 510 },
  ]},
  { name: 'G.I Pipe Local S20', variants: [
    { name: '1/2" (20ft)', price: 245 },
    { name: '3/4" (20ft)', price: 320 },
    { name: '1" (20ft)', price: 395 },
    { name: '1.5" (20ft)', price: 615 },
    { name: '2" (20ft)', price: 940 },
  ]},

  // ── Lumber & Wood ──
  { name: 'Coco Lumber', variants: [
    { name: '2x2x10 (Per Piece)', price: 60 },
    { name: '2x2x12 (Per Piece)', price: 72 },
    { name: '2x2x8 (Per Piece)', price: 48 },
    { name: '2x3x10 (Per Piece)', price: 90 },
    { name: '2x3x8 (Per Piece)', price: 72 },
    { name: '2x4x10 (Per Piece)', price: 120 },
    { name: '2x4x8 (Per Piece)', price: 96 },
  ]},
  { name: 'Good Lumber S4S', variants: [
    { name: '1x2 per Board Foot', price: 62 },
    { name: '2x2 per Board Foot', price: 62 },
    { name: '2x3 per Board Foot', price: 62 },
    { name: '2x4 per Board Foot', price: 62 },
    { name: '2x6 per Board Foot', price: 65 },
  ]},
  { name: 'KD S4S Wood PL', variants: [
    { name: '1x2 per Board Foot', price: 72 },
    { name: '2x2 per Board Foot', price: 72 },
    { name: '2x3 per Board Foot', price: 72 },
    { name: '2x4 per Board Foot', price: 72 },
    { name: '2x6 per Board Foot', price: 75 },
  ]},
  { name: 'Marine Plywood Local', variants: [
    { name: '1/4 (4x8ft)', price: 380 },
    { name: '1/2 (4x8ft)', price: 640 },
    { name: '3/4 (4x8ft)', price: 920 },
  ]},
  { name: 'Plywood Ordinary', variants: [
    { name: '1/4 (4x8ft)', price: 250 },
    { name: '1/2 (4x8ft)', price: 480 },
    { name: '3/4 (4x8ft)', price: 710 },
  ]},
  { name: 'Phenolic Board 1/2 Croco', price: 620, variants: null },
  { name: 'Phenolic Board 18mm', price: 780, variants: null },

  // ── Roofing & Ceiling ──
  { name: 'Longspan RIB22', variants: [
    { name: '8ft (0.4mm)', price: 354 },
    { name: '10ft (0.4mm)', price: 443 },
    { name: '12ft (0.4mm)', price: 531 },
    { name: '14ft (0.4mm)', price: 620 },
    { name: '16ft (0.4mm)', price: 708 },
    { name: '8ft (0.5mm)', price: 482 },
    { name: '10ft (0.5mm)', price: 602 },
    { name: '12ft (0.5mm)', price: 722 },
  ]},
  { name: 'Metal Furring', variants: [
    { name: '19 x 50 (10ft)', price: 71 },
    { name: '25 x 50 (10ft)', price: 93 },
  ]},
  { name: 'Metal Studs', price: 165, variants: null },
  { name: 'Carrying Channel', price: 105, variants: null },
  { name: 'Shadow Line', price: 80, variants: null },

  // ── Cement & Masonry ──
  { name: 'Eagle Cement Advance', price: 260, variants: null },
  { name: 'Republic Cement', price: 255, variants: null },
  { name: 'Concrete Hollow Block', variants: [
    { name: '4" CHB (Per Piece)', price: 12 },
    { name: '6" CHB (Per Piece)', price: 16 },
  ]},
  { name: 'Bistay per Sack', price: 185, variants: null },
  { name: 'White Sand', price: 48, variants: null },
  { name: 'Gravel 3/4', price: 52, variants: null },

  // ── Plumbing ──
  { name: 'Neltex PPR PVC Pipe', variants: [
    { name: '1/2" x 3m', price: 109 },
    { name: '3/4" x 3m', price: 179 },
    { name: '1" x 3m', price: 289 },
  ]},
  { name: 'Neltex Sanitary PVC Pipe S600', variants: [
    { name: '2" x 3m', price: 268 },
    { name: '3" x 3m', price: 408 },
    { name: '4" x 3m', price: 608 },
  ]},
  { name: 'Neltex PVC Sanitary P-Trap', variants: [
    { name: '2"', price: 85 },
    { name: '3"', price: 145 },
    { name: '4"', price: 225 },
  ]},
  { name: 'Lucky PPR Elbow Female 1/2', price: 29, variants: null },

  // ── Electrical ──
  { name: 'Royu THHN Wire 8.0mm', variants: [
    { name: 'Red (Per Box 75m)', price: 5200 },
    { name: 'Black (Per Box 75m)', price: 5200 },
    { name: 'White (Per Box 75m)', price: 5200 },
    { name: 'Green (Per Box 75m)', price: 5200 },
  ]},
  { name: 'Circuit Breaker Bolt-On', variants: [
    { name: '15A', price: 258 },
    { name: '20A', price: 258 },
    { name: '30A', price: 268 },
    { name: '60A', price: 378 },
  ]},
  { name: 'Neltex Electrical Pipe Thickwall 1/2"', price: 65, variants: null },
  { name: 'Neltex Electrical Pipe Thinwall', variants: [
    { name: '1/2" Per Piece', price: 32 },
    { name: '3/4" Per Piece', price: 48 },
    { name: '1" Per Piece', price: 68 },
  ]},

  // ── Paint & Coatings ──
  { name: 'Boysen Lacquer Thinner B50', variants: [
    { name: '1/4 Liter', price: 78 },
    { name: '1 Liter', price: 248 },
    { name: '4 Liters', price: 875 },
  ]},
  { name: 'Boysen Permacoat Flat Latex White', variants: [
    { name: '1 Liter', price: 225 },
    { name: '4 Liters', price: 795 },
    { name: '16 Liters (1 Pail)', price: 2850 },
  ]},
  { name: 'Novtek Concrete Sealer 4 Liters', price: 480, variants: null },
  { name: 'Gardner', price: 295, variants: null },

  // ── Fasteners & Nails ──
  { name: 'Black Screw Metal', variants: [
    { name: '1" (Per Box 500pcs)', price: 220 },
    { name: '1.5" (Per Box 500pcs)', price: 265 },
    { name: '2" (Per Box 500pcs)', price: 310 },
  ]},
  { name: 'Black Screw Pointed', variants: [
    { name: '1" (Per Box 500pcs)', price: 210 },
    { name: '1.5" (Per Box 500pcs)', price: 260 },
    { name: '2" (Per Box 500pcs)', price: 290 },
  ]},
  { name: 'Common Wire Nail', variants: [
    { name: '1" (Per Kilo)', price: 65 },
    { name: '1.5" (Per Kilo)', price: 62 },
    { name: '2" (Per Kilo)', price: 60 },
    { name: '3" (Per Kilo)', price: 58 },
    { name: '4" (Per Kilo)', price: 56 },
  ]},
  { name: 'Concrete Nail', variants: [
    { name: '1" (Per Kilo)', price: 125 },
    { name: '2" (Per Kilo)', price: 120 },
    { name: '3" (Per Kilo)', price: 118 },
  ]},
  { name: 'Hardiflex Screw 1"', price: 2.5, variants: null },
  { name: 'Tekscrew', variants: [
    { name: '1" (Per Piece)', price: 2 },
    { name: '1.5" (Per Piece)', price: 2.5 },
    { name: '2" (Per Piece)', price: 3 },
    { name: '2.5" (Per Piece)', price: 3.5 },
    { name: '3" (Per Piece)', price: 4 },
  ]},
  { name: 'Tox', variants: [
    { name: '#8 Tox (Per Box)', price: 48 },
    { name: '#10 Tox (Per Box)', price: 65 },
    { name: '#12 Tox (Per Box)', price: 85 },
  ]},
  { name: 'W-Clip', price: 2, variants: null },
  { name: 'Wood Screw Flat Head', variants: [
    { name: '3/4" (Per Kilo)', price: 195 },
    { name: '1" (Per Kilo)', price: 180 },
    { name: '1.5" (Per Kilo)', price: 175 },
    { name: '2" (Per Kilo)', price: 168 },
  ]},
  { name: 'GI Wire #16', price: 85, variants: null },

  // ── Tools ──
  { name: 'Adjustable Hacksaw', price: 130, variants: null },
  { name: 'Claw Hammer Wood Handle', price: 175, variants: null },
  { name: 'Twisted Wire Cup Brush 4"', price: 95, variants: null },

  // ── Hardware & Accessories ──
  { name: 'Camel Drawer Lock', price: 85, variants: null },
  { name: 'Nihonweld Welding Rod N6013', variants: [
    { name: '1/8" (3.2mm) per kg', price: 165 },
    { name: '5/32" (4.0mm) per kg', price: 175 },
    { name: '1/8" (3.2mm) 5kg pack', price: 616 },
  ]},
];

// ── CUSTOMER LIST (must match seed.js) ──────────────────────────────
const CUSTOMERS = [
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
  { email: 'orders@jmbuilders.ph', name: 'JM Builders Corp', phone: '09180281234' },
  { email: 'procurement@manilaconst.ph', name: 'Manila Construction Inc', phone: '09191292345' },
  { email: 'supply@solidfound.ph', name: 'Solid Foundation Builders', phone: '09202303456' },
  { email: 'buying@topnotch.ph', name: 'Top Notch Renovations', phone: '09163314567' },
  { email: 'materials@primedev.ph', name: 'Prime Development Co', phone: '09174325678' },
  { email: 'brgy.maintenance@makati.gov.ph', name: 'Brgy Poblacion Makati', phone: '09185336789' },
  { email: 'facilities@smdept.com', name: 'SM Facilities Dept', phone: '09196347890' },
  { email: 'maintenance@condoliving.ph', name: 'Condo Living Admin', phone: '09207358901' },
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

// ── ADDRESS POOL ─────────────────────────────────────────────────────
const ADDRESSES = [
  { address: '123 Main St, Makati', barangay: 'Poblacion', landmarks: 'Near Mercury Drug' },
  { address: '456 Rizal Ave, Quezon City', barangay: 'Tandang Sora', landmarks: 'Behind SM Fairview' },
  { address: '789 EDSA, Pasig', barangay: 'Kapitolyo', landmarks: 'Across Ace Hardware' },
  { address: '321 Ayala Ave, BGC', barangay: 'Forbes Park', landmarks: 'Near Petron Gas Station' },
  { address: '555 Commonwealth Ave, QC', barangay: 'Batasan Hills', landmarks: 'Beside Jollibee' },
  { address: '777 Shaw Blvd, Mandaluyong', barangay: 'Pleasant Hills', landmarks: 'Near Starmall' },
  { address: '888 Ortigas Ave, Pasig', barangay: 'San Antonio', landmarks: 'Across Robinson Metro East' },
  { address: '999 C5 Road, Taguig', barangay: 'Signal Village', landmarks: 'Near Gate 1' },
  { address: '111 Macapagal Blvd, Pasay', barangay: 'Baclaran', landmarks: 'Near MOA' },
  { address: '222 Taft Ave, Manila', barangay: 'Ermita', landmarks: 'Near De La Salle University' },
  { address: '333 Espana Blvd, Manila', barangay: 'Sampaloc', landmarks: 'Near UST' },
  { address: '444 Aurora Blvd, QC', barangay: 'Project 4', landmarks: 'Behind Gateway Mall' },
  { address: '555 Quirino Hwy, QC', barangay: 'Novaliches', landmarks: 'Near SM Nova' },
  { address: '666 Congressional Ave, QC', barangay: 'Project 8', landmarks: 'Near Savemore' },
  { address: '777 Mindanao Ave, QC', barangay: 'Talipapa', landmarks: 'Near Puregold' },
  { address: '100 Gen. Luna St, Intramuros', barangay: 'Intramuros', landmarks: 'Near Fort Santiago' },
  { address: '200 P. Tuazon Blvd, Cubao', barangay: 'Cubao', landmarks: 'Near Araneta Center' },
  { address: '300 Marcos Hwy, Marikina', barangay: 'Concepcion', landmarks: 'Near SM Marikina' },
  { address: '400 Sumulong Hwy, Antipolo', barangay: 'San Jose', landmarks: 'Near Robinsons Antipolo' },
  { address: '500 JP Rizal Ave, Makati', barangay: 'Guadalupe Viejo', landmarks: 'Near Guadalupe Bridge' },
  { address: '600 Katipunan Ave, QC', barangay: 'Loyola Heights', landmarks: 'Near Ateneo gate' },
  { address: '700 Gilmore Ave, QC', barangay: 'Valencia', landmarks: 'Near Gilmore IT Center' },
  { address: '800 Visayas Ave, QC', barangay: 'Bahay Toro', landmarks: 'Near Congressional Market' },
  { address: '900 Timog Ave, QC', barangay: 'South Triangle', landmarks: 'Near GMA Network' },
  { address: '150 Recto Ave, Manila', barangay: 'University Belt', landmarks: 'Near Isetann' },
];

const ORDER_NOTES = [
  '', '', '', '', '', '', '',  // 70% no notes
  'Please call before delivery',
  'Leave at the guard house',
  'Deliver in the morning only',
  'Gate code: 1234',
  'Contact foreman on site',
  'Rush delivery needed',
  'Deliver to construction site entrance',
  'Ask for the caretaker',
  'Ring the doorbell twice',
  'Handle with care',
  'Deliver between 8am-12pm only',
  'Call 30 minutes before arrival',
  'Use service entrance',
];

// ══════════════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

let _seed = 42;
function seededRandom() {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}

function generateOrderNumber(date) {
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const seq = String(Math.floor(seededRandom() * 99999)).padStart(5, '0');
  return `ORD-${y}${m}${d}-${seq}`;
}

function toCsvField(val) {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ══════════════════════════════════════════════════════════════════════
//  REVENUE MODEL
// ══════════════════════════════════════════════════════════════════════

// Monthly multiplier (on base of ₱10,000/day)
const monthMult = [
  0.55,  // Jan – post-holiday slump
  0.60,  // Feb – quiet, some reno
  1.15,  // Mar – summer starts
  1.40,  // Apr – peak summer
  1.30,  // May – still strong
  1.00,  // Jun – rainy season starts
  0.80,  // Jul – heavy rains
  0.75,  // Aug – typhoon season
  0.65,  // Sep – worst typhoon
  0.85,  // Oct – recovery
  1.10,  // Nov – Christmas rush begins
  1.25,  // Dec – year-end push
];

// Day-of-week multiplier
const dowMult = [
  0.15,  // Sunday  – mostly closed
  1.15,  // Monday  – contractors stock up
  1.10,  // Tuesday
  1.05,  // Wednesday
  1.00,  // Thursday
  1.10,  // Friday – restock before weekend
  0.70,  // Saturday – half day
];

function yearMult(year) {
  if (year === 2024) return 0.85;
  if (year === 2025) return 1.00;
  return 1.08;
}

// Status assignment based on order age
function getStatusForDate(orderDate) {
  const now = new Date(2026, 1, 18);
  const daysAgo = Math.floor((now - orderDate) / 86400000);

  if (daysAgo > 60) {
    const r = Math.random();
    if (r < 0.82) return 'completed';
    if (r < 0.92) return 'delivered';
    if (r < 0.96) return 'cancelled';
    if (r < 0.99) return 'rejected';
    return 'pending';
  } else if (daysAgo > 14) {
    const r = Math.random();
    if (r < 0.55) return 'completed';
    if (r < 0.75) return 'delivered';
    if (r < 0.82) return 'out_for_delivery';
    if (r < 0.88) return 'preparing';
    if (r < 0.93) return 'accepted';
    if (r < 0.97) return 'cancelled';
    return 'pending';
  } else if (daysAgo > 3) {
    const r = Math.random();
    if (r < 0.25) return 'completed';
    if (r < 0.40) return 'delivered';
    if (r < 0.52) return 'out_for_delivery';
    if (r < 0.65) return 'preparing';
    if (r < 0.80) return 'accepted';
    if (r < 0.85) return 'cancelled';
    return 'pending';
  } else {
    const r = Math.random();
    if (r < 0.08) return 'completed';
    if (r < 0.15) return 'delivered';
    if (r < 0.25) return 'out_for_delivery';
    if (r < 0.42) return 'preparing';
    if (r < 0.62) return 'accepted';
    if (r < 0.67) return 'cancelled';
    return 'pending';
  }
}

// ══════════════════════════════════════════════════════════════════════
//  GENERATE
// ══════════════════════════════════════════════════════════════════════

function generate() {
  console.log('📊 Generating order CSV data...\n');

  // Flatten products into selectable items
  const selectableItems = [];
  for (const p of PRODUCTS) {
    if (p.variants && p.variants.length > 0) {
      for (const v of p.variants) {
        selectableItems.push({ productName: p.name, variantName: v.name, price: v.price });
      }
    } else {
      selectableItems.push({ productName: p.name, variantName: '', price: p.price });
    }
  }

  const cheapItems  = selectableItems.filter(i => i.price <= 50);
  const midItems    = selectableItems.filter(i => i.price > 50 && i.price <= 500);
  const priceyItems = selectableItems.filter(i => i.price > 500 && i.price <= 2000);
  const bigItems    = selectableItems.filter(i => i.price > 2000);

  // Date range: Jan 1, 2024 → Feb 18, 2026
  const startDate = new Date(2024, 0, 1);
  const endDate   = new Date(2026, 1, 18);
  const allDates  = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    allDates.push(new Date(d));
  }

  const BASE_DAILY = 10000;
  const usedOrderNumbers = new Set();

  const orderRows = [];
  const itemRows  = [];
  let totalOrders = 0;
  let totalItems  = 0;

  for (const date of allDates) {
    const month = date.getMonth();
    const dow   = date.getDay();
    const year  = date.getFullYear();
    const dd    = date.getDate();

    // Calculate target daily revenue
    const mM    = monthMult[month];
    const dM    = dowMult[dow];
    const yM    = yearMult(year);
    const noise = 0.70 + Math.random() * 0.60;

    let target = BASE_DAILY * mM * dM * yM * noise;

    // Holiday adjustments
    if ((month === 11 && dd >= 30) || (month === 0 && dd <= 3)) target *= 0.15;
    if (month === 3 && dd >= 9 && dd <= 13) target *= 0.10;
    if (month === 11 && dd >= 1 && dd <= 23) target *= 1.10;
    if (month === 10 && dd === 1) target *= 0.05;
    if (month === 5 && dd === 12) target *= 0.10;

    target = Math.min(target, 28000);
    if (dow === 0) target = Math.min(target, 3500);

    // Generate orders
    let dailyRevenue = 0;
    let safetyCounter = 0;

    while (dailyRevenue < target && safetyCounter < 50) {
      safetyCounter++;

      // Number of items per order
      const roll = Math.random();
      let numItems;
      if (roll < 0.20) numItems = 1;
      else if (roll < 0.50) numItems = 2;
      else if (roll < 0.78) numItems = 3;
      else if (roll < 0.92) numItems = 4;
      else numItems = 5;

      const items = [];
      const usedKeys = new Set();
      let orderTotal = 0;

      for (let i = 0; i < numItems; i++) {
        let pool;
        const tierRoll = Math.random();
        if (tierRoll < 0.40) pool = cheapItems;
        else if (tierRoll < 0.75) pool = midItems;
        else if (tierRoll < 0.93) pool = priceyItems;
        else pool = bigItems;
        if (pool.length === 0) pool = selectableItems;

        const item = pool[Math.floor(Math.random() * pool.length)];
        const key = `${item.productName}|${item.variantName}`;
        if (usedKeys.has(key)) continue;
        usedKeys.add(key);

        // Quantity
        let qty;
        if (item.price <= 5)       qty = randomInt(10, 100);
        else if (item.price <= 30)  qty = randomInt(3, 25);
        else if (item.price <= 100) qty = randomInt(1, 12);
        else if (item.price <= 300) qty = randomInt(1, 6);
        else if (item.price <= 1000) qty = randomInt(1, 3);
        else qty = 1;

        let subtotal = qty * item.price;
        if (dailyRevenue + orderTotal + subtotal > 34000) {
          if (item.price > 200) continue;
          qty = 1;
          subtotal = item.price;
        }

        orderTotal += subtotal;
        items.push({
          productName: item.productName,
          variantName: item.variantName,
          quantity: qty,
          unitPrice: item.price,
          subtotal,
        });
      }

      if (items.length === 0) break;
      orderTotal = items.reduce((s, it) => s + it.subtotal, 0);
      if (dailyRevenue + orderTotal > 34500) break;

      // Time
      const hour   = randomInt(7, 18);
      const minute = randomInt(0, 59);
      const second = randomInt(0, 59);
      const orderDate = new Date(date);
      orderDate.setHours(hour, minute, second, randomInt(0, 999));

      // Customer
      const isRegistered = Math.random() < 0.75;
      const customer     = isRegistered ? randomItem(CUSTOMERS) : null;
      const addr         = randomItem(ADDRESSES);

      let orderNumber;
      do { orderNumber = generateOrderNumber(orderDate); }
      while (usedOrderNumbers.has(orderNumber));
      usedOrderNumbers.add(orderNumber);

      const status = getStatusForDate(orderDate);
      const notes  = randomItem(ORDER_NOTES);

      const dateStr = orderDate.toISOString().slice(0, 10);
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

      orderRows.push([
        orderNumber,
        dateStr,
        timeStr,
        customer ? customer.email : '',
        customer ? customer.name : randomItem(CUSTOMERS).name,
        customer ? customer.phone : randomItem(CUSTOMERS).phone,
        addr.address,
        addr.barangay,
        addr.landmarks,
        status,
        orderTotal.toFixed(2),
        notes,
      ]);

      for (const it of items) {
        itemRows.push([
          orderNumber,
          it.productName,
          it.variantName,
          it.quantity,
          it.unitPrice.toFixed(2),
          it.subtotal.toFixed(2),
        ]);
        totalItems++;
      }

      dailyRevenue += orderTotal;
      totalOrders++;
    }
  }

  // ── Write CSVs ───────────────────────────────────────────────────
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // orders.csv
  const ordersHeader = 'order_number,date,time,customer_email,customer_name,phone,address,barangay,landmarks,status,total_amount,notes';
  const ordersContent = ordersHeader + '\n' + orderRows.map(row => row.map(toCsvField).join(',')).join('\n') + '\n';
  fs.writeFileSync(ORDERS_CSV, ordersContent, 'utf8');

  // order-items.csv
  const itemsHeader = 'order_number,product_name,variant_name,quantity,unit_price,subtotal';
  const itemsContent = itemsHeader + '\n' + itemRows.map(row => row.map(toCsvField).join(',')).join('\n') + '\n';
  fs.writeFileSync(ITEMS_CSV, itemsContent, 'utf8');

  // ── Stats ────────────────────────────────────────────────────────
  const daily = {};
  for (const row of orderRows) {
    const d = row[1];
    daily[d] = (daily[d] || 0) + parseFloat(row[10]);
  }
  const vals = Object.values(daily).sort((a, b) => b - a);

  console.log(`✅ Generated ${ORDERS_CSV}`);
  console.log(`   → ${totalOrders.toLocaleString()} orders`);
  console.log(`✅ Generated ${ITEMS_CSV}`);
  console.log(`   → ${totalItems.toLocaleString()} line items`);
  console.log('');
  console.log('📊 Revenue stats:');
  console.log(`   Days with orders: ${Object.keys(daily).length}`);
  console.log(`   Max daily:  ₱${Math.round(vals[0]).toLocaleString()}`);
  console.log(`   Avg daily:  ₱${Math.round(vals.reduce((s, v) => s + v, 0) / vals.length).toLocaleString()}`);
  console.log(`   Min daily:  ₱${Math.round(vals[vals.length - 1]).toLocaleString()}`);
  console.log(`   Over ₱35k:  ${vals.filter(v => v > 35000).length} days`);
  console.log('');
  console.log('💡 You can now edit the CSV files in Excel/Google Sheets,');
  console.log('   then run: npx prisma db seed');
}

generate();
