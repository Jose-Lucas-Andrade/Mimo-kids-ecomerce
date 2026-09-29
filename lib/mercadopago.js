import { createHmac, timingSafeEqual } from 'node:crypto';

const API_BASE = 'https://api.mercadopago.com';

function getAccessToken() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN;
}

export function isMercadoPagoConfigured() {
  return !!getAccessToken();
}

export function verifyMercadoPagoWebhookSignature({ signature, requestId, dataId }) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret || !signature || !requestId || !dataId) {
    return false;
  }

  const parts = Object.fromEntries(
    signature.split(',').map((part) => {
      const separator = part.indexOf('=');
      return separator < 0
        ? [part.trim(), '']
        : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    }),
  );
  if (!/^\d+$/.test(parts.ts || '') || !/^[a-f\d]{64}$/i.test(parts.v1 || '')) {
    return false;
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  const received = Buffer.from(parts.v1, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function createCheckoutPreference(payload) {
  const token = getAccessToken();
  if (!token) {
    throw new Error('MERCADO_PAGO_NOT_CONFIGURED');
  }

  const response = await fetch(`${API_BASE}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`MERCADO_PAGO_PREFERENCE_ERROR:${response.status}`);
  }

  return response.json();
}

export async function getPaymentById(paymentId) {
  const token = getAccessToken();
  if (!token) {
    throw new Error('MERCADO_PAGO_NOT_CONFIGURED');
  }

  const response = await fetch(`${API_BASE}/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`MERCADO_PAGO_PAYMENT_ERROR:${response.status}`);
  }

  return response.json();
}
