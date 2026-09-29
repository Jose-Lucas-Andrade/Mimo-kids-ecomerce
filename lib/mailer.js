import nodemailer from 'nodemailer';
import { prisma } from './prisma';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function isMailConfigured() {
  return !!getTransport() && !!process.env.SMTP_FROM;
}

export async function sendOrderTrackingEmail(order) {
  const transport = getTransport();
  const from = process.env.SMTP_FROM;

  if (!transport || !from) {
    throw new Error('SMTP_NOT_CONFIGURED');
  }

  const trackingDetails = order.trackingCode
    ? `
      <p><strong>Código de rastreio:</strong> ${escapeHtml(order.trackingCode)}</p>
      ${order.trackingUrl ? `<p><a href="${escapeHtml(order.trackingUrl)}">Acompanhar entrega</a></p>` : ''}
    `
    : '<p>Seu pedido foi atualizado e em breve teremos mais detalhes de envio.</p>';

  await transport.sendMail({
    from,
    to: order.email,
    subject: `Atualizacao do pedido #${order.id}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#2f2440">
        <h2>Seu pedido #${order.id} foi atualizado</h2>
        <p>Oi, ${escapeHtml(order.name)}.</p>
        <p><strong>Status atual:</strong> ${escapeHtml(order.status)}</p>
        ${trackingDetails}
        <p>Valor total: R$ ${order.total.toFixed(2)}</p>
        <p>Obrigado por comprar com a gente.</p>
      </div>
    `,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { lastEmailSentAt: new Date() },
  });
}

export async function sendOrderPaymentReminderEmail(order) {
  const transport = getTransport();
  const from = process.env.SMTP_FROM;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!transport || !from) {
    throw new Error('SMTP_NOT_CONFIGURED');
  }
  if (!order.publicToken) {
    throw new Error('ORDER_PRIVATE_LINK_MISSING');
  }

  const orderUrl = new URL(`/success/${encodeURIComponent(order.publicToken)}`, baseUrl).toString();
  const safeName = escapeHtml(order.name);
  const safeUrl = escapeHtml(orderUrl);
  const formattedTotal = Number(order.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  await transport.sendMail({
    from,
    to: order.email,
    subject: `Pedido #${order.id} salvo — finalize quando quiser`,
    text: [
      `Olá, ${order.name}.`,
      '',
      `Salvamos seu pedido #${order.id}, no valor de ${formattedTotal}. O pagamento ainda está pendente.`,
      'Quando estiver pronto, acesse seu link privado para conferir o pedido e continuar para o pagamento.',
      'As formas disponíveis (por exemplo, Pix, boleto e cartões) dependem do provedor de pagamento e da configuração da loja.',
      '',
      orderUrl,
      '',
      'Se você já realizou o pagamento, aguarde a confirmação antes de tentar novamente.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#2f2440">
        <h2>Seu pedido foi salvo</h2>
        <p>Olá, ${safeName}.</p>
        <p>Salvamos o pedido <strong>#${order.id}</strong>, no valor de <strong>${escapeHtml(formattedTotal)}</strong>.
        O pagamento ainda está pendente.</p>
        <p>Quando quiser, volte ao link privado para conferir o pedido e continuar para o pagamento.
        As formas disponíveis — como Pix, boleto e cartões — dependem do provedor de pagamento e da configuração da loja.</p>
        <p><a href="${safeUrl}" style="display:inline-block;padding:12px 20px;background:#f05b36;color:#fff;text-decoration:none;border-radius:24px;font-weight:bold">Retomar meu pedido</a></p>
        <p>Se você já realizou o pagamento, aguarde a confirmação antes de tentar novamente.</p>
      </div>
    `,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { orderReminderSentAt: new Date() },
  });
}
