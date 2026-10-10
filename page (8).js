import Link from 'next/link';
import AuthForm from '@/components/auth-form';
import { safeNext } from '@/lib/utils';

export const metadata = { title: 'Sign in · Abundra' };

export default function LoginPage({ searchParams }) {
  const next = safeNext(searchParams?.next);
  const mode = searchParams?.mode === 'signup' ? 'signup' : 'signin';
  const confirmFailed = searchParams?.error === 'confirm';
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <Link href="/" className="font-serif text-2xl font-semibold text-vine">Abundra</Link>
      {confirmFailed && (
        <p className="max-w-md rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          That confirmation link has expired or was already used. Sign in, or create your account again.
        </p>
      )}
      <AuthForm initialMode={mode} next={next} />
    </main>
  );
}
