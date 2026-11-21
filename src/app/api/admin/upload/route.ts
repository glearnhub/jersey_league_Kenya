import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import { getAdminUser } from '@/lib/auth';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: 'Please upload a JPEG, PNG, WebP, or GIF image.' },
        { status: 422 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Image must be 5 MB or smaller.' },
        { status: 422 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const cleanBase = file.name
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40) || 'jersey';
    const filename = `${cleanBase}-${Date.now()}.${ext}`;

    // 1. If Vercel Blob is connected, store on Vercel Blob CDN
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`products/${filename}`, bytes, {
        access: 'public',
        contentType: file.type,
      });
      return NextResponse.json({ path: blob.url });
    }

    // 2. Locally (non-Vercel), store in public/storage/products/
    if (!process.env.VERCEL) {
      const dir = path.join(process.cwd(), 'public', 'storage', 'products');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, filename), bytes);
      return NextResponse.json({ path: `products/${filename}` });
    }

    // 3. On Vercel without Blob token yet, return compact base64 data URI so Postgres stores it directly
    const dataUrl = `data:${file.type};base64,${bytes.toString('base64')}`;
    return NextResponse.json({ path: dataUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Could not upload image. Please try again.' },
      { status: 500 }
    );
  }
}
