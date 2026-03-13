/*
  # Create Books and Reading Sessions Tables

  ## New Tables
  
  ### `books`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `title` (text, required)
  - `author` (text, required)
  - `total_pages` (integer, default 0)
  - `current_page` (integer, default 0)
  - `status` (text, default 'want') - 'reading', 'finished', 'want'
  - `cover_url` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `reading_sessions`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `book_id` (uuid, references books)
  - `minutes_read` (integer, required)
  - `pages_read` (integer, default 0)
  - `session_date` (date, required)
  - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS on both tables
  - Users can only access their own books and sessions
  - Policies for SELECT, INSERT, UPDATE, DELETE
*/

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text NOT NULL,
  total_pages integer DEFAULT 0,
  current_page integer DEFAULT 0,
  status text DEFAULT 'want',
  cover_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reading_sessions table
CREATE TABLE IF NOT EXISTS reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  minutes_read integer NOT NULL,
  pages_read integer DEFAULT 0,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

-- Books policies
CREATE POLICY "Users can view own books"
  ON books FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books"
  ON books FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
  ON books FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reading sessions policies
CREATE POLICY "Users can view own sessions"
  ON reading_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON reading_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON reading_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON reading_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS books_user_id_idx ON books(user_id);
CREATE INDEX IF NOT EXISTS books_status_idx ON books(status);
CREATE INDEX IF NOT EXISTS reading_sessions_user_id_idx ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS reading_sessions_book_id_idx ON reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS reading_sessions_session_date_idx ON reading_sessions(session_date);

-- Function to update book updated_at timestamp
CREATE OR REPLACE FUNCTION update_books_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_books_updated_at();