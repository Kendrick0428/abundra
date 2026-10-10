import { createClient } from '@/lib/supabase/server';
import { getContext } from '@/lib/workspace';
import { formatDate } from '@/lib/utils';
import ResetForm from '@/components/reset-form';
import SubmitButton from '@/components/submit-button';
import { createPost, createComment, deletePost, togglePin } from '../actions';

export default async function CommunityPage({ params }) {
  const { user, workspace, isStaff } = await getContext(params.slug);
  if (!user || !workspace) return null;
  const supabase = createClient();

  const { data: posts } = await supabase
    .from('posts')
    .select('id, body, author_id, created_at, pinned')
    .eq('workspace_id', workspace.id)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  const postIds = (posts || []).map((p) => p.id);
  const { data: comments } = postIds.length
    ? await supabase.from('comments').select('id, post_id, body, author_id, created_at').in('post_id', postIds).order('created_at')
    : { data: [] };

  const authorIds = [...new Set([...(posts || []), ...(comments || [])].map((x) => x.author_id))];
  const { data: profiles } = authorIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', authorIds)
    : { data: [] };
  const nameOf = (id) => (profiles || []).find((p) => p.id === id)?.full_name || 'Member';

  return (
    <div className="max-w-2xl">
      <h1 className="page-title">Community</h1>

      <ResetForm action={createPost} className="panel mt-8 p-4">
        <input type="hidden" name="workspace_id" value={workspace.id} />
        <label htmlFor="new-post" className="sr-only">Write a post</label>
        <textarea id="new-post" name="body" rows={3} required className="field resize-y border-0 px-1 focus:ring-0" placeholder="Share an encouragement, a question, or what you're learning…" />
        <div className="mt-3 flex justify-end">
          <SubmitButton pendingText="Posting…">Post</SubmitButton>
        </div>
      </ResetForm>

      {!posts?.length && <p className="mt-8 text-stone">No posts yet. Start the conversation above.</p>}

      <ul className="mt-8 space-y-5">
        {(posts || []).map((post) => {
          const thread = (comments || []).filter((c) => c.post_id === post.id);
          const canDelete = post.author_id === user.id || isStaff;
          return (
            <li key={post.id} className="panel">
              <div className="p-5">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold">{nameOf(post.author_id)}</span>
                  <span className="text-xs text-stone">{formatDate(post.created_at)}</span>
                  {post.pinned && <span className="text-xs font-medium text-harvest">Pinned</span>}
                </div>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">{post.body}</p>
                {(canDelete || isStaff) && (
                  <div className="mt-3 flex gap-4 text-xs">
                    {isStaff && (
                      <form action={togglePin}>
                        <input type="hidden" name="post_id" value={post.id} />
                        <input type="hidden" name="pinned" value={post.pinned ? 'false' : 'true'} />
                        <button className="text-stone hover:text-ink">{post.pinned ? 'Unpin' : 'Pin to top'}</button>
                      </form>
                    )}
                    {canDelete && (
                      <form action={deletePost}>
                        <input type="hidden" name="post_id" value={post.id} />
                        <button className="text-stone hover:text-red-700">Delete post</button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-line bg-dew/60 px-5 py-4">
                {thread.length > 0 && (
                  <ul className="mb-4 space-y-3">
                    {thread.map((c) => (
                      <li key={c.id} className="text-sm">
                        <span className="font-semibold">{nameOf(c.author_id)}</span>{' '}
                        <span className="whitespace-pre-wrap">{c.body}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <ResetForm action={createComment} className="flex gap-2">
                  <input type="hidden" name="post_id" value={post.id} />
                  <input type="hidden" name="workspace_id" value={workspace.id} />
                  <label htmlFor={`c-${post.id}`} className="sr-only">Write a comment</label>
                  <input id={`c-${post.id}`} name="body" required className="field" placeholder="Write a comment…" />
                  <SubmitButton className="btn btn-quiet" pendingText="…">Reply</SubmitButton>
                </ResetForm>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
