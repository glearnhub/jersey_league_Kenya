import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/mpesa';
import { OrderError, placeOrder, startPayment } from '@/lib/orders';
import { orderLink } from '@/lib/signed-url';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customerName = String(body.customerName || '').trim();
    const rawPhone = String(body.phone || '').trim();
    const email = body.email ? String(body.email).trim() : null;
    const deliveryZoneId = Number(body.deliveryZoneId);
    const address = body.address ? String(body.address).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;
    const lines = Array.isArray(body.lines) ? body.lines : [];

    const errors: Record<string, string> = {};
    if (!customerName) errors.customerName = 'Enter your name.';
    const phone = normalizePhone(rawPhone);
    if (!phone) errors.phone = 'Enter a Safaricom number like 0712 345 678.';
    if (!deliveryZoneId) errors.deliveryZoneId = 'Choose how you want to receive your order.';

    const zone = deliveryZoneId
      ? await prisma.deliveryZone.findFirst({ where: { id: deliveryZoneId, isActive: true } })
      : null;
    if (!zone) {
      errors.deliveryZoneId = 'Choose how you want to receive your order.';
    } else if (zone.method !== 'pickup' && !address) {
      errors.address = 'Enter the address to deliver to.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    const order = await placeOrder({
      customerName,
      phone: phone!,
      email,
      deliveryZoneId: zone!.id,
      address,
      notes,
      lines,
    });

    let paymentError: string | null = null;
    try {
      await startPayment(order.id, phone!);
    } catch (err) {
      paymentError = err instanceof Error ? err.message : 'M-Pesa could not start the payment.';
    }

    const redirectUrl = orderLink(order.number) + (paymentError ? `&error=${encodeURIComponent(paymentError)}` : '');
    return NextResponse.json({ redirectUrl, orderNumber: order.number });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ cartError: err.message }, { status: 400 });
    }
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Could not place order. Please try again.' }, { status: 500 });
  }
}
