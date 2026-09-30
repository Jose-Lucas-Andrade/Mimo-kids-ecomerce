import { cookies } from 'next/headers';
import { verifySession } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export default async function AdminProducts({ searchParams }){
  const token = cookies().get('admin_session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'ADMIN') return <div>Acesso negado.</div>;
  const query = searchParams?.q?.toString().trim() || '';
  const products = await prisma.product.findMany({
    where: query ? {
      OR: [
        { name: { contains: query } },
        { slug: { contains: query } },
        { barcode: { contains: query } },
      ],
    } : undefined,
    orderBy: { createdAt: 'desc' }
  });
  const error = searchParams?.error;
  const errorMessage = error === 'STOCK_LIMIT_EXCEEDED'
    ? 'A entrada ultrapassaria o limite de estoque permitido.'
    : error === 'STOCK_UPDATE_CONFLICT'
      ? 'O estoque foi alterado em outra operação. Atualize a página e tente novamente.'
      : error
        ? 'Nao foi possivel concluir a acao. Confira os dados e tente novamente.'
        : null;
  const received = Number(searchParams?.received || 0);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Produtos</h1>
        <a href="/admin/products/new" className="btn btn-primary">Cadastrar produto / escanear código</a>
      </div>
      <div className="card border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
        Para cadastrar com leitor, abra o cadastro, clique no campo de código de barras e escaneie. O leitor USB/Bluetooth precisa funcionar como teclado; a busca de dados é opcional. Se já tem o produto, use a busca abaixo para localizar pelo código.
      </div>
      <form className="card p-4" action="/admin/products" method="get">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input name="q" defaultValue={query} className="input flex-1" placeholder="Buscar por nome, slug ou escanear código de barras" />
          <button className="btn btn-outline">Buscar</button>
        </div>
      </form>
      {error && (
        <div role="alert" className="card border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {errorMessage}
        </div>
      )}
      {received > 0 && (
        <div role="status" className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Entrada de estoque registrada: {received} pacote(s).
        </div>
      )}
      <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Confira o peso do produto já embalado antes de vender. Produtos existentes receberam 0,30 kg inicialmente e precisam do peso real da embalagem.
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map(p => (
          <div key={p.id} className="card p-3 space-y-2">
            <img src={p.imageUrl} className="w-full h-40 object-cover rounded" />
            <div className="font-medium">{p.name}</div>
            <div className="text-sm text-gray-600">R$ {p.price.toFixed(2)}</div>
            <div className="text-sm text-gray-600">
              Estoque: {p.stock} unidades{p.barcode ? ` · Código: ${p.barcode}` : ''}
            </div>
            <div className="text-xs text-gray-600">
              {p.unitsPerPackage} unidade(s) por pacote
            </div>
            <form action={`/api/admin/products/${p.id}/receive-stock`} method="post" className="flex items-end gap-2">
              <label className="flex-1 space-y-1 text-sm">
                <span>Pacotes recebidos</span>
                <input name="packagesReceived" type="number" min="1" max="100000" step="1" required defaultValue="1" className="input" />
              </label>
              <button className="btn btn-outline">Somar ao estoque</button>
            </form>
            <form action={`/api/admin/products/${p.id}/shipping-weight`} method="post" className="flex items-end gap-2">
              <label className="flex-1 space-y-1 text-sm">
                <span>Peso embalado (kg)</span>
                <input name="shippingWeightKg" type="number" min="0.01" max="30" step="0.01" required defaultValue={p.shippingWeightKg.toFixed(2)} className="input" />
              </label>
              <button className="btn btn-outline">Salvar peso</button>
            </form>
            <form action={`/api/admin/products/${p.id}/delete`} method="post">
              <button className="btn btn-outline mt-2">Excluir</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
