import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getContext } from '@/lib/workspace';
import { formatPrice } from '@/lib/utils';

export default async function CoursesPage({ params }) {
  const { user, workspace, isStaff } = await getContext(params.slug);
  if (!user || !workspace) return null;
  const supabase = createClient();

  const [{ data: courses }, { data: enrollments }] = await Promise.all([
    supabase.from('courses').select('id, title, slug, description, status, price_cents, cover_url').eq('workspace_id', workspace.id).neq('status', 'archived').order('created_at'),
    supabase.from('enrollments').select('course_id').eq('user_id', user.id).eq('workspace_id', workspace.id),
  ]);
  const enrolled = new Set((enrollments || []).map((e) => e.course_id));

  return (
    <div className="max-w-5xl">
      <h1 className="page-title">Courses</h1>

      {!courses?.length ? (
        <div className="panel mt-8 p-8">
          {isStaff ? (
            <>
              <p className="text-stone">No courses yet. Your first course starts with a title; you can add lessons right after.</p>
              <Link href={`/w/${workspace.slug}/manage`} className="btn btn-primary mt-4">Create a course</Link>
            </>
          ) : (
            <p className="text-stone">No courses are published yet. Check back soon.</p>
          )}
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {courses.map((c) => (
            <li key={c.id}>
              <Link href={`/w/${workspace.slug}/courses/${c.slug}`} className="panel block h-full overflow-hidden hover:border-stone">
                {c.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.cover_url} alt="" className="aspect-[16/9] w-full object-cover" />
                ) : (
                  <div className="aspect-[16/9] w-full" style={{ backgroundColor: 'var(--brand)', opacity: 0.9 }} aria-hidden="true" />
                )}
                <div className="p-5">
                  <h2 className="font-serif text-xl font-semibold">{c.title}</h2>
                  {c.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone">{c.description}</p>}
                  <p className="mt-4 text-sm font-medium">
                    {c.status === 'draft' ? (
                      <span className="text-harvest">Draft, only staff can see it</span>
                    ) : enrolled.has(c.id) ? (
                      <span className="text-vine">Enrolled</span>
                    ) : (
                      <span className="text-stone">{formatPrice(c.price_cents)}</span>
                    )}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
