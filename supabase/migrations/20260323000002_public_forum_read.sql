-- ── Re-open forum reads to anonymous users ─────────────────────────────────────
--
-- Migration 20260317010000 tightened posts/post_likes/post_comments to
-- TO authenticated only.  Now that guests can browse the forum (progressive
-- auth UX), we need anon reads back so unauthenticated visitors see the posts.
--
-- Write actions (INSERT) remain restricted to authenticated users.

ALTER POLICY "Anyone can view posts"
  ON public.posts
  TO anon, authenticated;

ALTER POLICY "Anyone can view post likes"
  ON public.post_likes
  TO anon, authenticated;

ALTER POLICY "Anyone can view post comments"
  ON public.post_comments
  TO anon, authenticated;
