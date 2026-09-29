export default function StoreFooter() {
  return (
    <footer className="mt-12 border-t border-[color:var(--line)] bg-[rgba(255,255,255,0.72)]">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr,0.8fr,0.8fr]">
          <div className="space-y-3">
            <div className="font-display text-3xl font-extrabold text-[color:var(--text)]">Mimo Kids</div>
            <p className="max-w-md text-sm text-[color:var(--muted)]">
              Papelaria, mochilas e brinquedos com selecao pensada para rotina escolar, presentes e momentos criativos.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Compre online</h3>
            <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
              <a href="/products" className="block hover:text-[color:var(--brand-deep)]">Catalogo completo</a>
              <a href="/cart" className="block hover:text-[color:var(--brand-deep)]">Carrinho</a>
            </div>
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Atendimento</h3>
            <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
              <p>Seg a Sex, 9h as 18h</p>
              <p>Entrega para todo o Brasil</p>
              <p>Compra segura e envio acompanhado</p>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-[color:var(--line)] pt-4 text-sm text-[color:var(--muted)]">
          (c) {new Date().getFullYear()} Mimo Kids Store
        </div>
      </div>
    </footer>
  );
}
