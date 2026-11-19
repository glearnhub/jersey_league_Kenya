import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOrderSignature } from '@/lib/signed-url';
import { normalizePhone } from '@/lib/mpesa';
import { startPayment } from '@/lib/orders';

export async function POST(
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

  const body = await req.json();
  const phone = normalizePhone(body.phone);
  if (!phone) {
    return NextResponse.json(
      { error: 'Enter a Safaricom number like 0712 345 678.' },
      { status: 422 }
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { phone },
  });

  try {
    await startPayment(order.id, phone);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'M-Pesa could not start the payment.' },
      { status: 400 }
    );
  }
}
