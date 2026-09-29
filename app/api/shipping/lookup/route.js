import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const cep = (searchParams.get('cep') || '').replace(/\D/g, '');
  if (cep.length !== 8) return NextResponse.json({ error: 'CEP inválido' }, { status: 400 });

  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!r.ok) return NextResponse.json({ error: 'Erro ao consultar CEP' }, { status: 502 });
    const data = await r.json();
    if (data.erro) return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 });
    return NextResponse.json({
      cep,
      address: `${data.logradouro || ''}`.trim(),
      neighborhood: data.bairro || '',
      city: data.localidade,
      state: data.uf
    });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao consultar CEP' }, { status: 500 });
  }
}
