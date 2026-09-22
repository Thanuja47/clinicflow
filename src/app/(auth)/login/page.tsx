'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Stethoscope, User, Lock } from 'lucide-react';

function LoginForm() {
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
    <div className="w-full max-w-sm apple-card p-8 space-y-6 shadow-2xl transition-all duration-200">
      {/* Brand & Title */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-apple-blue/10 text-apple-blue flex items-center justify-center font-bold text-2xl border border-apple-blue/20">
          🏥
        </div>
        <h1 className="text-2xl font-bold text-apple-text tracking-tight mt-2">ClinicFlow</h1>
        <p className="apple-caption">Private Clinic Management System</p>
      </div>

      {error && (
        <div className="bg-apple-red/10 border border-apple-red/20 text-apple-red text-xs p-3 rounded-apple-md font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block apple-caption mb-1.5 font-medium">
            Email address
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-apple-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@lankacare.lk"
              className="w-full apple-input pl-9"
            />
          </div>
        </div>

        <div>
          <label className="block apple-caption mb-1.5 font-medium">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-apple-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full apple-input pl-9"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full apple-btn-primary py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      {/* Quick Access Roles */}
      <div className="pt-4 border-t border-apple-border space-y-2.5">
        <p className="apple-caption text-center font-medium">
          Quick demo accounts
        </p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => fillQuickRole('admin@lankacare.lk')}
            className="apple-btn-secondary py-1.5 px-2 text-center text-xs flex items-center justify-center gap-1"
          >
            <ShieldCheck className="w-3 h-3 text-apple-blue" /> Admin
          </button>
          <button
            type="button"
            onClick={() => fillQuickRole('doctor@lankacare.lk')}
            className="apple-btn-secondary py-1.5 px-2 text-center text-xs flex items-center justify-center gap-1"
          >
            <Stethoscope className="w-3 h-3 text-apple-green" /> Doctor
          </button>
          <button
            type="button"
            onClick={() => fillQuickRole('reception@lankacare.lk')}
            className="apple-btn-secondary py-1.5 px-2 text-center text-xs flex items-center justify-center gap-1"
          >
            <User className="w-3 h-3 text-apple-orange" /> Reception
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-apple-bg text-apple-text flex flex-col justify-center items-center p-4 transition-colors duration-200">
      <Suspense fallback={<div className="apple-caption">Loading login portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
