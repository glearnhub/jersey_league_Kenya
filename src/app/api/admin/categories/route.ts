import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminUser } from '@/lib/auth';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 422 });

  const parentId = body.parentId ? Number(body.parentId) : null;
  const parent = parentId ? await prisma.category.findUnique({ where: { id: parentId } }) : null;
  const baseSlug = body.slug
    ? slugify(String(body.slug))
    : slugify((parent ? `${parent.slug}-` : '') + name);

  let slug = baseSlug;
  let n = 2;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`;
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      parentId,
      sortOrder: Number(body.sortOrder) || 0,
      isActive: Boolean(body.isActive ?? true),
    },
  });

  return NextResponse.json({ ok: true, id: category.id });
}
