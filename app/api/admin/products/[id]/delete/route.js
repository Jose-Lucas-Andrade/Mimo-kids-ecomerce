import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { verifySession } from '../../../../../../lib/auth';

export async function POST(req, { params }) {
  const token = req.cookies.get('admin_session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.product.delete({ where: { id: Number(params.id) } });
    return NextResponse.redirect(new URL('/admin/products', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'), 303);
  } catch {
    const errorUrl = new URL('/admin/products', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    errorUrl.searchParams.set('error', 'PRODUCT_DELETE_FAILED');
    return NextResponse.redirect(errorUrl, 303);
  }
}
