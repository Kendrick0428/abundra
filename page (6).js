import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getContext } from '@/lib/workspace';
import { videoEmbed } from '@/lib/utils';
import SubmitButton from '@/components/submit-button';
import { markComplete, markIncomplete } from '../../../actions';

export default async function LessonPage({ params }) {
  const { user, workspace } = await getContext(params.slug);
  if (!user || !workspace) return null;
  const supabase = createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('workspace_id', workspace.id)
    .eq('slug', params.courseSlug)
    .maybeSingle();
  if (!course) notFound();

  const courseUrl = `/w/${workspace.slug}/courses/${course.slug}`;

  const [{ data: lesson }, { data: modules }, { data: lessons }, { data: progress }] = await Promise.all([
    supabase.from('lessons').select('*').eq('id', params.lessonId).eq('course_id', course.id).maybeSingle(),
    supabase.from('modules').select('id, position').eq('course_id', course.id).order('position'),
    supabase.from('lessons').select('id, module_id, position').eq('course_id', course.id).order('position'),
    supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id).eq('lesson_id', params.lessonId).maybeSingle(),
  ]);

  if (!lesson) {
    return (
      <div className="max-w-2xl">
        <Link href={courseUrl} className="text-sm text-stone hover:text-ink">Back to {course.title}</Link>
        <h1 className="page-title mt-3">This lesson isn't open to you yet</h1>
        <p className="mt-3 text-stone">Enroll in the course, or wait for the lesson to unlock on its scheduled day.</p>
      </div>
    );
  }

  const modulePos = new Map((modules || []).map((m) => [m.id, m.position]));
  const ordered = (lessons || []).slice().sort(
    (a, b) => (modulePos.get(a.module_id) ?? 0) - (modulePos.get(b.module_id) ?? 0) || a.position - b.position
  );
  const index = ordered.findIndex((l) => l.id === lesson.id);
  const prev = index > 0 ? ordered[index - 1] : null;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null;
  const embed = videoEmbed(lesson.video_url);
  const isDone = Boolean(progress);

  return (
    <article className="max-w-3xl">
      <Link href={courseUrl} className="text-sm text-stone hover:text-ink">Back to {course.title}</Link>
      <h1 className="page-title mt-3">{lesson.title}</h1>

      {lesson.video_url && (
        <div className="mt-6 overflow-hidden rounded-lg bg-ink">
          {embed ? (
            <iframe
              src={embed}
              title={lesson.title}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={lesson.video_url} controls className="aspect-video w-full" />
          )}
        </div>
      )}

      {lesson.content && (
        <div className="mt-8 whitespace-pre-wrap font-serif text-lg leading-[1.75] text-ink">{lesson.content}</div>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        {isDone ? (
          <form action={markIncomplete}>
            <input type="hidden" name="lesson_id" value={lesson.id} />
            <SubmitButton className="btn btn-quiet" pendingText="Updating…">Completed, mark as not done</SubmitButton>
          </form>
        ) : (
          <form action={markComplete}>
            <input type="hidden" name="lesson_id" value={lesson.id} />
            <input type="hidden" name="workspace_id" value={workspace.id} />
            <input type="hidden" name="next_url" value={next ? `${courseUrl}/${next.id}` : ''} />
            <SubmitButton pendingText="Saving…">{next ? 'Mark complete and continue' : 'Mark complete'}</SubmitButton>
          </form>
        )}
        <div className="ml-auto flex gap-2">
          {prev && <Link href={`${courseUrl}/${prev.id}`} className="btn btn-quiet">Previous lesson</Link>}
          {next && <Link href={`${courseUrl}/${next.id}`} className="btn btn-quiet">Next lesson</Link>}
        </div>
      </div>
    </article>
  );
}
