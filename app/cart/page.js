'use client';
import { useEffect, useState } from 'react';
import { useCart } from '../store/cart';

export default function CartPage() {
  const { items, remove, setQuantity, subtotal, totalWeight, shipping, setShippingQuote, selectShipping, clearShipping, selectedShipping } = useCart();
  const [mounted, setMounted] = useState(false);
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const chosenShipping = selectedShipping();
  const total = subtotal() + Number(chosenShipping?.price || 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) setCep(shipping?.cep || '');
  }, [mounted, shipping?.cep]);

  async function calc() {
    setLoading(true);
    setShippingError('');
    clearShipping();
    try {
      const res = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep, items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShippingError(data.error === 'SHIPPING_INVALID_CEP' ? 'CEP inválido ou não encontrado.' : 'Não foi possível calcular o frete. Tente novamente.');
        return;
      }
      setShippingQuote({ cep: data.cep || cep, ...data });
    } catch {
      setShippingError('Não foi possível consultar o frete. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <section className="card soft-panel p-6 sm:p-8">
          <div className="space-y-3">
            <span className="eyebrow">Carrinho</span>
            <h1 className="section-title">Carregando seu carrinho...</h1>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card soft-panel p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="eyebrow">Carrinho</span>
            <h1 className="section-title">Revise seus itens e escolha o frete ideal.</h1>
            <p className="max-w-2xl text-[color:var(--muted)]">
              Seu carrinho fica salvo entre paginas. Agora e so confirmar os produtos, calcular o envio e seguir para o checkout.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] bg-white/80 px-4 py-4 text-center">
              <div className="font-display text-3xl font-extrabold">{items.length}</div>
              <div className="text-sm text-[color:var(--muted)]">itens</div>
            </div>
            <div className="rounded-[24px] bg-white/80 px-4 py-4 text-center">
              <div className="font-display text-3xl font-extrabold">{totalWeight().toFixed(1)}kg</div>
              <div className="text-sm text-[color:var(--muted)]">peso estimado</div>
            </div>
            <div className="rounded-[24px] bg-white/80 px-4 py-4 text-center">
              <div className="font-display text-3xl font-extrabold">R$ {total.toFixed(2)}</div>
              <div className="text-sm text-[color:var(--muted)]">total atual</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          {items.length === 0 && (
            <div className="card p-6">
              <h2 className="font-display text-3xl font-extrabold">Seu carrinho esta vazio.</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Escolha produtos no catalogo para ver o resumo da compra aqui.</p>
              <a href="/products" className="btn btn-primary mt-5">Explorar produtos</a>
            </div>
          )}
          {items.map((item) => (
            <div key={item.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <img src={item.imageUrl} className="h-24 w-full rounded-[20px] object-cover sm:w-24" alt={item.name} />
              <div className="flex-1">
                <div className="font-display text-2xl font-extrabold">{item.name}</div>
                <label className="mt-1 flex items-center gap-2 text-sm text-[color:var(--muted)]">
                  <span>Quantidade</span>
                  <input
                    className="input w-24 py-2 text-center"
                    type="number"
                    min="1"
                    max={Math.min(Number.isSafeInteger(item.stock) ? item.stock : 99, 99)}
                    value={item.qty}
                    onChange={(event) => setQuantity(item.id, Number(event.target.value))}
                  />
                  <span>de {item.stock ?? '—'} disponíveis</span>
                </label>
              </div>
              <div className="text-right">
                <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[color:var(--muted)]">Total do item</div>
                <div className="text-2xl font-extrabold">R$ {(item.price * item.qty).toFixed(2)}</div>
              </div>
              <button onClick={() => remove(item.id)} className="btn btn-outline">Remover</button>
            </div>
          ))}
        </div>

        <div className="card space-y-3 p-4">
          <h2 className="font-display text-3xl font-extrabold">Resumo</h2>
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <strong>R$ {subtotal().toFixed(2)}</strong>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">CEP</label>
            <input className="input" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" />
            <button onClick={calc} className="btn btn-outline" disabled={loading || !cep || items.length === 0}>
              {loading ? 'Calculando...' : 'Calcular frete'}
            </button>
            {shippingError && <p role="alert" className="text-sm text-rose-700">{shippingError}</p>}

            {shipping?.options?.length > 0 && (
              <div className="space-y-2 text-sm text-gray-700">
                <div>Destino: {shipping.city}/{shipping.state}</div>
                {shipping.options.map((option, idx) => (
                  <label key={idx} className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 px-3 py-3">
                    <div>
                      <div className="font-semibold">{option.name}</div>
                      <div className="text-xs text-gray-500">{option.etaDays} dias</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">R$ {option.price.toFixed(2)}</span>
                      <input type="radio" name="shipping" checked={shipping.selectedIndex === idx} onChange={() => selectShipping(idx)} />
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {chosenShipping && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span>Frete selecionado</span>
                <strong>R$ {chosenShipping.price.toFixed(2)}</strong>
              </div>
              <div className="flex items-center justify-between border-t border-[color:var(--line)] pt-3 text-lg">
                <span>Total estimado</span>
                <strong>R$ {total.toFixed(2)}</strong>
              </div>
            </>
          )}

          <a href="/checkout" className="btn btn-primary w-full text-center">Continuar para o checkout</a>
        </div>
      </div>
    </div>
  );
}
