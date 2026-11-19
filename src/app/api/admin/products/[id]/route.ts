import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminUser } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const productId = Number(id);
  const body = await req.json();
  const name = String(body.name || '').trim();
  const price = Math.max(0, Number(body.price) || 0);

  if (!name) {
    return NextResponse.json({ error: 'Product name is required.' }, { status: 422 });
  }

  const variants: Array<{ size: string; stock: number }> = Array.isArray(body.variants)
    ? body.variants
    : [];
  const sizesSeen = new Set<string>();
  for (const v of variants) {
    if (sizesSeen.has(v.size)) {
      return NextResponse.json({ error: `Duplicate size: ${v.size}` }, { status: 422 });
    }
    sizesSeen.add(v.size);
  }

  const images: Array<{ path: string; alt?: string }> = Array.isArray(body.images)
    ? body.images.filter((i: { path?: string }) => Boolean(i.path?.trim()))
    : [];

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        name,
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        team: body.team ? String(body.team).trim() : null,
        season: body.season ? String(body.season).trim() : null,
        kit: body.kit ? String(body.kit) : null,
        version: body.version ? String(body.version) : null,
        description: body.description ? String(body.description) : null,
        careNotes: body.careNotes ? String(body.careNotes) : null,
        price,
        compareAtPrice: body.compareAtPrice ? Math.max(0, Number(body.compareAtPrice)) : null,
        badge: body.badge ? String(body.badge) : null,
        isActive: Boolean(body.isActive ?? true),
        isFeatured: Boolean(body.isFeatured ?? false),
        allowsPrinting: Boolean(body.allowsPrinting ?? true),
        allowsSleeveBadge: Boolean(body.allowsSleeveBadge ?? false),
      },
    });

    // Sync variants preserving reserved count
    const existingVariants = await tx.productVariant.findMany({ where: { productId } });
    const keepSizes = new Set(variants.map((v) => v.size));
    for (const ev of existingVariants) {
      if (!keepSizes.has(ev.size)) {
        await tx.productVariant.delete({ where: { id: ev.id } });
      }
    }
    for (const v of variants) {
      await tx.productVariant.upsert({
        where: { productId_size: { productId, size: v.size } },
        update: { stock: Math.max(0, Number(v.stock) || 0) },
        create: { productId, size: v.size, stock: Math.max(0, Number(v.stock) || 0), reserved: 0 },
      });
    }

    await tx.productImage.deleteMany({ where: { productId } });
    if (images.length > 0) {
      await tx.productImage.createMany({
        data: images.map((img, idx) => ({
          productId,
          path: String(img.path).trim(),
          alt: img.alt ? String(img.alt).trim() : name,
          sortOrder: idx,
        })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.product.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
