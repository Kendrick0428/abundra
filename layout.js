import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getContext } from '@/lib/workspace';
import WorkspaceNav from '@/components/workspace-nav';

export default async function WorkspaceLayout({ children, params }) {
  const { user, workspace, role, isStaff } = await getContext(params.slug);
  if (!user) redirect(`/login?next=${encodeURIComponent(`/w/${params.slug}`)}`);

  if (!workspace || !role) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="page-title">You're not a member of this workspace</h1>
        <p className="mt-3 text-stone">If you were invited, use the invite link to join.</p>
        <div className="mt-6 flex gap-3">
          <Link href={`/join/${params.slug}`} className="btn btn-primary">Open the invite page</Link>
          <Link href="/dashboard" className="btn btn-quiet">Your workspaces</Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen md:flex" style={{ '--brand': workspace.brand_color || '#2F5D46' }}>
      <aside className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex h-full flex-col gap-4 p-4 md:p-5">
          <Link href={`/w/${workspace.slug}`} className="flex items-center gap-3">
            {workspace.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={workspace.logo_url} alt="" className="h-9 w-9 rounded-md object-cover" />
            ) : (
              <span className="h-9 w-9 shrink-0 rounded-md" style={{ backgroundColor: 'var(--brand)' }} aria-hidden="true" />
            )}
            <span className="font-serif text-lg font-semibold leading-tight">{workspace.name}</span>
          </Link>
          <WorkspaceNav slug={workspace.slug} isStaff={isStaff} />
          <div className="mt-auto hidden gap-1 border-t border-line pt-4 md:grid">
            <Link href="/dashboard" className="rounded-md px-3 py-2 text-sm text-stone hover:text-ink">Your workspaces</Link>
            <form action="/auth/signout" method="post">
              <button className="w-full rounded-md px-3 py-2 text-left text-sm text-stone hover:text-ink">Sign out</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
