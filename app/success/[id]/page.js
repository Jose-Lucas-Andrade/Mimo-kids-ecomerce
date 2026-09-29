import { prisma } from '../../../lib/prisma';
import { isMercadoPagoConfigured } from '../../../lib/mercadopago';
import ContinuePayment from './ContinuePayment';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function SuccessPage({ params, searchParams }) {
  const order = await prisma.order.findUnique({ where: { publicToken: params.id }, include: { items: true } });
  if (!order) return <div>Pedido nao encontrado.</div>;
  const emailStatus = searchParams?.email;
  const canPay = order.status !== 'CANCELLED' && order.status !== 'PAID' && order.paymentStatus !== 'APPROVED';

  return (
    <div className="space-y-6">
      <section className="card soft-panel p-6 sm:p-8">
        <div className="space-y-3">
          <span className="eyebrow">Pedido confirmado</span>
          <h1 className="section-title">Pedido #{order.id} registrado com sucesso.</h1>
          <p className="max-w-2xl text-[color:var(--muted)]">
            Guarde este link privado para consultar o pedido e acompanhar as atualizações.
          </p>
        </div>
      </section>

      {emailStatus === 'sent' && (
        <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Enviamos um e-mail com o link privado e as instruções para continuar o pedido.
        </div>
      )}
      {emailStatus === 'failed' && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          O pedido foi salvo, mas não foi possível enviar o e-mail. Guarde este link privado para consultar o pedido.
        </div>
      )}
      {emailStatus !== 'sent' && emailStatus !== 'failed' && order.orderReminderSentAt && (
        <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Enviamos um e-mail com o link privado e as instruções para continuar o pedido.
        </div>
      )}
      <div className="card space-y-4 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] bg-white/80 p-4 text-sm">
            <div className="font-semibold">Total</div>
            <div className="mt-1 text-[color:var(--muted)]">R$ {order.total.toFixed(2)} (Frete R$ {order.shipping.toFixed(2)})</div>
          </div>
          <div className="rounded-[22px] bg-white/80 p-4 text-sm">
            <div className="font-semibold">Status do pedido</div>
            <div className="mt-1 text-[color:var(--muted)]">{order.status}</div>
          </div>
          <div className="rounded-[22px] bg-white/80 p-4 text-sm">
            <div className="font-semibold">Status do pagamento</div>
            <div className="mt-1 text-[color:var(--muted)]">{order.paymentStatus || 'NAO INFORMADO'}</div>
          </div>
        </div>

        <div>
          <strong>Itens:</strong>
          <ul className="ml-5 mt-2 list-disc">
            {order.items.map((item) => <li key={item.id}>{item.qty}x {item.name} - R$ {(item.price * item.qty).toFixed(2)}</li>)}
          </ul>
        </div>

        {canPay && (
          <div className="border-t border-[color:var(--line)] pt-4">
            <h2 className="font-display text-2xl font-extrabold">Pagamento pendente</h2>
            <p className="mb-3 text-sm text-[color:var(--muted)]">
              Continue para ver as formas de pagamento disponíveis. Pix, boleto e cartões dependem da configuração do provedor.
            </p>
            <ContinuePayment token={order.publicToken} enabled={isMercadoPagoConfigured()} />
          </div>
        )}
      </div>
    </div>
  );
}
