import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, PenTool, CheckCircle2, XCircle, Lightbulb, ChevronRight,
  Brain, AlertTriangle, Target, Sparkles, RotateCcw, TrendingUp,
} from 'lucide-react';
import { SUBJECTS, SUBJECT_MAP, getConcept, questionsForConcept, type Question } from '@/lib/curriculum';
import { useAuth } from '@/lib/auth';
import { useLearningData, masteryForSubject } from '@/lib/useLearningData';
import { evaluateAnswer, masteryColor, masteryLabel, weakConcepts } from '@/lib/mastery';
import { GlassCard, ProgressRing } from '@/components/ui';

const SESSION_LENGTH = 6;

export function PracticeSession({
  initialSubject,
  onExit,
}: {
  initialSubject?: string;
  onExit: () => void;
}) {
  const { profile } = useAuth();
  const userId = profile?.id;
  const { mastery, ensureSubjectMastery, recordAnswer, reload } = useLearningData(userId);

  const [subjectId, setSubjectId] = useState<string | undefined>(initialSubject);
  const [phase, setPhase] = useState<'select' | 'intro' | 'question' | 'feedback' | 'done'>(
    initialSubject ? 'intro' : 'select',
  );
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ReturnType<typeof evaluateAnswer> | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptId, setAttemptId] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);
  const [showHint, setShowHint] = useState(false);
  const [loadingQ, setLoadingQ] = useState(false);

  const rows = subjectId ? masteryForSubject(mastery, subjectId) : [];
  const weak = useMemo(() => weakConcepts(rows, 60), [rows]);
  const focusConcepts = weak.length > 0 ? weak : rows;

  useEffect(() => {
    if (initialSubject) {
      setSubjectId(initialSubject);
      setPhase('intro');
    }
  }, [initialSubject]);

  const start = async () => {
    if (!subjectId) return;
    setLoadingQ(true);
    await ensureSubjectMastery(subjectId);
    await reload();
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase
      .from('assessment_attempts')
      .insert({
        user_id: userId,
        subject: subjectId,
        type: 'practice',
        status: 'in_progress',
        total_questions: SESSION_LENGTH,
      })
      .select()
      .maybeSingle();
    setAttemptId(data?.id ?? crypto.randomUUID());
    setIdx(0);
    setCorrectCount(0);
    setSeen(new Set());
    pickNext(subjectId, new Set());
    setPhase('question');
    setLoadingQ(false);
  };

  const pickNext = (subj: string, seenIds: Set<string>) => {
    const subject = SUBJECT_MAP[subj];
    const pool = subject.concepts
      .flatMap((c) => c.id)
      .map((cid) => ({ cid, mastery: mastery.find((m) => m.concept_id === cid && m.subject === subj)?.mastery ?? 20 }))
      .filter((x) => Number(x.mastery) < 60)
      .sort((a, b) => Number(a.mastery) - Number(b.mastery));

    const candidateConcepts = pool.length > 0 ? pool : subject.concepts.map((c) => ({ cid: c.id, mastery: 100 }));
    const allQuestions = subject.concepts.flatMap((c) => questionsForConcept(c.id));
    let chosen: Question | null = null;
    for (const { cid, mastery } of candidateConcepts) {
      const m = Number(mastery);
      const targetDifficulty = m < 35 ? 'easy' : m < 65 ? 'medium' : 'hard';
      const match = allQuestions.find(
        (q) => q.concept_id === cid && q.difficulty === targetDifficulty && !seenIds.has(q.id),
      );
      if (match) {
        chosen = match;
        break;
      }
      const anyForConcept = allQuestions.find((q) => q.concept_id === cid && !seenIds.has(q.id));
      if (anyForConcept) {
        chosen = anyForConcept;
        break;
      }
    }
    if (!chosen) {
      const unseen = allQuestions.filter((q) => !seenIds.has(q.id));
      chosen = unseen[0] ?? allQuestions[0] ?? null;
    }
    setQuestion(chosen);
    setAnswer('');
    setSelectedOption(null);
    setShowHint(false);
    setStartTime(Date.now());
  };

  const submit = async () => {
    if (!question || !subjectId) return;
    const studentAnswer = question.type === 'mcq' ? (selectedOption ?? '') : answer;
    if (!studentAnswer.trim()) return;
    const row = mastery.find((m) => m.concept_id === question.concept_id && m.subject === subjectId);
    const result = evaluateAnswer(question, studentAnswer, {
      mastery: row ? Number(row.mastery) : 20,
      difficulty: row?.difficulty ?? 'easy',
      attempts: row?.attempts ?? 0,
      correct_count: row?.correct_count ?? 0,
    }, subjectId);
    setFeedback(result);
    await recordAnswer({
      conceptId: question.concept_id,
      subjectId,
      correct: result.correct,
      newMastery: result.newMastery,
      newDifficulty: result.newDifficulty,
      attemptId,
      questionType: question.type,
      difficulty: question.difficulty,
      studentAnswer,
      timeSpentMs: Date.now() - startTime,
    });
    setCorrectCount((c) => c + (result.correct ? 1 : 0));
    setPhase('feedback');
  };

  const advance = async () => {
    if (!subjectId) return;
    const nextSeen = new Set(seen);
    if (question) nextSeen.add(question.id);
    setSeen(nextSeen);
    if (idx + 1 >= SESSION_LENGTH) {
      const { supabase } = await import('@/lib/supabase');
      await supabase
        .from('assessment_attempts')
        .update({
          status: 'completed',
          score: Math.round((correctCount / SESSION_LENGTH) * 100),
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId);
      setPhase('done');
      return;
    }
    setIdx((i) => i + 1);
    pickNext(subjectId, nextSeen);
    setPhase('question');
  };

  // ---------- SELECT ----------
  if (phase === 'select') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={onExit} className="btn-ghost text-sm mb-6 py-2">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-center mb-10 animate-fade-up">
          <span className="chip bg-amber-500/15 text-amber-300 border border-amber-500/20 mb-3">
            <PenTool size={13} /> Personalized practice
          </span>
          <h1 className="font-display text-3xl font-bold text-white">Targeted practice, just for you</h1>
          <p className="mt-2 text-slate-400 max-w-lg mx-auto">
            We focus on concepts where your mastery is below 60%, with easier questions for lower mastery
            and harder ones as you grow. Every answer comes with an explanation and learning feedback.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SUBJECTS.map((s, i) => {
            const sRows = masteryForSubject(mastery, s.id);
            const sWeak = weakConcepts(sRows, 60);
            return (
              <button
                key={s.id}
                onClick={() => { setSubjectId(s.id); setPhase('intro'); }}
                className="glass glass-hover p-6 text-left group animate-fade-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <PenTool size={24} className="text-white" />
                </div>
                <h3 className="font-display text-lg font-bold text-white">{s.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {sWeak.length > 0 ? `${sWeak.length} concepts below 60%` : 'All concepts strong \u2014 keep sharp!'}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- INTRO ----------
  if (phase === 'intro' && subjectId) {
    const subj = SUBJECT_MAP[subjectId];
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center animate-fade-up">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${subj.color} flex items-center justify-center mx-auto mb-6 shadow-2xl`}>
          <PenTool size={40} className="text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white">{subj.name} practice</h1>
        <p className="mt-3 text-slate-400 max-w-md mx-auto">
          {SESSION_LENGTH} personalised questions targeting your weakest concepts. Mix of MCQ,
          short-answer, and long-answer \u2014 with explanations and feedback after each one.
        </p>
        {focusConcepts.length > 0 && (
          <div className="glass p-5 mt-8 text-left">
            <p className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
              <Target size={14} className="text-rose-400" /> Focusing on {focusConcepts.length} concepts
            </p>
            <div className="flex flex-wrap gap-2">
              {focusConcepts.slice(0, 8).map((r) => {
                const c = getConcept(subjectId, r.concept_id);
                return (
                  <span key={r.id} className={`chip border text-xs ${Number(r.mastery) < 40 ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>
                    {c?.name} \u00b7 {Math.round(Number(r.mastery))}%
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <button onClick={start} disabled={loadingQ} className="btn-brand mt-8">
          {loadingQ ? 'Preparing\u2026' : 'Start practice'} <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  // ---------- QUESTION ----------
  if (phase === 'question' && question) {
    const progress = (idx / SESSION_LENGTH) * 100;
    const concept = getConcept(subjectId!, question.concept_id);
    const row = mastery.find((m) => m.concept_id === question.concept_id && m.subject === subjectId);
    const currentMastery = row ? Number(row.mastery) : 20;
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 animate-fade-up">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Question {idx + 1} of {SESSION_LENGTH}</span>
            <span>{SUBJECT_MAP[subjectId!]?.name}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        <GlassCard className="p-6 sm:p-8 animate-scale-in" hover={false}>
          <div className="flex items-center gap-2 mb-4">
            <span className="chip bg-white/[0.05] text-slate-300 border border-white/[0.08] capitalize">
              {question.type === 'mcq' ? 'Multiple choice' : question.type === 'short' ? 'Short answer' : 'Long answer'}
            </span>
            <span className={`chip capitalize border ${
              question.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              : question.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
            }`}>
              {question.difficulty}
            </span>
            <span className="text-xs text-slate-500 ml-auto">{concept?.name}</span>
          </div>

          <p className="text-lg text-white leading-relaxed font-medium">{question.prompt}</p>

          {question.type === 'mcq' ? (
            <div className="mt-6 space-y-2.5">
              {question.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelectedOption(opt)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                    selectedOption === opt
                      ? 'border-brand-500/60 bg-brand-500/10 text-white'
                      : 'border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-white/[0.16] hover:bg-white/[0.06]'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selectedOption === opt ? 'border-brand-400 bg-brand-500' : 'border-slate-600'
                  }`}>
                    {selectedOption === opt && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              className="input-field mt-5 min-h-[120px] resize-y leading-relaxed"
              placeholder={question.type === 'short' ? 'Type a short answer\u2026' : 'Explain your reasoning in detail\u2026'}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              onClick={() => setShowHint((s) => !s)}
              className="text-sm text-amber-300 hover:text-amber-200 flex items-center gap-1.5 transition-colors"
            >
              <Lightbulb size={16} /> {showHint ? 'Hide hint' : 'Show hint'}
            </button>
            <button
              onClick={submit}
              disabled={question.type === 'mcq' ? !selectedOption : !answer.trim()}
              className="btn-brand"
            >
              Submit <ChevronRight size={16} />
            </button>
          </div>

          {showHint && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-fade-in">
              <p className="text-sm text-amber-200 leading-relaxed">
                <span className="font-semibold">Hint:</span> {question.hints[0]}
              </p>
            </div>
          )}
        </GlassCard>

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
          <Sparkles size={12} className="text-accent-400" /> Current mastery: {Math.round(currentMastery)}%
        </div>
      </div>
    );
  }

  // ---------- FEEDBACK ----------
  if (phase === 'feedback' && feedback && question) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <GlassCard className="p-6 sm:p-8 animate-scale-in" hover={false}>
          <div className="flex items-center gap-3 mb-5">
            {feedback.correct ? (
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center animate-bounce-in">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center animate-bounce-in">
                <XCircle size={28} className="text-rose-400" />
              </div>
            )}
            <div>
              <h3 className="font-display text-xl font-bold text-white">
                {feedback.correct ? 'Nicely done!' : 'Good attempt \u2014 let\u2019s learn from this'}
              </h3>
              <p className="text-sm text-slate-400">{feedback.evaluation}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="glass p-3 text-center">
              <p className="text-xs text-slate-500">New mastery</p>
              <p className={`font-display text-xl font-bold ${masteryColor(feedback.newMastery)}`}>
                {Math.round(feedback.newMastery)}%
              </p>
              <p className={`text-xs ${masteryColor(feedback.newMastery)}`}>{masteryLabel(feedback.newMastery)}</p>
            </div>
            <div className="glass p-3 text-center">
              <p className="text-xs text-slate-500">Change</p>
              <p className={`font-display text-xl font-bold ${feedback.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {feedback.delta >= 0 ? '+' : ''}{Math.round(feedback.delta)}
              </p>
            </div>
            <div className="glass p-3 text-center">
              <p className="text-xs text-slate-500">Next level</p>
              <p className="font-display text-sm font-bold text-brand-300 capitalize">{feedback.newDifficulty}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-brand-500/8 border border-brand-500/20 mb-4">
            <p className="text-xs font-semibold text-brand-300 mb-1.5 flex items-center gap-1.5">
              <Brain size={14} /> Explanation
            </p>
            <p className="text-sm text-slate-200 leading-relaxed">{question.explanation}</p>
          </div>

          {feedback.gaps.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/8 border border-rose-500/20 mb-4">
              <p className="text-xs font-semibold text-rose-300 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Learning feedback
              </p>
              <ul className="space-y-1.5">
                {feedback.gaps.map((g, i) => (
                  <li key={i} className="text-sm text-slate-200 leading-relaxed flex items-start gap-2">
                    <span className="text-rose-400 mt-1">\u2022</span> {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={advance} className="btn-brand w-full">
            {idx + 1 >= SESSION_LENGTH ? 'See results' : 'Next question'} <ChevronRight size={16} />
          </button>
        </GlassCard>
      </div>
    );
  }

  // ---------- DONE ----------
  if (phase === 'done') {
    const score = Math.round((correctCount / SESSION_LENGTH) * 100);
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center animate-fade-up">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce-in">
          <TrendingUp size={40} className="text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white">Practice complete</h1>
        <p className="mt-2 text-slate-400">
          You answered {correctCount} of {SESSION_LENGTH} correctly.
        </p>
        <div className="flex justify-center my-8">
          <ProgressRing value={score} label="Score" size={140} />
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setPhase('select'); setSubjectId(undefined); }} className="btn-ghost">
            <RotateCcw size={16} /> Another subject
          </button>
          <button onClick={onExit} className="btn-brand">
            Back to dashboard <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
