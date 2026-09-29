import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import {
  getPaymentById,
  isMercadoPagoConfigured,
  verifyMercadoPagoWebhookSignature,
} from '../../../../lib/mercadopago';
import { deductStockForOrderIfNeeded } from '../../../../lib/orders';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!process.env.MERCADO_PAGO_WEBHOOK_SECRET || !isMercadoPagoConfigured()) {
    return NextResponse.json({ error: 'MERCADO_PAGO_WEBHOOK_NOT_CONFIGURED' }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_NOTIFICATION' }, { status: 400 });
  }

  const dataId = requestUrl.searchParams.get('data.id') || String(body?.data?.id || '');
  if (!/^\d+$/.test(dataId)) {
    return NextResponse.json({ error: 'INVALID_PAYMENT_ID' }, { status: 400 });
  }

  const signatureIsValid = verifyMercadoPagoWebhookSignature({
    signature: request.headers.get('x-signature'),
    requestId: request.headers.get('x-request-id'),
    dataId,
  });
  if (!signatureIsValid) {
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });
  }

  try {
    const payment = await getPaymentById(dataId);
    const orderId = Number(payment.external_reference);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentProvider !== 'MERCADO_PAGO') {
      return NextResponse.json({ received: true });
    }

    const paymentAmount = Number(payment.transaction_amount);
    if (
      String(payment.external_reference) !== String(order.id) ||
      payment.currency_id !== 'BRL' ||
      !Number.isFinite(paymentAmount) ||
      paymentAmount.toFixed(2) !== order.total.toFixed(2)
    ) {
      console.error('Mercado Pago webhook payment did not match its order.');
      return NextResponse.json({ error: 'PAYMENT_ORDER_MISMATCH' }, { status: 422 });
    }

    const paymentStatus = String(payment.status || '').toUpperCase();
    if (!paymentStatus) {
      return NextResponse.json({ error: 'INVALID_PAYMENT_STATUS' }, { status: 422 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus,
        paymentId: String(payment.id),
        status: paymentStatus === 'APPROVED' && order.status === 'PENDING' ? 'PAID' : order.status,
      },
    });

    if (paymentStatus === 'APPROVED') {
      await deductStockForOrderIfNeeded(order.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Mercado Pago webhook processing failed:', error);
    return NextResponse.json({ error: 'WEBHOOK_PROCESSING_FAILED' }, { status: 500 });
  }
}
