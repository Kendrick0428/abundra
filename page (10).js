import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SubmitButton from '@/components/submit-button';
import { createWorkspace } from './actions';

export const metadata = { title: 'Your workspaces · Abundra' };

const errors = {
  name: 'Give your workspace a name.',
  short: 'The web address needs at least 3 letters or numbers.',
  taken: 'That web address is already taken. Try another.',
  failed: 'The workspace could not be created. Try again.',
};

const roleNames = { owner: 'Owner', admin: 'Admin', instructor: 'Instructor', student: 'Student' };

export default async function Dashboard({ searchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('role, workspaces(id, name, slug, brand_color)')
    .eq('user_id', user.id);

  const list = (memberships || []).filter((m) => m.workspaces);
  const error = errors[searchParams?.error];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-semibold text-vine">Abundra</Link>
        <form action="/auth/signout" method="post">
          <button className="btn btn-quiet">Sign out</button>
        </form>
      </header>

      <h1 className="page-title mt-12">Your workspaces</h1>

      {list.length === 0 ? (
        <p className="mt-4 text-stone">You are not part of any workspace yet. Create one below, or open an invite link you were sent.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line panel">
          {list.map((m) => (
            <li key={m.workspaces.id}>
              <Link href={`/w/${m.workspaces.slug}`} className="flex items-center gap-4 px-5 py-4 hover:bg-dew">
                <span className="h-8 w-8 shrink-0 rounded-md" style={{ backgroundColor: m.workspaces.brand_color || '#2F5D46' }} aria-hidden="true" />
                <span className="flex-1 font-semibold">{m.workspaces.name}</span>
                <span className="text-sm text-stone">{roleNames[m.role]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="panel mt-10 p-6">
        <h2 className="font-serif text-xl font-semibold">Create a workspace</h2>
        <p className="mt-1 text-sm text-stone">A workspace holds one program's courses, community, and students.</p>
        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>}
        <form action={createWorkspace} className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">Workspace name</label>
            <input id="name" name="name" className="field" placeholder="Love The Right Way Academy" required />
          </div>
          <div>
            <label htmlFor="slug" className="label">Web address</label>
            <input id="slug" name="slug" className="field" placeholder="love-the-right-way" />
            <p className="mt-1 text-xs text-stone">Lowercase letters, numbers, and dashes. Leave blank to use the name.</p>
          </div>
          <div className="md:col-span-2">
            <SubmitButton pendingText="Creating…">Create workspace</SubmitButton>
          </div>
        </form>
      </section>
    </div>
  );
}
