import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getContext } from '@/lib/workspace';
import SubmitButton from '@/components/submit-button';
import ResetForm from '@/components/reset-form';
import {
  updateCourse, deleteCourse, addModule, renameModule, deleteModule, addLesson, updateLesson, deleteLesson,
} from '../../../actions';

function LessonFields({ lesson, idPrefix }) {
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-title`} className="label">Lesson title</label>
        <input id={`${idPrefix}-title`} name="title" required defaultValue={lesson?.title || ''} className="field" />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-video`} className="label">Video link (YouTube, Vimeo, or a video file)</label>
        <input id={`${idPrefix}-video`} name="video_url" type="url" defaultValue={lesson?.video_url || ''} className="field" placeholder="https://…" />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-content`} className="label">Lesson text</label>
        <textarea id={`${idPrefix}-content`} name="content" rows={5} defaultValue={lesson?.content || ''} className="field font-serif" />
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label htmlFor={`${idPrefix}-drip`} className="label">Unlocks after (days)</label>
          <input id={`${idPrefix}-drip`} name="drip_days" type="number" min="0" defaultValue={lesson?.drip_days ?? 0} className="field w-28" />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input name="is_preview" type="checkbox" defaultChecked={lesson?.is_preview} className="h-4 w-4 accent-vine" />
          Free preview for non-enrolled members
        </label>
      </div>
    </>
  );
}

export default async function CourseEditor({ params }) {
  const { workspace, isStaff, isAdmin } = await getContext(params.slug);
  if (!isStaff) notFound();
  const supabase = createClient();

  const { data: course } = await supabase.from('courses').select('*').eq('id', params.courseId).eq('workspace_id', workspace.id).maybeSingle();
  if (!course) notFound();

  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabase.from('modules').select('*').eq('course_id', course.id).order('position'),
    supabase.from('lessons').select('*').eq('course_id', course.id).order('position'),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href={`/w/${workspace.slug}/manage`} className="text-sm text-stone hover:text-ink">Back to Manage</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="page-title flex-1">{course.title}</h1>
          <Link href={`/w/${workspace.slug}/courses/${course.slug}`} className="btn btn-quiet">View as a student sees it</Link>
        </div>
      </div>

      <section className="panel p-6">
        <h2 className="font-serif text-xl font-semibold">Course details</h2>
        <form action={updateCourse} className="mt-5 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="course_id" value={course.id} />
          <div className="md:col-span-2">
            <label htmlFor="c-title" className="label">Title</label>
            <input id="c-title" name="title" required defaultValue={course.title} className="field" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="c-desc" className="label">Description</label>
            <textarea id="c-desc" name="description" rows={3} defaultValue={course.description || ''} className="field" />
          </div>
          <div>
            <label htmlFor="c-status" className="label">Status</label>
            <select id="c-status" name="status" defaultValue={course.status} className="field">
              <option value="draft">Draft (staff only)</option>
              <option value="published">Published (visible to members)</option>
              <option value="archived">Archived (hidden)</option>
            </select>
          </div>
          <div>
            <label htmlFor="c-price" className="label">Price in dollars (0 = free)</label>
            <input id="c-price" name="price" type="number" min="0" step="0.01" defaultValue={(course.price_cents / 100).toString()} className="field" />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input name="certificate_enabled" type="checkbox" defaultChecked={course.certificate_enabled} className="h-4 w-4 accent-vine" />
            Award a certificate when a student completes every lesson
          </label>
          <div className="md:col-span-2"><SubmitButton>Save course</SubmitButton></div>
        </form>
      </section>

      {(modules || []).map((m, i) => {
        const items = (lessons || []).filter((l) => l.module_id === m.id);
        return (
          <section key={m.id} className="panel">
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
              <span className="text-sm text-stone">Module {i + 1}</span>
              <form action={renameModule} className="flex flex-1 gap-2">
                <input type="hidden" name="module_id" value={m.id} />
                <label htmlFor={`m-${m.id}`} className="sr-only">Module title</label>
                <input id={`m-${m.id}`} name="title" defaultValue={m.title} required className="field font-semibold" />
                <SubmitButton className="btn btn-quiet" pendingText="…">Rename</SubmitButton>
              </form>
              <form action={deleteModule}>
                <input type="hidden" name="module_id" value={m.id} />
                <button className="text-sm text-stone hover:text-red-700">Delete module</button>
              </form>
            </div>

            <ul className="divide-y divide-line">
              {items.map((l) => (
                <li key={l.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-3 hover:bg-dew">
                      <span className="flex-1 font-medium">{l.title}</span>
                      {l.drip_days > 0 && <span className="text-xs text-stone">Day {l.drip_days}</span>}
                      {l.is_preview && <span className="text-xs text-vine">Preview</span>}
                      <span className="text-sm text-stone group-open:hidden">Edit</span>
                      <span className="hidden text-sm text-stone group-open:inline">Close</span>
                    </summary>
                    <div className="space-y-4 bg-dew/50 px-6 py-5">
                      <form action={updateLesson} className="grid gap-4">
                        <input type="hidden" name="lesson_id" value={l.id} />
                        <LessonFields lesson={l} idPrefix={`l-${l.id}`} />
                        <div><SubmitButton>Save lesson</SubmitButton></div>
                      </form>
                      <form action={deleteLesson}>
                        <input type="hidden" name="lesson_id" value={l.id} />
                        <button className="text-sm text-stone hover:text-red-700">Delete lesson</button>
                      </form>
                    </div>
                  </details>
                </li>
              ))}
            </ul>

            <details className="border-t border-line">
              <summary className="cursor-pointer list-none px-6 py-3 text-sm font-semibold" style={{ color: 'var(--brand)' }}>Add a lesson to this module</summary>
              <ResetForm action={addLesson} className="grid gap-4 px-6 pb-6">
                <input type="hidden" name="module_id" value={m.id} />
                <input type="hidden" name="course_id" value={course.id} />
                <input type="hidden" name="workspace_id" value={workspace.id} />
                <input type="hidden" name="position" value={items.length} />
                <LessonFields idPrefix={`new-${m.id}`} />
                <div><SubmitButton pendingText="Adding…">Add lesson</SubmitButton></div>
              </ResetForm>
            </details>
          </section>
        );
      })}

      <section className="panel p-6">
        <h2 className="font-serif text-xl font-semibold">Add a module</h2>
        <p className="mt-1 text-sm text-stone">Modules group related lessons, like chapters in a book.</p>
        <ResetForm action={addModule} className="mt-4 flex gap-2">
          <input type="hidden" name="course_id" value={course.id} />
          <input type="hidden" name="workspace_id" value={workspace.id} />
          <input type="hidden" name="position" value={(modules || []).length} />
          <label htmlFor="new-module" className="sr-only">Module title</label>
          <input id="new-module" name="title" required className="field" placeholder="Foundations of a healthy marriage" />
          <SubmitButton pendingText="Adding…">Add module</SubmitButton>
        </ResetForm>
      </section>

      {isAdmin && (
        <details className="border-t border-line pt-6">
          <summary className="cursor-pointer list-none text-sm text-stone hover:text-red-700">Delete this course</summary>
          <form action={deleteCourse} className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-900">This removes the course, every lesson, and all student progress. It cannot be undone.</p>
            <input type="hidden" name="course_id" value={course.id} />
            <input type="hidden" name="workspace_slug" value={workspace.slug} />
            <SubmitButton className="btn mt-3 bg-red-700 text-white hover:bg-red-800" pendingText="Deleting…">Yes, delete permanently</SubmitButton>
          </form>
        </details>
      )}
    </div>
  );
}
