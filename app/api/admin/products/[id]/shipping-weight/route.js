import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { verifySession } from '../../../../../../lib/auth';

export async function POST(request, { params }) {
  const token = request.cookies.get('admin_session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  const form = await request.formData();
  const shippingWeightKg = Number(form.get('shippingWeightKg'));
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isFinite(shippingWeightKg) || shippingWeightKg <= 0 || shippingWeightKg > 30) {
    const url = new URL('/admin/products', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    url.searchParams.set('error', 'INVALID_SHIPPING_WEIGHT');
    return NextResponse.redirect(url, 303);
  }

  try {
    await prisma.product.update({
      where: { id },
      data: { shippingWeightKg },
    });
    return NextResponse.redirect(
      new URL('/admin/products', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
      303,
    );
  } catch {
    const url = new URL('/admin/products', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    url.searchParams.set('error', 'PRODUCT_NOT_FOUND');
    return NextResponse.redirect(url, 303);
  }
}
