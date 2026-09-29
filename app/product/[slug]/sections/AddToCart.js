'use client';
import { useState } from 'react';
import { useCart } from '../../../store/cart';

export default function AddToCart({ product }) {
  const add = useCart((s) => s.add);
  const [feedback, setFeedback] = useState('');
  const [quantity, setQuantity] = useState(1);

  function handleAdd() {
    const addedQuantity = add(product, quantity);
    setFeedback(addedQuantity < quantity ? `Adicionamos ${addedQuantity} unidade(s), até o limite do estoque.` : 'Adicionado ao carrinho.');
    window.setTimeout(() => setFeedback(''), 2200);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <label className="space-y-1 text-sm">
          <span className="block">Quantidade</span>
          <input
            className="input w-28"
            type="number"
            min="1"
            max={Math.min(product.stock, 99)}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(Math.min(product.stock, 99), Number(event.target.value) || 1)))}
            disabled={product.stock < 1}
          />
        </label>
        <button onClick={handleAdd} className="btn btn-primary self-end" disabled={product.stock < 1}>
          {product.stock < 1 ? 'Sem estoque' : 'Adicionar ao carrinho'}
        </button>
      </div>
      {feedback && <p role="status" className="text-sm text-[color:var(--muted)]">{feedback}</p>}
      <p className="text-sm text-[color:var(--muted)]">
        Compra segura, carrinho salvo entre paginas e finalizacao rapida no checkout.
      </p>
    </div>
  );
}
