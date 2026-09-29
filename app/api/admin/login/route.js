import { NextResponse } from 'next/server';
import { createSession } from '../../../../lib/auth';

export async function POST(req) {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 20) {
    return NextResponse.json({ error: 'ADMIN_CREDENTIALS_NOT_CONFIGURED' }, { status: 503 });
  }
  let credentials;
  try {
    credentials = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
  }
  const { email, password } = credentials || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
  }
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = await createSession({ email, role: 'ADMIN' });
    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }
  return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
}
