import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  cleanPrintName,
  cleanPrintNumber,
  deliveryFeeFor,
  imageUrlFor,
  shopConfig,
} from '@/lib/constants';
import { makeCartKey } from '@/store/cart';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawItems: Array<{
      key?: string;
      productId: number;
      size: string;
      quantity: number;
      printName?: string | null;
      printNumber?: string | null;
      sleeveBadge?: boolean;
    }> = Array.isArray(body?.items) ? body.items : [];

    const cfg = shopConfig();
    if (!rawItems.length) {
      const zones = await prisma.deliveryZone.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
      return NextResponse.json({
        lines: [],
        subtotal: 0,
        zones: zones.map((z) => ({ ...z, computedFee: deliveryFeeFor(z, 0) })),
        printFee: cfg.printFee,
        paymentWindowMinutes: cfg.paymentWindowMinutes,
      });
    }

    const productIds = Array.from(new Set(rawItems.map((i) => Number(i.productId))));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        variants: true,
      },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const lines = rawItems
      .map((item) => {
        const product = productMap.get(Number(item.productId));
        const variant = product?.variants.find((v) => v.size === item.size);
        if (!product || !variant) return null;

        const printName = product.allowsPrinting ? cleanPrintName(item.printName) : null;
        const printNumber = product.allowsPrinting ? cleanPrintNumber(item.printNumber) : null;
        const sleeveBadge = Boolean(product.allowsSleeveBadge && item.sleeveBadge);
        const quantity = Math.max(1, Math.min(cfg.maxQuantityPerLine, Number(item.quantity) || 1));

        const wantedForSize = rawItems
          .filter((r) => Number(r.productId) === product.id && r.size === item.size)
          .reduce((sum, r) => sum + Math.max(1, Number(r.quantity) || 1), 0);

        const hasPrint = Boolean(printName || printNumber);
        const printFee = (hasPrint ? cfg.printFee : 0) + (sleeveBadge ? cfg.sleeveBadgeFee : 0);
        const unitPrice = product.price;
        const lineTotal = (unitPrice + printFee) * quantity;
        const available = Math.max(0, variant.stock - variant.reserved);

        return {
          key: item.key || makeCartKey(product.id, item.size, printName, printNumber, sleeveBadge),
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          imageUrl: imageUrlFor(product.images[0]?.path),
          size: item.size,
          quantity,
          printName,
          printNumber,
          sleeveBadge,
          unitPrice,
          printFee,
          lineTotal,
          available,
          enoughStock: available >= wantedForSize,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const zones = await prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      lines,
      subtotal,
      zones: zones.map((z) => ({
        ...z,
        computedFee: deliveryFeeFor(z, subtotal),
      })),
      printFee: cfg.printFee,
      paymentWindowMinutes: cfg.paymentWindowMinutes,
    });
  } catch (err) {
    console.error('Cart validate error:', err);
    return NextResponse.json({ error: 'Could not validate cart' }, { status: 500 });
  }
}
