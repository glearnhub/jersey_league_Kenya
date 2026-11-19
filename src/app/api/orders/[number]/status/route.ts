import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOrderSignature } from '@/lib/signed-url';
import { getOrderState, settleOrder } from '@/lib/orders';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const sig = req.nextUrl.searchParams.get('sig');
  if (!verifyOrderSignature(number, sig)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const order = await prisma.order.findUnique({ where: { number } });
  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await settleOrder(order.id);
  const state = await getOrderState(order.id);

  return NextResponse.json({ state });
}
