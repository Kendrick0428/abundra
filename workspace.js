import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

// Loads the signed-in user, the workspace, and their role once per request.
export const getContext = cache(async (slug) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null };

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  let role = null;
  if (workspace) {
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .maybeSingle();
    role = member?.role ?? null;
  }

  return {
    user,
    workspace,
    role,
    isStaff: ['owner', 'admin', 'instructor'].includes(role),
    isAdmin: ['owner', 'admin'].includes(role),
  };
});
