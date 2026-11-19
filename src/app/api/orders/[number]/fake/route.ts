import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { verifyOrderSignature } from '@/lib/signed-url';
import { isFakeMpesa, StkCallbackPayload } from '@/lib/mpesa';
import { applyMpesaResult } from '@/lib/orders';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const sig = req.nextUrl.searchParams.get('sig');
  if (!verifyOrderSignature(number, sig) || !isFakeMpesa()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const outcome = body.outcome;
  if (outcome !== 'success' && outcome !== 'cancel') {
    return NextResponse.json({ error: 'Invalid outcome' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { number } });
  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId: order.id, status: 'pending' },
    orderBy: { id: 'desc' },
  });
  if (!payment || !payment.checkoutRequestId) {
    return NextResponse.json({ error: 'No pending payment' }, { status: 404 });
  }

  const randReceipt = 'FAKE' + crypto.randomBytes(4).toString('hex').slice(0, 7).toUpperCase();
  const stk: StkCallbackPayload =
    outcome === 'success'
      ? {
          MerchantRequestID: payment.merchantRequestId,
          CheckoutRequestID: payment.checkoutRequestId,
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: payment.amount },
              { Name: 'MpesaReceiptNumber', Value: randReceipt },
              { Name: 'TransactionDate', Value: 20261119120000 },
              { Name: 'PhoneNumber', Value: Number(payment.phone) },
            ],
          },
        }
      : {
          MerchantRequestID: payment.merchantRequestId,
          CheckoutRequestID: payment.checkoutRequestId,
          ResultCode: 1032,
          ResultDesc: 'Request cancelled by user',
        };

  await applyMpesaResult(stk, { Body: { stkCallback: stk } });
  return NextResponse.json({ ok: true });
}
