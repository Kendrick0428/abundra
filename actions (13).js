'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function joinWorkspace(formData) {
  const slug = String(formData.get('slug'));
  const supabase = createClient();
  const { error } = await supabase.rpc('join_workspace', { ws_slug: slug });
  if (error) redirect(`/join/${slug}?error=1`);
  redirect(`/w/${slug}`);
}
