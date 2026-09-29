import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(_req, { params }) {
  const product = await prisma.product.findFirst({ where: { slug: params.slug, active: true } });
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(product);
}
