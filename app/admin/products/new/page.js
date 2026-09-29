import { cookies } from 'next/headers';
import { verifySession } from '../../../../lib/auth';

export default async function NewProduct({ searchParams }){
  const token = cookies().get('admin_session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'ADMIN') return <div>Acesso negado.</div>;

  return (
    <form className="card p-6 max-w-xl space-y-3" action="/api/admin/products/create" method="post">
      <h1 className="text-xl font-semibold">Novo Produto</h1>
      {searchParams?.error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          Não foi possível criar o produto. Confira os campos obrigatórios e se o código de barras ou slug já está cadastrado.
        </div>
      )}
      <input name="name" className="input" placeholder="Nome" required />
      <input name="slug" className="input" placeholder="slug-exemplo" required />
      <label className="block space-y-1 text-sm">
        <span>Código de barras do produto ou da caixa (bipe o leitor)</span>
        <input name="barcode" className="input" inputMode="numeric" autoFocus placeholder="EAN-8, UPC-A, EAN-13 ou GTIN-14" />
        <span className="block text-xs text-[color:var(--muted)]">
          O leitor digita o código neste campo. O código identifica o produto, mas não informa quantas unidades vêm na caixa.
        </span>
      </label>
      <input name="price" className="input" placeholder="Preço (ex: 19.90)" required />
      <input name="imageUrl" className="input" placeholder="URL da imagem" required />
      <label className="block space-y-1 text-sm">
        <span>Unidades que vêm em cada pacote/caixa</span>
        <input name="unitsPerPackage" type="number" min="1" max="10000" step="1" className="input" defaultValue="1" required />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Pacotes/caixas recebidos agora</span>
        <input name="packagesReceived" type="number" min="0" max="100000" step="1" className="input" defaultValue="0" required />
        <span className="block text-xs text-[color:var(--muted)]">O estoque será calculado em unidades: pacotes × unidades por pacote.</span>
      </label>
      <label className="block space-y-1 text-sm">
        <span>Peso embalado para o frete (kg)</span>
        <input name="shippingWeightKg" type="number" min="0.01" max="30" step="0.01" className="input" defaultValue="0.30" required />
      </label>
      <textarea name="description" className="input" placeholder="Descrição"></textarea>
      <button className="btn btn-primary">Salvar</button>
    </form>
  );
}
