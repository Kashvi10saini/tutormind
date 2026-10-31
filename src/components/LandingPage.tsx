import { useState } from 'react';
import {
  Brain, Atom, FlaskConical, Sigma, Dna, GraduationCap, Users, Sparkles,
  LineChart, Target, CalendarClock, Network, MessageSquare, ChevronRight,
  ShieldCheck, Zap, BookOpen, TrendingUp,
} from 'lucide-react';
import { SUBJECTS } from '@/lib/curriculum';
import { AuthModal } from '@/components/AuthModal';

const ICONS: Record<string, typeof Atom> = {
  Atom, FlaskConical, Sigma, Dna,
};

function Nav({ onStart }: { onStart: (mode: 'student' | 'teacher') => void }) {
  return (
    <header className="fixed top-0 inset-x-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-3">
        <div className="glass-strong px-4 sm:px-5 py-3 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
              <Brain size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg tracking-tight">TutorMind</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#subjects" className="hover:text-white transition-colors">Subjects</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
          </nav>
          <button onClick={() => onStart('student')} className="btn-brand text-sm py-2.5">
            Start learning <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onStart }: { onStart: (mode: 'student' | 'teacher') => void }) {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-hero-radial pointer-events-none" />
      {/* floating orbs */}
      <div className="absolute top-24 left-10 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute top-40 right-10 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-up">
          <span className="chip bg-brand-500/15 text-brand-300 border border-brand-500/20 mb-5">
            <Sparkles size={13} /> AI-powered adaptive learning
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
            Your personal
            <br />
            <span className="text-gradient">AI tutor</span> that
            <br />
            thinks with you.
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-md leading-relaxed">
            TutorMind learns how you learn. Adaptive diagnostics map your mastery,
            a friendly AI tutor explains concepts in plain language, and a misconception
            detective catches the misunderstandings you didn\u2019t know you had.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button onClick={() => onStart('student')} className="btn-brand">
              <GraduationCap size={18} /> Start learning
            </button>
            <button onClick={() => onStart('teacher')} className="btn-ghost">
              <Users size={18} /> Teacher login
            </button>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-400" /> Aligned to syllabus</span>
            <span className="flex items-center gap-1.5"><Zap size={15} className="text-amber-400" /> Real-time adaptivity</span>
          </div>
        </div>

        {/* AI tutor illustration */}
        <div className="relative animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <div className="relative aspect-square max-w-lg mx-auto">
      <div className="absolute inset-0 glass-strong rounded-[2.5rem] overflow-hidden">
        {/* concentric pulse rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border border-brand-400/20 animate-pulse-ring"
              style={{ width: 120 + i * 80, height: 120 + i * 80, animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </div>
        {/* central brain node */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-32 h-32 rounded-full bg-brand-gradient flex items-center justify-center shadow-2xl shadow-brand-500/40 animate-float-slow">
            <Brain size={56} className="text-white" />
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-400 border-4 border-ink-900" />
          </div>
        </div>
        {/* orbiting concept chips */}
        {[
          { icon: Atom, label: 'Physics', x: '8%', y: '18%', delay: '0s' },
          { icon: FlaskConical, label: 'Chemistry', x: '70%', y: '12%', delay: '0.6s' },
          { icon: Sigma, label: 'Maths', x: '12%', y: '68%', delay: '1.1s' },
          { icon: Dna, label: 'Biology', x: '74%', y: '72%', delay: '1.6s' },
        ].map((o) => (
          <div
            key={o.label}
            className="absolute glass px-3 py-2 flex items-center gap-2 animate-float-slow"
            style={{ left: o.x, top: o.y, animationDelay: o.delay }}
          >
            <o.icon size={16} className="text-brand-300" />
            <span className="text-xs font-medium text-slate-200">{o.label}</span>
          </div>
        ))}
        {/* connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
          <g stroke="rgba(168,85,247,0.25)" strokeWidth="1" fill="none" strokeDasharray="4 4" className="animate-dash">
            <line x1="200" y1="200" x2="60" y2="90" />
            <line x1="200" y1="200" x2="330" y2="70" />
            <line x1="200" y1="200" x2="70" y2="290" />
            <line x1="200" y1="200" x2="320" y2="305" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function SubjectCards({ onStart }: { onStart: (mode: 'student' | 'teacher') => void }) {
  return (
    <section id="subjects" className="relative py-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-12 animate-fade-up">
        <span className="chip bg-accent-500/15 text-accent-300 border border-accent-500/20 mb-3">
          <BookOpen size={13} /> Pick a subject
        </span>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
          Master every subject, one concept at a time
        </h2>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          Each subject is broken into interconnected concepts. Adaptive diagnostics figure out
          where you are, then guide you to where you want to be.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SUBJECTS.map((s, i) => {
          const Icon = ICONS[s.icon] ?? Atom;
          return (
            <button
              key={s.id}
              onClick={() => onStart('student')}
              className="glass glass-hover p-6 text-left group animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">{s.name}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.blurb}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>{s.concepts.length} concepts</span>
                <span className="text-brand-300 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Explore <ChevronRight size={14} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: Target, color: 'from-brand-500 to-accent-500', title: 'Adaptive diagnostics',
      desc: 'Tests that change difficulty as you answer, mapping your mastery across every concept in the syllabus.',
    },
    {
      icon: Network, color: 'from-emerald-500 to-brand-500', title: 'Concept graph',
      desc: 'See how concepts depend on each other. Green means mastered, red means a gap to close.',
    },
    {
      icon: MessageSquare, color: 'from-accent-500 to-brand-500', title: 'Conversational AI tutor',
      desc: 'A friendly tutor that explains concepts naturally, gives hints instead of answers, and asks you questions back.',
    },
    {
      icon: ShieldCheck, color: 'from-amber-500 to-rose-500', title: 'Misconception detective',
      desc: 'Reads your reasoning, not just your final answer \u2014 and flags hidden misunderstandings before your viva.',
    },
    {
      icon: LineChart, color: 'from-brand-500 to-emerald-500', title: 'Performance analytics',
      desc: 'Track mastery, streaks, and growth over time with clear, motivating visuals.',
    },
    {
      icon: CalendarClock, color: 'from-accent-500 to-brand-500', title: 'Revision reminders',
      desc: 'Spaced-repetition sessions scheduled automatically for the concepts you\u2019re most likely to forget.',
    },
  ];
  return (
    <section id="features" className="relative py-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-12 animate-fade-up">
        <span className="chip bg-brand-500/15 text-brand-300 border border-brand-500/20 mb-3">
          <Sparkles size={13} /> Everything you need
        </span>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
          A complete adaptive learning engine
        </h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((f, i) => (
          <div
            key={f.title}
            className="glass glass-hover p-6 animate-fade-up"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
              <f.icon size={22} className="text-white" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProgressOverview() {
  const bars = [
    { label: 'Physics', value: 78, color: 'from-brand-500 to-accent-500' },
    { label: 'Chemistry', value: 54, color: 'from-emerald-500 to-brand-500' },
    { label: 'Mathematics', value: 63, color: 'from-accent-500 to-brand-500' },
    { label: 'Biology', value: 41, color: 'from-teal-500 to-accent-500' },
  ];
  return (
    <section className="relative py-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass p-7 lg:col-span-2 animate-fade-up">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-brand-300" />
            <h3 className="font-display text-xl font-bold text-white">Learning progress overview</h3>
          </div>
          <div className="space-y-5">
            {bars.map((b, i) => (
              <div key={b.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300">{b.label}</span>
                  <span className="text-slate-400 font-medium">{b.value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${b.color} animate-fade-up`}
                    style={{ width: `${b.value}%`, animationDelay: `${i * 0.1}s`, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-7 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-5">
            <CalendarClock size={18} className="text-accent-300" />
            <h3 className="font-display text-xl font-bold text-white">Upcoming revision</h3>
          </div>
          <ul className="space-y-3">
            {[
              { name: 'Newton\u2019s Laws', when: 'Tomorrow, 10:00', tone: 'amber' },
              { name: 'Chemical Bonding', when: 'Wed, 14:30', tone: 'brand' },
              { name: 'Differentiation', when: 'Fri, 09:00', tone: 'emerald' },
            ].map((r) => (
              <li key={r.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className={`w-2 h-10 rounded-full bg-${r.tone}-500`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.when}</p>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PerformanceAnalytics() {
  // sparkline-ish bar chart
  const data = [42, 48, 51, 47, 55, 62, 58, 67, 71, 69, 78, 84];
  const max = Math.max(...data);
  return (
    <section className="relative py-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="glass p-7 animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LineChart size={18} className="text-brand-300" />
            <h3 className="font-display text-xl font-bold text-white">Recent performance analytics</h3>
          </div>
          <span className="chip bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <TrendingUp size={12} /> +42% over 12 weeks
          </span>
        </div>
        <div className="flex items-end justify-between gap-2 h-44">
          {data.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-accent-400 animate-fade-up"
                style={{
                  height: `${(v / max) * 100}%`,
                  animationDelay: `${i * 0.05}s`,
                  transition: 'height 0.8s cubic-bezier(0.16,1,0.3,1)',
                }}
              />
              <span className="text-[10px] text-slate-500">W{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Take a diagnostic', desc: 'An adaptive test pinpoints your mastery across every concept in the syllabus.' },
    { n: '02', title: 'See your concept graph', desc: 'Visualise strengths and gaps, with prerequisites mapped and colour-coded.' },
    { n: '03', title: 'Chat with your AI tutor', desc: 'Get explanations, hints, and probing questions that build real understanding.' },
    { n: '04', title: 'Practice smarter', desc: 'Personalised questions target weak concepts and adapt as you grow.' },
  ];
  return (
    <section id="how" className="relative py-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-12 animate-fade-up">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">How it works</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((s, i) => (
          <div key={s.n} className="glass p-6 animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="font-display text-3xl font-extrabold text-gradient">{s.n}</span>
            <h3 className="mt-3 font-display text-lg font-bold text-white">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-white">TutorMind</span>
        </div>
        <p className="text-xs text-slate-500">Adaptive learning, reimagined.</p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'student' | 'teacher'>('student');

  const open = (mode: 'student' | 'teacher') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Nav onStart={open} />
      <Hero onStart={open} />
      <SubjectCards onStart={open} />
      <Features />
      <ProgressOverview />
      <PerformanceAnalytics />
      <HowItWorks />
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}
