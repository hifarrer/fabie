import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, '..', 'data', 'db.json');

const adapter = new JSONFile(file);
const db = new Low(adapter, { dpps: [], naftaInputs: [], messages: [], threads: [], users: [] });

// Demo Users
const users = [
  {
    id: 'demo-seller-1',
    name: 'Tom Richardson',
    email: 'tom@thermaldyne.com',
    company: 'ThermalDyne Exhaust',
    location: 'Mississauga, ON',
    role: 'seller',
    createdAt: '2025-10-15T10:00:00Z'
  },
  {
    id: 'demo-seller-2',
    name: 'Sarah Chen',
    email: 'sarah@grandriveralloys.com',
    company: 'Grand River Alloys',
    location: 'Cambridge, ON',
    role: 'seller',
    createdAt: '2025-09-20T10:00:00Z'
  },
  {
    id: 'demo-seller-3',
    name: 'Mike Patterson',
    email: 'mike@apexprecision.ca',
    company: 'Apex Precision Manufacturing',
    location: 'Hamilton, ON',
    role: 'seller',
    createdAt: '2025-08-05T10:00:00Z'
  },
  {
    id: 'demo-seller-4',
    name: 'Linda Kowalski',
    email: 'linda@northernplastics.com',
    company: 'Northern Plastics Corp',
    location: 'Kitchener, ON',
    role: 'seller',
    createdAt: '2025-11-01T10:00:00Z'
  },
  {
    id: 'demo-buyer-1',
    name: 'John Carter',
    email: 'john@techworks.com',
    company: 'TechWorks Inc',
    location: 'Toronto, ON',
    role: 'buyer',
    createdAt: '2025-12-01T10:00:00Z'
  },
  {
    id: 'demo-buyer-2',
    name: 'Maya Singh',
    email: 'maya@northwindhvac.com',
    company: 'NorthWind HVAC',
    location: 'London, ON',
    role: 'buyer',
    createdAt: '2025-11-15T10:00:00Z'
  }
];

// 15 DPP Listings
const dpps = [
  // RAW MATERIALS (5)
  {
    id: 'dpp-raw-001',
    assetType: 'raw_material',
    name: '321 Stainless Steel Tubing',
    description: 'High-quality 321 titanium-stabilized austenitic stainless steel tubing, ideal for high-temperature exhaust applications and heat exchangers. Mill certified with full chemical analysis and mechanical properties documentation.',
    sellerId: 'demo-seller-1',
    seller: { name: 'ThermalDyne Exhaust', location: 'Mississauga, ON' },
    specs: {
      material: '321 Stainless Steel',
      form: 'Tubing',
      dimensions: '1.5" OD × 0.065" wall',
      weight: '18,000 lbs total',
      hsCode: '7306.40',
      lotNumber: 'TD-321-18000',
      heatNumber: 'H-77421'
    },
    pricing: { basePrice: 9.80, currency: 'CAD', unit: 'lb' },
    availability: { status: 'in_stock', quantity: 18000, leadTimeDays: 3, minimumOrder: 100 },
    verification: { tier: 'document_supported', badges: ['mill_cert'] },
    nafta: { enabled: true, rvc: 70, qualifies: true },
    documents: [
      { id: 'doc-1', name: 'Mill Test Certificate', type: 'mill_cert', status: 'validated' },
      { id: 'doc-2', name: 'Inventory Spreadsheet', type: 'inventory', status: 'pending' }
    ],
    views: 1284,
    inquiries: 14,
    status: 'active',
    createdAt: '2025-12-01T10:00:00Z'
  },
  {
    id: 'dpp-raw-002',
    assetType: 'raw_material',
    name: 'Inconel 600 Sheet',
    description: 'Premium Inconel 600 nickel-chromium alloy sheet with exceptional oxidation resistance at elevated temperatures up to 2150°F. Perfect for furnace components, heat treating equipment, and chemical processing.',
    sellerId: 'demo-seller-2',
    seller: { name: 'Grand River Alloys', location: 'Cambridge, ON' },
    specs: {
      material: 'Inconel 600 (UNS N06600)',
      form: 'Sheet',
      dimensions: '48" × 120" × 0.125"',
      weight: '2,400 lbs available',
      hsCode: '7506.20'
    },
    pricing: { basePrice: 17.50, currency: 'CAD', unit: 'lb' },
    availability: { status: 'in_stock', quantity: 2400, leadTimeDays: 2, minimumOrder: 50 },
    verification: { tier: 'fully_verified', badges: ['mill_cert', 'iso_cert'] },
    nafta: { enabled: true, rvc: 85, qualifies: true },
    documents: [
      { id: 'doc-3', name: 'Mill Test Certificate', type: 'mill_cert', status: 'validated' },
      { id: 'doc-4', name: 'ISO 9001 Certificate', type: 'iso_cert', status: 'validated' }
    ],
    views: 892,
    inquiries: 21,
    status: 'active',
    createdAt: '2025-11-15T10:00:00Z'
  },
  {
    id: 'dpp-raw-003',
    assetType: 'raw_material',
    name: 'Aluminum 6061-T6 Bar Stock',
    description: 'Versatile heat-treated aluminum alloy bar stock in various diameters. Excellent machinability, weldability, and corrosion resistance. Ideal for structural components and machined parts.',
    sellerId: 'demo-seller-2',
    seller: { name: 'Grand River Alloys', location: 'Cambridge, ON' },
    specs: {
      material: 'Aluminum 6061-T6',
      form: 'Round Bar',
      dimensions: 'Various: 0.5" to 6" diameter',
      weight: '5,200 lbs total inventory',
      hsCode: '7604.29'
    },
    pricing: { basePrice: 3.85, currency: 'CAD', unit: 'lb' },
    availability: { status: 'in_stock', quantity: 5200, leadTimeDays: 1, minimumOrder: 25 },
    verification: { tier: 'document_supported', badges: ['mill_cert'] },
    nafta: { enabled: true, rvc: 100, qualifies: true },
    documents: [],
    views: 567,
    inquiries: 8,
    status: 'active',
    createdAt: '2025-11-20T10:00:00Z'
  },
  {
    id: 'dpp-raw-004',
    assetType: 'raw_material',
    name: '316L Stainless Steel Plate',
    description: 'Low-carbon 316L stainless steel plate with superior corrosion resistance. Ideal for marine, chemical processing, and food industry applications where chloride exposure is a concern.',
    sellerId: 'demo-seller-1',
    seller: { name: 'ThermalDyne Exhaust', location: 'Mississauga, ON' },
    specs: {
      material: '316L Stainless Steel',
      form: 'Plate',
      dimensions: '48" × 96" × 0.25" to 1"',
      weight: '8,500 lbs',
      hsCode: '7219.33'
    },
    pricing: { basePrice: 11.20, currency: 'CAD', unit: 'lb' },
    availability: { status: 'in_stock', quantity: 8500, leadTimeDays: 5, minimumOrder: 200 },
    verification: { tier: 'basic', badges: [] },
    nafta: { enabled: false, rvc: null, qualifies: null },
    documents: [],
    views: 342,
    inquiries: 5,
    status: 'active',
    createdAt: '2025-12-05T10:00:00Z'
  },
  {
    id: 'dpp-raw-005',
    assetType: 'raw_material',
    name: 'ABS Plastic Pellets (FR Grade)',
    description: 'Flame-retardant ABS plastic pellets meeting UL 94 V-0 rating. Suitable for injection molding automotive and electronic components. Consistent quality with full material certification.',
    sellerId: 'demo-seller-4',
    seller: { name: 'Northern Plastics Corp', location: 'Kitchener, ON' },
    specs: {
      material: 'ABS FR15U (Flame Retardant)',
      form: 'Pellets',
      dimensions: 'N/A',
      weight: '22,000 lbs',
      hsCode: '3903.30',
      color: 'Natural / Black'
    },
    pricing: { basePrice: 2.45, currency: 'CAD', unit: 'lb' },
    availability: { status: 'in_stock', quantity: 22000, leadTimeDays: 2, minimumOrder: 500 },
    verification: { tier: 'document_supported', badges: ['material_cert'] },
    nafta: { enabled: true, rvc: 95, qualifies: true },
    documents: [],
    views: 234,
    inquiries: 3,
    status: 'active',
    createdAt: '2025-11-28T10:00:00Z'
  },

  // FINISHED PARTS (4)
  {
    id: 'dpp-part-001',
    assetType: 'finished_part',
    name: 'ABS Terminal Covers (Injection Molded)',
    description: 'High-impact ABS terminal covers for automotive ABS brake systems. Injection molded with precision tolerances. UL 94 V-0 flame rating. Available in production quantities.',
    sellerId: 'demo-seller-4',
    seller: { name: 'Northern Plastics Corp', location: 'Kitchener, ON' },
    specs: {
      material: 'ABS Plastic (Cycolac FR15U)',
      dimensions: '2.5" × 1.8" × 0.6"',
      weight: '0.12 lbs each',
      certifications: ['UL 94 V-0'],
      hsCode: '3926.90',
      partNumber: 'NPC-TC-2518'
    },
    pricing: { basePrice: 1.15, currency: 'CAD', unit: 'piece', volumeTiers: [
      { minQty: 1000, price: 1.10 },
      { minQty: 5000, price: 1.05 }
    ]},
    availability: { status: 'in_stock', quantity: 45000, leadTimeDays: 7, minimumOrder: 500 },
    verification: { tier: 'fully_verified', badges: ['ppap', 'ul_cert'] },
    nafta: { enabled: true, rvc: 100, qualifies: true },
    documents: [],
    views: 445,
    inquiries: 9,
    status: 'active',
    createdAt: '2025-11-10T10:00:00Z'
  },
  {
    id: 'dpp-part-002',
    assetType: 'finished_part',
    name: 'CNC Machined Hydraulic Manifold',
    description: 'Precision CNC machined hydraulic manifold block from 6061-T6 aluminum. Complex internal porting with tight tolerances. Anodized finish available.',
    sellerId: 'demo-seller-3',
    seller: { name: 'Apex Precision Manufacturing', location: 'Hamilton, ON' },
    specs: {
      material: 'Aluminum 6061-T6',
      dimensions: '6" × 4" × 3"',
      weight: '4.2 lbs',
      tolerances: '±0.001"',
      finish: 'Clear Anodize Type II',
      partNumber: 'APM-HM-6043'
    },
    pricing: { basePrice: 285.00, currency: 'CAD', unit: 'piece' },
    availability: { status: 'made_to_order', quantity: 0, leadTimeDays: 14, minimumOrder: 10 },
    verification: { tier: 'document_supported', badges: ['dimensional_report'] },
    nafta: { enabled: true, rvc: 88, qualifies: true },
    documents: [],
    views: 312,
    inquiries: 6,
    status: 'active',
    createdAt: '2025-12-03T10:00:00Z'
  },
  {
    id: 'dpp-part-003',
    assetType: 'finished_part',
    name: 'Stainless Steel Exhaust Flex Pipe',
    description: 'Flexible exhaust coupling made from 321 stainless steel inner liner with 304 SS outer braid. Designed for high-temperature exhaust systems with vibration isolation.',
    sellerId: 'demo-seller-1',
    seller: { name: 'ThermalDyne Exhaust', location: 'Mississauga, ON' },
    specs: {
      material: '321 SS inner / 304 SS braid',
      dimensions: '2.5" ID × 8" length',
      weight: '1.8 lbs',
      maxTemp: '1400°F',
      partNumber: 'TD-FP-2508'
    },
    pricing: { basePrice: 45.00, currency: 'CAD', unit: 'piece' },
    availability: { status: 'in_stock', quantity: 850, leadTimeDays: 3, minimumOrder: 25 },
    verification: { tier: 'basic', badges: [] },
    nafta: { enabled: true, rvc: 72, qualifies: true },
    documents: [],
    views: 523,
    inquiries: 11,
    status: 'active',
    createdAt: '2025-11-25T10:00:00Z'
  },
  {
    id: 'dpp-part-004',
    assetType: 'finished_part',
    name: 'Surplus Automotive Brackets (Steel)',
    description: 'Surplus production run of stamped steel mounting brackets. Originally manufactured for Tier 1 automotive supplier. Full dimensional conformance, excess inventory from completed program.',
    sellerId: 'demo-seller-3',
    seller: { name: 'Apex Precision Manufacturing', location: 'Hamilton, ON' },
    specs: {
      material: 'Cold Rolled Steel 1008',
      dimensions: '4.5" × 2.2" × 0.09"',
      weight: '0.18 lbs',
      finish: 'E-coat',
      partNumber: 'SURPLUS-BR-452'
    },
    pricing: { basePrice: 0.85, currency: 'CAD', unit: 'piece' },
    availability: { status: 'in_stock', quantity: 12500, leadTimeDays: 2, minimumOrder: 1000 },
    verification: { tier: 'basic', badges: [] },
    nafta: { enabled: false, rvc: null, qualifies: null },
    documents: [],
    views: 189,
    inquiries: 2,
    status: 'active',
    createdAt: '2025-12-08T10:00:00Z'
  },

  // EQUIPMENT (3)
  {
    id: 'dpp-equip-001',
    assetType: 'equipment',
    name: 'Haas VF-2 CNC Vertical Mill',
    description: 'Used Haas VF-2 vertical machining center in excellent condition. Recently serviced with new spindle bearings. Includes 4th axis rotary table, probing system, and chip conveyor.',
    sellerId: 'demo-seller-3',
    seller: { name: 'Apex Precision Manufacturing', location: 'Hamilton, ON' },
    specs: {
      make: 'Haas',
      model: 'VF-2',
      year: 2016,
      hours: 6200,
      serialNumber: '1154789',
      tableSize: '36" × 14"',
      spindleSpeed: '8,100 RPM',
      toolChanger: '20+1 side-mount'
    },
    pricing: { basePrice: 58000.00, currency: 'CAD', unit: 'unit' },
    availability: { status: 'in_stock', quantity: 1, leadTimeDays: 14, minimumOrder: 1 },
    verification: { tier: 'basic', badges: [] },
    nafta: { enabled: false, rvc: null, qualifies: null },
    documents: [],
    views: 756,
    inquiries: 4,
    status: 'active',
    createdAt: '2025-11-08T10:00:00Z'
  },
  {
    id: 'dpp-equip-002',
    assetType: 'equipment',
    name: 'Keyence IM-7500 Instant Measurement System',
    description: 'High-accuracy optical measurement system for production inspection. Measures up to 300 dimensions simultaneously. Includes software license and calibration certification.',
    sellerId: 'demo-seller-3',
    seller: { name: 'Apex Precision Manufacturing', location: 'Hamilton, ON' },
    specs: {
      make: 'Keyence',
      model: 'IM-7500',
      year: 2019,
      hours: 2800,
      accuracy: '±0.0001"',
      measurementRange: '7.87" × 5.91"'
    },
    pricing: { basePrice: 42000.00, currency: 'CAD', unit: 'unit' },
    availability: { status: 'in_stock', quantity: 1, leadTimeDays: 7, minimumOrder: 1 },
    verification: { tier: 'document_supported', badges: ['calibration_cert'] },
    nafta: { enabled: false, rvc: null, qualifies: null },
    documents: [
      { id: 'doc-5', name: 'Calibration Certificate', type: 'calibration_cert', status: 'validated' }
    ],
    views: 423,
    inquiries: 7,
    status: 'active',
    createdAt: '2025-12-02T10:00:00Z'
  },
  {
    id: 'dpp-equip-003',
    assetType: 'equipment',
    name: 'Arburg 370S Injection Molding Machine',
    description: '110-ton Arburg injection molding machine with Selogica control. Excellent for precision plastic parts. Robot-ready with EUROMAP interface. Maintained with OEM parts.',
    sellerId: 'demo-seller-4',
    seller: { name: 'Northern Plastics Corp', location: 'Kitchener, ON' },
    specs: {
      make: 'Arburg',
      model: '370S 700-290',
      year: 2014,
      hours: 18500,
      clampingForce: '110 tons',
      shotSize: '5.5 oz (PS)',
      tieBarSpacing: '14.6" × 14.6"'
    },
    pricing: { basePrice: 75000.00, currency: 'CAD', unit: 'unit' },
    availability: { status: 'in_stock', quantity: 1, leadTimeDays: 21, minimumOrder: 1 },
    verification: { tier: 'basic', badges: [] },
    nafta: { enabled: false, rvc: null, qualifies: null },
    documents: [],
    views: 289,
    inquiries: 3,
    status: 'active',
    createdAt: '2025-11-18T10:00:00Z'
  },

  // SERVICES (3)
  {
    id: 'dpp-svc-001',
    assetType: 'service',
    name: 'Waterjet Cutting Service',
    description: 'Precision waterjet cutting services for metals, plastics, composites, and stone. 60,000 PSI cutting with ±0.003" accuracy. No heat-affected zone. Quick turnaround available.',
    sellerId: 'demo-seller-2',
    seller: { name: 'Grand River Alloys', location: 'Cambridge, ON' },
    specs: {
      capabilities: '60,000 PSI abrasive waterjet',
      capacity: '6\' × 12\' cutting bed',
      materials: 'Aluminum, Steel, Stainless, Titanium, Plastics, Composites',
      accuracy: '±0.003"',
      maxThickness: '6" steel, 8" aluminum'
    },
    pricing: { basePrice: 125.00, currency: 'CAD', unit: 'hour' },
    availability: { status: 'available', quantity: null, leadTimeDays: 3, minimumOrder: 1 },
    verification: { tier: 'fully_verified', badges: ['iso_cert', 'capability_statement'] },
    nafta: { enabled: false, rvc: null, qualifies: null },
    documents: [
      { id: 'doc-6', name: 'ISO 9001:2015 Certificate', type: 'iso_cert', status: 'validated' },
      { id: 'doc-7', name: 'Capability Statement', type: 'capability_statement', status: 'validated' }
    ],
    views: 932,
    inquiries: 21,
    status: 'active',
    createdAt: '2025-10-25T10:00:00Z'
  },
  {
    id: 'dpp-svc-002',
    assetType: 'service',
    name: 'CNC Machining - 5-Axis',
    description: 'Full-service 5-axis CNC machining for complex aerospace and medical components. DMG MORI equipment with full CMM inspection. ITAR registered, AS9100 certified.',
    sellerId: 'demo-seller-3',
    seller: { name: 'Apex Precision Manufacturing', location: 'Hamilton, ON' },
    specs: {
      capabilities: '5-axis simultaneous machining',
      capacity: '12 CNC machines, 3 shifts',
      materials: 'All metals, engineering plastics',
      accuracy: '±0.0005"',
      certifications: ['AS9100D', 'ISO 9001:2015', 'ITAR']
    },
    pricing: { basePrice: 95.00, currency: 'CAD', unit: 'hour' },
    availability: { status: 'available', quantity: null, leadTimeDays: 10, minimumOrder: 1 },
    verification: { tier: 'fully_verified', badges: ['as9100', 'iso_cert'] },
    nafta: { enabled: false, rvc: null, qualifies: null },
    documents: [],
    views: 678,
    inquiries: 15,
    status: 'active',
    createdAt: '2025-11-05T10:00:00Z'
  },
  {
    id: 'dpp-svc-003',
    assetType: 'service',
    name: 'Plastic Injection Molding',
    description: 'Custom injection molding services from prototype to production. 40 to 500 ton presses. In-house tooling design and modification. Scientific molding approach with full process documentation.',
    sellerId: 'demo-seller-4',
    seller: { name: 'Northern Plastics Corp', location: 'Kitchener, ON' },
    specs: {
      capabilities: 'Injection molding 40-500 ton',
      capacity: '24 presses, 24/7 operation',
      materials: 'ABS, PC, PP, PE, Nylon, POM, and engineering resins',
      services: 'Tooling, Assembly, Packaging'
    },
    pricing: { basePrice: 65.00, currency: 'CAD', unit: 'hour' },
    availability: { status: 'available', quantity: null, leadTimeDays: 5, minimumOrder: 1 },
    verification: { tier: 'document_supported', badges: ['iso_cert'] },
    nafta: { enabled: false, rvc: null, qualifies: null },
    documents: [],
    views: 445,
    inquiries: 12,
    status: 'active',
    createdAt: '2025-11-12T10:00:00Z'
  }
];

// NAFTA Inputs for dpp-raw-001 (321 SS Tubing)
const naftaInputs = [
  {
    id: 'nafta-input-001',
    dppId: 'dpp-raw-001',
    name: '321 SS Tubing (raw)',
    category: 'raw_material',
    country: 'USA',
    cost: 12.00,
    createdAt: '2025-12-01T10:00:00Z'
  },
  {
    id: 'nafta-input-002',
    dppId: 'dpp-raw-001',
    name: 'Cutting & Handling',
    category: 'direct_labor',
    country: 'CAN',
    cost: 8.00,
    createdAt: '2025-12-01T10:00:00Z'
  },
  {
    id: 'nafta-input-003',
    dppId: 'dpp-raw-001',
    name: 'Facility Overhead',
    category: 'overhead',
    country: 'CAN',
    cost: 14.00,
    createdAt: '2025-12-01T10:00:00Z'
  },
  {
    id: 'nafta-input-004',
    dppId: 'dpp-raw-001',
    name: 'Packaging Materials',
    category: 'packaging',
    country: 'MEX',
    cost: 4.00,
    createdAt: '2025-12-01T10:00:00Z'
  },
  {
    id: 'nafta-input-005',
    dppId: 'dpp-raw-001',
    name: 'Fasteners (misc)',
    category: 'other',
    country: 'CHN',
    cost: 2.00,
    createdAt: '2025-12-01T10:00:00Z'
  }
];

// Demo message threads
const threads = [
  {
    id: 'thread-001',
    dppId: 'dpp-raw-001',
    participants: ['demo-buyer-1', 'demo-seller-1'],
    createdAt: '2025-12-20T14:00:00Z',
    updatedAt: '2025-12-20T15:30:00Z'
  },
  {
    id: 'thread-002',
    dppId: 'dpp-svc-001',
    participants: ['demo-buyer-2', 'demo-seller-2'],
    createdAt: '2025-12-18T09:00:00Z',
    updatedAt: '2025-12-18T11:00:00Z'
  }
];

const messages = [
  {
    id: 'msg-001',
    threadId: 'thread-001',
    fromUserId: 'demo-buyer-1',
    content: 'Hi — can you confirm continuous temperature rating and lead time to Hamilton?',
    createdAt: '2025-12-20T14:12:00Z',
    readAt: '2025-12-20T14:30:00Z'
  },
  {
    id: 'msg-002',
    threadId: 'thread-001',
    fromUserId: 'demo-seller-1',
    content: 'Yes — rated to 1500°F continuous. Lead time is 3 days pickup, 5–7 days delivery. We can quote freight.',
    createdAt: '2025-12-20T15:30:00Z',
    readAt: null
  },
  {
    id: 'msg-003',
    threadId: 'thread-002',
    fromUserId: 'demo-buyer-2',
    content: 'What\'s your typical turnaround for 1/4" aluminum plate cutting? Need about 50 custom brackets.',
    createdAt: '2025-12-18T09:15:00Z',
    readAt: '2025-12-18T09:45:00Z'
  },
  {
    id: 'msg-004',
    threadId: 'thread-002',
    fromUserId: 'demo-seller-2',
    content: 'For 50 brackets in 1/4" aluminum, we can turn that around in 2-3 business days. Can you send the DXF files?',
    createdAt: '2025-12-18T11:00:00Z',
    readAt: null
  }
];

async function seed() {
  console.log('🌱 Seeding FABIE database...\n');

  db.data = {
    users,
    dpps,
    naftaInputs,
    threads,
    messages
  };

  await db.write();

  console.log(`✅ Created ${users.length} users`);
  console.log(`✅ Created ${dpps.length} DPP listings:`);
  console.log(`   - ${dpps.filter(d => d.assetType === 'raw_material').length} Raw Materials`);
  console.log(`   - ${dpps.filter(d => d.assetType === 'finished_part').length} Finished Parts`);
  console.log(`   - ${dpps.filter(d => d.assetType === 'equipment').length} Equipment`);
  console.log(`   - ${dpps.filter(d => d.assetType === 'service').length} Services`);
  console.log(`✅ Created ${naftaInputs.length} NAFTA inputs`);
  console.log(`✅ Created ${threads.length} message threads with ${messages.length} messages`);
  console.log('\n🎉 Database seeded successfully!');
  console.log('\nRun `npm start` to start the server.\n');
}

seed().catch(console.error);


