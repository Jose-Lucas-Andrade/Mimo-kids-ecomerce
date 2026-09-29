export default function Header({ isAdmin }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--line)] bg-[rgba(255,250,244,0.82)] backdrop-blur-xl">
      <div className="container py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <a href="/" className="group flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ffb15c,#ff7a59)] text-xl font-extrabold shadow-lg shadow-orange-200/60">
                MK
              </span>
              <div>
                <div className="font-display text-2xl font-extrabold leading-none text-[color:var(--text)]">Mimo Kids</div>
                <div className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--muted)]">Papelaria e Diversao</div>
              </div>
            </a>
            <a href="/cart" className="btn btn-outline lg:hidden">Carrinho</a>
          </div>

          <form action="/products" className="flex-1 lg:max-w-xl">
            <div className="card flex items-center gap-3 rounded-full px-3 py-2">
              <span className="pl-2 text-sm font-bold text-[color:var(--muted)]">BUSCA</span>
              <input className="w-full bg-transparent text-sm outline-none" name="q" placeholder="Busque por cadernos, mochilas, kits ou brinquedos" />
              <button className="btn btn-primary px-4 py-2" type="submit">Buscar</button>
            </div>
          </form>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <a href="/" className="btn btn-outline">Inicio</a>
            <a href="/products" className="btn btn-outline">Catalogo</a>
            <a href="/cart" className="btn btn-outline hidden lg:inline-flex">Carrinho</a>
            {isAdmin && <a href="/admin" className="btn btn-primary">Admin</a>}
          </nav>
        </div>
      </div>
    </header>
  );
}
