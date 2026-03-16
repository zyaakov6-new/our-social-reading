-- ── Ensure profiles table exists (safe if already present) ───────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view all profiles'
  ) THEN
    CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add new columns to profiles (safe if already present)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reading_goal_minutes int DEFAULT 20;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- ── Session likes ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.reading_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.session_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_likes' AND policyname = 'Anyone can view likes') THEN
    CREATE POLICY "Anyone can view likes" ON public.session_likes FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_likes' AND policyname = 'Auth users can like') THEN
    CREATE POLICY "Auth users can like" ON public.session_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_likes' AND policyname = 'Users can unlike own') THEN
    CREATE POLICY "Users can unlike own" ON public.session_likes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Session comments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.reading_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.session_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_comments' AND policyname = 'Anyone can view comments') THEN
    CREATE POLICY "Anyone can view comments" ON public.session_comments FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_comments' AND policyname = 'Auth users can comment') THEN
    CREATE POLICY "Auth users can comment" ON public.session_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_comments' AND policyname = 'Users can delete own') THEN
    CREATE POLICY "Users can delete own" ON public.session_comments FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
