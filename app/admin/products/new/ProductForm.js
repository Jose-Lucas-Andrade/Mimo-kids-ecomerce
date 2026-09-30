'use client';

import { useEffect, useRef, useState } from 'react';

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ProductForm({ hasError }) {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [lookupState, setLookupState] = useState({ status: 'idle', message: '' });
  const barcodeInput = useRef(null);
  const barcodeRef = useRef('');
  const lastKeyAt = useRef(0);
  const rapidKeyCount = useRef(0);
  const scanTimeout = useRef(null);
  const suggestedDataLoaded = useRef(false);

  useEffect(() => {
    barcodeInput.current?.focus();
    return () => window.clearTimeout(scanTimeout.current);
  }, []);

  async function lookupBarcode(value = barcodeRef.current) {
    if (![8, 12, 13, 14].includes(value.length)) {
      setLookupState({ status: 'error', message: 'Informe um código EAN/UPC/GTIN válido antes de consultar.' });
      return;
    }

    setLookupState({ status: 'loading', message: 'Consultando a base de produtos...' });
    try {
      const response = await fetch('/api/admin/products/barcode-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: value }),
      });
      const result = await response.json();

      if (response.status === 409 && result.existingProduct) {
        setLookupState({
          status: 'error',
          message: `Este código já está cadastrado em “${result.existingProduct.name}”.`,
          href: `/admin/products?q=${encodeURIComponent(barcode)}`,
        });
        return;
      }

      if (!response.ok) {
        const message = response.status === 429 || result.error === 'BARCODE_LOOKUP_RATE_LIMITED'
          ? 'A base externa limitou as consultas gratuitas. Aguarde e tente novamente mais tarde, ou preencha os dados manualmente.'
          : result.error === 'BARCODE_LOOKUP_UNAVAILABLE'
            ? 'A consulta externa está indisponível no momento. Você ainda pode cadastrar o produto manualmente.'
            : 'Não foi possível consultar esse código. Confira o código e tente novamente.';
        setLookupState({ status: 'error', message });
        return;
      }

      if (!result.found) {
        setLookupState({
          status: 'empty',
          message: 'Produto não encontrado na base externa. Preencha os dados manualmente; o código continuará salvo.',
        });
        return;
      }

      setName(result.product.name);
      setSlug(slugify(result.product.name));
      setSlugEdited(false);
      setDescription(result.product.description || '');
      setImageUrl(result.product.imageUrl || '');
      suggestedDataLoaded.current = true;
      setLookupState({
        status: 'success',
        message: 'Dados sugeridos carregados. Revise as informações antes de salvar; preço, peso e quantidades continuam manuais.',
        sourceUrl: result.sourceUrl,
      });
    } catch {
      setLookupState({
        status: 'error',
        message: 'Não foi possível consultar a base externa. Confira sua conexão ou continue o cadastro manualmente.',
      });
    }
  }

  return (
    <form className="card p-6 max-w-xl space-y-3" action="/api/admin/products/create" method="post">
      <h1 className="text-xl font-semibold">Novo Produto</h1>
      {hasError && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          Não foi possível criar o produto. Confira os campos obrigatórios e se o código de barras ou slug já está cadastrado.
        </div>
      )}
      <label className="block space-y-1 text-sm">
        <span className="font-semibold">1. Código de barras do produto ou da caixa</span>
        <span className="block text-xs text-[color:var(--muted)]">
          Clique no campo e bipe com um leitor USB/Bluetooth conectado ao computador. A câmera do celular não é usada neste cadastro.
        </span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={barcodeInput}
            name="barcode"
            className="input flex-1"
            inputMode="numeric"
            autoFocus
            placeholder="EAN-8, UPC-A, EAN-13 ou GTIN-14"
            value={barcode}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, '').slice(0, 14);
              if (value !== barcodeRef.current) {
                setLookupState({ status: 'idle', message: '' });
                if (suggestedDataLoaded.current) {
                  setName('');
                  setSlug('');
                  setSlugEdited(false);
                  setDescription('');
                  setImageUrl('');
                  suggestedDataLoaded.current = false;
                }
              }
              barcodeRef.current = value;
              setBarcode(value);
              window.clearTimeout(scanTimeout.current);
              if ([8, 12, 13, 14].includes(value.length) && rapidKeyCount.current >= 6) {
                scanTimeout.current = window.setTimeout(() => lookupBarcode(value), 250);
              }
            }}
            onKeyDown={(event) => {
              if (/^\d$/.test(event.key)) {
                const now = performance.now();
                rapidKeyCount.current = now - lastKeyAt.current < 80 ? rapidKeyCount.current + 1 : 1;
                lastKeyAt.current = now;
              }
              if (event.key === 'Enter' || event.key === 'Tab') {
                if (event.key === 'Enter') {
                  event.preventDefault();
                }
                if ([8, 12, 13, 14].includes(barcodeRef.current.length)) {
                  window.clearTimeout(scanTimeout.current);
                  lookupBarcode(barcodeRef.current);
                }
              } else if (event.key === 'Backspace' || event.key === 'Delete') {
                rapidKeyCount.current = 0;
              }
            }}
          />
          <button type="button" className="btn btn-outline" disabled={lookupState.status === 'loading'} onClick={lookupBarcode}>
            {lookupState.status === 'loading' ? 'Consultando...' : 'Consultar dados do código'}
          </button>
        </div>
        <span className="block text-xs text-[color:var(--muted)]">
          Leitor USB/Bluetooth que funcione como teclado: escaneie com este campo selecionado. A consulta inicia ao detectar o scanner (ou ao pressionar Enter); também pode clicar no botão. A base externa tem limite gratuito e cobertura parcial.
        </span>
      </label>
      {lookupState.message && (
        <div
          role={lookupState.status === 'success' || lookupState.status === 'empty' ? 'status' : 'alert'}
          className={`rounded-2xl border px-4 py-3 text-sm ${
            lookupState.status === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : lookupState.status === 'empty'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          {lookupState.href ? (
            <>
              {lookupState.message}{' '}
              <a className="underline" href={lookupState.href}>Ver produto cadastrado</a>
            </>
          ) : lookupState.sourceUrl ? (
            <>
              {lookupState.message}{' '}
              <a className="underline" href={lookupState.sourceUrl} target="_blank" rel="noreferrer">Ver fonte dos dados</a>
            </>
          ) : lookupState.message}
        </div>
      )}
      <label className="block space-y-1 text-sm font-semibold" htmlFor="product-name">2. Revise e complete os dados do produto</label>
      <input id="product-name" name="name" className="input" placeholder="Nome" value={name} onChange={(event) => {
        setName(event.target.value);
        if (!slugEdited) setSlug(slugify(event.target.value));
      }} required />
      <input name="slug" className="input" placeholder="slug-exemplo" value={slug} onChange={(event) => {
        setSlug(event.target.value);
        setSlugEdited(true);
      }} required />
      <input name="price" type="number" min="0.01" step="0.01" className="input" placeholder="Preço (ex: 19.90)" required />
      <input name="imageUrl" type="url" className="input" placeholder="URL da imagem" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} required />
      <label className="block space-y-1 text-sm">
        <span>Unidades que vêm em cada pacote/caixa</span>
        <input name="unitsPerPackage" type="number" min="1" max="10000" step="1" className="input" defaultValue="1" required />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Pacotes/caixas recebidos agora</span>
        <input name="packagesReceived" type="number" min="0" max="100000" step="1" className="input" defaultValue="0" required />
        <span className="block text-xs text-[color:var(--muted)]">O estoque será calculado em unidades: pacotes × unidades por pacote.</span>
      </label>
      <label className="block space-y-1 text-sm">
        <span>Peso embalado para o frete (kg)</span>
        <input name="shippingWeightKg" type="number" min="0.01" max="30" step="0.01" className="input" defaultValue="0.30" required />
      </label>
      <textarea name="description" className="input" placeholder="Descrição" value={description} onChange={(event) => setDescription(event.target.value)} />
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        Preço, peso e unidades por caixa não são preenchidos pela busca. Confira nome e imagem: os dados externos não são garantidos, e você deve confirmar que tem autorização para usar a imagem antes de publicá-la.
      </div>
      <button className="btn btn-primary">Salvar</button>
    </form>
  );
}
