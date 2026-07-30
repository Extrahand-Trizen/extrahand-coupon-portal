/** Service / category slugs for coupon targeting (Book Now catalog ids + Post & Compare category slugs). */

export type CategoryOption = {
  slug: string;
  label: string;
  /** Group shown in the admin dropdown. */
  group: 'Book Now' | 'Post & Compare';
};

/** Book Now cart `catalogId` values — same ids sent as serviceIds at Book Now checkout. */
const BOOK_NOW_RAW: Array<[string, string]> = [
  ['Full House Cleaning', 'full-house'],
  ['Bathroom Cleaning', 'bathroom'],
  ['Kitchen Cleaning', 'kitchen'],
  ['Sofa Cleaning', 'sofa'],
  ['Mattress Cleaning', 'mattress'],
  ['Window & Glass Cleaning', 'window-glass'],
  ['AC Services', 'ac-services'],
  ['Appliance Repair', 'appliance-repair'],
];

/** Post & Compare category slugs (aligned with mobile CATEGORY_TO_SLUG). */
const POST_COMPARE_RAW: Array<[string, string]> = [
  ['Business Services', 'business-services'],
  ['Marketing & Design', 'marketing-design'],
  ['AC Repair & Service', 'ac-repair'],
  ['Appliance Repair', 'appliance-repair'],
  ['Beauty Services', 'beauty-services'],
  ['Car Washing / Car Cleaning', 'car-washing'],
  ['Roadside Assistance', 'roadside-assistance'],
  ['Maid', 'maid'],
  ['Personal Assistance', 'personal-assistance'],
  ['Carpenter', 'carpenter'],
  ['Cooking / Home Chef', 'cooking-home-chef'],
  ['Deep Cleaning', 'deep-cleaning'],
  ['Delivery / Pickup Services', 'delivery-pickup-services'],
  ['Driver / Chauffeur', 'driver-chauffeur'],
  ['Electrical', 'electrical'],
  ['Event Services', 'event-services'],
  ['Fitness Trainers', 'fitness-trainers'],
  ['Furniture Assembly', 'furniture-assembly'],
  ['Gardening', 'gardening'],
  ['Handyperson / General Repairs', 'handyperson'],
  ['Home Cleaning', 'home-cleaning'],
  ['IT Support / Laptop Repair', 'it-support'],
  ['Laundry / Ironing', 'laundry-ironing'],
  ['Massage / Spa', 'massage-spa'],
  ['Packers & Movers', 'packers-movers'],
  ['Painting', 'painting'],
  ['Pest Control', 'pest-control'],
  ['Photographer / Videographer', 'photographer-videographer'],
  ['Plumbing', 'plumbing'],
  ['Security Patrol / Watchman', 'security-patrol'],
  ['Senior Care / Elder Care', 'senior-care-elder-care'],
  ['Tutors', 'tutors'],
  ['Water & Tanker Services', 'water-tanker-services'],
  ['Pet Services', 'pet-services'],
  ['Accounting', 'accounting'],
  ['Receptionist Services', 'receptionist-services'],
  ['Writing Services', 'writing-services'],
  ['Other', 'other'],
];

function buildOptions(
  rows: Array<[string, string]>,
  group: CategoryOption['group'],
): CategoryOption[] {
  const seen = new Set<string>();
  const out: CategoryOption[] = [];
  for (const [label, slug] of rows) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ slug, label, group });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

export const BOOK_NOW_SERVICE_OPTIONS = buildOptions(BOOK_NOW_RAW, 'Book Now');
export const POST_COMPARE_CATEGORY_OPTIONS = buildOptions(POST_COMPARE_RAW, 'Post & Compare');

/**
 * Combined list for the coupon admin multi-select.
 * Note: `appliance-repair` exists in both flows with the same slug — one entry is enough.
 */
export const CATEGORY_OPTIONS: CategoryOption[] = (() => {
  const bySlug = new Map<string, CategoryOption>();
  for (const opt of [...BOOK_NOW_SERVICE_OPTIONS, ...POST_COMPARE_CATEGORY_OPTIONS]) {
    const existing = bySlug.get(opt.slug);
    if (!existing) {
      bySlug.set(opt.slug, opt);
      continue;
    }
    // Prefer a combined label when the same slug is used in both flows.
    if (existing.group !== opt.group) {
      bySlug.set(opt.slug, {
        slug: opt.slug,
        label: existing.label,
        group: existing.group,
      });
    }
  }
  return [...bySlug.values()].sort((a, b) => {
    if (a.group !== b.group) return a.group === 'Book Now' ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
})();

/** Options shown in grouped dropdown (Book Now first, then Post & Compare; shared slugs under Book Now). */
export const CATEGORY_OPTIONS_GROUPED: {
  group: CategoryOption['group'];
  options: CategoryOption[];
}[] = [
  {
    group: 'Book Now',
    options: BOOK_NOW_SERVICE_OPTIONS,
  },
  {
    group: 'Post & Compare',
    options: POST_COMPARE_CATEGORY_OPTIONS.filter(
      (c) => !BOOK_NOW_SERVICE_OPTIONS.some((b) => b.slug === c.slug),
    ),
  },
];

export function labelForSlug(slug: string): string {
  const bookNow = BOOK_NOW_SERVICE_OPTIONS.find((c) => c.slug === slug);
  const post = POST_COMPARE_CATEGORY_OPTIONS.find((c) => c.slug === slug);
  if (bookNow && post) return bookNow.label;
  if (bookNow) return `${bookNow.label} (Book Now)`;
  if (post) return post.label;
  return slug;
}

const BOOK_NOW_SLUG_SET = new Set(BOOK_NOW_SERVICE_OPTIONS.map((c) => c.slug));
const POST_COMPARE_SLUG_SET = new Set(POST_COMPARE_CATEGORY_OPTIONS.map((c) => c.slug));

/** Infer applicable flows from selected service/category slugs. */
export function flowsFromServiceIds(serviceIds: string[]): {
  flowBookNow: boolean;
  flowPostCompare: boolean;
} {
  let flowBookNow = false;
  let flowPostCompare = false;
  for (const raw of serviceIds) {
    const slug = String(raw || '').trim();
    if (!slug) continue;
    const isBookNow = BOOK_NOW_SLUG_SET.has(slug);
    const isPost = POST_COMPARE_SLUG_SET.has(slug);
    if (isBookNow) flowBookNow = true;
    if (isPost) flowPostCompare = true;
  }
  return { flowBookNow, flowPostCompare };
}
