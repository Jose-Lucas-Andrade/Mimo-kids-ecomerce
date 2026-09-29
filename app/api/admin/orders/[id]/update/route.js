import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { verifySession } from '../../../../../../lib/auth';
import { sendOrderTrackingEmail } from '../../../../../../lib/mailer';
import { deductStockForOrderIfNeeded } from '../../../../../../lib/orders';

export async function POST(req, { params }) {
  const token = req.cookies.get('admin_session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const status = String(form.get('status') || 'PENDING');
  const trackingCode = String(form.get('trackingCode') || '').trim() || null;
  const trackingUrl = String(form.get('trackingUrl') || '').trim() || null;
  const sendEmail = form.get('sendEmail') === 'on';

  let order = await prisma.order.update({
    where: { id: Number(params.id) },
    data: {
      status,
      trackingCode,
      trackingUrl,
      shippedAt: status === 'SHIPPED' ? new Date() : null,
    },
    include: { items: true },
  });

  if (status === 'PAID' || status === 'SHIPPED' || status === 'DELIVERED') {
    try {
      order = await deductStockForOrderIfNeeded(order.id);
    } catch (error) {
      const redirectUrl = new URL('/admin/orders', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('emailError', error?.message || 'ORDER_STOCK_UPDATE_FAILED');
      return NextResponse.redirect(redirectUrl, 303);
    }
  }

  let emailError = null;
  if (sendEmail) {
    try {
      await sendOrderTrackingEmail(order);
      await prisma.order.update({
        where: { id: order.id },
        data: { lastEmailSentAt: new Date() },
      });
    } catch (error) {
      emailError = error?.message || 'EMAIL_SEND_FAILED';
    }
  }

  const redirectUrl = new URL('/admin/orders', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
  if (emailError) redirectUrl.searchParams.set('emailError', emailError);
  return NextResponse.redirect(redirectUrl, 303);
}
