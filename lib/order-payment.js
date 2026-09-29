import { createCheckoutPreference, isMercadoPagoConfigured } from './mercadopago';

export function assertPaymentCheckoutReady() {
  if (!isMercadoPagoConfigured()) {
    throw new Error('MERCADO_PAGO_NOT_CONFIGURED');
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  if (process.env.NODE_ENV === 'production' && !baseUrl.startsWith('https://')) {
    throw new Error('PUBLIC_HTTPS_URL_REQUIRED');
  }
  if (process.env.NODE_ENV === 'production' && !process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
    throw new Error('MERCADO_PAGO_WEBHOOK_NOT_CONFIGURED');
  }
  return baseUrl;
}

export async function createPaymentPreferenceForOrder(order, baseUrl, emailStatus) {
  if (!order.publicToken) {
    throw new Error('ORDER_PRIVATE_LINK_MISSING');
  }

  const emailQuery = emailStatus ? `&email=${emailStatus}` : '';
  const returnUrl = `${baseUrl}/payment/mercadopago/return?token=${encodeURIComponent(order.publicToken)}${emailQuery}`;
  return createCheckoutPreference({
    external_reference: String(order.id),
    payer: {
      name: order.name,
      email: order.email,
    },
    items: [
      ...order.items.map((item) => ({
        title: item.name,
        quantity: item.qty,
        currency_id: 'BRL',
        unit_price: Number(item.price),
      })),
      ...(order.shipping > 0
        ? [{
            title: 'Frete',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: order.shipping,
          }]
        : []),
    ],
    back_urls: {
      success: returnUrl,
      pending: returnUrl,
      failure: returnUrl,
    },
    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    auto_return: 'approved',
    statement_descriptor: 'MIMOKIDS',
    metadata: {
      order_id: order.id,
    },
  });
}
