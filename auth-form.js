'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthForm({ initialMode = 'signin', next = '/dashboard' }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }
    setNotice('Check your email for a link to confirm your account, then come back and sign in.');
    setBusy(false);
  }

  const isSignup = mode === 'signup';

  return (
    <div className="panel w-full max-w-md p-8">
      <h1 className="font-serif text-2xl font-semibold">{isSignup ? 'Create your account' : 'Sign in to Abundra'}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {isSignup && (
          <div>
            <label htmlFor="fullName" className="label">Full name</label>
            <input id="fullName" className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" minLength={8} className="field" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={isSignup ? 'new-password' : 'current-password'} />
          {isSignup && <p className="mt-1 text-xs text-stone">At least 8 characters.</p>}
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>}
        {notice && <p className="rounded-md bg-dew px-3 py-2 text-sm text-ink" role="status">{notice}</p>}
        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? 'One moment…' : isSignup ? 'Create account' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-stone">
        {isSignup ? 'Already have an account?' : 'New to Abundra?'}{' '}
        <button type="button" className="font-semibold text-vine underline-offset-2 hover:underline" onClick={() => { setMode(isSignup ? 'signin' : 'signup'); setError(null); setNotice(null); }}>
          {isSignup ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </div>
  );
}
