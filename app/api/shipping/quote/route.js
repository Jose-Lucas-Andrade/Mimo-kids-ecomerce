import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getShippingQuote } from '../../../../lib/shipping';

export async function POST(req) {
  try {
    const body = await req.json();
    const cep = body?.cep;
    if (!Array.isArray(body?.items) || body.items.length === 0 || body.items.length > 50) {
      return NextResponse.json({ error: 'SHIPPING_INVALID_ITEMS' }, { status: 400 });
    }

    const quantities = new Map();
    for (const item of body.items) {
      const id = Number(item?.id);
      const qty = Number(item?.qty);
      if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(qty) || qty <= 0 || qty > 99) {
        return NextResponse.json({ error: 'SHIPPING_INVALID_ITEMS' }, { status: 400 });
      }
      quantities.set(id, (quantities.get(id) || 0) + qty);
    }

    const products = await prisma.product.findMany({
      where: { id: { in: [...quantities.keys()] }, active: true },
      select: { id: true, shippingWeightKg: true },
    });
    if (products.length !== quantities.size) {
      return NextResponse.json({ error: 'SHIPPING_INVALID_ITEMS' }, { status: 400 });
    }

    const weight = products.reduce((total, product) => total + product.shippingWeightKg * quantities.get(product.id), 0);
    return NextResponse.json(await getShippingQuote(cep, weight));
  } catch (error) {
    const message = error?.message || 'SHIPPING_LOOKUP_FAILED';
    const status = message === 'SHIPPING_INVALID_CEP' || message === 'SHIPPING_INVALID_WEIGHT' ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
