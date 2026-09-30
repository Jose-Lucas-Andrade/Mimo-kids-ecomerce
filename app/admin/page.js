import { cookies } from 'next/headers';
import { verifySession } from '../../lib/auth';

export default async function AdminHome(){
  const token = cookies().get('admin_session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'ADMIN') {
    return <div className="card p-4">Acesso negado. <a className="underline" href="/admin/login">Fazer login</a></div>;
  }
  return (
    <div className="space-y-6">
      <section className="card soft-panel p-6 sm:p-8">
        <div className="space-y-3">
          <span className="eyebrow">Admin</span>
          <h1 className="section-title">Painel de operacao da loja</h1>
          <p className="max-w-2xl text-[color:var(--muted)]">
            Acompanhe produtos, pedidos, rastreio, estoque e andamento da loja em um unico lugar.
          </p>
          <a className="btn btn-primary mt-2 inline-flex" href="/admin/products/new">
            Cadastrar produto / escanear código
          </a>
          <p className="max-w-2xl text-xs text-[color:var(--muted)]">
            Conecte um leitor USB ou Bluetooth que funcione como teclado e escaneie no campo “Código de barras”.
          </p>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <a className="card p-5 hover:shadow" href="/admin/products">
          <div className="font-display text-3xl font-extrabold">Produtos</div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Cadastre itens, pesquise por nome e acompanhe o estoque da vitrine.</p>
        </a>
        <a className="card p-5 hover:shadow" href="/admin/orders">
          <div className="font-display text-3xl font-extrabold">Pedidos</div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Filtre pedidos, atualize status, rastreio e acompanhe o pagamento.</p>
        </a>
      </div>
      <form action="/api/admin/logout" method="post">
        <button className="btn btn-outline mt-3">Sair</button>
      </form>
    </div>
  );
}
