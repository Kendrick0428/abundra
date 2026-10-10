import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getContext } from '@/lib/workspace';
import { formatPrice } from '@/lib/utils';
import SubmitButton from '@/components/submit-button';
import { enrollFree } from '../../actions';

export default async function CoursePage({ params }) {
  const { user, workspace, isStaff } = await getContext(params.slug);
  if (!user || !workspace) return null;
  const supabase = createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('slug', params.courseSlug)
    .maybeSingle();
  if (!course) notFound();

  const [{ data: modules }, { data: lessons }, { data: enrollment }, { data: progress }] = await Promise.all([
    supabase.from('modules').select('id, title, position').eq('course_id', course.id).order('position'),
    supabase.from('lessons').select('id, title, module_id, position, is_preview').eq('course_id', course.id).order('position'),
    supabase.from('enrollments').select('id').eq('course_id', course.id).eq('user_id', user.id).maybeSingle(),
    supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id).eq('workspace_id', workspace.id),
  ]);

  const done = new Set((progress || []).map((p) => p.lesson_id));
  const visible = lessons || [];
  const completedCount = visible.filter((l) => done.has(l.id)).length;
  const hasAccess = Boolean(enrollment) || isStaff;
  const base = `/w/${workspace.slug}/courses/${course.slug}`;

  return (
    <div className="max-w-3xl">
      <Link href={`/w/${workspace.slug}`} className="text-sm text-stone hover:text-ink">All courses</Link>
      <h1 className="page-title mt-3">{course.title}</h1>
      {course.status === 'draft' && <p className="mt-2 text-sm font-medium text-harvest">Draft, only staff can see this course.</p>}
      {course.description && <p className="mt-4 whitespace-pre-wrap font-serif text-lg leading-relaxed text-ink/80">{course.description}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {enrollment ? (
          <p className="text-sm text-stone">{completedCount} of {visible.length} lessons complete</p>
        ) : isStaff ? (
          <p className="text-sm text-stone">You're viewing as staff, so every lesson is open to you.</p>
        ) : course.price_cents > 0 ? (
          <p className="text-sm text-stone">{formatPrice(course.price_cents)}. Online checkout is coming soon.</p>
        ) : (
          <form action={enrollFree}>
            <input type="hidden" name="course_id" value={course.id} />
            <SubmitButton pendingText="Enrolling…">Enroll for free</SubmitButton>
          </form>
        )}
        {isStaff && <Link href={`/w/${workspace.slug}/manage/courses/${course.id}`} className="btn btn-quiet">Edit course</Link>}
      </div>

      <div className="mt-10 space-y-6">
        {(modules || []).map((m, i) => {
          const items = visible.filter((l) => l.module_id === m.id);
          return (
            <section key={m.id} className="panel">
              <h2 className="border-b border-line px-5 py-3 font-semibold">
                <span className="mr-2 text-stone">Module {i + 1}</span>{m.title}
              </h2>
              {items.length === 0 ? (
                <p className="px-5 py-4 text-sm text-stone">{hasAccess ? 'Lessons in this module unlock soon.' : 'Enroll to see these lessons.'}</p>
              ) : (
                <ol className="divide-y divide-line">
                  {items.map((l) => {
                    const open = hasAccess || l.is_preview;
                    const row = (
                      <span className="flex items-center gap-3 px-5 py-3">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${done.has(l.id) ? 'border-transparent text-white' : 'border-line'}`}
                          style={done.has(l.id) ? { backgroundColor: 'var(--brand)' } : undefined}
                          aria-label={done.has(l.id) ? 'Completed' : undefined}
                        >
                          {done.has(l.id) ? '✓' : ''}
                        </span>
                        <span className={open ? 'text-ink' : 'text-stone'}>{l.title}</span>
                        {l.is_preview && !hasAccess && <span className="ml-auto text-xs font-medium text-vine">Free preview</span>}
                      </span>
                    );
                    return <li key={l.id}>{open ? <Link href={`${base}/${l.id}`} className="block hover:bg-dew">{row}</Link> : row}</li>;
                  })}
                </ol>
              )}
            </section>
          );
        })}
        {!modules?.length && <p className="text-stone">This course doesn't have any lessons yet.</p>}
      </div>
    </div>
  );
}
