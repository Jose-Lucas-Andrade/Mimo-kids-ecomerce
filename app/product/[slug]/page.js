import { prisma } from '../../../lib/prisma';
import AddToCart from './sections/AddToCart';

export default async function ProductPage({ params }) {
  const product = await prisma.product.findFirst({ where: { slug: params.slug, active: true } });
  if (!product) return <div>Produto nao encontrado.</div>;

  return (
    <div className="space-y-8">
      <div className="text-sm font-bold text-[color:var(--muted)]">
        <a href="/" className="hover:text-[color:var(--brand-deep)]">Inicio</a> / <a href="/products" className="hover:text-[color:var(--brand-deep)]">Catalogo</a> / {product.name}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="card overflow-hidden p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#fff7ef,#ffe5d6)]">
            <div className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-[color:var(--brand-deep)]">
              Destaque da loja
            </div>
            <img src={product.imageUrl} alt={product.name} className="aspect-[4/4.1] w-full object-cover" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card soft-panel p-6 sm:p-8">
            <div className="space-y-4">
              <span className="eyebrow">Pronto para enviar</span>
              <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">{product.name}</h1>
              <div className="flex flex-wrap items-end gap-3">
                <div className="text-4xl font-extrabold text-[color:var(--text)]">R$ {product.price.toFixed(2)}</div>
                <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-[color:var(--muted)]">
                  {product.stock} unidades em estoque
                </div>
              </div>
              <p className="whitespace-pre-wrap text-base leading-7 text-[color:var(--muted)]">
                {product.description || 'Produto selecionado para rotina escolar, organizacao e presentes com entrega para todo o Brasil.'}
              </p>
              <AddToCart product={product} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="card p-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[color:var(--brand-deep)]">Envio</div>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Calcule o frete pelo CEP direto no carrinho.</p>
            </div>
            <div className="card p-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[color:var(--brand-deep)]">Compra</div>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Checkout simples e confirmacao de pedido imediata.</p>
            </div>
            <div className="card p-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[color:var(--brand-deep)]">Curadoria</div>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Itens escolhidos para estudo, rotina e presente.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
