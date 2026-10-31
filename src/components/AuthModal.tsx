import { useEffect, useState } from 'react';
import { Brain, GraduationCap, X, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';

type Mode = 'student' | 'teacher';
type Tab = 'signin' | 'signup';

export function AuthModal({
  open,
  onClose,
  initialMode = 'student',
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
}) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<Tab>('signin');
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setTab('signin');
      setError(null);
    }
  }, [open, initialMode]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    if (tab === 'signin') {
      const { error } = await signIn(email, password);
      setBusy(false);
      if (error) setError(error);
      else onClose();
    } else {
      if (name.trim().length < 2) {
        setError('Please enter your name.');
        setBusy(false);
        return;
      }
      const { error } = await signUp(email, password, name, mode);
      setBusy(false);
      if (error) setError(error);
      else onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative glass-strong w-full max-w-md p-7 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Welcome to TutorMind</h3>
            <p className="text-xs text-slate-400">
              {tab === 'signin' ? 'Sign in to continue learning' : 'Create your account'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 mb-5 rounded-xl bg-ink-800/60 border border-white/[0.06]">
          {(['student', 'teacher'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === m
                  ? 'bg-brand-gradient text-white shadow-lg shadow-brand-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m === 'student' ? <GraduationCap size={16} /> : <UserIcon size={16} />}
              {m === 'student' ? 'Student' : 'Teacher'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5 text-sm">
          <button
            onClick={() => setTab('signin')}
            className={`py-2 rounded-lg font-medium transition-all ${
              tab === 'signin' ? 'text-brand-300 bg-brand-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`py-2 rounded-lg font-medium transition-all ${
              tab === 'signup' ? 'text-brand-300 bg-brand-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Full name</label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="input-field pl-10"
                  placeholder="Ada Lovelace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                className="input-field pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                className="input-field pl-10"
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 animate-fade-in">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-brand w-full mt-2">
            {busy ? <Loader2 size={18} className="animate-spin" /> : null}
            {tab === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          {mode === 'student'
            ? 'Personalised adaptive learning, mastery tracking and an AI tutor.'
            : 'Teacher accounts can monitor class progress and assign diagnostics.'}
        </p>
      </div>
    </div>
  );
}
