import { prisma } from '../../../../lib/prisma';
import { getPaymentById, isMercadoPagoConfigured } from '../../../../lib/mercadopago';
import { deductStockForOrderIfNeeded } from '../../../../lib/orders';
import ClearCartOnApprove from './ClearCartOnApprove';

function getLabels(status) {
  if (status === 'approved') {
    return {
      title: 'Pagamento aprovado',
      description: 'Seu pagamento foi confirmado e seu pedido ja entrou em preparacao.',
    };
  }

  if (status === 'pending' || status === 'in_process') {
    return {
      title: 'Pagamento em analise',
      description: 'Recebemos o pedido e estamos aguardando a confirmacao do pagamento.',
    };
  }

  return {
    title: 'Pagamento nao concluido',
    description: 'O pedido foi registrado, mas o pagamento nao foi aprovado ainda.',
  };
}

export default async function MercadoPagoReturnPage({ searchParams }) {
  const orderId = Number(searchParams?.external_reference || 0);
  const paymentId = searchParams?.payment_id ? String(searchParams.payment_id) : null;
  const merchantOrderId = searchParams?.merchant_order_id ? String(searchParams.merchant_order_id) : null;
  const accessToken = searchParams?.token ? String(searchParams.token) : null;
  const emailStatus = searchParams?.email;

  let order = null;
  let verifiedStatus = 'pending';
  let verificationError = false;
  let accessDenied = false;
  if (orderId) {
    const currentOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!currentOrder || !accessToken || currentOrder.publicToken !== accessToken) {
      accessDenied = true;
    } else if (paymentId && /^\d+$/.test(paymentId) && currentOrder.paymentProvider === 'MERCADO_PAGO' && isMercadoPagoConfigured()) {
      try {
        const payment = await getPaymentById(paymentId);
        const amountMatches = Number.isFinite(Number(payment.transaction_amount)) &&
          Number(payment.transaction_amount).toFixed(2) === Number(currentOrder.total).toFixed(2);
        if (
          String(payment.external_reference) !== String(orderId) ||
          payment.currency_id !== 'BRL' ||
          !amountMatches
        ) {
          throw new Error('PAYMENT_ORDER_MISMATCH');
        }

        const normalizedStatus = String(payment.status || '').toUpperCase();
        verifiedStatus = normalizedStatus.toLowerCase();

        order = await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentProvider: 'MERCADO_PAGO',
            paymentStatus: normalizedStatus,
            paymentId: String(payment.id),
            merchantOrderId,
            status: normalizedStatus === 'APPROVED' && currentOrder.status === 'PENDING' ? 'PAID' : currentOrder.status,
          },
          include: { items: true },
        });

        if (normalizedStatus === 'APPROVED') {
          order = await deductStockForOrderIfNeeded(orderId);
        }
      } catch (error) {
        console.error('Mercado Pago return verification failed:', error);
        verificationError = true;
        order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
      }
    } else {
      order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    }
  }

  const labels = getLabels(verifiedStatus);

  return (
    <div className="space-y-6">
      <ClearCartOnApprove shouldClear={verifiedStatus === 'approved'} />

      <section className="card soft-panel p-6 sm:p-8">
        <div className="space-y-3">
          <span className="eyebrow">Mercado Pago</span>
          <h1 className="section-title">{labels.title}</h1>
          <p className="max-w-2xl text-[color:var(--muted)]">{labels.description}</p>
        </div>
      </section>

      {accessDenied && (
        <div className="card p-4 text-sm text-rose-900">
          Link privado inválido. Use o link recebido ao iniciar o pagamento.
        </div>
      )}
      {verificationError && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Nao foi possivel confirmar o pagamento agora. O pedido continua registrado como pendente; consulte o status mais tarde.
        </div>
      )}
      {emailStatus === 'failed' && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          O pedido foi registrado, mas o e-mail de lembrete não pôde ser enviado. Guarde o link privado do pedido.
        </div>
      )}
      {emailStatus === 'sent' && (
        <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Enviamos um e-mail com o resumo e o link privado do pedido.
        </div>
      )}

      {order ? (
        <div className="card space-y-4 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="font-display text-3xl font-extrabold">Pedido #{order.id}</div>
              <div className="text-sm text-[color:var(--muted)]">{order.name} - {order.email}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[color:var(--muted)]">Total</div>
              <div className="text-2xl font-extrabold">R$ {order.total.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] bg-white/80 p-4 text-sm">
              <div className="font-semibold">Status do pedido</div>
              <div className="mt-1 text-[color:var(--muted)]">{order.status}</div>
            </div>
            <div className="rounded-[22px] bg-white/80 p-4 text-sm">
              <div className="font-semibold">Status do pagamento</div>
              <div className="mt-1 text-[color:var(--muted)]">{order.paymentStatus}</div>
            </div>
            <div className="rounded-[22px] bg-white/80 p-4 text-sm">
              <div className="font-semibold">Pagamento</div>
              <div className="mt-1 text-[color:var(--muted)]">{order.paymentId || 'Aguardando id do pagamento'}</div>
            </div>
          </div>

          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-[18px] bg-white/80 px-4 py-3 text-sm">
                <span>{item.qty}x {item.name}</span>
                <strong>R$ {(item.price * item.qty).toFixed(2)}</strong>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {order.publicToken && <a href={`/success/${order.publicToken}`} className="btn btn-primary">Ver resumo do pedido</a>}
            <a href="/products" className="btn btn-outline">Voltar ao catalogo</a>
          </div>
        </div>
      ) : (
        <div className="card p-6">Nao foi possivel localizar o pedido retornado pelo pagamento.</div>
      )}
    </div>
  );
}
