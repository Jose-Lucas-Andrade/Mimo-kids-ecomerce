'use client';

import { useState } from 'react';

export default function ContinuePayment({ token, enabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!enabled) {
    return (
      <p className="text-sm text-[color:var(--muted)]">
        O pagamento online ainda não está configurado. Entre em contato com a loja para combinar o pagamento.
      </p>
    );
  }

  async function continuePayment() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(token)}/payment/mercadopago`, {
        method: 'POST',
      });
      const result = await response.json();
      if (!response.ok) {
        const message = result.error === 'MERCADO_PAGO_NOT_CONFIGURED'
          ? 'O pagamento online ainda não está configurado. Entre em contato com a loja para combinar o pagamento.'
          : 'Não foi possível abrir o pagamento agora. Tente novamente ou entre em contato com a loja.';
        setError(message);
        return;
      }
      if (!result.initPoint) {
        throw new Error('PAYMENT_LINK_MISSING');
      }
      window.location.assign(result.initPoint);
    } catch {
      setError('Não foi possível abrir o pagamento agora. Tente novamente ou entre em contato com a loja.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" className="btn btn-primary" onClick={continuePayment} disabled={loading}>
        {loading ? 'Abrindo pagamento...' : 'Continuar para o pagamento'}
      </button>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    </div>
  );
}
