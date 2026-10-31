/*
# TutorMind schema - adaptive AI tutoring platform

1. New Tables
- `profiles`: extends auth.users with display name, role (student/teacher), streak.
- `concept_mastery`: per-user per-concept mastery score (0-100), difficulty bucket.
- `assessment_attempts`: diagnostic & practice sessions.
- `assessment_answers`: individual answers within an attempt.
- `revision_sessions`: scheduled revision reminders.
- `chat_messages`: conversational AI tutor transcripts.

2. Security
- Enable RLS on every table.
- Grant CRUD to authenticated only (app requires sign-in).
- Owner-scoped policies using auth.uid() = user_id.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Learner',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher')),
  avatar text DEFAULT '',
  streak int NOT NULL DEFAULT 0,
  last_active date DEFAULT now()::date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS concept_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  concept_id text NOT NULL,
  mastery numeric(5,2) NOT NULL DEFAULT 20.00 CHECK (mastery >= 0 AND mastery <= 100),
  difficulty text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  attempts int NOT NULL DEFAULT 0,
  correct_count int NOT NULL DEFAULT 0,
  last_practiced timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, subject, concept_id)
);

ALTER TABLE concept_mastery ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON concept_mastery TO authenticated;

DROP POLICY IF EXISTS "select_own_mastery" ON concept_mastery;
CREATE POLICY "select_own_mastery" ON concept_mastery
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mastery" ON concept_mastery;
CREATE POLICY "insert_own_mastery" ON concept_mastery
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mastery" ON concept_mastery;
CREATE POLICY "update_own_mastery" ON concept_mastery
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_mastery" ON concept_mastery;
CREATE POLICY "delete_own_mastery" ON concept_mastery
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mastery_user_subject ON concept_mastery (user_id, subject);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  type text NOT NULL DEFAULT 'diagnostic' CHECK (type IN ('diagnostic','practice')),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  score numeric(5,2) DEFAULT 0,
  total_questions int DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON assessment_attempts TO authenticated;

DROP POLICY IF EXISTS "select_own_attempts" ON assessment_attempts;
CREATE POLICY "select_own_attempts" ON assessment_attempts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_attempts" ON assessment_attempts;
CREATE POLICY "insert_own_attempts" ON assessment_attempts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_attempts" ON assessment_attempts;
CREATE POLICY "update_own_attempts" ON assessment_attempts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_attempts" ON assessment_attempts;
CREATE POLICY "delete_own_attempts" ON assessment_attempts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS assessment_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('mcq','short','long')),
  difficulty text NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  correct boolean NOT NULL DEFAULT false,
  student_answer text DEFAULT '',
  time_spent_ms int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON assessment_answers TO authenticated;

DROP POLICY IF EXISTS "select_own_answers" ON assessment_answers;
CREATE POLICY "select_own_answers" ON assessment_answers
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_answers" ON assessment_answers;
CREATE POLICY "insert_own_answers" ON assessment_answers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_answers" ON assessment_answers;
CREATE POLICY "update_own_answers" ON assessment_answers
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_answers" ON assessment_answers;
CREATE POLICY "delete_own_answers" ON assessment_answers
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_answers_attempt ON assessment_answers (attempt_id);

CREATE TABLE IF NOT EXISTS revision_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  concept_id text NOT NULL,
  concept_name text NOT NULL,
  due_date date NOT NULL DEFAULT (now()::date + 1),
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','done','skipped')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE revision_sessions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON revision_sessions TO authenticated;

DROP POLICY IF EXISTS "select_own_revisions" ON revision_sessions;
CREATE POLICY "select_own_revisions" ON revision_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_revisions" ON revision_sessions;
CREATE POLICY "insert_own_revisions" ON revision_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_revisions" ON revision_sessions;
CREATE POLICY "update_own_revisions" ON revision_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_revisions" ON revision_sessions;
CREATE POLICY "delete_own_revisions" ON revision_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_revision_user ON revision_sessions (user_id, due_date);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('student','tutor','system')),
  content text NOT NULL,
  concept_id text,
  misconception text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;

DROP POLICY IF EXISTS "select_own_chats" ON chat_messages;
CREATE POLICY "select_own_chats" ON chat_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chats" ON chat_messages;
CREATE POLICY "insert_own_chats" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_chats" ON chat_messages;
CREATE POLICY "update_own_chats" ON chat_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chats" ON chat_messages;
CREATE POLICY "delete_own_chats" ON chat_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages (user_id, created_at);
