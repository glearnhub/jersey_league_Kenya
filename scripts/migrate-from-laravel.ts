import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Loads an exported JSON snapshot of the Laravel database (prisma/laravel-export.json)
 * into the Next.js Prisma PostgreSQL database, preserving IDs, passwords, stock, orders, and receipts.
 */
async function main() {
  const dumpPath = path.join(process.cwd(), 'prisma', 'laravel-export.json');
  if (!fs.existsSync(dumpPath)) {
    console.error(`Missing ${dumpPath}. Run the export first.`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

  for (const u of data.users || []) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, password: u.password },
      create: { id: u.id, name: u.name, email: u.email, password: u.password },
    });
  }

  for (const c of data.categories || []) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        parentId: c.parent_id ?? null,
        image: c.image ?? null,
        sortOrder: Number(c.sort_order ?? 0),
        isActive: Boolean(c.is_active),
      },
      create: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentId: c.parent_id ?? null,
        image: c.image ?? null,
        sortOrder: Number(c.sort_order ?? 0),
        isActive: Boolean(c.is_active),
      },
    });
  }

  for (const p of data.products || []) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        categoryId: p.category_id ?? null,
        team: p.team ?? null,
        season: p.season ?? null,
        kit: p.kit ?? null,
        version: p.version ?? null,
        description: p.description ?? null,
        careNotes: p.care_notes ?? null,
        price: Number(p.price),
        compareAtPrice: p.compare_at_price !== null ? Number(p.compare_at_price) : null,
        badge: p.badge ?? null,
        isFeatured: Boolean(p.is_featured),
        isActive: Boolean(p.is_active),
        allowsPrinting: Boolean(p.allows_printing),
        allowsSleeveBadge: Boolean(p.allows_sleeve_badge),
      },
      create: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        categoryId: p.category_id ?? null,
        team: p.team ?? null,
        season: p.season ?? null,
        kit: p.kit ?? null,
        version: p.version ?? null,
        description: p.description ?? null,
        careNotes: p.care_notes ?? null,
        price: Number(p.price),
        compareAtPrice: p.compare_at_price !== null ? Number(p.compare_at_price) : null,
        badge: p.badge ?? null,
        isFeatured: Boolean(p.is_featured),
        isActive: Boolean(p.is_active),
        allowsPrinting: Boolean(p.allows_printing),
        allowsSleeveBadge: Boolean(p.allows_sleeve_badge),
      },
    });
  }

  for (const img of data.product_images || []) {
    await prisma.productImage.upsert({
      where: { id: img.id },
      update: {
        productId: img.product_id,
        path: img.path,
        alt: img.alt ?? null,
        sortOrder: Number(img.sort_order ?? 0),
      },
      create: {
        id: img.id,
        productId: img.product_id,
        path: img.path,
        alt: img.alt ?? null,
        sortOrder: Number(img.sort_order ?? 0),
      },
    });
  }

  for (const v of data.product_variants || []) {
    await prisma.productVariant.upsert({
      where: { productId_size: { productId: v.product_id, size: v.size } },
      update: { stock: Number(v.stock), reserved: Number(v.reserved) },
      create: {
        id: v.id,
        productId: v.product_id,
        size: v.size,
        stock: Number(v.stock),
        reserved: Number(v.reserved),
      },
    });
  }

  for (const z of data.delivery_zones || []) {
    await prisma.deliveryZone.upsert({
      where: { id: z.id },
      update: {
        name: z.name,
        method: z.method,
        fee: Number(z.fee),
        freeOver: z.free_over !== null ? Number(z.free_over) : null,
        estimate: z.estimate ?? null,
        note: z.note ?? null,
        sortOrder: Number(z.sort_order ?? 0),
        isActive: Boolean(z.is_active),
      },
      create: {
        id: z.id,
        name: z.name,
        method: z.method,
        fee: Number(z.fee),
        freeOver: z.free_over !== null ? Number(z.free_over) : null,
        estimate: z.estimate ?? null,
        note: z.note ?? null,
        sortOrder: Number(z.sort_order ?? 0),
        isActive: Boolean(z.is_active),
      },
    });
  }

  for (const o of data.orders || []) {
    await prisma.order.upsert({
      where: { number: o.number },
      update: { status: o.status },
      create: {
        id: o.id,
        number: o.number,
        customerName: o.customer_name,
        phone: o.phone,
        email: o.email ?? null,
        deliveryMethod: o.delivery_method,
        deliveryZoneId: o.delivery_zone_id ?? null,
        deliveryZoneName: o.delivery_zone_name ?? null,
        address: o.address ?? null,
        notes: o.notes ?? null,
        subtotal: Number(o.subtotal),
        deliveryFee: Number(o.delivery_fee),
        total: Number(o.total),
        status: o.status,
        expiresAt: o.expires_at ? new Date(o.expires_at) : null,
        paidAt: o.paid_at ? new Date(o.paid_at) : null,
      },
    });
  }

  for (const item of data.order_items || []) {
    await prisma.orderItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id ?? null,
        productVariantId: item.product_variant_id ?? null,
        productName: item.product_name,
        size: item.size,
        unitPrice: Number(item.unit_price),
        printName: item.print_name ?? null,
        printNumber: item.print_number ?? null,
        sleeveBadge: Boolean(item.sleeve_badge),
        printFee: Number(item.print_fee ?? 0),
        quantity: Number(item.quantity),
        lineTotal: Number(item.line_total),
      },
    });
  }

  for (const pay of data.payments || []) {
    await prisma.payment.upsert({
      where: { id: pay.id },
      update: { status: pay.status, mpesaReceipt: pay.mpesa_receipt ?? null },
      create: {
        id: pay.id,
        orderId: pay.order_id,
        phone: pay.phone,
        amount: Number(pay.amount),
        merchantRequestId: pay.merchant_request_id ?? null,
        checkoutRequestId: pay.checkout_request_id ?? null,
        status: pay.status,
        mpesaReceipt: pay.mpesa_receipt ?? null,
        resultCode: pay.result_code !== null ? Number(pay.result_code) : null,
        resultDesc: pay.result_desc ?? null,
        callback: pay.callback ? JSON.parse(pay.callback) : null,
        paidAt: pay.paid_at ? new Date(pay.paid_at) : null,
      },
    });
  }

  console.log('Migrated all data from Laravel export successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
