import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={onSubmit}
            className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Dan Creative Studio</h1>
        <p className="text-sm text-slate-500 mb-6">Inicia sesión para continuar</p>

        <label className="block text-xs font-medium text-slate-600 mb-1">Correo</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
               className="w-full mb-4 rounded-lg border border-slate-300 px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="tu@correo.com" />

        <label className="block text-xs font-medium text-slate-600 mb-1">Contraseña</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
               className="w-full mb-6 rounded-lg border border-slate-300 px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="••••••••" />

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-60
                           text-white text-sm font-medium py-2.5 transition">
          {loading ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
