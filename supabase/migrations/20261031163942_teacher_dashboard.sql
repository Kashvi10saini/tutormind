/*
# Teacher dashboard support - assignments, class enrollments, teacher read access

1. New Tables
- `class_enrollments`: links a teacher to their students. teacher_id + student_id pair.
  A teacher can read mastery, attempts, answers, and misconceptions for any student
  enrolled in one of their classes.
- `assignments`: custom diagnostic tests a teacher creates and assigns to their class.
  Stores subject, title, description, a focus-concept list (text[]), question count, due date,
  and status. Created by teachers, visible to enrolled students.

2. Modified Tables
- `assessment_attempts`: add nullable `assignment_id` column linking an attempt to a
  specific assignment when the student takes a teacher-assigned diagnostic.

3. Security
- Enable RLS on `class_enrollments` and `assignments`.
- Teachers can CRUD their own enrollment rows and assignment rows.
- Students can read assignments assigned to them (via enrollment check).
- Students can insert attempts referencing an assignment they are enrolled in.
- Teacher READ access: add SELECT policies on profiles, concept_mastery,
  assessment_attempts, assessment_answers, and chat_messages that allow a teacher to
  read rows belonging to any student enrolled in one of their classes. These are NEW
  policies added alongside the existing owner-scoped policies (both coexist).
- Grants: add SELECT on class_enrollments + assignments to authenticated.
- Add assignment_id to assessment_attempts; grant UPDATE includes it.
*/

-- ============================================================
-- class_enrollments
-- ============================================================
CREATE TABLE IF NOT EXISTS class_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_name text NOT NULL DEFAULT 'Default Class',
  created_at timestamptz DEFAULT now(),
  UNIQUE (teacher_id, student_id)
);

ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON class_enrollments TO authenticated;

DROP POLICY IF EXISTS "teacher_select_enrollments" ON class_enrollments;
CREATE POLICY "teacher_select_enrollments"
  ON class_enrollments
  FOR SELECT TO authenticated
  USING (auth.uid() = teacher_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "teacher_insert_enrollments" ON class_enrollments;
CREATE POLICY "teacher_insert_enrollments"
  ON class_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "teacher_update_enrollments" ON class_enrollments;
CREATE POLICY "teacher_update_enrollments"
  ON class_enrollments
  FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "teacher_delete_enrollments" ON class_enrollments;
CREATE POLICY "teacher_delete_enrollments"
  ON class_enrollments
  FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id);

CREATE INDEX IF NOT EXISTS idx_enrollment_teacher ON class_enrollments (teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_student ON class_enrollments (student_id);

-- ============================================================
-- assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  focus_concepts text[] NOT NULL DEFAULT '{}',
  question_count int NOT NULL DEFAULT 8,
  difficulty text NOT NULL DEFAULT 'adaptive' CHECK (difficulty IN ('easy','medium','hard','adaptive')),
  due_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON assignments TO authenticated;

DROP POLICY IF EXISTS "teacher_select_assignments" ON assignments;
CREATE POLICY "teacher_select_assignments"
  ON assignments
  FOR SELECT TO authenticated
  USING (
    auth.uid() = teacher_id
    OR EXISTS (
      SELECT 1 FROM class_enrollments
      WHERE class_enrollments.teacher_id = assignments.teacher_id
        AND class_enrollments.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "teacher_insert_assignments" ON assignments;
CREATE POLICY "teacher_insert_assignments"
  ON assignments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "teacher_update_assignments" ON assignments;
CREATE POLICY "teacher_update_assignments"
  ON assignments
  FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "teacher_delete_assignments" ON assignments;
CREATE POLICY "teacher_delete_assignments"
  ON assignments
  FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id);

CREATE INDEX IF NOT EXISTS idx_assignment_teacher ON assignments (teacher_id);

-- ============================================================
-- assessment_attempts: add assignment_id column
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_attempts' AND column_name = 'assignment_id'
  ) THEN
    ALTER TABLE assessment_attempts ADD COLUMN assignment_id uuid REFERENCES assignments(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_attempts_assignment ON assessment_attempts (assignment_id);
  END IF;
END $$;

-- ============================================================
-- Teacher READ access to student data (via enrollment)
-- These policies are ADDITIVE: they sit beside existing owner-scoped policies.
-- A row is visible if the user owns it OR the user is a teacher who has enrolled
-- the row's owner in one of their classes.
-- ============================================================

-- profiles: teacher can read any student they have enrolled
DROP POLICY IF EXISTS "teacher_read_profiles" ON profiles;
CREATE POLICY "teacher_read_profiles"
  ON profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM class_enrollments
      WHERE class_enrollments.student_id = profiles.id
        AND class_enrollments.teacher_id = auth.uid()
    )
  );

-- concept_mastery: teacher can read mastery for enrolled students
DROP POLICY IF EXISTS "teacher_read_mastery" ON concept_mastery;
CREATE POLICY "teacher_read_mastery"
  ON concept_mastery
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM class_enrollments
      WHERE class_enrollments.student_id = concept_mastery.user_id
        AND class_enrollments.teacher_id = auth.uid()
    )
  );

-- assessment_attempts: teacher can read attempts for enrolled students
DROP POLICY IF EXISTS "teacher_read_attempts" ON assessment_attempts;
CREATE POLICY "teacher_read_attempts"
  ON assessment_attempts
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM class_enrollments
      WHERE class_enrollments.student_id = assessment_attempts.user_id
        AND class_enrollments.teacher_id = auth.uid()
    )
  );

-- assessment_answers: teacher can read answers for enrolled students
DROP POLICY IF EXISTS "teacher_read_answers" ON assessment_answers;
CREATE POLICY "teacher_read_answers"
  ON assessment_answers
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM class_enrollments
      WHERE class_enrollments.student_id = assessment_answers.user_id
        AND class_enrollments.teacher_id = auth.uid()
    )
  );

-- chat_messages: teacher can read chat (incl. misconceptions) for enrolled students
DROP POLICY IF EXISTS "teacher_read_chats" ON chat_messages;
CREATE POLICY "teacher_read_chats"
  ON chat_messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM class_enrollments
      WHERE class_enrollments.student_id = chat_messages.user_id
        AND class_enrollments.teacher_id = auth.uid()
    )
  );
