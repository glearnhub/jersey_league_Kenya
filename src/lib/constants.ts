export const PRODUCT_VERSIONS: Record<string, string> = {
  fan: 'Fan version',
  player: 'Player version',
  kids: 'Kids',
  retro: 'Retro',
  special: 'Special edition',
  other: 'Other',
};

export const PRODUCT_KITS: Record<string, string> = {
  home: 'Home',
  away: 'Away',
  third: 'Third',
  training: 'Training',
  other: 'Other',
};

export const PRODUCT_BADGES: Record<string, string> = {
  new: 'New arrival',
  best_seller: 'Best seller',
  clearance: 'Clearance sale',
};

export const ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL'] as const;
export const KIDS_SIZES = ['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'] as const;
export const ALL_SIZES = [...ADULT_SIZES, ...KIDS_SIZES] as const;

export const DELIVERY_METHODS: Record<string, string> = {
  standard: 'Standard delivery',
  express: 'Express delivery',
  pickup: 'Store pickup',
};

export const ORDER_STATUSES: Record<string, string> = {
  pending_payment: 'Waiting for payment',
  paid: 'Paid',
  processing: 'Processing',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  failed: 'Payment failed',
};

export function shopConfig() {
  return {
    name: process.env.SHOP_NAME || 'Jersey League Kenya',
    currency: 'KES',
    printFee: parseInt(process.env.SHOP_PRINT_FEE || '400', 10),
    sleeveBadgeFee: parseInt(process.env.SHOP_SLEEVE_BADGE_FEE || '0', 10),
    phone: process.env.SHOP_PHONE || '+254185207143',
    whatsapp: process.env.SHOP_WHATSAPP || '254185207143',
    whatsappUrl: process.env.SHOP_WHATSAPP_URL || 'https://wa.me/message/RV5POMHO6E7LF1',
    address: process.env.SHOP_ADDRESS || '',
    hours: process.env.SHOP_HOURS || 'Mon - Sat: 9:00 AM - 7:00 PM',
    mapsUrl: process.env.SHOP_MAPS_URL || '',
    paymentWindowMinutes: parseInt(process.env.SHOP_PAYMENT_WINDOW || '15', 10),
    maxQuantityPerLine: 10,
  };
}

export function cleanPrintName(name?: string | null): string | null {
  if (!name) return null;
  const withoutTags = name.replace(/<[^>]*>/g, '');
  const ascii = withoutTags
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ø/g, 'O')
    .replace(/ø/g, 'o')
    .replace(/Æ/g, 'AE')
    .replace(/æ/g, 'ae');
  const cleaned = ascii.replace(/[^A-Za-z '-]/g, '').trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 14).toUpperCase().trim();
}

export function cleanPrintNumber(num?: string | null): string | null {
  if (!num) return null;
  const digits = num.replace(/\D/g, '');
  if (!digits) return null;
  return String(parseInt(digits.slice(0, 2), 10));
}

export function deliveryFeeFor(
  zone: { method: string; fee: number; freeOver: number | null },
  subtotal: number
): number {
  if (zone.method === 'pickup') return 0;
  if (zone.freeOver !== null && subtotal > zone.freeOver) return 0;
  return zone.fee;
}

export function orderNumberFor(id: number): string {
  return `JLK-${String(id).padStart(6, '0')}`;
}

export function imageUrlFor(path?: string | null): string | null {
  if (!path) return null;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('/') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  return `/storage/${path}`;
}

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE')}`;
}
