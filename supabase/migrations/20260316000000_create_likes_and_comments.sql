-- Session likes
CREATE TABLE IF NOT EXISTS session_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES reading_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE session_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes"     ON session_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like"       ON session_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike own"      ON session_likes FOR DELETE USING (auth.uid() = user_id);

-- Session comments
CREATE TABLE IF NOT EXISTS session_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES reading_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments"  ON session_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can comment"    ON session_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own"      ON session_comments FOR DELETE USING (auth.uid() = user_id);

-- Profiles: add reading_goal_minutes and is_public if not present
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reading_goal_minutes int DEFAULT 20;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;
