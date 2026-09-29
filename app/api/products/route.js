import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifySession } from '../../../lib/auth';

export async function GET() {
  const products = await prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(products);
}

export async function POST(req) {
  const token = req.cookies.get('admin_session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const product = await prisma.product.create({ data });
  return NextResponse.json(product, { status: 201 });
}
