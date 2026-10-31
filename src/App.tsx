import { useEffect, useState } from 'react';
import { Brain, LayoutDashboard, Target, Network, MessageSquare, PenTool, LogOut, GraduationCap, Menu, ClipboardList } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LandingPage } from '@/components/LandingPage';
import { StudentDashboard, type DashboardView } from '@/components/StudentDashboard';
import { DiagnosticAssessment } from '@/components/DiagnosticAssessment';
import { ConceptGraph } from '@/components/ConceptGraph';
import { AITutor } from '@/components/AITutor';
import { PracticeSession } from '@/components/PracticeSession';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { LoadingScreen } from '@/components/ui';

function AppShell() {
  const { session, profile, loading, signOut } = useAuth();
  const [view, setView] = useState<DashboardView>('dashboard');
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  // If the user signs out, reset to dashboard view
  useEffect(() => {
    if (!session) setView('dashboard');
  }, [session]);

  if (loading) return <LoadingScreen label="Loading TutorMind\u2026" />;
  if (!session) return <LandingPage />;

  const nav = (v: DashboardView, subj?: string) => {
    setView(v);
    setSubjectId(subj);
    setMenuOpen(false);
  };

  const isTeacher = profile?.role === 'teacher';

  const navItems: { id: DashboardView; label: string; icon: typeof LayoutDashboard }[] = isTeacher
    ? [
        { id: 'dashboard', label: 'Teacher Dashboard', icon: ClipboardList },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'diagnostic', label: 'Diagnostic', icon: Target },
        { id: 'graph', label: 'Concept Graph', icon: Network },
        { id: 'tutor', label: 'AI Tutor', icon: MessageSquare },
        { id: 'practice', label: 'Practice', icon: PenTool },
      ];

  return (
    <div className="min-h-screen flex">
      {/* sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full glass-strong rounded-none lg:rounded-r-3xl flex flex-col p-4">
          <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Brain size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg">TutorMind</span>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => nav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  view === item.id
                    ? 'bg-brand-gradient text-white shadow-lg shadow-brand-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          {isTeacher && (
            <div className="mx-2 mb-3 p-3 rounded-xl bg-accent-500/10 border border-accent-500/20">
              <p className="text-xs text-accent-300 flex items-center gap-1.5">
                <GraduationCap size={14} /> Teacher account
              </p>
            </div>
          )}

          <div className="px-2 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
                {profile?.display_name?.charAt(0).toUpperCase() ?? 'L'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{profile?.display_name ?? 'Learner'}</p>
                <p className="text-xs text-slate-500 capitalize">{profile?.role ?? 'student'}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-ink-900/60 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* main */}
      <div className="flex-1 min-w-0">
        {/* mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 px-4 py-3 bg-ink-900/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setMenuOpen(true)} className="text-slate-300 hover:text-white">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center">
                <Brain size={15} className="text-white" />
              </div>
              <span className="font-display font-bold text-white">TutorMind</span>
            </div>
          </div>
        </div>

        <main className="animate-fade-in">
          {view === 'dashboard' && (isTeacher ? <TeacherDashboard /> : <StudentDashboard onNavigate={nav} />)}
          {view === 'diagnostic' && <DiagnosticAssessment subjectId={subjectId} onExit={() => nav('dashboard')} />}
          {view === 'graph' && <ConceptGraph onExit={() => nav('dashboard')} />}
          {view === 'tutor' && <AITutor onExit={() => nav('dashboard')} />}
          {view === 'practice' && <PracticeSession initialSubject={subjectId} onExit={() => nav('dashboard')} />}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
