'use client';
import { useState } from 'react';
import { useCart } from '../app/store/cart';

export default function ProductCard({ product }) {
  const add = useCart((state) => state.add);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState('');

  function addToCart() {
    const addedQuantity = add(product, quantity);
    setFeedback(addedQuantity < quantity ? `Adicionado: ${addedQuantity} unidade(s), limite do estoque.` : 'Adicionado ao carrinho.');
    window.setTimeout(() => setFeedback(''), 2200);
  }

  return (
    <article className="group card overflow-hidden p-3">
      <a href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/4.2] w-full overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#fff7ef,#ffe7db)]">
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-[color:var(--brand-deep)]">
            Destaque
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <h3 className="min-h-[3.5rem] text-base font-extrabold leading-7 text-[color:var(--text)]">{product.name}</h3>
            <p className="text-sm text-[color:var(--muted)]">{product.description || 'Produto especial para rotina escolar e momentos de diversao.'}</p>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="text-2xl font-extrabold text-[color:var(--text)]">R$ {product.price.toFixed(2)}</span>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">{product.stock} unidades</div>
            </div>
            <span className="btn btn-outline px-4 py-2 text-xs group-hover:border-[color:var(--brand)] group-hover:text-[color:var(--brand-deep)]">
              Ver item
            </span>
          </div>
        </div>
      </a>
      <div className="mt-4 flex items-center gap-2">
        <label className="sr-only" htmlFor={`catalog-qty-${product.id}`}>Quantidade de {product.name}</label>
        <input
          id={`catalog-qty-${product.id}`}
          className="input w-20 text-center"
          type="number"
          min="1"
          max={Math.min(product.stock, 99)}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Math.min(Math.min(product.stock, 99), Number(event.target.value) || 1)))}
          disabled={product.stock < 1}
        />
        <button type="button" className="btn btn-primary flex-1" onClick={addToCart} disabled={product.stock < 1}>
          {product.stock < 1 ? 'Sem estoque' : 'Adicionar'}
        </button>
      </div>
      {feedback && <p role="status" className="mt-2 text-xs text-[color:var(--muted)]">{feedback}</p>}
    </article>
  );
}
