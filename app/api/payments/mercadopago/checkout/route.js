import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { isMercadoPagoConfigured } from '../../../../../lib/mercadopago';
import { buildOrderPayload, createOrderWithOptionalStock } from '../../../../../lib/orders';
import { assertPaymentCheckoutReady, createPaymentPreferenceForOrder } from '../../../../../lib/order-payment';
import { sendOrderPaymentReminderEmail } from '../../../../../lib/mailer';

export async function POST(req) {
  try {
    if (!isMercadoPagoConfigured()) {
      return NextResponse.json({ error: 'MERCADO_PAGO_NOT_CONFIGURED' }, { status: 400 });
    }
    const baseUrl = assertPaymentCheckoutReady();

    const body = await req.json();
    const payload = await buildOrderPayload(body);

    const order = await createOrderWithOptionalStock(payload, {
      paymentProvider: 'MERCADO_PAGO',
      paymentStatus: 'PENDING',
      deductStock: false,
    });

    let emailSent = false;
    try {
      await sendOrderPaymentReminderEmail(order);
      emailSent = true;
    } catch (emailError) {
      console.error(`Order ${order.id} was created, but its payment reminder email could not be sent:`, emailError);
    }

    const preference = await createPaymentPreferenceForOrder(order, baseUrl, emailSent ? 'sent' : 'failed');
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentPreferenceId: String(preference.id),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      preferenceId: preference.id,
      emailSent,
      emailError: emailSent ? null : 'ORDER_EMAIL_NOT_SENT',
    });
  } catch (error) {
    const message = error?.message || 'MERCADO_PAGO_ERROR';
    const status = message === 'MERCADO_PAGO_NOT_CONFIGURED' || message.startsWith('ORDER_') || message === 'SHIPPING_INVALID_CEP' || message === 'PUBLIC_HTTPS_URL_REQUIRED'
      ? 400
      : message === 'MERCADO_PAGO_WEBHOOK_NOT_CONFIGURED' ? 503
      : message.startsWith('SHIPPING_') ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
