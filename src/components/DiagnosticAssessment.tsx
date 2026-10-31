import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Brain, CheckCircle2, XCircle, Lightbulb, ChevronRight,
  Loader2, Target, TrendingUp, AlertTriangle, RotateCcw, Trophy,
} from 'lucide-react';
import { SUBJECTS, SUBJECT_MAP, getConcept, questionsForSubject, type Question } from '@/lib/curriculum';
import { useAuth } from '@/lib/auth';
import { useLearningData } from '@/lib/useLearningData';
import { evaluateAnswer, pickAdaptiveQuestion, masteryLabel, masteryColor } from '@/lib/mastery';
import { GlassCard, Skeleton } from '@/components/ui';

type Phase = 'select' | 'intro' | 'question' | 'feedback' | 'done';

export function DiagnosticAssessment({
  subjectId,
  onExit,
}: {
  subjectId?: string;
  onExit: () => void;
}) {
  const { profile } = useAuth();
  const userId = profile?.id;
  const { mastery, ensureSubjectMastery, recordAnswer, scheduleRevision, reload } = useLearningData(userId);

  const [phase, setPhase] = useState<Phase>('select');
  const [subject, setSubject] = useState<string | undefined>(subjectId);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ReturnType<typeof evaluateAnswer> | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [questionIdx, setQuestionIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptId, setAttemptId] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);
  const [showHint, setShowHint] = useState(false);
  const [masteryMap, setMasteryMap] = useState<Record<string, number>>({});

  const TOTAL_QUESTIONS = 8;

  // when subject chosen, go to intro
  useEffect(() => {
    if (subject && phase === 'select') setPhase('intro');
  }, [subject, phase]);

  const masteryByConcept = useMemo(() => {
    const map: Record<string, number> = {};
    mastery.forEach((m) => {
      if (!subject || m.subject === subject) map[m.concept_id] = Number(m.mastery);
    });
    return map;
  }, [mastery, subject]);

  const start = async () => {
    if (!subject) return;
    await ensureSubjectMastery(subject);
    await reload();
    // fresh attempt row
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase
      .from('assessment_attempts')
      .insert({ user_id: userId, subject, type: 'diagnostic', status: 'in_progress', total_questions: TOTAL_QUESTIONS })
      .select()
      .maybeSingle();
    const newId = data?.id ?? crypto.randomUUID();
    setAttemptId(newId);
    setQuestionIdx(0);
    setCorrectCount(0);
    setSeen(new Set());
    setMasteryMap(masteryByConcept);
    nextQuestion(subject, new Set(), masteryByConcept);
    setPhase('question');
    setStartTime(Date.now());
  };

  const nextQuestion = (subj: string, seenIds: Set<string>, mMap: Record<string, number>) => {
    const pool = questionsForSubject(subj);
    const conceptIds = (SUBJECT_MAP[subj]?.concepts.map((c) => c.id)) ?? [];
    const q = pickAdaptiveQuestion(subj, conceptIds, mMap, seenIds, pool);
    setQuestion(q);
    setAnswer('');
    setSelectedOption(null);
    setShowHint(false);
    setStartTime(Date.now());
  };

  const submit = async () => {
    if (!question || !subject) return;
    const studentAnswer = question.type === 'mcq' ? (selectedOption ?? '') : answer;
    if (!studentAnswer.trim()) return;
    const row = mastery.find(
      (m) => m.concept_id === question.concept_id && m.subject === subject,
    );
    const currentState = {
      mastery: row ? Number(row.mastery) : 20,
      difficulty: row?.difficulty ?? 'easy',
      attempts: row?.attempts ?? 0,
      correct_count: row?.correct_count ?? 0,
    };
    const result = evaluateAnswer(question, studentAnswer, currentState, subject);
    setFeedback(result);

    await recordAnswer({
      conceptId: question.concept_id,
      subjectId: subject,
      correct: result.correct,
      newMastery: result.newMastery,
      newDifficulty: result.newDifficulty,
      attemptId,
      questionType: question.type,
      difficulty: question.difficulty,
      studentAnswer,
      timeSpentMs: Date.now() - startTime,
    });

    // schedule a revision for weak concepts
    if (result.newMastery < 60) {
      const concept = getConcept(subject, question.concept_id);
      if (concept) await scheduleRevision(subject, concept.id, concept.name, result.newMastery < 35 ? 1 : 2);
    }

    setCorrectCount((c) => c + (result.correct ? 1 : 0));
    const newMap = { ...masteryMap, [question.concept_id]: result.newMastery };
    setMasteryMap(newMap);
    setPhase('feedback');
  };

  const advance = async () => {
    if (!subject) return;
    const nextSeen = new Set(seen);
    if (question) nextSeen.add(question.id);
    setSeen(nextSeen);
    if (questionIdx + 1 >= TOTAL_QUESTIONS) {
      // finish attempt
      const { supabase } = await import('@/lib/supabase');
      await supabase
        .from('assessment_attempts')
        .update({
          status: 'completed',
          score: Math.round((correctCount / TOTAL_QUESTIONS) * 100),
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId);
      setPhase('done');
      return;
    }
    setQuestionIdx((i) => i + 1);
    nextQuestion(subject, nextSeen, masteryMap);
    setPhase('question');
  };

  // ---------- SUBJECT SELECT ----------
  if (phase === 'select') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={onExit} className="btn-ghost text-sm mb-6 py-2">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-center mb-10 animate-fade-up">
          <span className="chip bg-brand-500/15 text-brand-300 border border-brand-500/20 mb-3">
            <Target size={13} /> Diagnostic assessment
          </span>
          <h1 className="font-display text-3xl font-bold text-white">Choose a subject to diagnose</h1>
          <p className="mt-2 text-slate-400 max-w-lg mx-auto">
            An adaptive test that maps your mastery across the whole syllabus \u2014 one question at a time.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SUBJECTS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSubject(s.id)}
              className="glass glass-hover p-6 text-left group animate-fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <Target size={24} className="text-white" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">{s.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{s.concepts.length} concepts \u00b7 {questionsForSubject(s.id).length} questions</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------- INTRO ----------
  if (phase === 'intro' && subject) {
    const subj = SUBJECT_MAP[subject];
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center animate-fade-up">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${subj.color} flex items-center justify-center mx-auto mb-6 shadow-2xl`}>
          <Brain size={40} className="text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white">{subj.name} diagnostic</h1>
        <p className="mt-3 text-slate-400 max-w-md mx-auto">
          {TOTAL_QUESTIONS} adaptive questions covering {subj.concepts.length} concepts. The test gets
          harder when you\u2019re right and easier when you\u2019re not. Take your time \u2014 there\u2019s no clock.
        </p>
        <div className="glass p-5 mt-8 text-left space-y-3">
          {[
            'Questions cover MCQ, short-answer, and long-answer types.',
            'Your mastery score updates after every answer.',
            'Hints are available \u2014 the tutor never just gives the answer.',
            'Expect a summary of strengths, gaps, and revision reminders at the end.',
          ].map((t) => (
            <div key={t} className="flex items-start gap-2.5 text-sm text-slate-300">
              <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              {t}
            </div>
          ))}
        </div>
        <button onClick={start} className="btn-brand mt-8">
          Begin diagnostic <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  // ---------- QUESTION ----------
  if (phase === 'question' && question) {
    const progress = ((questionIdx) / TOTAL_QUESTIONS) * 100;
    const concept = getConcept(subject!, question.concept_id);
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* progress */}
        <div className="mb-6 animate-fade-up">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Question {questionIdx + 1} of {TOTAL_QUESTIONS}</span>
            <span>{SUBJECT_MAP[subject!]?.name}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
            <div className="h-full bg-brand-gradient rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease' }} />
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
              Submit answer <ChevronRight size={16} />
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
                {feedback.correct ? 'Correct!' : 'Not quite'}
              </h3>
              <p className="text-sm text-slate-400">{feedback.evaluation}</p>
            </div>
          </div>

          {/* mastery evaluation */}
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

          {/* explanation */}
          <div className="p-4 rounded-xl bg-brand-500/8 border border-brand-500/20 mb-4">
            <p className="text-xs font-semibold text-brand-300 mb-1.5 flex items-center gap-1.5">
              <Brain size={14} /> Explanation
            </p>
            <p className="text-sm text-slate-200 leading-relaxed">{question.explanation}</p>
          </div>

          {/* learning gaps / misconceptions */}
          {feedback.gaps.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/8 border border-rose-500/20 mb-4">
              <p className="text-xs font-semibold text-rose-300 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Learning gaps detected
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
            {questionIdx + 1 >= TOTAL_QUESTIONS ? 'See results' : 'Next question'} <ChevronRight size={16} />
          </button>
        </GlassCard>
      </div>
    );
  }

  // ---------- DONE ----------
  if (phase === 'done') {
    const score = Math.round((correctCount / TOTAL_QUESTIONS) * 100);
    const conceptCount = Object.keys(masteryMap).length;
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center animate-fade-up">
        <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-500/40 animate-bounce-in">
          <Trophy size={40} className="text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white">Diagnostic complete</h1>
        <p className="mt-2 text-slate-400">
          You answered {correctCount} of {TOTAL_QUESTIONS} correctly across {conceptCount} concepts.
        </p>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <GlassCard className="p-5">
            <p className="font-display text-3xl font-bold text-gradient">{score}%</p>
            <p className="text-xs text-slate-400 mt-1">Score</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="font-display text-3xl font-bold text-emerald-400">{correctCount}</p>
            <p className="text-xs text-slate-400 mt-1">Correct</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="font-display text-3xl font-bold text-rose-400">{TOTAL_QUESTIONS - correctCount}</p>
            <p className="text-xs text-slate-400 mt-1">Gaps</p>
          </GlassCard>
        </div>

        <div className="flex gap-3 mt-8 justify-center">
          <button onClick={() => { setPhase('select'); setSubject(undefined); }} className="btn-ghost">
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
