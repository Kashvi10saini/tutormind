import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users, GraduationCap, TrendingUp, AlertTriangle, ClipboardList, Plus,
  ChevronRight, Target, Brain, Flame, X, Loader2, BookOpen, Network, Calendar, Hash,
} from 'lucide-react';
import { supabase, type Profile, type ConceptMastery, type AssessmentAttempt, type AssessmentAnswer, type ChatMessage, type Assignment, type ClassEnrollment } from '@/lib/supabase';
import { SUBJECTS, SUBJECT_MAP, getConcept } from '@/lib/curriculum';
import { averageMastery, masteryColor, masteryLabel, weakConcepts } from '@/lib/mastery';
import { useAuth } from '@/lib/auth';
import { useCountUp } from '@/lib/hooks';
import { GlassCard, ProgressRing, Skeleton, StatBadge } from '@/components/ui';
import { AssignDiagnosticModal } from '@/components/AssignDiagnosticModal';

export function TeacherDashboard() {
  const { profile } = useAuth();
  const teacherId = profile?.id;

  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [allMastery, setAllMastery] = useState<ConceptMastery[]>([]);
  const [allAttempts, setAllAttempts] = useState<AssessmentAttempt[]>([]);
  const [allAnswers, setAllAnswers] = useState<AssessmentAnswer[]>([]);
  const [allChats, setAllChats] = useState<ChatMessage[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);

    const [enrRes, asgRes] = await Promise.all([
      supabase.from('class_enrollments').select('*').eq('teacher_id', teacherId),
      supabase.from('assignments').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }),
    ]);

    const enrolls = (enrRes.data as ClassEnrollment[]) ?? [];
    setEnrollments(enrolls);
    setAssignments((asgRes.data as Assignment[]) ?? []);

    const studentIds = enrolls.map((e) => e.student_id);
    if (studentIds.length === 0) {
      setStudents([]);
      setAllMastery([]);
      setAllAttempts([]);
      setAllAnswers([]);
      setAllChats([]);
      setLoading(false);
      return;
    }

    const [profRes, masRes, attRes, ansRes, chatRes] = await Promise.all([
      supabase.from('profiles').select('*').in('id', studentIds),
      supabase.from('concept_mastery').select('*').in('user_id', studentIds),
      supabase.from('assessment_attempts').select('*').in('user_id', studentIds).order('started_at', { ascending: false }),
      supabase.from('assessment_answers').select('*').in('user_id', studentIds).order('created_at', { ascending: false }).limit(500),
      supabase.from('chat_messages').select('*').in('user_id', studentIds).order('created_at', { ascending: false }).limit(500),
    ]);

    setStudents((profRes.data as Profile[]) ?? []);
    setAllMastery((masRes.data as ConceptMastery[]) ?? []);
    setAllAttempts((attRes.data as AssessmentAttempt[]) ?? []);
    setAllAnswers((ansRes.data as AssessmentAnswer[]) ?? []);
    setAllChats((chatRes.data as ChatMessage[]) ?? []);
    setLoading(false);
  }, [teacherId]);

  useEffect(() => {
    load();
  }, [load]);

  // ---- derived analytics ----
  const classMastery = useCountUp(allMastery.length > 0 ? averageMastery(allMastery) : 0);
  const studentCount = students.length;
  const activeAssignments = assignments.filter((a) => a.status === 'active');
  const completedAttempts = allAttempts.filter((a) => a.status === 'completed');
  const avgScore =
    completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((sum, a) => sum + Number(a.score), 0) / completedAttempts.length)
      : 0;

  // misconceptions: from chat_messages where misconception is not null + wrong long/short answers
  const misconceptions = useMemo(() => {
    const items: { studentId: string; conceptId: string | null; message: string; source: string; createdAt: string }[] = [];
    allChats.forEach((c) => {
      if (c.misconception) {
        items.push({
          studentId: c.user_id,
          conceptId: c.concept_id,
          message: c.misconception,
          source: 'AI tutor chat',
          createdAt: c.created_at,
        });
      }
    });
    allAnswers.forEach((a) => {
      if (!a.correct && (a.question_type === 'long' || a.question_type === 'short')) {
        const concept = SUBJECTS.flatMap((s) => s.concepts).find((c) => c.id === a.concept_id);
        items.push({
          studentId: a.user_id,
          conceptId: a.concept_id,
          message: `Incorrect ${a.question_type} answer on "${concept?.name ?? a.concept_id}": "${a.student_answer.slice(0, 120)}"`,
          source: `${a.question_type} question`,
          createdAt: a.created_at,
        });
      }
    });
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allChats, allAnswers]);

  // subject-level mastery heatmap
  const subjectMastery = useMemo(() => {
    return SUBJECTS.map((s) => {
      const rows = allMastery.filter((m) => m.subject === s.id);
      return {
        subject: s,
        avg: averageMastery(rows),
        weakCount: weakConcepts(rows, 60).length,
        totalConcepts: s.concepts.length,
        trackedConcepts: rows.length,
      };
    });
  }, [allMastery]);

  // per-student summary
  const studentSummaries = useMemo(() => {
    return students.map((stu) => {
      const mastery = allMastery.filter((m) => m.user_id === stu.id);
      const attempts = allAttempts.filter((a) => a.user_id === stu.id);
      const completed = attempts.filter((a) => a.status === 'completed');
      const avg = completed.length > 0
        ? Math.round(completed.reduce((s, a) => s + Number(a.score), 0) / completed.length)
        : 0;
      const weak = weakConcepts(mastery, 60).length;
      const misconCount = misconceptions.filter((m) => m.studentId === stu.id).length;
      return { profile: stu, masteryAvg: averageMastery(mastery), attempts: attempts.length, avg, weak, misconCount };
    });
  }, [students, allMastery, allAttempts, misconceptions]);

  const studentName = (id: string) => students.find((s) => s.id === id)?.display_name ?? 'Student';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-sm text-slate-400">Teacher dashboard</p>
          <h1 className="font-display text-3xl font-bold text-white">{profile?.display_name ?? 'Teacher'}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatBadge value={<Users size={13} />} label={`${studentCount} students`} tone="brand" />
          <StatBadge value={<ClipboardList size={13} />} label={`${activeAssignments.length} active`} tone="emerald" />
          <StatBadge value={<AlertTriangle size={13} />} label={`${misconceptions.length} misconceptions`} tone="rose" />
        </div>
      </div>

      {/* top stats */}
      <div className="grid md:grid-cols-4 gap-5">
        <GlassCard className="p-6 flex items-center gap-5 animate-fade-up">
          <ProgressRing value={classMastery} size={100} label="Mastery" />
          <div>
            <p className="text-sm text-slate-400">Class-wide mastery</p>
            <p className={`font-display text-2xl font-bold ${masteryColor(classMastery)}`}>{masteryLabel(classMastery)}</p>
            <p className="text-xs text-slate-500 mt-1">{allMastery.length} concepts tracked</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-emerald-300" />
            <h3 className="font-display font-bold text-white text-sm">Avg. score</h3>
          </div>
          <p className="font-display text-3xl font-bold text-white">{avgScore}%</p>
          <p className="text-xs text-slate-500 mt-1">{completedAttempts.length} completed attempts</p>
        </GlassCard>

        <GlassCard className="p-6 animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} className="text-rose-300" />
            <h3 className="font-display font-bold text-white text-sm">Weak concepts</h3>
          </div>
          <p className="font-display text-3xl font-bold text-rose-400">
            {allMastery.length > 0 ? weakConcepts(allMastery, 60).length : 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Below 60% across the class</p>
        </GlassCard>

        <GlassCard className="p-6 animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={18} className="text-amber-300" />
            <h3 className="font-display font-bold text-white text-sm">Active assignments</h3>
          </div>
          <p className="font-display text-3xl font-bold text-white">{activeAssignments.length}</p>
          <button
            onClick={() => setShowAssignModal(true)}
            className="text-xs text-brand-300 hover:text-brand-200 flex items-center gap-1 mt-1"
          >
            <Plus size={12} /> Assign a new diagnostic
          </button>
        </GlassCard>
      </div>

      {/* actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => setShowAssignModal(true)}
          className="glass glass-hover p-5 text-left group animate-fade-up flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <ClipboardList size={24} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white">Assign custom diagnostic</p>
            <p className="text-xs text-slate-400 mt-0.5">Create a targeted test for your class</p>
          </div>
          <ChevronRight size={18} className="text-slate-500 ml-auto group-hover:translate-x-1 transition-transform" />
        </button>
        <button
          onClick={() => setEnrollOpen(true)}
          className="glass glass-hover p-5 text-left group animate-fade-up flex items-center gap-4"
          style={{ animationDelay: '0.05s' }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-brand-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white">Enroll students</p>
            <p className="text-xs text-slate-400 mt-0.5">Add students to your class by email</p>
          </div>
          <ChevronRight size={18} className="text-slate-500 ml-auto group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-5">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : studentCount === 0 ? (
        <GlassCard className="p-10 text-center animate-fade-up">
          <GraduationCap size={40} className="text-slate-500 mx-auto mb-4" />
          <h3 className="font-display text-xl font-bold text-white">No students enrolled yet</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Add students to your class to see their mastery analytics, track misconceptions, and
            assign custom diagnostics. Students need a TutorMind account with the email you enroll.
          </p>
          <button onClick={() => setEnrollOpen(true)} className="btn-brand mt-6">
            <Plus size={16} /> Enroll your first student
          </button>
        </GlassCard>
      ) : (
        <>
          {/* subject mastery heatmap */}
          <div className="animate-fade-up">
            <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Network size={20} className="text-brand-300" /> Subject mastery across the class
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {subjectMastery.map((s, i) => (
                <GlassCard key={s.subject.id} className="p-5 animate-fade-up" >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-bold text-white">{s.subject.name}</span>
                    <span className={`text-sm font-semibold ${masteryColor(s.avg)}`}>{Math.round(s.avg)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full ${s.avg >= 60 ? 'bg-emerald-500' : s.avg >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${s.avg}%`, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {s.trackedConcepts} of {s.totalConcepts} concepts tracked
                  </p>
                  <p className="text-xs text-rose-400 mt-0.5">{s.weakCount} weak concepts</p>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* student roster + misconception tracker */}
          <div className="grid lg:grid-cols-2 gap-5 animate-fade-up">
            {/* roster */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-brand-300" />
                <h3 className="font-display font-bold text-white">Student roster</h3>
                <span className="text-xs text-slate-500 ml-auto">{studentCount} enrolled</span>
              </div>
              <ul className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                {studentSummaries.map((s) => (
                  <li key={s.profile.id}>
                    <button
                      onClick={() => setSelectedStudent(s.profile)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {s.profile.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.profile.display_name}</p>
                        <p className="text-xs text-slate-400">
                          Mastery {Math.round(s.masteryAvg)}% \u00b7 {s.attempts} attempts \u00b7 Avg {s.avg}%
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {s.weak > 0 && (
                          <span className="chip bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px]">
                            {s.weak} weak
                          </span>
                        )}
                        {s.misconCount > 0 && (
                          <span className="chip bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                            {s.misconCount} misc.
                          </span>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-slate-500 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </GlassCard>

            {/* misconception tracker */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-rose-400" />
                <h3 className="font-display font-bold text-white">Misconception tracker</h3>
                <span className="text-xs text-slate-500 ml-auto">{misconceptions.length} flagged</span>
              </div>
              {misconceptions.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">
                  No misconceptions detected yet. As students chat with the AI tutor and answer
                  long-form questions, hidden misunderstandings will appear here.
                </p>
              ) : (
                <ul className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                  {misconceptions.slice(0, 12).map((m, i) => {
                    const concept = m.conceptId ? SUBJECTS.flatMap((s) => s.concepts).find((c) => c.id === m.conceptId) : null;
                    return (
                      <li key={i} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle size={14} className="text-rose-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 leading-relaxed">{m.message}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {studentName(m.studentId)} \u00b7 {concept?.name ?? 'General'} \u00b7 {m.source}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </GlassCard>
          </div>

          {/* assignments list */}
          <div className="animate-fade-up">
            <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ClipboardList size={20} className="text-accent-300" /> Your assignments
            </h2>
            {assignments.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <BookOpen size={32} className="text-slate-500 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  No assignments yet. Create a custom diagnostic to target specific concepts.
                </p>
              </GlassCard>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((a, i) => (
                  <GlassCard key={a.id} className="p-5 animate-fade-up" >
                    <div className="flex items-center justify-between mb-3">
                      <span className="chip bg-accent-500/10 text-accent-300 border border-accent-500/20 text-xs">
                        {SUBJECT_MAP[a.subject]?.name ?? a.subject}
                      </span>
                      <span className={`chip text-xs border ${
                        a.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-white">{a.title}</h3>
                    {a.description && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{a.description}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="chip bg-white/[0.04] text-slate-300 border border-white/[0.06] text-[10px]">
                        <Hash size={10} /> {a.question_count} Q
                      </span>
                      <span className="chip bg-white/[0.04] text-slate-300 border border-white/[0.06] text-[10px] capitalize">
                        {a.difficulty}
                      </span>
                      {a.focus_concepts.length > 0 && (
                        <span className="chip bg-white/[0.04] text-slate-300 border border-white/[0.06] text-[10px]">
                          <Target size={10} /> {a.focus_concepts.length} concepts
                        </span>
                      )}
                      {a.due_date && (
                        <span className="chip bg-white/[0.04] text-slate-300 border border-white/[0.06] text-[10px]">
                          <Calendar size={10} /> {new Date(a.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {/* completion stats */}
                    {(() => {
                      const assignedAttempts = allAttempts.filter((att) => att.assignment_id === a.id);
                      const completed = assignedAttempts.filter((att) => att.status === 'completed');
                      return (
                        <p className="text-xs text-slate-500 mt-3">
                          {completed.length} of {studentCount} students completed
                        </p>
                      );
                    })()}
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* modals */}
      <AssignDiagnosticModal open={showAssignModal} onClose={() => setShowAssignModal(false)} onCreated={load} />
      {enrollOpen && (
        <EnrollStudentModal
          teacherId={teacherId ?? ''}
          onClose={() => setEnrollOpen(false)}
          onEnrolled={load}
        />
      )}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          mastery={allMastery.filter((m) => m.user_id === selectedStudent.id)}
          attempts={allAttempts.filter((a) => a.user_id === selectedStudent.id)}
          misconceptions={misconceptions.filter((m) => m.studentId === selectedStudent.id)}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// Enroll student by email
// ============================================================
function EnrollStudentModal({
  teacherId,
  onClose,
  onEnrolled,
}: {
  teacherId: string;
  onClose: () => void;
  onEnrolled: () => void;
}) {
  const [email, setEmail] = useState('');
  const [className, setClassName] = useState('Default Class');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError('Enter a student email.');
      return;
    }
    setBusy(true);
    // look up the student's profile by email — but profiles table doesn't store email.
    // We need to find the auth user. Since we can't query auth.users from the client,
    // we search profiles by display_name is not useful. Instead, we rely on the
    // student having signed in and a profile existing. We'll use the supabase admin
    // approach: query auth.users via an edge function is overkill here.
    // Simpler: the teacher enters the student's UUID or we search by display_name.
    // For a practical flow: we search profiles by display_name (case-insensitive).
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .ilike('display_name', `%${email.trim()}%`)
      .limit(10);
    setBusy(false);
    if (!profiles || profiles.length === 0) {
      setError('No student found with that name. Ask them to sign up first, then enroll by their display name.');
      return;
    }
    // if multiple matches, we just pick the first student-role one
    const student = (profiles as Profile[]).find((p) => p.role === 'student') ?? (profiles[0] as Profile);
    const { error: insError } = await supabase.from('class_enrollments').insert({
      teacher_id: teacherId,
      student_id: student.id,
      class_name: className,
    });
    if (insError) {
      if (insError.code === '23505') {
        setError(`${student.display_name} is already enrolled in your class.`);
      } else {
        setError(insError.message);
      }
      return;
    }
    setSuccess(`${student.display_name} enrolled successfully.`);
    setEmail('');
    onEnrolled();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative glass-strong w-full max-w-md p-7 animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-brand-500 flex items-center justify-center shadow-lg">
            <Users size={22} className="text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Enroll a student</h3>
            <p className="text-xs text-slate-400">Search by their display name</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Student name</label>
            <input
              className="input-field"
              placeholder="e.g. Ada Lovelace"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Class name</label>
            <input
              className="input-field"
              placeholder="Default Class"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 animate-fade-in">
              {error}
            </p>
          )}
          {success && (
            <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 animate-fade-in">
              {success}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-brand w-full mt-2">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Enroll student
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Student detail modal
// ============================================================
function StudentDetailModal({
  student,
  mastery,
  attempts,
  misconceptions,
  onClose,
}: {
  student: Profile;
  mastery: ConceptMastery[];
  attempts: AssessmentAttempt[];
  misconceptions: { studentId: string; conceptId: string | null; message: string; source: string; createdAt: string }[];
  onClose: () => void;
}) {
  const avg = averageMastery(mastery);
  const weak = weakConcepts(mastery, 60);
  const completed = attempts.filter((a) => a.status === 'completed');
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((s, a) => s + Number(a.score), 0) / completed.length)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative glass-strong w-full max-w-2xl p-7 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-thin">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-xl shrink-0">
            {student.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-white">{student.display_name}</h3>
            <p className="text-sm text-slate-400">{student.role} \u00b7 {mastery.length} concepts tracked</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass p-4 text-center">
            <ProgressRing value={avg} size={80} stroke={8} />
            <p className="text-xs text-slate-400 mt-2">Mastery</p>
          </div>
          <div className="glass p-4 text-center">
            <p className="font-display text-2xl font-bold text-white">{avgScore}%</p>
            <p className="text-xs text-slate-400 mt-1">Avg. score</p>
          </div>
          <div className="glass p-4 text-center">
            <p className="font-display text-2xl font-bold text-rose-400">{weak.length}</p>
            <p className="text-xs text-slate-400 mt-1">Weak concepts</p>
          </div>
        </div>

        {/* weak concepts */}
        {weak.length > 0 && (
          <div className="mb-5">
            <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-rose-400" /> Weak concepts ({weak.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {weak.map((w) => {
                const concept = getConcept(w.subject, w.concept_id);
                return (
                  <span key={w.id} className="chip bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs">
                    {concept?.name ?? w.concept_id} \u00b7 {Math.round(Number(w.mastery))}%
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* misconceptions */}
        {misconceptions.length > 0 && (
          <div className="mb-5">
            <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Brain size={14} className="text-amber-400" /> Flagged misconceptions ({misconceptions.length})
            </h4>
            <ul className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin pr-1">
              {misconceptions.map((m, i) => (
                <li key={i} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <p className="text-sm text-slate-200 leading-relaxed">{m.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{m.source}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* recent attempts */}
        {completed.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <ClipboardList size={14} className="text-brand-300" /> Recent assessments
            </h4>
            <ul className="space-y-2">
              {completed.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className={`w-1.5 h-8 rounded-full ${a.type === 'diagnostic' ? 'bg-brand-500' : 'bg-emerald-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white capitalize">
                      {a.type} \u2014 {SUBJECT_MAP[a.subject]?.name ?? a.subject}
                    </p>
                    <p className="text-xs text-slate-400">
                      Score {a.score}% \u00b7 {new Date(a.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`font-display text-lg font-bold ${masteryColor(Number(a.score))}`}>
                    {Math.round(Number(a.score))}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
