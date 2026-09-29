const STATE_ZONES = {
  SP: 1, RJ: 1, MG: 1, ES: 1,
  PR: 2, SC: 2, RS: 2, DF: 2, GO: 2, MS: 2, MT: 2,
  BA: 3, SE: 3, AL: 3, PE: 3, PB: 3, RN: 3, CE: 3, PI: 3, MA: 3,
  PA: 3, AP: 3, AM: 3, RR: 3, RO: 3, AC: 3, TO: 3,
};

function getZonePrice(zone) {
  if (zone === 1) return 18;
  if (zone === 2) return 28;
  return 42;
}

export async function getShippingQuote(rawCep, weight) {
  const cep = String(rawCep || '').replace(/\D/g, '');
  if (cep.length !== 8) {
    throw new Error('SHIPPING_INVALID_CEP');
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('SHIPPING_LOOKUP_FAILED');
  }

  const address = await response.json();
  if (address.erro) {
    throw new Error('SHIPPING_INVALID_CEP');
  }

  const state = String(address.uf || '').toUpperCase();
  const city = String(address.localidade || '').trim();
  if (!state || !city) {
    throw new Error('SHIPPING_LOOKUP_FAILED');
  }

  const safeWeight = Number(weight);
  if (!Number.isFinite(safeWeight) || safeWeight <= 0) {
    throw new Error('SHIPPING_INVALID_WEIGHT');
  }

  const zone = STATE_ZONES[state] || 3;
  const extra = Math.ceil(Math.max(0, safeWeight - 0.3) / 0.5) * 4;
  const base = getZonePrice(zone) + extra;

  return {
    city,
    state,
    options: [
      { name: 'PAC (estimado)', price: base, etaDays: zone === 1 ? 5 : zone === 2 ? 8 : 12 },
      { name: 'SEDEX (estimado)', price: base + 18, etaDays: zone === 1 ? 2 : zone === 2 ? 3 : 5 },
    ],
  };
}
