/**
 * Comprehensive Category & Subcategory Catalog for Coupon Targeting.
 * Supports:
 * 1. Book Now Categories (with their full package/SKU lists and an 'All' option).
 * 2. Post & Compare Categories (with their subcategories and an 'All' option).
 */

export type SubcategoryOption = {
  slug: string;
  label: string;
  isAll?: boolean;
};

export type CategoryCatalogItem = {
  slug: string;
  label: string;
  group: 'Book Now' | 'Post & Compare';
  subcategories: SubcategoryOption[];
};

export const CATEGORY_CATALOG: CategoryCatalogItem[] = [
  // ==========================================
  // BOOK NOW CATEGORIES & SUBCATEGORIES (SKUs)
  // ==========================================
  {
    slug: 'hourly-helper',
    label: 'Hourly Based Services',
    group: 'Book Now',
    subcategories: [
      { slug: 'hourly-helper', label: 'All Hourly Based Durations', isAll: true },
      { slug: 'hourly-1h', label: '1 Hour' },
      { slug: 'hourly-1-5h', label: '1.5 Hours' },
      { slug: 'hourly-2h', label: '2 Hours' },
      { slug: 'hourly-3h', label: '3 Hours' },
      { slug: 'hourly-4h', label: '4 Hours' },
    ],
  },
  {
    slug: 'full-house',
    label: 'Full House Cleaning',
    group: 'Book Now',
    subcategories: [
      { slug: 'full-house', label: 'All Full House Cleaning', isAll: true },
      { slug: '1bhk-economy', label: '1 BHK Economy Clean' },
      { slug: '1bhk-deep', label: '1 BHK Deep Clean' },
      { slug: '2bhk-economy', label: '2 BHK Economy Clean' },
      { slug: '2bhk-deep', label: '2 BHK Deep Clean' },
      { slug: '3bhk-economy', label: '3 BHK Economy Clean' },
      { slug: '4bhk-economy', label: '4 BHK Economy Clean' },
      { slug: 'combo-1bed', label: '1 Bedroom Combo' },
      { slug: 'combo-2bed', label: '2 Bedroom Combo' },
      { slug: 'full-home-deep', label: 'Full Home Deep Clean' },
    ],
  },
  {
    slug: 'bathroom',
    label: 'Bathroom Cleaning',
    group: 'Book Now',
    subcategories: [
      { slug: 'bathroom', label: 'All Bathroom Cleaning', isAll: true },
      { slug: 'regular-clean', label: 'Regular Bathroom Clean' },
    ],
  },
  {
    slug: 'kitchen',
    label: 'Kitchen Cleaning',
    group: 'Book Now',
    subcategories: [
      { slug: 'kitchen', label: 'All Kitchen Cleaning', isAll: true },
      { slug: 'standard-kitchen-clean', label: 'Standard Kitchen Clean' },
      { slug: 'deep-kitchen-clean', label: 'Deep Kitchen Clean' },
      { slug: 'empty-kitchen-clean', label: 'Empty Kitchen Clean' },
      { slug: 'kitchen-chimney-clean', label: 'Kitchen Chimney Clean' },
      { slug: 'post-reno-kitchen-clean', label: 'Post Reno Kitchen Clean' },
    ],
  },
  {
    slug: 'sofa',
    label: 'Sofa Cleaning',
    group: 'Book Now',
    subcategories: [
      { slug: 'sofa', label: 'All Sofa Cleaning', isAll: true },
      { slug: '2-seater-dry-foam', label: '2 Seater Dry Foam Wash' },
      { slug: '3-seater-dry-foam', label: '3 Seater Dry Foam Wash' },
      { slug: 'l-shape-dry-foam', label: 'L-Shape Dry Foam Wash' },
      { slug: 'sofa-chair-clean', label: 'Sofa Chair Clean' },
    ],
  },
  {
    slug: 'mattress',
    label: 'Mattress Cleaning',
    group: 'Book Now',
    subcategories: [
      { slug: 'mattress', label: 'All Mattress Cleaning', isAll: true },
      { slug: 'single-mattress-clean', label: 'Single Mattress Clean' },
      { slug: 'double-queen-mattress-clean', label: 'Double/Queen Mattress Clean' },
      { slug: 'king-mattress-clean', label: 'King Mattress Clean' },
      { slug: 'mattress-protector-wash', label: 'Mattress Protector Wash' },
    ],
  },
  {
    slug: 'window-glass',
    label: 'Window & Glass Cleaning',
    group: 'Book Now',
    subcategories: [
      { slug: 'window-glass', label: 'All Window & Glass Cleaning', isAll: true },
      { slug: 'interior-windows-per-5', label: 'Interior Windows (per 5)' },
      { slug: 'exterior-windows-per-5', label: 'Exterior Windows (per 5)' },
      { slug: 'glass-door-per-door', label: 'Glass Door (per door)' },
      { slug: 'mirror-clean-per-mirror', label: 'Mirror Clean (per mirror)' },
    ],
  },
  {
    slug: 'ac-services',
    label: 'AC Services',
    group: 'Book Now',
    subcategories: [
      { slug: 'ac-services', label: 'All AC Services', isAll: true },
      { slug: 'foam-blast-service', label: 'Foam Blast Service' },
      { slug: 'premium-ac-service', label: 'Premium AC Service' },
      { slug: 'anti-rust-service', label: 'Anti-Rust Service' },
      { slug: 'r22-gas-refill', label: 'R22 Gas Refill' },
      { slug: 'r32-gas-refill', label: 'R32 Gas Refill' },
      { slug: 'split-ac-installation', label: 'Split AC Installation' },
      { slug: 'split-ac-uninstallation', label: 'Split AC Uninstallation' },
      { slug: 'ac-diagnosis-inspection', label: 'AC Diagnosis / Inspection' },
    ],
  },
  {
    slug: 'appliance-repair',
    label: 'Appliance Repair',
    group: 'Book Now',
    subcategories: [
      { slug: 'appliance-repair', label: 'All Appliance Repair', isAll: true },
      { slug: 'wm-checkup', label: 'Washing Machine Check-Up' },
      { slug: 'wm-installation', label: 'Washing Machine Installation' },
      { slug: 'wm-uninstallation', label: 'Washing Machine Uninstallation' },
      { slug: 'fridge-checkup', label: 'Refrigerator Check-Up' },
      { slug: 'purifier-checkup', label: 'Water Purifier Check-Up' },
      { slug: 'purifier-filter-checkup', label: 'Water Purifier Filter Check-Up' },
      { slug: 'purifier-regular-service', label: 'Water Purifier Regular Service' },
      { slug: 'purifier-installation', label: 'Water Purifier Installation' },
      { slug: 'purifier-uninstallation', label: 'Water Purifier Uninstallation' },
      { slug: 'geyser-checkup', label: 'Geyser Check-Up' },
      { slug: 'geyser-servicing', label: 'Geyser Service' },
      { slug: 'geyser-installation', label: 'Geyser Installation' },
      { slug: 'geyser-uninstallation', label: 'Geyser Uninstallation' },
    ],
  },

  // ==========================================
  // POST & COMPARE CATEGORIES & SUBCATEGORIES
  // ==========================================
  {
    slug: 'home-cleaning',
    label: 'Home Cleaning',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'home-cleaning', label: 'All Home Cleaning', isAll: true },
      { slug: 'general-home-cleaning', label: 'General Home Cleaning' },
      { slug: 'pc-bathroom-cleaning', label: 'Bathroom Cleaning' },
      { slug: 'pc-kitchen-cleaning', label: 'Kitchen Cleaning' },
      { slug: 'sofa-upholstery-cleaning', label: 'Sofa / Upholstery Cleaning' },
      { slug: 'window-cleaning', label: 'Window Cleaning' },
      { slug: 'carpet-cleaning', label: 'Carpet Cleaning' },
    ],
  },
  {
    slug: 'deep-cleaning',
    label: 'Deep Cleaning',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'deep-cleaning', label: 'All Deep Cleaning', isAll: true },
      { slug: 'full-home-deep-cleaning', label: 'Full Home Deep Cleaning' },
      { slug: 'move-in-move-out-cleaning', label: 'Move-in / Move-out Cleaning' },
      { slug: 'post-renovation-cleaning', label: 'Post-renovation Cleaning' },
      { slug: 'office-deep-cleaning', label: 'Office Deep Cleaning' },
    ],
  },
  {
    slug: 'plumbing',
    label: 'Plumbing',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'plumbing', label: 'All Plumbing', isAll: true },
      { slug: 'tap-faucet-repair', label: 'Tap / Faucet Repair' },
      { slug: 'pipe-leakage-fix', label: 'Pipe Leakage Fix' },
      { slug: 'drain-blockage', label: 'Drain Blockage' },
      { slug: 'bathroom-fittings', label: 'Bathroom Fittings' },
    ],
  },
  {
    slug: 'electrical',
    label: 'Electrical',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'electrical', label: 'All Electrical', isAll: true },
      { slug: 'fan-light-installation', label: 'Fan / Light Installation' },
      { slug: 'wiring-repair', label: 'Wiring Repair' },
      { slug: 'switchboard-fix', label: 'Switchboard Fix' },
      { slug: 'inverter-ups-setup', label: 'Inverter / UPS Setup' },
    ],
  },
  {
    slug: 'carpenter',
    label: 'Carpenter',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'carpenter', label: 'All Carpenter Work', isAll: true },
      { slug: 'furniture-repair', label: 'Furniture Repair' },
      { slug: 'door-window-work', label: 'Door / Window Work' },
      { slug: 'custom-woodwork', label: 'Custom Woodwork' },
      { slug: 'shelf-installation', label: 'Shelf Installation' },
    ],
  },
  {
    slug: 'painting',
    label: 'Painting',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'painting', label: 'All Painting', isAll: true },
      { slug: 'wall-painting', label: 'Wall Painting' },
      { slug: 'touch-up-work', label: 'Touch-up Work' },
      { slug: 'texture-design-paint', label: 'Texture / Design Paint' },
      { slug: 'exterior-painting', label: 'Exterior Painting' },
    ],
  },
  {
    slug: 'ac-repair',
    label: 'AC Repair & Service',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'ac-repair', label: 'All AC Repair & Service', isAll: true },
      { slug: 'pc-ac-service', label: 'AC Service' },
      { slug: 'pc-gas-refill', label: 'Gas Refill' },
      { slug: 'pc-ac-installation', label: 'AC Installation' },
      { slug: 'ac-not-cooling', label: 'AC Not Cooling' },
    ],
  },
  {
    slug: 'pest-control',
    label: 'Pest Control',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'pest-control', label: 'All Pest Control', isAll: true },
      { slug: 'general-pest-control', label: 'General Pest Control' },
      { slug: 'termite-treatment', label: 'Termite Treatment' },
      { slug: 'cockroach-control', label: 'Cockroach Control' },
      { slug: 'mosquito-control', label: 'Mosquito Control' },
    ],
  },
  {
    slug: 'car-washing',
    label: 'Car Washing / Cleaning',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'car-washing', label: 'All Car Washing', isAll: true },
      { slug: 'exterior-wash', label: 'Exterior Wash' },
      { slug: 'interior-cleaning', label: 'Interior Cleaning' },
      { slug: 'foam-wash', label: 'Foam Wash' },
      { slug: 'polish-detailing', label: 'Polish & Detailing' },
    ],
  },
  {
    slug: 'roadside-assistance',
    label: 'Roadside Assistance',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'roadside-assistance', label: 'All Roadside Assistance', isAll: true },
      { slug: 'bike-repair', label: 'Bike Repair' },
      { slug: 'car-repair', label: 'Car Repair' },
    ],
  },
  {
    slug: 'maid',
    label: 'Maid',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'maid', label: 'All Maid Services', isAll: true },
      { slug: 'daily-maid', label: 'Daily Maid' },
      { slug: 'part-time-maid', label: 'Part-time Maid' },
      { slug: 'utensil-washing', label: 'Utensil Washing' },
      { slug: 'home-upkeep', label: 'Home Upkeep' },
    ],
  },
  {
    slug: 'personal-assistance',
    label: 'Personal Assistance',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'personal-assistance', label: 'All Personal Assistance', isAll: true },
      { slug: 'any-work-on-behalf', label: 'Any work on your behalf' },
      { slug: 'office-document-visits', label: 'Office / document visits' },
      { slug: 'shopping-errands', label: 'Shopping & errands' },
      { slug: 'queue-follow-ups', label: 'Queue / follow-ups' },
      { slug: 'custom-request', label: 'Custom request' },
    ],
  },
  {
    slug: 'cooking-home-chef',
    label: 'Cooking / Home Chef',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'cooking-home-chef', label: 'All Cooking / Chef', isAll: true },
      { slug: 'daily-cooking', label: 'Daily Cooking' },
      { slug: 'party-event-cooking', label: 'Party / Event Cooking' },
      { slug: 'diet-specific-meals', label: 'Diet Specific Meals' },
    ],
  },
  {
    slug: 'packers-movers',
    label: 'Packers & Movers',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'packers-movers', label: 'All Packers & Movers', isAll: true },
      { slug: 'home-shifting', label: 'Home Shifting' },
      { slug: 'office-relocation', label: 'Office Relocation' },
      { slug: 'packing-help', label: 'Packing Help' },
      { slug: 'loading-unloading', label: 'Loading / Unloading' },
    ],
  },
  {
    slug: 'delivery-pickup-services',
    label: 'Delivery / Pickup Services',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'delivery-pickup-services', label: 'All Delivery / Pickup', isAll: true },
      { slug: 'parcel-pickup', label: 'Parcel Pickup' },
      { slug: 'document-delivery', label: 'Document Delivery' },
      { slug: 'grocery-pickup', label: 'Grocery Pickup' },
      { slug: 'furniture-delivery', label: 'Furniture Delivery' },
      { slug: 'food-delivery', label: 'Food Delivery' },
      { slug: 'courier-services', label: 'Courier Services' },
      { slug: 'local-transport', label: 'Local Transport' },
      { slug: 'intercity-transport', label: 'Intercity Transport' },
    ],
  },
  {
    slug: 'gardening',
    label: 'Gardening',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'gardening', label: 'All Gardening', isAll: true },
      { slug: 'lawn-mowing', label: 'Lawn Mowing' },
      { slug: 'weeding', label: 'Weeding' },
      { slug: 'plant-care', label: 'Plant Care' },
      { slug: 'garden-cleanup', label: 'Garden Cleanup' },
      { slug: 'tree-trimming', label: 'Tree Trimming' },
    ],
  },
  {
    slug: 'handyperson',
    label: 'Handyperson / General Repairs',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'handyperson', label: 'All Handyperson', isAll: true },
      { slug: 'minor-repairs', label: 'Minor Repairs' },
      { slug: 'wall-mounting', label: 'Wall Mounting' },
      { slug: 'curtain-rod-fitting', label: 'Curtain / Rod Fitting' },
      { slug: 'home-fixes', label: 'Home Fixes' },
      { slug: 'door-window-repair', label: 'Door / Window Repair' },
      { slug: 'lock-repair', label: 'Lock Repair' },
    ],
  },
  {
    slug: 'furniture-assembly',
    label: 'Furniture Assembly',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'furniture-assembly', label: 'All Furniture Assembly', isAll: true },
      { slug: 'bed-assembly', label: 'Bed Assembly' },
      { slug: 'wardrobe-assembly', label: 'Wardrobe Assembly' },
      { slug: 'table-desk-assembly', label: 'Table / Desk Assembly' },
      { slug: 'ikea-assembly', label: 'IKEA Assembly' },
    ],
  },
  {
    slug: 'security-patrol',
    label: 'Security Patrol / Watchman',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'security-patrol', label: 'All Security Patrol', isAll: true },
      { slug: 'residential-guard', label: 'Residential Guard' },
      { slug: 'night-patrol', label: 'Night Patrol' },
      { slug: 'event-security', label: 'Event Security' },
      { slug: 'gate-watchman', label: 'Gate Watchman' },
    ],
  },
  {
    slug: 'beauty-services',
    label: 'Beauty Services',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'beauty-services', label: 'All Beauty Services', isAll: true },
      { slug: 'pc-makeup', label: 'Makeup' },
      { slug: 'pc-hair-styling', label: 'Hair Styling' },
      { slug: 'pc-facial', label: 'Facial' },
      { slug: 'pc-nail-services', label: 'Nail Services' },
      { slug: 'pc-beard-grooming', label: 'Beard Grooming' },
    ],
  },
  {
    slug: 'driver-chauffeur',
    label: 'Driver / Chauffeur',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'driver-chauffeur', label: 'All Driver / Chauffeur', isAll: true },
      { slug: 'city-drive', label: 'City Drive' },
      { slug: 'outstation-drive', label: 'Outstation Drive' },
      { slug: 'personal-driver-monthly', label: 'Personal Driver (Monthly)' },
    ],
  },
  {
    slug: 'fitness-trainers',
    label: 'Fitness Trainers',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'fitness-trainers', label: 'All Fitness Trainers', isAll: true },
      { slug: 'personal-gym-trainer', label: 'Personal Gym Trainer' },
      { slug: 'yoga-instructor', label: 'Yoga Instructor' },
      { slug: 'zumba-dance-fitness', label: 'Zumba / Dance Fitness' },
    ],
  },
  {
    slug: 'it-support',
    label: 'IT Support / Laptop Repair',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'it-support', label: 'All IT Support', isAll: true },
      { slug: 'laptop-desktop-repair', label: 'Laptop / Desktop Repair' },
      { slug: 'os-software-setup', label: 'OS & Software Setup' },
      { slug: 'wifi-network-setup', label: 'Wi-Fi & Network Setup' },
      { slug: 'printer-setup', label: 'Printer Setup' },
    ],
  },
  {
    slug: 'laundry-ironing',
    label: 'Laundry / Ironing',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'laundry-ironing', label: 'All Laundry / Ironing', isAll: true },
      { slug: 'wash-fold', label: 'Wash & Fold' },
      { slug: 'wash-iron', label: 'Wash & Iron' },
      { slug: 'steam-ironing', label: 'Steam Ironing' },
      { slug: 'dry-cleaning', label: 'Dry Cleaning' },
    ],
  },
  {
    slug: 'massage-spa',
    label: 'Massage / Spa',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'massage-spa', label: 'All Massage / Spa', isAll: true },
      { slug: 'body-massage', label: 'Body Massage' },
      { slug: 'head-shoulder-massage', label: 'Head & Shoulder Massage' },
      { slug: 'foot-reflexology', label: 'Foot Reflexology' },
    ],
  },
  {
    slug: 'photographer-videographer',
    label: 'Photographer / Videographer',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'photographer-videographer', label: 'All Photography', isAll: true },
      { slug: 'event-shoot', label: 'Event Shoot' },
      { slug: 'portrait-portfolio', label: 'Portrait / Portfolio Shoot' },
      { slug: 'product-shoot', label: 'Product Shoot' },
    ],
  },
  {
    slug: 'tutors',
    label: 'Tutors',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'tutors', label: 'All Tutors', isAll: true },
      { slug: 'school-subjects-1-10', label: 'School Subjects (Class 1-10)' },
      { slug: 'science-maths-11-12', label: 'Science & Maths (Class 11-12)' },
      { slug: 'language-learning', label: 'Language Learning' },
      { slug: 'music-instrument-tutor', label: 'Music / Instrument Tutor' },
    ],
  },
  {
    slug: 'water-tanker-services',
    label: 'Water & Tanker Services',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'water-tanker-services', label: 'All Water & Tanker', isAll: true },
      { slug: 'domestic-water-tanker', label: 'Domestic Water Tanker' },
      { slug: 'commercial-water-tanker', label: 'Commercial Water Tanker' },
      { slug: 'water-tank-cleaning', label: 'Water Tank Cleaning' },
    ],
  },
  {
    slug: 'pet-services',
    label: 'Pet Services',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'pet-services', label: 'All Pet Services', isAll: true },
      { slug: 'dog-walking', label: 'Dog Walking' },
      { slug: 'pet-grooming', label: 'Pet Grooming' },
      { slug: 'pet-sitting-boarding', label: 'Pet Sitting / Boarding' },
    ],
  },
  {
    slug: 'business-services',
    label: 'Business Services',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'business-services', label: 'All Business Services', isAll: true },
      { slug: 'gst-tax-filing', label: 'GST & Tax Filing' },
      { slug: 'company-registration', label: 'Company Registration' },
      { slug: 'bookkeeping', label: 'Bookkeeping' },
    ],
  },
  {
    slug: 'marketing-design',
    label: 'Marketing & Design',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'marketing-design', label: 'All Marketing & Design', isAll: true },
      { slug: 'logo-graphic-design', label: 'Logo & Graphic Design' },
      { slug: 'social-media-management', label: 'Social Media Management' },
      { slug: 'website-development', label: 'Website Development' },
    ],
  },
  {
    slug: 'event-services',
    label: 'Event Services',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'event-services', label: 'All Event Services', isAll: true },
      { slug: 'birthday-party-decor', label: 'Birthday / Party Decor' },
      { slug: 'catering-services', label: 'Catering Services' },
      { slug: 'dj-sound-setup', label: 'DJ & Sound Setup' },
    ],
  },
  {
    slug: 'senior-care-elder-care',
    label: 'Senior Care / Elder Care',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'senior-care-elder-care', label: 'All Senior Care', isAll: true },
      { slug: 'daily-elder-care', label: 'Daily Elder Care' },
      { slug: 'bedridden-patient-care', label: 'Bedridden Patient Care' },
      { slug: 'medical-visit-companion', label: 'Medical Visit Companion' },
    ],
  },
  {
    slug: 'accounting',
    label: 'Accounting',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'accounting', label: 'All Accounting', isAll: true },
      { slug: 'income-tax-filing', label: 'Income Tax Filing' },
      { slug: 'gst-compliance', label: 'GST Compliance' },
      { slug: 'auditing-services', label: 'Auditing Services' },
    ],
  },
  {
    slug: 'receptionist-services',
    label: 'Receptionist Services',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'receptionist-services', label: 'All Receptionist Services', isAll: true },
      { slug: 'front-desk-support', label: 'Front Desk Support' },
      { slug: 'virtual-receptionist', label: 'Virtual Receptionist' },
    ],
  },
  {
    slug: 'writing-services',
    label: 'Writing Services',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'writing-services', label: 'All Writing Services', isAll: true },
      { slug: 'content-writing', label: 'Content Writing' },
      { slug: 'resume-cv-writing', label: 'Resume & CV Writing' },
      { slug: 'academic-business-writing', label: 'Academic / Business Writing' },
    ],
  },
  {
    slug: 'other',
    label: 'Other',
    group: 'Post & Compare',
    subcategories: [
      { slug: 'other', label: 'All Other Services', isAll: true },
      { slug: 'custom-task', label: 'Custom Task' },
    ],
  },
];

/** Lookup helpers */
export function findCategoryBySlug(slug: string): CategoryCatalogItem | undefined {
  return CATEGORY_CATALOG.find((cat) => cat.slug === slug);
}

export function findCategoryForSubcategorySlug(subSlug: string): CategoryCatalogItem | undefined {
  return CATEGORY_CATALOG.find((cat) =>
    cat.subcategories.some((sub) => sub.slug === subSlug)
  );
}

export function labelForSubcategorySlug(slug: string): string {
  for (const cat of CATEGORY_CATALOG) {
    const sub = cat.subcategories.find((s) => s.slug === slug);
    if (sub) {
      return `${cat.label} · ${sub.label}`;
    }
  }
  return slug;
}

/** Grouped categories for the Category dropdown */
export const CATEGORY_GROUPS = [
  {
    group: 'Book Now',
    categories: CATEGORY_CATALOG.filter((c) => c.group === 'Book Now'),
  },
  {
    group: 'Post & Compare',
    categories: CATEGORY_CATALOG.filter((c) => c.group === 'Post & Compare'),
  },
];

