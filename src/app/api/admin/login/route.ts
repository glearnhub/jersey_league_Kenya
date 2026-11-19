import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { COOKIE_NAME, createAdminToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email || '').trim();
  const password = String(body.password || '');

  let user = await prisma.user.findUnique({ where: { email } });

  // Fallback to ADMIN_EMAIL / ADMIN_PASSWORD from env if user row hasn't been seeded yet
  if (
    !user &&
    process.env.ADMIN_EMAIL &&
    process.env.ADMIN_PASSWORD &&
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const hashedPassword = await bcrypt.hash(password, 12);
    user = await prisma.user.create({
      data: { email, name: 'Owner', password: hashedPassword },
    });
  }

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const token = await createAdminToken({ id: user.id, email: user.email, name: user.name });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
