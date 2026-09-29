'use client';
import { useEffect, useState } from 'react';
import { useCart } from '../store/cart';

export default function CheckoutPage() {
  const { items, subtotal, clear, shipping, selectedShipping } = useCart();
  const [mounted, setMounted] = useState(false);
  const chosenShipping = selectedShipping();
  const subtotalValue = subtotal();
  const [form, setForm] = useState({
    name: '',
    email: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    shipping: 0,
  });
  const [saving, setSaving] = useState(false);
  const [redirectingPayment, setRedirectingPayment] = useState(false);
  const total = subtotalValue + Number(form.shipping || 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setForm((current) => ({
      ...current,
      cep: current.cep || shipping?.cep || '',
      city: current.city || shipping?.city || '',
      state: current.state || shipping?.state || '',
      shipping: chosenShipping?.price ?? current.shipping ?? 0,
    }));
  }, [mounted, shipping?.cep, shipping?.city, shipping?.state, chosenShipping?.price]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.id) {
      clear();
      const emailStatus = data.emailSent ? 'sent' : 'failed';
      window.location.href = `/success/${data.publicToken}?email=${emailStatus}`;
    } else {
      alert(data.error || 'Erro ao criar pedido');
    }
  }

  function formatCep(value) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  async function payWithMercadoPago() {
    setRedirectingPayment(true);
    const res = await fetch('/api/payments/mercadopago/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items }),
    });
    const data = await res.json();
    setRedirectingPayment(false);

    if (data.initPoint) {
      window.location.href = data.initPoint;
      return;
    }

    alert(data.error || 'Nao foi possivel iniciar o pagamento com Mercado Pago.');
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <section className="card soft-panel p-6 sm:p-8">
          <div className="space-y-3">
            <span className="eyebrow">Checkout</span>
            <h1 className="section-title">Carregando seu checkout...</h1>
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
            <span className="eyebrow">Checkout</span>
            <h1 className="section-title">Finalize seu pedido com calma e clareza.</h1>
            <p className="max-w-2xl text-[color:var(--muted)]">
              Preencha os dados de entrega, confirme o frete e conclua a compra em poucos passos.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] bg-white/80 px-4 py-4 text-center">
              <div className="font-display text-3xl font-extrabold">{items.length}</div>
              <div className="text-sm text-[color:var(--muted)]">itens</div>
            </div>
            <div className="rounded-[24px] bg-white/80 px-4 py-4 text-center">
              <div className="font-display text-3xl font-extrabold">R$ {subtotalValue.toFixed(2)}</div>
              <div className="text-sm text-[color:var(--muted)]">subtotal</div>
            </div>
            <div className="rounded-[24px] bg-white/80 px-4 py-4 text-center">
              <div className="font-display text-3xl font-extrabold">R$ {total.toFixed(2)}</div>
              <div className="text-sm text-[color:var(--muted)]">total</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <form className="card space-y-4 p-5 md:col-span-2 sm:p-6" onSubmit={onSubmit}>
          <h2 className="font-display text-3xl font-extrabold">Dados de entrega</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input required placeholder="Nome completo" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="email" placeholder="Email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required placeholder="CEP" className="input" value={form.cep} onChange={(e) => setForm({ ...form, cep: formatCep(e.target.value) })} />
            <button type="button" className="btn btn-outline" onClick={async () => {
              const res = await fetch(`/api/shipping/lookup?cep=${encodeURIComponent(form.cep)}`);
              const data = await res.json();
              if (data.error) return alert('CEP invalido');
              setForm((current) => ({
                ...current,
                cep: formatCep(data.cep || current.cep),
                address: data.address,
                neighborhood: data.neighborhood || '',
                city: data.city,
                state: data.state,
              }));
            }}>Buscar CEP</button>
            <input required placeholder="Endereco" className="input sm:col-span-2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <input required placeholder="Numero" className="input" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            <input placeholder="Complemento" className="input" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
            <input placeholder="Bairro" className="input sm:col-span-2" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
            <input required placeholder="Cidade" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input required placeholder="UF" className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <input required type="number" step="0.01" placeholder="Frete (R$)" className="input" value={form.shipping} onChange={(e) => setForm({ ...form, shipping: Number(e.target.value) })} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={redirectingPayment || items.length === 0} onClick={payWithMercadoPago} className="btn btn-primary w-full sm:w-auto">
              {redirectingPayment ? 'Redirecionando para pagamento...' : 'Pagar com Mercado Pago'}
            </button>
            <button disabled={saving || items.length === 0} className="btn btn-outline w-full sm:w-auto">
              {saving ? 'Finalizando...' : 'Salvar pedido sem pagamento'}
            </button>
          </div>
        </form>

        <div className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-display text-3xl font-extrabold">Resumo</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-[20px] bg-white/80 px-4 py-3">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-[color:var(--muted)]">Qtd: {item.qty}</div>
                </div>
                <strong>R$ {(item.price * item.qty).toFixed(2)}</strong>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between"><span>Subtotal</span><strong>R$ {subtotalValue.toFixed(2)}</strong></div>
          <div className="flex items-center justify-between"><span>Frete</span><strong>R$ {Number(form.shipping || 0).toFixed(2)}</strong></div>
          <div className="flex items-center justify-between border-t border-[color:var(--line)] pt-3 text-lg">
            <span>Total</span>
            <strong>R$ {total.toFixed(2)}</strong>
          </div>
          {chosenShipping ? (
            <div className="text-sm text-gray-600">Opcao selecionada: {chosenShipping.name} para {shipping.city}/{shipping.state}.</div>
          ) : (
            <div className="text-sm text-gray-600">Se preferir, calcule o frete no carrinho antes de fechar o pedido.</div>
          )}
          <div className="rounded-[20px] bg-white/80 p-4 text-sm text-[color:var(--muted)]">
            Para entregas mais precisas, confirme endereco, numero e bairro antes de finalizar.
          </div>
          <div className="rounded-[20px] bg-[color:var(--accent-soft)] p-4 text-sm text-[color:var(--text)]">
            Use <strong>Mercado Pago</strong> para cobrar Pix, cartao e outras formas de pagamento. Enquanto a conta nao estiver configurada, o botao pode retornar erro de configuracao.
          </div>
        </div>
      </div>
    </div>
  );
}
