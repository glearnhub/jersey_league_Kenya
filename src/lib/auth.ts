import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'jlk_admin_session';

function getJwtSecret(): Uint8Array {
  const secret = process.env.APP_SECRET || 'jersey-league-kenya-default-secret-key';
  return new TextEncoder().encode(secret);
}

export async function createAdminToken(user: { id: number; email: string; name: string }): Promise<string> {
  return new SignJWT({ sub: String(user.id), email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function getAdminUser(): Promise<{ id: number; email: string; name: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      id: Number(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
