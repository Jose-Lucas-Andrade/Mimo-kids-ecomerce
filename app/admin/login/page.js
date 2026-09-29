'use client';
import { useState } from 'react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e){
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password })
    });
    setLoading(false);
    if (res.ok) window.location.href = '/admin';
    else alert('Credenciais inválidas');
  }

  return (
    <form className="card p-6 max-w-md mx-auto space-y-3" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Login do Admin</h1>
      <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="input" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="btn btn-primary" disabled={loading}>{loading?'Entrando...':'Entrar'}</button>
    </form>
  );
}
