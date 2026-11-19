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
  const zoneId = Number(id);
  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 422 });

  await prisma.deliveryZone.update({
    where: { id: zoneId },
    data: {
      name,
      method: String(body.method || 'standard'),
      fee: Math.max(0, Number(body.fee) || 0),
      freeOver:
        body.freeOver !== null && body.freeOver !== '' && body.freeOver !== undefined
          ? Math.max(0, Number(body.freeOver))
          : null,
      estimate: body.estimate ? String(body.estimate).trim() : null,
      note: body.note ? String(body.note).trim() : null,
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
  await prisma.deliveryZone.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
