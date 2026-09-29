import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { assertPaymentCheckoutReady, createPaymentPreferenceForOrder } from '../../../../../../lib/order-payment';

export async function POST(_request, { params }) {
  try {
    const baseUrl = assertPaymentCheckoutReady();
    const order = await prisma.order.findUnique({
      where: { publicToken: params.token },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }
    if (order.status === 'CANCELLED' || order.paymentStatus === 'APPROVED' || order.status === 'PAID') {
      return NextResponse.json({ error: 'ORDER_NOT_PAYABLE' }, { status: 409 });
    }

    const preference = await createPaymentPreferenceForOrder(order, baseUrl);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProvider: 'MERCADO_PAGO',
        paymentPreferenceId: String(preference.id),
      },
    });

    return NextResponse.json({
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    });
  } catch (error) {
    const message = error?.message || 'MERCADO_PAGO_ERROR';
    const status = message === 'MERCADO_PAGO_NOT_CONFIGURED' || message === 'PUBLIC_HTTPS_URL_REQUIRED'
      ? 400
      : message === 'MERCADO_PAGO_WEBHOOK_NOT_CONFIGURED'
        ? 503
        : 502;
    console.error('Could not resume Mercado Pago checkout:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
