import { NextResponse } from 'next/server';
import { reconcileAndExpireAll } from '@/lib/orders';

export async function GET() {
  try {
    const result = await reconcileAndExpireAll();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('Cron reconcile failed:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
