import { useCallback, useEffect, useState } from 'react';
import { supabase, type ConceptMastery, type RevisionSession, type AssessmentAttempt } from './supabase';
import { SUBJECT_MAP, SUBJECTS } from './curriculum';
import { clampMastery } from './mastery';

export function useLearningData(userId: string | undefined) {
  const [mastery, setMastery] = useState<ConceptMastery[]>([]);
  const [revisions, setRevisions] = useState<RevisionSession[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [m, r, a] = await Promise.all([
      supabase.from('concept_mastery').select('*').eq('user_id', userId),
      supabase.from('revision_sessions').select('*').eq('user_id', userId).order('due_date', { ascending: true }),
      supabase
        .from('assessment_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(10),
    ]);
    setMastery((m.data as ConceptMastery[]) ?? []);
    setRevisions((r.data as RevisionSession[]) ?? []);
    setAttempts((a.data as AssessmentAttempt[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // seed concept_mastery for any subject the user touches, lazily
  const ensureSubjectMastery = useCallback(
    async (subjectId: string) => {
      if (!userId) return;
      const subject = SUBJECT_MAP[subjectId];
      if (!subject) return;
      const existing = mastery.filter((m) => m.subject === subjectId);
      if (existing.length === subject.concepts.length) return;
      const rows = subject.concepts.map((c) => ({
        user_id: userId,
        subject: subjectId,
        concept_id: c.id,
        mastery: 20,
        difficulty: 'easy' as const,
      }));
      const { data } = await supabase
        .from('concept_mastery')
        .upsert(rows, { onConflict: 'user_id,subject,concept_id', ignoreDuplicates: true })
        .select();
      if (data) {
        await load();
      }
    },
    [userId, mastery, load],
  );

  const recordAnswer = useCallback(
    async (args: {
      conceptId: string;
      subjectId: string;
      correct: boolean;
      newMastery: number;
      newDifficulty: 'easy' | 'medium' | 'hard';
      attemptId: string;
      questionType: 'mcq' | 'short' | 'long';
      difficulty: 'easy' | 'medium' | 'hard';
      studentAnswer: string;
      timeSpentMs: number;
    }) => {
      if (!userId) return;
      await supabase.from('assessment_answers').insert({
        attempt_id: args.attemptId,
        user_id: userId,
        concept_id: args.conceptId,
        question_type: args.questionType,
        difficulty: args.difficulty,
        correct: args.correct,
        student_answer: args.studentAnswer,
        time_spent_ms: args.timeSpentMs,
      });
      // update mastery row
      const row = mastery.find(
        (m) => m.concept_id === args.conceptId && m.subject === args.subjectId,
      );
      const attempts = (row?.attempts ?? 0) + 1;
      const correctCount = (row?.correct_count ?? 0) + (args.correct ? 1 : 0);
      if (row) {
        await supabase
          .from('concept_mastery')
          .update({
            mastery: clampMastery(args.newMastery),
            difficulty: args.newDifficulty,
            attempts,
            correct_count: correctCount,
            last_practiced: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
      } else {
        await supabase.from('concept_mastery').insert({
          user_id: userId,
          subject: args.subjectId,
          concept_id: args.conceptId,
          mastery: clampMastery(args.newMastery),
          difficulty: args.newDifficulty,
          attempts,
          correct_count: correctCount,
          last_practiced: new Date().toISOString(),
        });
      }
      await load();
    },
    [userId, mastery, load],
  );

  const scheduleRevision = useCallback(
    async (subjectId: string, conceptId: string, conceptName: string, daysAhead = 1) => {
      if (!userId) return;
      const due = new Date();
      due.setDate(due.getDate() + daysAhead);
      await supabase.from('revision_sessions').insert({
        user_id: userId,
        subject: subjectId,
        concept_id: conceptId,
        concept_name: conceptName,
        due_date: due.toISOString().slice(0, 10),
        status: 'upcoming',
      });
      await load();
    },
    [userId, load],
  );

  const completeRevision = useCallback(
    async (id: string) => {
      await supabase.from('revision_sessions').update({ status: 'done' }).eq('id', id);
      await load();
    },
    [load],
  );

  return {
    mastery,
    revisions,
    attempts,
    loading,
    reload: load,
    ensureSubjectMastery,
    recordAnswer,
    scheduleRevision,
    completeRevision,
  };
}

export function masteryForSubject(mastery: ConceptMastery[], subjectId: string): ConceptMastery[] {
  return mastery.filter((m) => m.subject === subjectId);
}

export function allConceptIds(): string[] {
  return SUBJECTS.flatMap((s) => s.concepts.map((c) => c.id));
}
