import { prisma } from '../lib/prisma';
import ProductCard from '../components/ProductCard';

const highlights = [
  {
    title: 'Papelaria que organiza',
    description: 'Cadernos, canetas, blocos e itens para uma rotina escolar mais gostosa.',
    badge: 'Estudo'
  },
  {
    title: 'Mochilas que acompanham o dia',
    description: 'Modelos infantis e escolares com estilo, conforto e espaco inteligente.',
    badge: 'Volta as aulas'
  },
  {
    title: 'Brinquedos para presentear',
    description: 'Opcoes criativas e educativas para surpreender sem complicacao.',
    badge: 'Presente'
  }
];

const categoryCards = [
  { title: 'Papelaria', subtitle: 'Cadernos, agendas, estojos e organizacao colorida.', icon: 'PA', href: '/products?q=caderno' },
  { title: 'Mochilas', subtitle: 'Modelos escolares e infantis para todas as idades.', icon: 'MO', href: '/products?q=mochila' },
  { title: 'Brinquedos', subtitle: 'Itens educativos e criativos para brincar e aprender.', icon: 'BR', href: '/products?q=brinquedo' },
];

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { active: true },
    take: 4,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="relative overflow-hidden rounded-[36px] border border-[color:var(--line)] bg-[linear-gradient(135deg,#fff1e5_0%,#fffaf3_52%,#e5faf6_100%)] px-6 py-8 shadow-[0_28px_70px_rgba(77,54,112,0.12)] sm:px-8 sm:py-12">
        <div className="absolute -right-12 top-10 h-36 w-36 rounded-full bg-[rgba(255,215,108,0.4)] blur-2xl" />
        <div className="absolute bottom-0 left-[-20px] h-40 w-40 rounded-full bg-[rgba(55,183,165,0.18)] blur-2xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="eyebrow">Loja infantil e escolar</span>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-5xl font-extrabold leading-[0.95] text-[color:var(--text)] sm:text-6xl">
                Papelaria, mochilas e brinquedos com cara de loja de verdade.
              </h1>
              <p className="max-w-xl text-lg text-[color:var(--muted)] sm:text-xl">
                Monte uma experiencia online mais bonita, acolhedora e pronta para vender itens escolares, presentes e achadinhos criativos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/products" className="btn btn-primary">Explorar catalogo</a>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="card px-4 py-4 text-center">
                <div className="font-display text-3xl font-extrabold">Envio</div>
                <div className="text-sm text-[color:var(--muted)]">Calculo de frete no carrinho</div>
              </div>
              <div className="card px-4 py-4 text-center">
                <div className="font-display text-3xl font-extrabold">Ajuda</div>
                <div className="text-sm text-[color:var(--muted)]">Atendimento para sua compra</div>
              </div>
              <div className="card px-4 py-4 text-center">
                <div className="font-display text-3xl font-extrabold">Compra</div>
                <div className="text-sm text-[color:var(--muted)]">Checkout simples e direto</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-5 sm:translate-y-8">
              <div className="text-sm font-extrabold uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">Favoritos da semana</div>
              <div className="mt-4 space-y-4">
                {highlights.slice(0, 2).map((item) => (
                  <div key={item.title} className="rounded-[24px] bg-[linear-gradient(180deg,#fff7ef,#ffffff)] p-4">
                    <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[color:var(--muted)]">{item.badge}</div>
                    <h2 className="mt-2 text-2xl font-extrabold">{item.title}</h2>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card bg-[linear-gradient(180deg,#fffef7,#ffffff)] p-5">
              <div className="rounded-[28px] bg-[linear-gradient(180deg,#ff845f,#ff6c6c)] p-6 text-white">
                <div className="text-sm font-extrabold uppercase tracking-[0.2em] text-white/80">Curadoria</div>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight">Itens para estudar, brincar e presentear em um mesmo lugar.</h2>
                <p className="mt-3 text-sm text-white/85">
                  Uma vitrine com categorias claras, destaque para novidades e espaco para produtos mais vendaveis.
                </p>
              </div>
              <div className="mt-4 rounded-[24px] bg-[color:var(--accent-soft)] p-5">
                <div className="text-sm font-extrabold uppercase tracking-[0.2em] text-[color:var(--accent)]">Mais procurados</div>
                <p className="mt-2 text-lg font-bold text-[color:var(--text)]">Mochilas escolares, kits criativos e papelaria de volta as aulas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Categorias</span>
            <h2 className="section-title mt-3">Uma loja pensada para venda real</h2>
          </div>
          <a href="/products" className="btn btn-outline hidden sm:inline-flex">Ver tudo</a>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {categoryCards.map((category) => (
            <a key={category.title} href={category.href} className="card group p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fff0df,#ffe0b8)] text-sm font-extrabold shadow-inner">
                {category.icon}
              </div>
              <h3 className="mt-5 text-3xl font-extrabold">{category.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{category.subtitle}</p>
              <span className="mt-6 inline-flex text-sm font-extrabold text-[color:var(--brand-deep)] group-hover:translate-x-1">
                Explorar categoria
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
        <div className="card soft-panel p-6 sm:p-8">
          <span className="eyebrow">Por que funciona</span>
          <h2 className="section-title mt-3">Visual acolhedor, navegacao simples e espaco para crescer.</h2>
          <div className="mt-6 space-y-4">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-[color:var(--line)] bg-white/80 p-4">
                <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[color:var(--brand-deep)]">{item.badge}</div>
                <h3 className="mt-2 text-2xl font-extrabold">{item.title}</h3>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Destaques</span>
              <h2 className="section-title mt-3">Produtos para puxar sua vitrine</h2>
            </div>
            <a href="/products" className="btn btn-accent">Ir para o catalogo</a>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
