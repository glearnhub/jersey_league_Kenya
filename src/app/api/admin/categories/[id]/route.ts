import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminUser } from '@/lib/auth';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const categoryId = Number(id);
  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 422 });

  const parentId = body.parentId ? Number(body.parentId) : null;
  if (parentId === categoryId) {
    return NextResponse.json({ error: 'A category cannot be inside itself.' }, { status: 422 });
  }

  const parent = parentId ? await prisma.category.findUnique({ where: { id: parentId } }) : null;
  const baseSlug = body.slug
    ? slugify(String(body.slug))
    : slugify((parent ? `${parent.slug}-` : '') + name);

  let slug = baseSlug || 'category';
  let n = 2;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === categoryId) break;
    slug = `${baseSlug}-${n++}`;
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      name,
      slug,
      parentId,
      sortOrder: Number(body.sortOrder) || 0,
      isActive: Boolean(body.isActive ?? true),
    },
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
  await prisma.category.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
