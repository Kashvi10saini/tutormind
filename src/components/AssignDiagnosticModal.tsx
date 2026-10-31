import { useEffect, useState } from 'react';
import { X, ClipboardList, Loader2, Check, Calendar, Hash, Layers, Target } from 'lucide-react';
import { SUBJECTS, SUBJECT_MAP } from '@/lib/curriculum';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function AssignDiagnosticModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { profile } = useAuth();
  const [subjectId, setSubjectId] = useState<string>('physics');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [focusConcepts, setFocusConcepts] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(8);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'adaptive'>('adaptive');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSubjectId('physics');
      setTitle('');
      setDescription('');
      setFocusConcepts([]);
      setQuestionCount(8);
      setDifficulty('adaptive');
      setDueDate('');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const subject = SUBJECT_MAP[subjectId];
  const toggleConcept = (id: string) => {
    setFocusConcepts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!profile) {
      setError('Not signed in.');
      return;
    }
    if (title.trim().length < 3) {
      setError('Please give the assignment a title.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('assignments').insert({
      teacher_id: profile.id,
      subject: subjectId,
      title: title.trim(),
      description: description.trim(),
      focus_concepts: focusConcepts,
      question_count: questionCount,
      difficulty,
      due_date: dueDate || null,
      status: 'active',
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative glass-strong w-full max-w-lg p-7 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-thin">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/30">
            <ClipboardList size={22} className="text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Assign a custom diagnostic</h3>
            <p className="text-xs text-slate-400">Create a targeted test for your class</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* subject */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Layers size={12} /> Subject
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setSubjectId(s.id); setFocusConcepts([]); }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    subjectId === s.id
                      ? 'bg-brand-gradient text-white shadow-lg shadow-brand-500/25'
                      : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* title */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Title</label>
            <input
              className="input-field"
              placeholder="e.g. Physics Mid-Term Diagnostic"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* description */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Description (optional)</label>
            <textarea
              className="input-field min-h-[60px] resize-y"
              placeholder="What should students focus on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* focus concepts */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Target size={12} /> Focus concepts ({focusConcepts.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin p-1">
              {subject.concepts.map((c) => {
                const selected = focusConcepts.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleConcept(c.id)}
                    className={`chip border text-xs transition-all ${
                      selected
                        ? 'bg-brand-500/20 text-brand-200 border-brand-500/40'
                        : 'bg-white/[0.04] text-slate-400 border-white/[0.06] hover:text-white'
                    }`}
                  >
                    {selected && <Check size={11} />}
                    {c.name}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Leave empty to cover all concepts in the syllabus.
            </p>
          </div>

          {/* question count + difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Hash size={12} /> Questions
              </label>
              <input
                type="number"
                min={3}
                max={20}
                className="input-field"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(3, Math.min(20, Number(e.target.value) || 8)))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Difficulty</label>
              <select
                className="input-field"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              >
                <option value="adaptive">Adaptive</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* due date */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar size={12} /> Due date (optional)
            </label>
            <input
              type="date"
              className="input-field"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 animate-fade-in">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-brand w-full mt-2">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ClipboardList size={18} />}
            {busy ? 'Creating\u2026' : 'Assign diagnostic'}
          </button>
        </form>
      </div>
    </div>
  );
}
