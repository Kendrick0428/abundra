'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

export async function createWorkspace(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const name = String(formData.get('name') || '').trim();
  const slug = slugify(formData.get('slug') || name);
  if (!name) redirect('/dashboard?error=name');
  if (slug.length < 3) redirect('/dashboard?error=short');

  const { error } = await supabase.from('workspaces').insert({ name, slug, owner_id: user.id });
  if (error) redirect(`/dashboard?error=${error.code === '23505' ? 'taken' : 'failed'}`);
  redirect(`/w/${slug}/manage`);
}
