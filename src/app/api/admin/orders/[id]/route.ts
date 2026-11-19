import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminUser } from '@/lib/auth';
import { cancelOrder } from '@/lib/orders';
import { ORDER_STATUSES } from '@/lib/constants';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const orderId = Number(id);
  const body = await req.json();
  const newStatus = String(body.status || '');

  if (!ORDER_STATUSES[newStatus]) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 422 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (
    (newStatus === 'paid' && order.status !== 'paid') ||
    (newStatus === 'pending_payment' && order.status !== 'pending_payment')
  ) {
    return NextResponse.json(
      { error: '"Paid" is set by M-Pesa, not by hand.' },
      { status: 422 }
    );
  }

  if (
    order.status === 'pending_payment' &&
    (newStatus === 'cancelled' || newStatus === 'failed')
  ) {
    await cancelOrder(order.id, newStatus);
  } else {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus },
    });
  }

  return NextResponse.json({ ok: true });
}
