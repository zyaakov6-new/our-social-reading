-- ── Allow anonymous users to read reading_sessions (public leaderboard) ────────
--
-- Without this, the leaderboard is invisible to unauthenticated visitors.
-- Social reading activity is intentionally public — users share their reading
-- with the community by using the app.
--
-- Existing authenticated policies remain in effect (OR-ed together).

CREATE POLICY "Public can read reading sessions for leaderboard"
  ON public.reading_sessions FOR SELECT
  TO anon
  USING (true);

-- ── Add yearly reading goal to profiles ─────────────────────────────────────────
--
-- Stores the user's yearly book-count goal (e.g., 12 books in 2026).
-- Defaults to 12 (approx. 1 book/month) if never set.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS yearly_goal_books integer DEFAULT 12;
