'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (redirectPath) {
        router.push(redirectPath);
        return;
      }

      switch (data.user.role) {
        case 'SUPER_ADMIN':
        case 'CLINIC_ADMIN':
          router.push('/admin');
          break;
        case 'DOCTOR':
          router.push('/doctor');
          break;
        case 'RECEPTIONIST':
          router.push('/reception');
          break;
        default:
          router.push('/admin');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillQuickRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-sky-400 font-bold text-2xl tracking-tight">
            <span className="bg-sky-500/20 text-sky-400 p-2 rounded-lg border border-sky-500/30">🏥</span>
            ClinicFlow
          </div>
          <p className="text-sm text-slate-400">Private Clinic Management System</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@lankacare.lk"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-700/50 space-y-2">
          <p className="text-xs text-slate-400 font-semibold text-center uppercase tracking-wider">
            Quick Test Accounts (Seeded)
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => fillQuickRole('admin@lankacare.lk')}
              className="bg-slate-700/50 hover:bg-slate-700 p-2 rounded text-slate-300 text-center border border-slate-600/50"
            >
              Admin
            </button>
            <button
              onClick={() => fillQuickRole('doctor@lankacare.lk')}
              className="bg-slate-700/50 hover:bg-slate-700 p-2 rounded text-slate-300 text-center border border-slate-600/50"
            >
              Doctor
            </button>
            <button
              onClick={() => fillQuickRole('reception@lankacare.lk')}
              className="bg-slate-700/50 hover:bg-slate-700 p-2 rounded text-slate-300 text-center border border-slate-600/50"
            >
              Reception
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
