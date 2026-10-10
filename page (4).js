import Link from 'next/link';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getContext } from '@/lib/workspace';
import SubmitButton from '@/components/submit-button';
import { createCourse, updateWorkspace, changeRole } from '../actions';

const statusNames = { draft: 'Draft', published: 'Published', archived: 'Archived' };
const roleNames = { owner: 'Owner', admin: 'Admin', instructor: 'Instructor', student: 'Student' };

export default async function ManagePage({ params, searchParams }) {
  const { workspace, isStaff, isAdmin } = await getContext(params.slug);
  if (!isStaff) {
    return <p className="text-stone">Only owners, admins, and instructors can manage this workspace.</p>;
  }
  const supabase = createClient();

  const [{ data: courses }, { data: members }] = await Promise.all([
    supabase.from('courses').select('id, title, status').eq('workspace_id', workspace.id).order('created_at'),
    supabase.from('workspace_members').select('user_id, role, joined_at').eq('workspace_id', workspace.id).order('joined_at'),
  ]);
  const ids = (members || []).map((m) => m.user_id);
  const { data: profiles } = ids.length ? await supabase.from('profiles').select('id, full_name').in('id', ids) : { data: [] };
  const nameOf = (id) => (profiles || []).find((p) => p.id === id)?.full_name || 'Member';

  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  const inviteUrl = `${proto}://${host}/join/${workspace.slug}`;

  return (
    <div className="max-w-4xl space-y-10">
      <h1 className="page-title">Manage {workspace.name}</h1>

      <section className="panel p-6">
        <h2 className="font-serif text-xl font-semibold">Courses</h2>
        {searchParams?.error === 'course' && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">The course could not be created. Try a different title.</p>
        )}
        {courses?.length ? (
          <ul className="mt-4 divide-y divide-line rounded-md border border-line">
            {courses.map((c) => (
              <li key={c.id}>
                <Link href={`/w/${workspace.slug}/manage/courses/${c.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-dew">
                  <span className="font-medium">{c.title}</span>
                  <span className={`text-sm ${c.status === 'published' ? 'text-vine' : 'text-stone'}`}>{statusNames[c.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone">No courses yet.</p>
        )}
        <form action={createCourse} className="mt-6 grid gap-4">
          <input type="hidden" name="workspace_id" value={workspace.id} />
          <input type="hidden" name="workspace_slug" value={workspace.slug} />
          <div>
            <label htmlFor="title" className="label">New course title</label>
            <input id="title" name="title" required className="field" placeholder="Certified Couples & Marriage Coach" />
          </div>
          <div>
            <label htmlFor="description" className="label">Short description</label>
            <textarea id="description" name="description" rows={2} className="field" placeholder="What students will learn and who it's for." />
          </div>
          <div><SubmitButton pendingText="Creating…">Create course</SubmitButton></div>
        </form>
      </section>

      <section className="panel p-6">
        <h2 className="font-serif text-xl font-semibold">Invite students</h2>
        <p className="mt-1 text-sm text-stone">Anyone with this link can create an account and join as a student.</p>
        <label htmlFor="invite" className="sr-only">Invite link</label>
        <input id="invite" readOnly value={inviteUrl} className="field mt-4 font-medium" />
      </section>

      {isAdmin && (
        <section className="panel p-6">
          <h2 className="font-serif text-xl font-semibold">Workspace settings</h2>
          <form action={updateWorkspace} className="mt-5 grid gap-4 md:grid-cols-2">
            <input type="hidden" name="workspace_id" value={workspace.id} />
            <div className="md:col-span-2">
              <label htmlFor="ws-name" className="label">Name</label>
              <input id="ws-name" name="name" defaultValue={workspace.name} required className="field" />
            </div>
            <div>
              <label htmlFor="brand" className="label">Brand color</label>
              <input id="brand" name="brand_color" type="color" defaultValue={workspace.brand_color || '#2F5D46'} className="h-10 w-20 cursor-pointer rounded-md border border-line bg-white p-1" />
            </div>
            <div>
              <label htmlFor="logo" className="label">Logo image link</label>
              <input id="logo" name="logo_url" type="url" defaultValue={workspace.logo_url || ''} className="field" placeholder="https://…" />
            </div>
            <div className="md:col-span-2"><SubmitButton>Save settings</SubmitButton></div>
          </form>
        </section>
      )}

      <section className="panel p-6">
        <h2 className="font-serif text-xl font-semibold">Members</h2>
        <ul className="mt-4 divide-y divide-line rounded-md border border-line">
          {(members || []).map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="flex-1 font-medium">{nameOf(m.user_id)}</span>
              {isAdmin && m.role !== 'owner' ? (
                <form action={changeRole} className="flex items-center gap-2">
                  <input type="hidden" name="workspace_id" value={workspace.id} />
                  <input type="hidden" name="user_id" value={m.user_id} />
                  <label htmlFor={`role-${m.user_id}`} className="sr-only">Role</label>
                  <select id={`role-${m.user_id}`} name="role" defaultValue={m.role} className="field w-auto py-1.5">
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <SubmitButton className="btn btn-quiet py-1.5" pendingText="…">Update</SubmitButton>
                </form>
              ) : (
                <span className="text-sm text-stone">{roleNames[m.role]}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
