-- ── Allow users to read their friends' reading sessions ───────────────────────
--
-- The existing "Users can view own sessions" policy only allows reading your
-- own rows.  The social feed queries sessions for accepted friends too, but
-- Supabase RLS silently filters those rows out.
--
-- Multiple SELECT policies on the same table are OR-ed together, so adding
-- this policy is safe and additive — own-session access is unchanged.

CREATE POLICY "Users can view accepted friends sessions"
  ON public.reading_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   public.friendships
      WHERE  status = 'accepted'
        AND  (
               (requester_id = auth.uid() AND addressee_id = reading_sessions.user_id)
               OR
               (addressee_id = auth.uid() AND requester_id = reading_sessions.user_id)
             )
    )
  );

-- ── Tighten overly-permissive SELECT policies ─────────────────────────────────
--
-- Several tables have USING (true) without TO authenticated, which means the
-- anon role (unauthenticated requests) can also read them.
-- Scope them to authenticated users only.

ALTER POLICY "Anyone can view likes"
  ON public.session_likes
  TO authenticated;

ALTER POLICY "Anyone can view comments"
  ON public.session_comments
  TO authenticated;

ALTER POLICY "Anyone can view challenges"
  ON public.challenges
  TO authenticated;

ALTER POLICY "Anyone can view challenge participants"
  ON public.challenge_participants
  TO authenticated;
