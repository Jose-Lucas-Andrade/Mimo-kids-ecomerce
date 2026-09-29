import { NextResponse } from 'next/server';
import { buildOrderPayload, createOrderWithOptionalStock } from '../../../lib/orders';
import { sendOrderPaymentReminderEmail } from '../../../lib/mailer';

export async function POST(req) {
  try {
    const body = await req.json();
    const payload = await buildOrderPayload(body);

    const order = await createOrderWithOptionalStock(payload, {
      paymentProvider: 'MANUAL',
      paymentStatus: 'PENDING',
      deductStock: true,
    });

    let emailSent = false;
    try {
      await sendOrderPaymentReminderEmail(order);
      emailSent = true;
    } catch (emailError) {
      console.error(`Order ${order.id} was saved, but its payment reminder email could not be sent:`, emailError);
    }

    return NextResponse.json({
      id: order.id,
      publicToken: order.publicToken,
      emailSent,
      emailError: emailSent ? null : 'ORDER_EMAIL_NOT_SENT',
    }, { status: 201 });
  } catch (error) {
    const message = error?.message || 'ORDER_CREATE_ERROR';
    const status = message.startsWith('ORDER_') || message === 'SHIPPING_INVALID_CEP'
      ? 400
      : message.startsWith('SHIPPING_') ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
