import crypto from 'crypto';

function getSecret(): string {
  return process.env.APP_SECRET || 'jersey-league-kenya-default-secret-key';
}

export function signOrderNumber(orderNumber: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(`order:${orderNumber}`)
    .digest('hex')
    .slice(0, 40);
}

export function verifyOrderSignature(orderNumber: string, signature?: string | null): boolean {
  if (!signature) return false;
  const expected = signOrderNumber(orderNumber);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function orderLink(orderNumber: string): string {
  const sig = signOrderNumber(orderNumber);
  return `/orders/${encodeURIComponent(orderNumber)}?sig=${sig}`;
}
