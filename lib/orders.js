import { prisma } from './prisma';
import { randomUUID } from 'node:crypto';
import { getShippingQuote } from './shipping';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function buildOrderPayload(body) {
  const name = normalizeText(body?.name);
  const email = normalizeText(body?.email).toLowerCase();
  const cep = normalizeText(body?.cep).replace(/\D/g, '');
  const address = normalizeText(body?.address);
  const number = normalizeText(body?.number);
  const complement = normalizeText(body?.complement);
  const neighborhood = normalizeText(body?.neighborhood);
  const city = normalizeText(body?.city);
  const state = normalizeText(body?.state).toUpperCase();
  const shipping = Number(body?.shipping);
  const items = body?.items;

  if (
    !name || name.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
    cep.length !== 8 ||
    !address || address.length > 200 ||
    !number || number.length > 30 ||
    complement.length > 200 || neighborhood.length > 100 ||
    !city || city.length > 100 || state.length !== 2
  ) {
    throw new Error('ORDER_REQUIRED_FIELDS');
  }

  if (!Array.isArray(items) || !items.length || items.length > 50) {
    throw new Error('ORDER_EMPTY_CART');
  }

  const quantities = new Map();
  for (const item of items) {
    const id = Number(item?.id);
    const qty = Number(item?.qty);
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(qty) || qty <= 0 || qty > 99) {
      throw new Error('ORDER_INVALID_ITEM');
    }
    quantities.set(id, (quantities.get(id) || 0) + qty);
  }

  const productIds = [...quantities.keys()];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });

  if (products.length !== productIds.length) {
    throw new Error('ORDER_INVALID_PRODUCTS');
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const orderItems = productIds.map((id) => {
    const product = productMap.get(id);
    const qty = quantities.get(id);

    if (!product) {
      throw new Error('ORDER_INVALID_ITEM');
    }

    if (product.stock < qty) {
      throw new Error(`ORDER_OUT_OF_STOCK:${product.name}`);
    }

    return {
      productId: product.id,
      name: product.name,
      qty,
      price: Number(product.price),
    };
  });

  const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const quote = await getShippingQuote(
    cep,
    orderItems.reduce((sum, item) => sum + item.qty * Number(productMap.get(item.productId).shippingWeightKg || 0.3), 0),
  );
  if (state !== quote.state) {
    throw new Error('ORDER_ADDRESS_MISMATCH');
  }

  if (!Number.isFinite(shipping) || !quote.options.some((option) => Math.round(option.price * 100) === Math.round(shipping * 100))) {
    throw new Error('ORDER_INVALID_SHIPPING');
  }

  const shippingValue = shipping;
  const total = subtotal + shippingValue;

  return {
    customer: { name, email, cep, address, number, complement: complement || null, neighborhood: neighborhood || null, city: quote.city, state: quote.state },
    items: orderItems,
    subtotal,
    shippingValue,
    total,
  };
}

export async function createOrderWithOptionalStock(payload, options = {}) {
  const { paymentProvider = 'MANUAL', paymentStatus = 'PENDING', deductStock = false } = options;

  return prisma.$transaction(async (tx) => {
    if (deductStock) {
      for (const item of payload.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.qty },
          },
          data: {
            stock: { decrement: item.qty },
          },
        });

        if (updated.count !== 1) {
          throw new Error(`ORDER_OUT_OF_STOCK:${item.name}`);
        }
      }
    }

    const order = await tx.order.create({
      data: {
        ...payload.customer,
        shipping: payload.shippingValue,
        subtotal: payload.subtotal,
        total: payload.total,
        paymentProvider,
        paymentStatus,
        publicToken: randomUUID(),
        stockDeductedAt: deductStock ? new Date() : null,
        items: {
          create: payload.items,
        },
      },
      include: { items: true },
    });

    return order;
  });
}

export async function deductStockForOrderIfNeeded(orderId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    if (order.stockDeductedAt) {
      return order;
    }

    for (const item of order.items) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: { gte: item.qty },
        },
        data: {
          stock: { decrement: item.qty },
        },
      });

      if (updated.count !== 1) {
        throw new Error(`ORDER_OUT_OF_STOCK:${item.name}`);
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: { stockDeductedAt: new Date() },
      include: { items: true },
    });
  });
}
