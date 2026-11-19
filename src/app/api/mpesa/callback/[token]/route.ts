import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { callbackToken, StkCallbackPayload } from '@/lib/mpesa';
import { applyMpesaResult } from '@/lib/orders';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const expected = callbackToken();
  if (
    token.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  ) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const stk = body?.Body?.stkCallback as StkCallbackPayload | undefined;
    if (stk && typeof stk === 'object') {
      await applyMpesaResult(stk, body);
    } else {
      console.warn('M-Pesa callback without stkCallback:', body);
    }
  } catch (err) {
    console.error('Error processing M-Pesa callback:', err);
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
