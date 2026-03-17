-- ── Add is_public flag to challenges ─────────────────────────────────────────
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- ── Seed 3 default public challenges (uses the first existing user as creator)
-- These are always-on challenges that all users can see and join.
DO $$
DECLARE
  seed_user_id uuid;
  end_year date := (date_trunc('year', CURRENT_DATE) + interval '1 year - 1 day')::date;
BEGIN
  SELECT id INTO seed_user_id FROM auth.users ORDER BY created_at LIMIT 1;

  IF seed_user_id IS NULL THEN
    RETURN; -- No users yet, skip seeding
  END IF;

  -- Only insert if no public challenges exist yet
  IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE is_public = true) THEN
    INSERT INTO public.challenges (creator_id, name, goal_type, goal_value, start_date, end_date, is_public)
    VALUES
      (seed_user_id, 'קורא השבוע 🏆',  'minutes', 140, CURRENT_DATE, CURRENT_DATE + 7,  true),
      (seed_user_id, 'ספר בחודש 📚',   'books',   1,   CURRENT_DATE, CURRENT_DATE + 30, true),
      (seed_user_id, 'קורא השנה 🥇',   'minutes', 10000, CURRENT_DATE, end_year,        true);
  END IF;
END $$;

-- ── Avatars storage bucket + policy ──────────────────────────────────────────
-- Create the avatars bucket if it doesn't exist (idempotent via DO block)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload/update their own avatar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatar upload by owner'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Avatar upload by owner" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatar update by owner'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Avatar update by owner" ON storage.objects
        FOR UPDATE TO authenticated
        USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatars are publicly readable'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Avatars are publicly readable" ON storage.objects
        FOR SELECT USING (bucket_id = 'avatars');
    $policy$;
  END IF;
END $$;
