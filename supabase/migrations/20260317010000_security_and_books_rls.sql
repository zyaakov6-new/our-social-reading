-- ── Fix 1: Allow reading books belonging to accepted friends ─────────────────
--
-- reading_sessions JOINs to books for the title/author.
-- The existing "Users can view own books" policy blocks that JOIN for friend
-- sessions, so book titles show as null / "ספר לא ידוע" in the social feed.
-- Adding a second SELECT policy (OR-ed) fixes this.

CREATE POLICY "Users can view friends books"
  ON public.books FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   public.friendships
      WHERE  status = 'accepted'
        AND  (
               (requester_id = auth.uid() AND addressee_id = books.user_id)
               OR
               (addressee_id = auth.uid() AND requester_id = books.user_id)
             )
    )
  );

-- ── Fix 2: Restrict friendships UPDATE to the addressee only ─────────────────
--
-- The current UPDATE policy allows BOTH requester and addressee to change the
-- status, meaning a requester could self-accept their own friend request.
-- Replace it with one that only permits the addressee to update status.

DROP POLICY IF EXISTS "users_update_own_friendships" ON public.friendships;

CREATE POLICY "users_update_own_friendships"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = addressee_id);

-- ── Fix 3: Tighten posts SELECT to authenticated users only ───────────────────
--
-- "Anyone can view posts" and "Anyone can view post likes/comments" use
-- USING (true) without TO authenticated, permitting anonymous reads.

ALTER POLICY "Anyone can view posts"
  ON public.posts
  TO authenticated;

ALTER POLICY "Anyone can view post likes"
  ON public.post_likes
  TO authenticated;

ALTER POLICY "Anyone can view post comments"
  ON public.post_comments
  TO authenticated;
