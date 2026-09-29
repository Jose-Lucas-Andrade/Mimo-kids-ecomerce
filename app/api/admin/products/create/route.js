import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { verifySession } from '../../../../../lib/auth';

export async function POST(req) {
  const token = req.cookies.get('admin_session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const name = form.get('name');
  const slug = form.get('slug');
  const price = parseFloat(form.get('price'));
  const imageUrl = form.get('imageUrl');
  const description = form.get('description') || '';
  const barcodeValue = String(form.get('barcode') || '').replace(/\D/g, '');
  const barcode = barcodeValue || null;
  const unitsPerPackage = Number(form.get('unitsPerPackage'));
  const packagesReceived = Number(form.get('packagesReceived'));
  const stock = unitsPerPackage * packagesReceived;
  const shippingWeightKg = Number(form.get('shippingWeightKg'));

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof slug !== 'string' || !slug.trim() ||
    !Number.isFinite(price) || price <= 0 ||
    typeof imageUrl !== 'string' || !imageUrl.trim() ||
    (barcode && ![8, 12, 13, 14].includes(barcode.length)) ||
    !Number.isSafeInteger(unitsPerPackage) || unitsPerPackage < 1 || unitsPerPackage > 10000 ||
    !Number.isSafeInteger(packagesReceived) || packagesReceived < 0 || packagesReceived > 100000 ||
    !Number.isSafeInteger(stock) || stock < 0 ||
    !Number.isFinite(shippingWeightKg) || shippingWeightKg <= 0 || shippingWeightKg > 30
  ) {
    const errorUrl = new URL('/admin/products/new', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    errorUrl.searchParams.set('error', 'PRODUCT_INVALID_FIELDS');
    return NextResponse.redirect(errorUrl, 303);
  }

  try {
    await prisma.product.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        price,
        imageUrl: imageUrl.trim(),
        description: String(description),
        barcode,
        unitsPerPackage,
        stock,
        shippingWeightKg,
      },
    });
    return NextResponse.redirect(new URL('/admin/products', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'), 303);
  } catch {
    const errorUrl = new URL('/admin/products/new', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    errorUrl.searchParams.set('error', 'PRODUCT_CREATE_FAILED');
    return NextResponse.redirect(errorUrl, 303);
  }
}
