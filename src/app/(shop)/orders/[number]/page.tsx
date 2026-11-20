import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyOrderSignature } from '@/lib/signed-url';
import { explainPaymentFailure, getOrderState, settleOrder } from '@/lib/orders';
import { isFakeMpesa } from '@/lib/mpesa';
import { shopConfig } from '@/lib/constants';
import { OrderClientView } from '@/components/OrderClientView';

export const dynamic = 'force-dynamic';

export default async function OrderShowPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { number } = await params;
  const sp = await searchParams;
  const sig = typeof sp.sig === 'string' ? sp.sig : '';
  const initialError = typeof sp.error === 'string' ? sp.error : null;

  if (!verifyOrderSignature(number, sig)) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { number },
  });
  if (!order) {
    notFound();
  }

  await settleOrder(order.id);

  const freshOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      items: true,
      payments: { orderBy: { id: 'desc' } },
    },
  });
  if (!freshOrder) notFound();

  const state = await getOrderState(freshOrder.id);
  const latestPayment = freshOrder.payments[0] ?? null;
  const latestSuccess = freshOrder.payments.find((p) => p.status === 'success') ?? null;
  const cfg = shopConfig();

  const expiresAtFormatted = freshOrder.expiresAt
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Nairobi',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(freshOrder.expiresAt)
    : null;

  return (
    <OrderClientView
      order={{
        number: freshOrder.number,
        status: freshOrder.status,
        customerName: freshOrder.customerName,
        phone: freshOrder.phone,
        subtotal: freshOrder.subtotal,
        deliveryFee: freshOrder.deliveryFee,
        total: freshOrder.total,
        deliveryMethod: freshOrder.deliveryMethod,
        deliveryZoneName: freshOrder.deliveryZoneName,
        address: freshOrder.address,
        expiresAtFormatted,
        items: freshOrder.items,
      }}
      sig={sig}
      initialState={state}
      explanation={explainPaymentFailure(latestPayment)}
      mpesaReceipt={latestSuccess?.mpesaReceipt ?? null}
      fake={isFakeMpesa()}
      initialError={initialError}
      shopAddress={cfg.address}
    />
  );
}
