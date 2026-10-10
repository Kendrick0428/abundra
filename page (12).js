import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SubmitButton from '@/components/submit-button';
import { joinWorkspace } from './actions';

export default async function JoinPage({ params, searchParams }) {
  const supabase = createClient();
  const { data: cards } = await supabase.rpc('workspace_card', { ws_slug: params.slug });
  const card = cards?.[0];
  const { data: { user } } = await supabase.auth.getUser();

  if (!card) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="page-title">This invite link doesn't match a workspace</h1>
        <p className="mt-3 text-stone">Ask the person who sent it for a new link.</p>
        <Link href="/" className="btn btn-quiet mt-6">Go to Abundra</Link>
      </main>
    );
  }

  const next = `/join/${params.slug}`;

  return (
    <main className="flex min-h-screen items-center justify-center px-4" style={{ '--brand': card.brand_color || '#2F5D46' }}>
      <div className="panel w-full max-w-md p-8 text-center">
        <span className="mx-auto block h-12 w-12 rounded-lg" style={{ backgroundColor: 'var(--brand)' }} aria-hidden="true" />
        <p className="mt-6 text-stone">You're invited to join</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold">{card.name}</h1>
        {searchParams?.error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">Joining didn't work. Refresh the page and try again.</p>
        )}
        {user ? (
          <form action={joinWorkspace} className="mt-8">
            <input type="hidden" name="slug" value={params.slug} />
            <SubmitButton pendingText="Joining…" className="btn btn-primary w-full">Join {card.name}</SubmitButton>
          </form>
        ) : (
          <div className="mt-8 grid gap-3">
            <Link href={`/login?mode=signup&next=${encodeURIComponent(next)}`} className="btn btn-primary">Create an account to join</Link>
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn btn-quiet">I already have an account</Link>
          </div>
        )}
      </div>
    </main>
  );
}
