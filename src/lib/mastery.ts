import type { ConceptMastery } from './supabase';
import { getConcept, type Difficulty } from './curriculum';

export type MasteryState = {
  concept_id: string;
  subject: string;
  mastery: number;
  difficulty: Difficulty;
  attempts: number;
  correct_count: number;
};

export type AnswerResult = {
  correct: boolean;
  newMastery: number;
  newDifficulty: Difficulty;
  delta: number;
  gaps: string[];
  evaluation: string;
};

// mastery increase per (difficulty, correctness)
const GAINS: Record<string, number> = {
  easy_correct: 4,
  easy_wrong: -3,
  medium_correct: 8,
  medium_wrong: -6,
  hard_correct: 14,
  hard_wrong: -10,
};

const MASTERY_FLOOR = 0;
const MASTERY_CEIL = 100;

export function clampMastery(m: number): number {
  return Math.max(MASTERY_FLOOR, Math.min(MASTERY_CEIL, Math.round(m * 100) / 100));
}

export function updateMastery(
  state: { mastery: number; difficulty: Difficulty; attempts: number; correct_count: number },
  isCorrect: boolean,
): { mastery: number; difficulty: Difficulty } {
  const key = `${state.difficulty}_${isCorrect ? 'correct' : 'wrong'}`;
  const delta = GAINS[key] ?? 0;
  const newMastery = clampMastery(state.mastery + delta);

  let newDifficulty: Difficulty = state.difficulty;
  if (isCorrect) {
    if (newMastery >= 75) newDifficulty = 'hard';
    else if (newMastery >= 45) newDifficulty = 'medium';
  } else {
    if (newMastery < 30) newDifficulty = 'easy';
    else if (newMastery < 60) newDifficulty = 'medium';
  }
  return { mastery: newMastery, difficulty: newDifficulty };
}

export function masteryLabel(m: number): string {
  if (m >= 80) return 'Mastered';
  if (m >= 60) return 'Strong';
  if (m >= 40) return 'Developing';
  if (m >= 20) return 'Weak';
  return 'Beginning';
}

export function masteryColor(m: number): string {
  if (m >= 60) return 'text-emerald-400';
  if (m >= 40) return 'text-amber-400';
  return 'text-rose-400';
}

export function masteryBg(m: number): string {
  if (m >= 60) return 'bg-emerald-500';
  if (m >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

export function pickAdaptiveQuestion(
  subjectId: string,
  conceptIds: string[],
  masteryMap: Record<string, number>,
  seenQuestionIds: Set<string>,
  pool: import('./curriculum').Question[],
): import('./curriculum').Question | null {
  const candidates = pool.filter(
    (q) => conceptIds.includes(q.concept_id) && !seenQuestionIds.has(q.id),
  );
  if (candidates.length === 0) return null;

  // choose a target concept weighted toward weakest unmastered concept
  const sortedConcepts = [...conceptIds].sort(
    (a, b) => (masteryMap[a] ?? 20) - (masteryMap[b] ?? 20),
  );
  for (const cid of sortedConcepts) {
    const m = masteryMap[cid] ?? 20;
    const targetDifficulty: Difficulty = m < 35 ? 'easy' : m < 65 ? 'medium' : 'hard';
    const match = candidates.find(
      (q) => q.concept_id === cid && q.difficulty === targetDifficulty,
    );
    if (match) return match;
    const anyForConcept = candidates.find((q) => q.concept_id === cid);
    if (anyForConcept) return anyForConcept;
  }
  return candidates[0];
}

export function evaluateAnswer(
  question: import('./curriculum').Question,
  studentAnswer: string,
  currentState: { mastery: number; difficulty: Difficulty; attempts: number; correct_count: number },
  subjectId: string,
): AnswerResult {
  const normalized = studentAnswer.trim().toLowerCase();
  let correct = false;
  const gaps: string[] = [];

  if (question.type === 'mcq') {
    correct = normalized === question.answer.trim().toLowerCase();
  } else {
    // short / long: judge via rubric keywords + explicit traps
    const keywords = question.rubricKeywords.map((k) => k.toLowerCase());
    const hits = keywords.filter((k) => {
      if (k.includes('^')) {
        // numeric power notation, treat loosely
        return normalized.includes(k.split('^')[0]);
      }
      return normalized.includes(k);
    });
    const coverage = keywords.length === 0 ? 0 : hits.length / keywords.length;
    // need a decent coverage AND not fall into a trap to be "correct enough"
    correct = coverage >= 0.6;
  }

  // misconception detection on reasoning
  const trapHits = question.misconceptionTraps.filter((t) =>
    normalized.includes(t.trap.toLowerCase()),
  );

  if (trapHits.length > 0) {
    correct = false;
    gaps.push(...trapHits.map((t) => t.message));
  }

  // detect common reasoning gaps even on a "correct" numeric answer for long answers
  if (correct && question.type === 'long') {
    if (!/(because|so|therefore|thus|hence|since|explain|means|which|due to)/i.test(studentAnswer)) {
      gaps.push('Your answer reaches the right value but does not explain the reasoning \u2014 in a viva, always justify the "why".');
    }
  }

  if (!correct && gaps.length === 0) {
    gaps.push(
      `Review the key idea: ${getConcept(subjectId, question.concept_id)?.description ?? ''}`,
    );
  }

  const updated = updateMastery(currentState, correct);
  const delta = updated.mastery - currentState.mastery;

  let evaluation: string;
  if (correct) {
    if (delta >= 10) evaluation = 'Excellent \u2014 a hard question answered well. Mastery jumped significantly.';
    else if (delta > 0) evaluation = 'Correct. Mastery increased a little \u2014 try a harder one next.';
    else evaluation = 'Correct. Keep practising to push mastery higher.';
  } else {
    evaluation = 'Not quite \u2014 a learning gap has been identified. See the explanation and retry.';
  }

  return {
    correct,
    newMastery: updated.mastery,
    newDifficulty: updated.difficulty,
    delta,
    gaps,
    evaluation,
  };
}

export function averageMastery(rows: ConceptMastery[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, r) => acc + Number(r.mastery), 0);
  return Math.round((sum / rows.length) * 10) / 10;
}

export function weakConcepts(rows: ConceptMastery[], threshold = 60): ConceptMastery[] {
  return rows.filter((r) => Number(r.mastery) < threshold);
}

export function masteredConcepts(rows: ConceptMastery[], threshold = 80): ConceptMastery[] {
  return rows.filter((r) => Number(r.mastery) >= threshold);
}
