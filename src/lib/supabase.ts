import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  display_name: string;
  role: 'student' | 'teacher';
  avatar: string;
  streak: number;
  last_active: string;
};

export type ConceptMastery = {
  id: string;
  user_id: string;
  subject: string;
  concept_id: string;
  mastery: number;
  difficulty: 'easy' | 'medium' | 'hard';
  attempts: number;
  correct_count: number;
  last_practiced: string | null;
  updated_at: string;
};

export type AssessmentAttempt = {
  id: string;
  user_id: string;
  subject: string;
  type: 'diagnostic' | 'practice';
  status: 'in_progress' | 'completed';
  score: number;
  total_questions: number;
  started_at: string;
  completed_at: string | null;
  assignment_id: string | null;
};

export type AssessmentAnswer = {
  id: string;
  attempt_id: string;
  user_id: string;
  concept_id: string;
  question_type: 'mcq' | 'short' | 'long';
  difficulty: 'easy' | 'medium' | 'hard';
  correct: boolean;
  student_answer: string;
  time_spent_ms: number;
  created_at: string;
};

export type RevisionSession = {
  id: string;
  user_id: string;
  subject: string;
  concept_id: string;
  concept_name: string;
  due_date: string;
  status: 'upcoming' | 'done' | 'skipped';
};

export type ChatMessage = {
  id: string;
  user_id: string;
  role: 'student' | 'tutor' | 'system';
  content: string;
  concept_id: string | null;
  misconception: string | null;
  created_at: string;
};

export type ClassEnrollment = {
  id: string;
  teacher_id: string;
  student_id: string;
  class_name: string;
  created_at: string;
};

export type Assignment = {
  id: string;
  teacher_id: string;
  subject: string;
  title: string;
  description: string;
  focus_concepts: string[];
  question_count: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  due_date: string | null;
  status: 'active' | 'closed';
  created_at: string;
};
