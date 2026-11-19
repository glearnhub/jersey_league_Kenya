import { prisma } from './prisma';
import {
  cleanPrintName,
  cleanPrintNumber,
  deliveryFeeFor,
  orderNumberFor,
  shopConfig,
} from './constants';
import { isFakeMpesa, StkCallbackPayload, stkPush, stkQuery } from './mpesa';

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderError';
  }
}

export interface RawCartLine {
  productId: number;
  size: string;
  quantity: number;
  printName?: string | null;
  printNumber?: string | null;
  sleeveBadge?: boolean;
}

export interface PlaceOrderInput {
  customerName: string;
  phone: string;
  email?: string | null;
  deliveryZoneId: number;
  address?: string | null;
  notes?: string | null;
  lines: RawCartLine[];
}

export async function placeOrder(input: PlaceOrderInput) {
  const cfg = shopConfig();
  if (!input.lines.length) {
    throw new OrderError('Your cart is empty.');
  }

  return prisma.$transaction(async (tx) => {
    const zone = await tx.deliveryZone.findFirst({
      where: { id: input.deliveryZoneId, isActive: true },
    });
    if (!zone) {
      throw new OrderError('Choose how you want to receive your order.');
    }

    const productIds = Array.from(new Set(input.lines.map((l) => l.productId)));
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { variants: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Build validated lines and sum quantities per variant
    const wantedByVariant = new Map<number, { wanted: number; productName: string; size: string; available: number }>();
    const preparedLines: Array<{
      productId: number;
      productVariantId: number;
      productName: string;
      size: string;
      unitPrice: number;
      printName: string | null;
      printNumber: string | null;
      sleeveBadge: boolean;
      printFee: number;
      quantity: number;
      lineTotal: number;
    }> = [];

    for (const raw of input.lines) {
      const product = productMap.get(raw.productId);
      const variant = product?.variants.find((v) => v.size === raw.size);
      if (!product || !variant) {
        throw new OrderError('One of the items in your cart is no longer available.');
      }

      const quantity = Math.max(1, Math.min(cfg.maxQuantityPerLine, Math.floor(raw.quantity)));
      const printName = product.allowsPrinting ? cleanPrintName(raw.printName) : null;
      const printNumber = product.allowsPrinting ? cleanPrintNumber(raw.printNumber) : null;
      const sleeveBadge = Boolean(product.allowsSleeveBadge && raw.sleeveBadge);
      const hasPrint = Boolean(printName || printNumber);
      const printFee = (hasPrint ? cfg.printFee : 0) + (sleeveBadge ? cfg.sleeveBadgeFee : 0);
      const unitPrice = product.price;
      const lineTotal = (unitPrice + printFee) * quantity;

      const prev = wantedByVariant.get(variant.id);
      const available = Math.max(0, variant.stock - variant.reserved);
      wantedByVariant.set(variant.id, {
        wanted: (prev?.wanted ?? 0) + quantity,
        productName: product.name,
        size: variant.size,
        available,
      });

      preparedLines.push({
        productId: product.id,
        productVariantId: variant.id,
        productName: product.name,
        size: variant.size,
        unitPrice,
        printName,
        printNumber,
        sleeveBadge,
        printFee,
        quantity,
        lineTotal,
      });
    }

    for (const [, check] of Array.from(wantedByVariant.entries()).sort(([a], [b]) => a - b)) {
      if (check.available < check.wanted) {
        throw new OrderError(
          `Sorry, ${check.productName} in size ${check.size} is no longer available in that quantity. Please change your cart.`
        );
      }
    }

    const subtotal = preparedLines.reduce((sum, l) => sum + l.lineTotal, 0);
    const fee = deliveryFeeFor(zone, subtotal);
    const expiresAt = new Date(Date.now() + cfg.paymentWindowMinutes * 60 * 1000);

    const created = await tx.order.create({
      data: {
        number: `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        customerName: input.customerName.trim(),
        phone: input.phone,
        email: input.email || null,
        deliveryMethod: zone.method,
        deliveryZoneId: zone.id,
        deliveryZoneName: zone.name,
        address: zone.method === 'pickup' ? null : input.address || null,
        notes: input.notes || null,
        subtotal,
        deliveryFee: fee,
        total: subtotal + fee,
        status: 'pending_payment',
        expiresAt,
      },
    });

    const finalNumber = orderNumberFor(created.id);
    const order = await tx.order.update({
      where: { id: created.id },
      data: { number: finalNumber },
    });

    for (const line of preparedLines) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          ...line,
        },
      });
      await tx.productVariant.update({
        where: { id: line.productVariantId },
        data: { reserved: { increment: line.quantity } },
      });
    }

    return order;
  });
}

export async function startPayment(orderId: number, phone: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== 'pending_payment') {
    throw new OrderError(
      order?.status === 'paid'
        ? 'This order is already paid.'
        : 'This order has expired. Please start a new order.'
    );
  }

  const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
  const recent = await prisma.payment.findFirst({
    where: {
      orderId: order.id,
      status: 'pending',
      phone,
      createdAt: { gt: sixtySecondsAgo },
    },
    orderBy: { id: 'desc' },
  });
  if (recent) {
    return recent;
  }

  const ids = await stkPush(phone, order.total, order.number, 'Jersey order');

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  if (order.expiresAt && order.expiresAt < fiveMinutesFromNow) {
    await prisma.order.update({
      where: { id: order.id },
      data: { expiresAt: fiveMinutesFromNow },
    });
  }

  return prisma.payment.create({
    data: {
      orderId: order.id,
      phone,
      amount: order.total,
      merchantRequestId: ids.merchantRequestId,
      checkoutRequestId: ids.checkoutRequestId,
      status: 'pending',
    },
  });
}

export async function applyMpesaResult(stk: StkCallbackPayload, fullPayload?: unknown) {
  const checkoutId = stk.CheckoutRequestID;
  if (!checkoutId) return null;

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { checkoutRequestId: checkoutId },
    });
    if (!payment) {
      console.warn('M-Pesa result for an unknown payment:', checkoutId);
      return null;
    }
    if (payment.status === 'success') {
      const metaItems = stk.CallbackMetadata?.Item ?? [];
      const meta = new Map(metaItems.map((i) => [i.Name ?? '', i.Value]));
      const receipt = meta.get('MpesaReceiptNumber') ? String(meta.get('MpesaReceiptNumber')) : null;
      if (receipt && !payment.mpesaReceipt) {
        return tx.payment.update({
          where: { id: payment.id },
          data: { mpesaReceipt: receipt, callback: (fullPayload ?? stk) as object },
        });
      }
      return payment;
    }

    const code = Number(stk.ResultCode ?? -1);
    const resultDesc = String(stk.ResultDesc ?? '');
    const callbackData = (fullPayload ?? stk) as object;

    if (code !== 0) {
      const failedStatus = code === 1032 ? 'cancelled' : code === 1037 ? 'timeout' : 'failed';
      return tx.payment.update({
        where: { id: payment.id },
        data: {
          resultCode: code,
          resultDesc,
          callback: callbackData,
          status: failedStatus,
        },
      });
    }

    const metaItems = stk.CallbackMetadata?.Item ?? [];
    const meta = new Map(metaItems.map((i) => [i.Name ?? '', i.Value]));
    const paidAmount = meta.get('Amount');
    const receipt = meta.get('MpesaReceiptNumber') ? String(meta.get('MpesaReceiptNumber')) : null;

    if (paidAmount !== undefined && paidAmount !== null && Math.round(Number(paidAmount)) !== payment.amount) {
      console.error('M-Pesa amount mismatch:', {
        paymentId: payment.id,
        expected: payment.amount,
        paid: paidAmount,
        receipt,
      });
      return tx.payment.update({
        where: { id: payment.id },
        data: {
          resultCode: code,
          resultDesc: 'Amount paid does not match the order: check with the customer',
          callback: callbackData,
          status: 'failed',
          mpesaReceipt: receipt,
        },
      });
    }

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        resultCode: code,
        resultDesc,
        callback: callbackData,
        status: 'success',
        mpesaReceipt: receipt,
        paidAt: new Date(),
      },
    });

    const order = await tx.order.findUnique({
      where: { id: payment.orderId },
      include: { items: true },
    });
    if (!order) return updatedPayment;

    if (order.status === 'paid' || order.paidAt) {
      console.warn('A second M-Pesa payment arrived for an already paid order:', order.number);
    } else {
      const wasReserved = order.status === 'pending_payment';
      if (order.status === 'cancelled' || order.status === 'failed') {
        console.warn('M-Pesa payment arrived after order expired: committing stock', order.number);
      }

      // Group quantities by variant ID
      const byVariant = new Map<number, number>();
      for (const item of order.items) {
        if (item.productVariantId) {
          byVariant.set(item.productVariantId, (byVariant.get(item.productVariantId) ?? 0) + item.quantity);
        }
      }

      for (const [variantId, qty] of Array.from(byVariant.entries()).sort(([a], [b]) => a - b)) {
        const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
        if (variant) {
          await tx.productVariant.update({
            where: { id: variantId },
            data: {
              stock: Math.max(0, variant.stock - qty),
              ...(wasReserved ? { reserved: Math.max(0, variant.reserved - qty) } : {}),
            },
          });
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'paid', paidAt: new Date() },
      });
    }

    return updatedPayment;
  });
}

export async function cancelOrder(orderId: number, status: 'cancelled' | 'failed' = 'cancelled'): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status !== 'pending_payment') {
      return false;
    }

    const byVariant = new Map<number, number>();
    for (const item of order.items) {
      if (item.productVariantId) {
        byVariant.set(item.productVariantId, (byVariant.get(item.productVariantId) ?? 0) + item.quantity);
      }
    }

    for (const [variantId, qty] of Array.from(byVariant.entries()).sort(([a], [b]) => a - b)) {
      const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
      if (variant) {
        await tx.productVariant.update({
          where: { id: variantId },
          data: { reserved: Math.max(0, variant.reserved - qty) },
        });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status },
    });

    await tx.payment.updateMany({
      where: { orderId: order.id, status: 'pending' },
      data: { status: 'timeout', resultDesc: 'The order expired before it was paid' },
    });

    return true;
  });
}

const lastQueriedAt = new Map<number, number>();

export async function settleOrder(orderId: number) {
  const latestPayment = await prisma.payment.findFirst({
    where: { orderId },
    orderBy: { id: 'desc' },
  });

  if (
    latestPayment &&
    latestPayment.status === 'pending' &&
    latestPayment.checkoutRequestId &&
    !isFakeMpesa() &&
    latestPayment.createdAt.getTime() < Date.now() - 25 * 1000
  ) {
    const lastAsk = lastQueriedAt.get(latestPayment.id) ?? 0;
    if (Date.now() - lastAsk >= 10 * 1000) {
      lastQueriedAt.set(latestPayment.id, Date.now());
      const answer = await stkQuery(latestPayment.checkoutRequestId);
      if (answer) {
        await applyMpesaResult(answer);
      }
    }
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order && order.status === 'pending_payment' && order.expiresAt && order.expiresAt < new Date()) {
    const activePrompt = await prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: 'pending',
        createdAt: { gt: new Date(Date.now() - 3 * 60 * 1000) },
      },
    });
    if (!activePrompt) {
      await cancelOrder(order.id);
    }
  }
}

export async function getOrderState(orderId: number): Promise<'paid' | 'waiting' | 'retry' | 'expired'> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return 'expired';
  if (order.status === 'paid' || order.paidAt) return 'paid';
  if (order.status !== 'pending_payment') return 'expired';

  const latestPayment = await prisma.payment.findFirst({
    where: { orderId: order.id },
    orderBy: { id: 'desc' },
  });
  return latestPayment && latestPayment.status === 'pending' ? 'waiting' : 'retry';
}

export function explainPaymentFailure(payment?: { status: string; resultCode: number | null } | null): string {
  if (!payment) return 'The payment has not started yet.';
  if (payment.status === 'cancelled') return 'The payment was cancelled on the phone.';
  if (payment.status === 'timeout') return 'There was no answer from the phone in time.';
  if (payment.resultCode === 1) return 'The M-Pesa balance is not enough for this order.';
  if (payment.resultCode === 2001) return 'The M-Pesa PIN was wrong.';
  return 'The payment did not go through.';
}

export async function reconcileAndExpireAll() {
  let settled = 0;
  let expired = 0;

  if (!isFakeMpesa()) {
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'pending',
        createdAt: { lt: new Date(Date.now() - 45 * 1000) },
      },
    });

    for (const payment of pendingPayments) {
      const answer = payment.checkoutRequestId ? await stkQuery(payment.checkoutRequestId) : null;
      if (answer) {
        await applyMpesaResult(answer);
        settled++;
      } else if (payment.createdAt.getTime() < Date.now() - 4 * 60 * 1000) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'timeout', resultDesc: 'No answer from the phone' },
        });
      }
    }
  }

  const overdueOrders = await prisma.order.findMany({
    where: {
      status: 'pending_payment',
      expiresAt: { lt: new Date() },
    },
  });

  for (const order of overdueOrders) {
    const activePrompt = await prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: 'pending',
        createdAt: { gt: new Date(Date.now() - 3 * 60 * 1000) },
      },
    });
    if (!activePrompt && (await cancelOrder(order.id))) {
      expired++;
    }
  }

  return { settled, expired };
}
