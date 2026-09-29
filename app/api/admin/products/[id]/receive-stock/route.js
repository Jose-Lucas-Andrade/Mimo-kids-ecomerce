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
  const packagesReceived = Number(form.get('packagesReceived'));
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(packagesReceived) || packagesReceived <= 0 || packagesReceived > 100000) {
    const url = new URL('/admin/products', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    url.searchParams.set('error', 'INVALID_STOCK_RECEIPT');
    return NextResponse.redirect(url, 303);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id }, select: { stock: true, unitsPerPackage: true } });
      if (!product) throw new Error('PRODUCT_NOT_FOUND');

      const unitsToAdd = packagesReceived * product.unitsPerPackage;
      if (!Number.isSafeInteger(unitsToAdd) || product.stock + unitsToAdd > 2147483647) {
        throw new Error('STOCK_LIMIT_EXCEEDED');
      }

      const update = await tx.product.updateMany({
        where: { id, stock: product.stock },
        data: { stock: { increment: unitsToAdd } },
      });
      if (update.count !== 1) throw new Error('STOCK_UPDATE_CONFLICT');
      return update;
    });

    const url = new URL('/admin/products', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    url.searchParams.set('received', String(packagesReceived));
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL('/admin/products', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    const errorCode = error?.message === 'STOCK_LIMIT_EXCEEDED'
      ? 'STOCK_LIMIT_EXCEEDED'
      : error?.message === 'STOCK_UPDATE_CONFLICT'
        ? 'STOCK_UPDATE_CONFLICT'
        : 'STOCK_RECEIPT_FAILED';
    url.searchParams.set('error', errorCode);
    return NextResponse.redirect(url, 303);
  }
}
