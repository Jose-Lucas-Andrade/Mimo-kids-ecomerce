import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { verifySession } from '../../../../../lib/auth';

const UPC_ITEMDB_URL = 'https://api.upcitemdb.com/prod/trial/lookup';

function normalizeGtin(value) {
  return String(value || '').replace(/\D/g, '').padStart(14, '0');
}

export async function POST(request) {
  const token = request.cookies.get('admin_session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
  }

  const barcode = typeof body?.barcode === 'string' ? body.barcode.replace(/\D/g, '') : '';
  if (![8, 12, 13, 14].includes(barcode.length)) {
    return NextResponse.json({ error: 'INVALID_BARCODE' }, { status: 400 });
  }

  const existingProduct = await prisma.product.findUnique({
    where: { barcode },
    select: { id: true, name: true },
  });
  if (existingProduct) {
    return NextResponse.json({ existingProduct }, { status: 409 });
  }

  let response;
  try {
    response = await fetch(`${UPC_ITEMDB_URL}?upc=${encodeURIComponent(barcode)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error('Barcode lookup provider request failed:', error);
    return NextResponse.json({ error: 'BARCODE_LOOKUP_UNAVAILABLE' }, { status: 502 });
  }

  if (response.status === 429) {
    return NextResponse.json({ error: 'BARCODE_LOOKUP_RATE_LIMITED' }, { status: 429 });
  }
  if (!response.ok) {
    console.error(`Barcode lookup provider returned HTTP ${response.status}.`);
    return NextResponse.json({ error: 'BARCODE_LOOKUP_UNAVAILABLE' }, { status: 502 });
  }

  let result;
  try {
    result = await response.json();
  } catch {
    console.error('Barcode lookup provider returned invalid JSON.');
    return NextResponse.json({ error: 'BARCODE_LOOKUP_UNAVAILABLE' }, { status: 502 });
  }

  if (result?.code === 'TOO_FAST' || result?.code === 'LIMIT_REACHED') {
    return NextResponse.json({ error: 'BARCODE_LOOKUP_RATE_LIMITED' }, { status: 429 });
  }
  if (result?.code !== 'OK') {
    console.error(`Barcode lookup provider returned code ${String(result?.code || 'UNKNOWN')}.`);
    return NextResponse.json({ error: 'BARCODE_LOOKUP_UNAVAILABLE' }, { status: 502 });
  }

  const item = Array.isArray(result.items)
    ? result.items.find((candidate) => normalizeGtin(candidate?.ean || candidate?.upc) === normalizeGtin(barcode))
    : null;
  if (!item || typeof item.title !== 'string' || !item.title.trim()) {
    return NextResponse.json({ found: false });
  }

  const imageUrl = Array.isArray(item.images)
    ? item.images.find((image) => typeof image === 'string' && image.startsWith('https://')) || ''
    : '';

  return NextResponse.json({
    found: true,
    product: {
      name: item.title.trim().slice(0, 200),
      description: typeof item.description === 'string' ? item.description.trim().slice(0, 2000) : '',
      imageUrl,
    },
    sourceUrl: `https://www.upcitemdb.com/upc/${encodeURIComponent(barcode)}`,
  });
}
