import { cookies } from 'next/headers';
import { verifySession } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { isMailConfigured } from '../../../lib/mailer';

const statuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function statusLabel(status) {
  const labels = {
    PENDING: 'Pendente',
    PAID: 'Pago',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregue',
    CANCELLED: 'Cancelado',
  };
  return labels[status] || status;
}

export default async function AdminOrders({ searchParams }) {
  const token = cookies().get('admin_session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'ADMIN') return <div>Acesso negado.</div>;

  const statusFilter = searchParams?.status?.toString() || '';
  const query = searchParams?.q?.toString().trim() || '';
  const orders = await prisma.order.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(query ? {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { trackingCode: { contains: query } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });
  const mailConfigured = isMailConfigured();
  const emailError = searchParams?.emailError;
  const formattedError = emailError?.startsWith('ORDER_OUT_OF_STOCK:')
    ? `Nao ha estoque suficiente para ${emailError.split(':').slice(1).join(':')}.`
    : emailError;
  const counters = {
    total: orders.length,
    pending: orders.filter((order) => order.status === 'PENDING').length,
    paid: orders.filter((order) => order.status === 'PAID').length,
    shipped: orders.filter((order) => order.status === 'SHIPPED').length,
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-extrabold">Pedidos</h1>
        <p className="text-sm text-[color:var(--muted)]">
          Atualize status, salve codigo de rastreio, acompanhe pagamento e envie email para o cliente quando quiser.
        </p>
      </div>

      <section className="card soft-panel p-5 sm:p-6">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-[22px] bg-white/80 p-4 text-center">
            <div className="font-display text-3xl font-extrabold">{counters.total}</div>
            <div className="text-sm text-[color:var(--muted)]">visiveis</div>
          </div>
          <div className="rounded-[22px] bg-white/80 p-4 text-center">
            <div className="font-display text-3xl font-extrabold">{counters.pending}</div>
            <div className="text-sm text-[color:var(--muted)]">pendentes</div>
          </div>
          <div className="rounded-[22px] bg-white/80 p-4 text-center">
            <div className="font-display text-3xl font-extrabold">{counters.paid}</div>
            <div className="text-sm text-[color:var(--muted)]">pagos</div>
          </div>
          <div className="rounded-[22px] bg-white/80 p-4 text-center">
            <div className="font-display text-3xl font-extrabold">{counters.shipped}</div>
            <div className="text-sm text-[color:var(--muted)]">enviados</div>
          </div>
        </div>
      </section>

      <form className="card grid gap-3 p-4 md:grid-cols-[1fr,220px,auto]" action="/admin/orders" method="get">
        <input
          name="q"
          defaultValue={query}
          className="input"
          placeholder="Buscar por nome, email ou rastreio"
        />
        <select name="status" defaultValue={statusFilter} className="input">
          <option value="">Todos os status</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{statusLabel(status)}</option>
          ))}
        </select>
        <button className="btn btn-outline">Filtrar</button>
      </form>

      {!mailConfigured && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Configure SMTP no arquivo <strong>.env</strong> para habilitar envio real de email ao cliente.
        </div>
      )}

      {formattedError && (
        <div className="card border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          Nao foi possivel concluir a atualizacao do pedido. Motivo: {formattedError}
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <form key={order.id} className="card space-y-4 p-5" action={`/api/admin/orders/${order.id}/update`} method="post">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="font-display text-3xl font-extrabold">Pedido #{order.id}</div>
                <div className="text-sm text-[color:var(--muted)]">
                  {order.name} - {order.email} - {order.city}/{order.state}
                </div>
                <div className="text-sm text-[color:var(--muted)]">
                  {order.address}, {order.number}{order.complement ? ` - ${order.complement}` : ''}{order.neighborhood ? ` - ${order.neighborhood}` : ''}
                </div>
                <div className="mt-2 text-sm text-[color:var(--muted)]">
                  Itens: {order.items.map((item) => `${item.qty}x ${item.name}`).join(', ')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[color:var(--muted)]">Total</div>
                <div className="text-2xl font-extrabold">R$ {order.total.toFixed(2)}</div>
                <div className="text-sm text-[color:var(--muted)]">Criado em {new Date(order.createdAt).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 text-sm">
                <span className="font-semibold">Status</span>
                <select name="status" defaultValue={order.status} className="input">
                  {statuses.map((status) => (
                    <option key={status} value={status}>{statusLabel(status)}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-semibold">Codigo de rastreio</span>
                <input name="trackingCode" defaultValue={order.trackingCode || ''} className="input" placeholder="AA123456789BR" />
              </label>

              <label className="space-y-2 text-sm md:col-span-2">
                <span className="font-semibold">Link de rastreio</span>
                <input name="trackingUrl" defaultValue={order.trackingUrl || ''} className="input" placeholder="https://..." />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-[22px] bg-white/80 p-4 text-sm text-[color:var(--muted)]">
                <div className="font-semibold text-[color:var(--text)]">Status atual</div>
                <div className="mt-1">{statusLabel(order.status)}</div>
              </div>
              <div className="rounded-[22px] bg-white/80 p-4 text-sm text-[color:var(--muted)]">
                <div className="font-semibold text-[color:var(--text)]">Pagamento</div>
                <div className="mt-1">{order.paymentProvider || 'Manual'} - {order.paymentStatus || 'PENDING'}</div>
              </div>
              <div className="rounded-[22px] bg-white/80 p-4 text-sm text-[color:var(--muted)]">
                <div className="font-semibold text-[color:var(--text)]">Ultimo rastreio</div>
                <div className="mt-1">{order.trackingCode || 'Nao informado'}</div>
              </div>
              <div className="rounded-[22px] bg-white/80 p-4 text-sm text-[color:var(--muted)]">
                <div className="font-semibold text-[color:var(--text)]">Ultimo email</div>
                <div className="mt-1">{order.lastEmailSentAt ? new Date(order.lastEmailSentAt).toLocaleString('pt-BR') : 'Ainda nao enviado'}</div>
              </div>
              <div className="rounded-[22px] bg-white/80 p-4 text-sm text-[color:var(--muted)]">
                <div className="font-semibold text-[color:var(--text)]">Lembrete do pedido</div>
                <div className="mt-1">{order.orderReminderSentAt ? new Date(order.orderReminderSentAt).toLocaleString('pt-BR') : 'Ainda nao enviado'}</div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-[color:var(--text)]">
              <input type="checkbox" name="sendEmail" disabled={!mailConfigured} />
              Enviar email ao cliente com esta atualizacao
            </label>

            <div className="flex flex-wrap gap-3">
              <button className="btn btn-primary">Salvar atualizacao</button>
              <button type="submit" name="status" value="PAID" className="btn btn-outline">Marcar como pago</button>
              <button type="submit" name="status" value="SHIPPED" className="btn btn-outline">Marcar como enviado</button>
              <button type="submit" name="status" value="DELIVERED" className="btn btn-outline">Marcar como entregue</button>
              {order.trackingUrl && (
                <a className="btn btn-outline" href={order.trackingUrl} target="_blank">Abrir rastreio</a>
              )}
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
