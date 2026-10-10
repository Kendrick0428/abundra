'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

const refresh = () => revalidatePath('/w/[slug]', 'layout');
const text = (fd, key) => String(fd.get(key) ?? '').trim();

async function currentUser(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return user;
}

/* ---------- Students ---------- */

export async function enrollFree(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  await supabase.rpc('enroll_free', { c_id: text(formData, 'course_id') });
  refresh();
}

export async function markComplete(formData) {
  const supabase = createClient();
  const user = await currentUser(supabase);
  await supabase.from('lesson_progress').upsert({
    user_id: user.id,
    lesson_id: text(formData, 'lesson_id'),
    workspace_id: text(formData, 'workspace_id'),
  });
  refresh();
  const nextUrl = text(formData, 'next_url');
  if (nextUrl.startsWith('/w/')) redirect(nextUrl);
}

export async function markIncomplete(formData) {
  const supabase = createClient();
  const user = await currentUser(supabase);
  await supabase.from('lesson_progress').delete().eq('user_id', user.id).eq('lesson_id', text(formData, 'lesson_id'));
  refresh();
}

/* ---------- Community ---------- */

export async function createPost(formData) {
  const supabase = createClient();
  const user = await currentUser(supabase);
  const body = text(formData, 'body');
  if (!body) return;
  await supabase.from('posts').insert({ workspace_id: text(formData, 'workspace_id'), author_id: user.id, body });
  refresh();
}

export async function createComment(formData) {
  const supabase = createClient();
  const user = await currentUser(supabase);
  const body = text(formData, 'body');
  if (!body) return;
  await supabase.from('comments').insert({
    post_id: text(formData, 'post_id'),
    workspace_id: text(formData, 'workspace_id'),
    author_id: user.id,
    body,
  });
  refresh();
}

export async function deletePost(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  await supabase.from('posts').delete().eq('id', text(formData, 'post_id'));
  refresh();
}

export async function togglePin(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  await supabase.from('posts').update({ pinned: formData.get('pinned') === 'true' }).eq('id', text(formData, 'post_id'));
  refresh();
}

/* ---------- Staff: workspace ---------- */

export async function updateWorkspace(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  await supabase
    .from('workspaces')
    .update({
      name: text(formData, 'name'),
      brand_color: text(formData, 'brand_color') || '#2F5D46',
      logo_url: text(formData, 'logo_url') || null,
    })
    .eq('id', text(formData, 'workspace_id'));
  refresh();
}

export async function changeRole(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  const role = text(formData, 'role');
  if (!['admin', 'instructor', 'student'].includes(role)) return;
  await supabase
    .from('workspace_members')
    .update({ role })
    .eq('workspace_id', text(formData, 'workspace_id'))
    .eq('user_id', text(formData, 'user_id'))
    .neq('role', 'owner');
  refresh();
}

/* ---------- Staff: courses ---------- */

export async function createCourse(formData) {
  const supabase = createClient();
  const user = await currentUser(supabase);
  const workspaceSlug = text(formData, 'workspace_slug');
  const title = text(formData, 'title');
  if (!title) return;
  const base = slugify(title) || 'course';
  const row = {
    workspace_id: text(formData, 'workspace_id'),
    title,
    description: text(formData, 'description') || null,
    created_by: user.id,
  };

  let { data, error } = await supabase.from('courses').insert({ ...row, slug: base }).select('id').single();
  if (error?.code === '23505') {
    ({ data, error } = await supabase
      .from('courses')
      .insert({ ...row, slug: `${base}-${Math.random().toString(36).slice(2, 6)}` })
      .select('id')
      .single());
  }
  if (error || !data) redirect(`/w/${workspaceSlug}/manage?error=course`);
  redirect(`/w/${workspaceSlug}/manage/courses/${data.id}`);
}

export async function updateCourse(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  const dollars = parseFloat(text(formData, 'price') || '0');
  await supabase
    .from('courses')
    .update({
      title: text(formData, 'title'),
      description: text(formData, 'description') || null,
      status: text(formData, 'status'),
      price_cents: Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : 0,
      certificate_enabled: formData.get('certificate_enabled') === 'on',
    })
    .eq('id', text(formData, 'course_id'));
  refresh();
}

export async function deleteCourse(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  await supabase.from('courses').delete().eq('id', text(formData, 'course_id'));
  refresh();
  redirect(`/w/${text(formData, 'workspace_slug')}/manage`);
}

export async function addModule(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  const title = text(formData, 'title');
  if (!title) return;
  await supabase.from('modules').insert({
    course_id: text(formData, 'course_id'),
    workspace_id: text(formData, 'workspace_id'),
    title,
    position: parseInt(text(formData, 'position'), 10) || 0,
  });
  refresh();
}

export async function renameModule(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  await supabase.from('modules').update({ title: text(formData, 'title') }).eq('id', text(formData, 'module_id'));
  refresh();
}

export async function deleteModule(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  await supabase.from('modules').delete().eq('id', text(formData, 'module_id'));
  refresh();
}

function lessonFields(formData) {
  return {
    title: text(formData, 'title'),
    video_url: text(formData, 'video_url') || null,
    content: text(formData, 'content') || null,
    drip_days: Math.max(0, parseInt(text(formData, 'drip_days'), 10) || 0),
    is_preview: formData.get('is_preview') === 'on',
  };
}

export async function addLesson(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  const fields = lessonFields(formData);
  if (!fields.title) return;
  await supabase.from('lessons').insert({
    ...fields,
    module_id: text(formData, 'module_id'),
    course_id: text(formData, 'course_id'),
    workspace_id: text(formData, 'workspace_id'),
    position: parseInt(text(formData, 'position'), 10) || 0,
  });
  refresh();
}

export async function updateLesson(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  await supabase.from('lessons').update(lessonFields(formData)).eq('id', text(formData, 'lesson_id'));
  refresh();
}

export async function deleteLesson(formData) {
  const supabase = createClient();
  await currentUser(supabase);
  await supabase.from('lessons').delete().eq('id', text(formData, 'lesson_id'));
  refresh();
}
