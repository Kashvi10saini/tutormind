import { useEffect, useMemo, useState } from 'react';
import {
  Flame, Trophy, Target, AlertTriangle, CalendarClock, ChevronRight,
  Brain, Sparkles, Network, MessageSquare, PenTool, TrendingUp, Zap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLearningData, masteryForSubject } from '@/lib/useLearningData';
import { SUBJECTS, SUBJECT_MAP, getConcept } from '@/lib/curriculum';
import { averageMastery, masteryColor, masteryLabel, weakConcepts, masteredConcepts } from '@/lib/mastery';
import { useCountUp } from '@/lib/hooks';
import { GlassCard, ProgressRing, Skeleton, StatBadge } from '@/components/ui';

export type DashboardView = 'dashboard' | 'diagnostic' | 'graph' | 'tutor' | 'practice';

export function StudentDashboard({
  onNavigate,
}: {
  onNavigate: (view: DashboardView, subjectId?: string) => void;
}) {
  const { profile } = useAuth();
  const userId = profile?.id;
  const { mastery, revisions, attempts, loading, ensureSubjectMastery } = useLearningData(userId);

  const overall = useCountUp(averageMastery(mastery));
  const weak = useMemo(() => weakConcepts(mastery, 60), [mastery]);
  const mastered = useMemo(() => masteredConcepts(mastery, 80), [mastery]);
  const upcomingRevisions = revisions.filter((r) => r.status === 'upcoming').slice(0, 5);

  const streak = profile?.streak ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-sm text-slate-400">Welcome back,</p>
          <h1 className="font-display text-3xl font-bold text-white">{profile?.display_name ?? 'Learner'}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatBadge value={<Flame size={13} />} label={`${streak} day streak`} tone="amber" />
          <StatBadge value={<Trophy size={13} />} label={`${mastered.length} mastered`} tone="emerald" />
          <StatBadge value={<Target size={13} />} label={`${weak.length} to improve`} tone="rose" />
        </div>
      </div>

      {/* top stats */}
      <div className="grid md:grid-cols-3 gap-5">
        <GlassCard className="p-6 flex items-center gap-6 animate-fade-up">
          <ProgressRing value={overall} label="Mastery" />
          <div>
            <p className="text-sm text-slate-400">Overall mastery score</p>
            <p className={`font-display text-2xl font-bold ${masteryColor(overall)}`}>{masteryLabel(overall)}</p>
            <p className="text-xs text-slate-500 mt-1">Across {mastery.length || 0} concepts tracked</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 animate-fade-up" hover={false}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock size={18} className="text-accent-300" />
              <h3 className="font-display font-bold text-white">Upcoming revision</h3>
            </div>
            <span className="text-xs text-slate-500">{upcomingRevisions.length} sessions</span>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : upcomingRevisions.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No revision scheduled. Take a diagnostic to get started.</p>
          ) : (
            <ul className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin pr-1">
              {upcomingRevisions.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-1.5 h-8 rounded-full bg-accent-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.concept_name}</p>
                    <p className="text-xs text-slate-400">{formatDate(r.due_date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-6 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-brand-300" />
            <h3 className="font-display font-bold text-white">Recent activity</h3>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : attempts.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No assessments yet.</p>
          ) : (
            <ul className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin pr-1">
              {attempts.slice(0, 4).map((a) => (
                <li key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className={`w-1.5 h-8 rounded-full ${a.type === 'diagnostic' ? 'bg-brand-500' : 'bg-emerald-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white capitalize">
                      {a.type} \u2014 {SUBJECT_MAP[a.subject]?.name ?? a.subject}
                    </p>
                    <p className="text-xs text-slate-400">
                      {a.status === 'completed' ? `Score ${a.score}%` : 'In progress'} \u00b7 {formatDate(a.started_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      {/* quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Target, label: 'Take a diagnostic', desc: 'Adaptive test', view: 'diagnostic' as const, color: 'from-brand-500 to-accent-500' },
          { icon: Network, label: 'Concept graph', desc: 'See your map', view: 'graph' as const, color: 'from-emerald-500 to-brand-500' },
          { icon: MessageSquare, label: 'Ask AI tutor', desc: 'Get unstuck', view: 'tutor' as const, color: 'from-accent-500 to-brand-500' },
          { icon: PenTool, label: 'Practice session', desc: 'Personalised', view: 'practice' as const, color: 'from-amber-500 to-rose-500' },
        ].map((a, i) => (
          <button
            key={a.label}
            onClick={() => onNavigate(a.view)}
            className="glass glass-hover p-5 text-left group animate-fade-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
              <a.icon size={22} className="text-white" />
            </div>
            <p className="font-display font-bold text-white">{a.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
          </button>
        ))}
      </div>

      {/* concept mastery grid by subject */}
      <div className="animate-fade-up">
        <h2 className="font-display text-xl font-bold text-white mb-4">Concept mastery by subject</h2>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBJECTS.map((s, i) => {
              const rows = masteryForSubject(mastery, s.id);
              const avg = averageMastery(rows);
              return (
                <button
                  key={s.id}
                  onClick={async () => {
                    await ensureSubjectMastery(s.id);
                    onNavigate('diagnostic', s.id);
                  }}
                  className="glass glass-hover p-5 text-left animate-fade-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-bold text-white">{s.name}</span>
                    <span className={`text-sm font-semibold ${masteryColor(avg)}`}>{Math.round(avg)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full ${avg >= 60 ? 'bg-emerald-500' : avg >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${avg}%`, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{rows.length} of {s.concepts.length} concepts tracked</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* weak + mastered concepts */}
      <div className="grid lg:grid-cols-2 gap-5 animate-fade-up">
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-rose-400" />
            <h3 className="font-display font-bold text-white">Weak concepts</h3>
            <span className="text-xs text-slate-500 ml-auto">{weak.length} below 60%</span>
          </div>
          {weak.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No weak concepts \u2014 great work!</p>
          ) : (
            <ul className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
              {weak.slice(0, 8).map((w) => {
                const concept = getConcept(w.subject, w.concept_id);
                return (
                  <li key={w.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/15">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-300 font-bold text-sm">
                      {Math.round(Number(w.mastery))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{concept?.name ?? w.concept_id}</p>
                      <p className="text-xs text-slate-400">{SUBJECT_MAP[w.subject]?.name}</p>
                    </div>
                    <button
                      onClick={() => onNavigate('practice', w.subject)}
                      className="text-xs text-rose-300 hover:text-rose-200 flex items-center gap-1"
                    >
                      Practice <ChevronRight size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-emerald-400" />
            <h3 className="font-display font-bold text-white">Mastered concepts</h3>
            <span className="text-xs text-slate-500 ml-auto">{mastered.length} above 80%</span>
          </div>
          {mastered.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">None yet \u2014 keep practising!</p>
          ) : (
            <ul className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
              {mastered.slice(0, 8).map((w) => {
                const concept = getConcept(w.subject, w.concept_id);
                return (
                  <li key={w.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-300 font-bold text-sm">
                      {Math.round(Number(w.mastery))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{concept?.name ?? w.concept_id}</p>
                      <p className="text-xs text-slate-400">{SUBJECT_MAP[w.subject]?.name}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function formatDate(d: string): string {
  const date = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
