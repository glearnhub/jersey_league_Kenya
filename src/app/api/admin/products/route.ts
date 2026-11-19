import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminUser } from '@/lib/auth';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uniqueProductSlug(name: string, excludeId?: number): Promise<string> {
  const base = slugify(name) || 'jersey';
  let slug = base;
  let n = 2;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  const slug = await uniqueProductSlug(name);

  const product = await prisma.product.create({
    data: {
      name,
      slug,
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
      variants: {
        create: variants.map((v) => ({
          size: String(v.size),
          stock: Math.max(0, Number(v.stock) || 0),
          reserved: 0,
        })),
      },
      images: {
        create: images.map((img, idx) => ({
          path: String(img.path).trim(),
          alt: img.alt ? String(img.alt).trim() : name,
          sortOrder: idx,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: product.id });
}
