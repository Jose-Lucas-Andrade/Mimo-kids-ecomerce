import { prisma } from '../../lib/prisma';
import ProductCard from '../../components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }) {
  const q = searchParams?.q?.toString().toLowerCase() || '';
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });
  const filtered = q ? products.filter(p => p.name.toLowerCase().includes(q)) : products;
  const categories = [...new Set(products.map((product) => product.category?.name).filter(Boolean))];

  return (
    <div className="space-y-8">
      <section className="card soft-panel overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="eyebrow">Catalogo</span>
            <h1 className="section-title">Tudo para a rotina escolar, presentes e brincadeiras criativas.</h1>
            <p className="text-base text-[color:var(--muted)] sm:text-lg">
              Encontre papelaria, mochilas e brinquedos em uma vitrine mais leve, organizada e pensada para compra rapida.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] bg-white/80 px-4 py-4 text-center">
              <div className="font-display text-3xl font-extrabold">{filtered.length}</div>
              <div className="text-sm text-[color:var(--muted)]">itens visiveis</div>
            </div>
            <div className="rounded-[24px] bg-white/80 px-4 py-4 text-center">
              <div className="font-display text-3xl font-extrabold">{categories.length}</div>
              <div className="text-sm text-[color:var(--muted)]">categorias</div>
            </div>
            <div className="rounded-[24px] bg-white/80 px-4 py-4 text-center">
              <div className="font-display text-3xl font-extrabold">24h</div>
              <div className="text-sm text-[color:var(--muted)]">compra online</div>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category} className="rounded-full border border-[color:var(--line)] bg-white/80 px-4 py-2 text-sm font-bold text-[color:var(--text)]">
                {category}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-3xl font-extrabold">Produtos</h2>
        {q && <p className="text-sm text-[color:var(--muted)]">Busca atual: "{q}"</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
