import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Brain, Sparkles, AlertTriangle, Lightbulb, BookOpen, Loader2 } from 'lucide-react';
import { SUBJECTS, SUBJECT_MAP, getConcept } from '@/lib/curriculum';
import { useAuth } from '@/lib/auth';
import { useLearningData, masteryForSubject } from '@/lib/useLearningData';
import { tutorReply, tutorExplain } from '@/lib/tutor';
import { masteryLabel, masteryColor } from '@/lib/mastery';
import { supabase, type ChatMessage } from '@/lib/supabase';
import { useTypewriter } from '@/lib/hooks';
import { GlassCard } from '@/components/ui';

type UIMessage = {
  id: string;
  role: 'student' | 'tutor' | 'system';
  content: string;
  misconception?: string | null;
  probe?: string;
  conceptId?: string;
};

export function AITutor({ onExit }: { onExit: () => void }) {
  const { profile } = useAuth();
  const userId = profile?.id;
  const { mastery } = useLearningData(userId);
  const [subjectId, setSubjectId] = useState<string>('physics');
  const [conceptId, setConceptId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [animatedId, setAnimatedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const subject = SUBJECT_MAP[subjectId];
  const conceptRows = masteryForSubject(mastery, subjectId);
  const conceptMasteryMap: Record<string, number> = {};
  conceptRows.forEach((r) => (conceptMasteryMap[r.concept_id] = Number(r.mastery)));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const concept = conceptId ? getConcept(subjectId, conceptId) : undefined;
  const conceptMastery = conceptId ? (conceptMasteryMap[conceptId] ?? 20) : 20;

  const seedWelcome = () => {
    const welcome: UIMessage = {
      id: 'welcome',
      role: 'tutor',
      content: concept
        ? `Hi ${profile?.display_name ?? 'there'}! Let\u2019s explore ${concept.name}. ${tutorExplain(concept)} Ask me anything, or tell me what you think \u2014 I\u2019ll guide you with hints rather than just handing over the answer.`
        : `Hi ${profile?.display_name ?? 'there'}! I\u2019m your AI tutor. Pick a concept on the left, or just ask me a question about ${subject.name}. I\u2019ll explain things in my own words, give you hints, and flag any misconceptions I spot \u2014 perfect prep for your viva.`,
    };
    setMessages([welcome]);
    setAnimatedId('welcome');
  };

  useEffect(() => {
    seedWelcome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, conceptId]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    const studentMsg: UIMessage = { id: crypto.randomUUID(), role: 'student', content: text };
    setMessages((m) => [...m, studentMsg]);
    setInput('');
    setThinking(true);

    // persist student message
    if (userId) {
      await supabase.from('chat_messages').insert({
        user_id: userId,
        role: 'student',
        content: text,
        concept_id: conceptId ?? null,
      });
    }

    // simulate tutor thinking
    const reply = tutorReply(text, {
      subjectId,
      conceptId,
      mastery: conceptMastery,
      conceptName: concept?.name,
    });

    setTimeout(async () => {
      const tutorMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: 'tutor',
        content: reply.text,
        misconception: reply.misconception,
        probe: reply.probe,
        conceptId: reply.conceptId,
      };
      setMessages((m) => [...m, tutorMsg]);
      setThinking(false);
      setAnimatedId(tutorMsg.id);
      if (userId) {
        await supabase.from('chat_messages').insert({
          user_id: userId,
          role: 'tutor',
          content: reply.text,
          concept_id: reply.conceptId ?? conceptId ?? null,
          misconception: reply.misconception ?? null,
        });
      }
    }, 700 + Math.random() * 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-4 animate-fade-up">
        <button onClick={onExit} className="btn-ghost text-sm py-2">
          <ArrowLeft size={16} /> Back
        </button>
        <span className="chip bg-accent-500/15 text-accent-300 border border-accent-500/20">
          <Sparkles size={13} /> Conversational AI tutor
        </span>
      </div>

      <div className="grid lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* concept picker */}
        <div className="lg:col-span-1 flex flex-col gap-3 animate-fade-up">
          <GlassCard className="p-4" hover={false}>
            <p className="text-xs text-slate-400 mb-2 font-semibold">Subject</p>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSubjectId(s.id); setConceptId(undefined); }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    subjectId === s.id ? 'bg-brand-gradient text-white' : 'bg-white/[0.04] text-slate-300 border border-white/[0.06]'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex-1 min-h-0 overflow-y-auto scrollbar-thin" hover={false}>
            <p className="text-xs text-slate-400 mb-2 font-semibold">Concepts</p>
            <ul className="space-y-1">
              {subject.concepts.map((c) => {
                const m = conceptMasteryMap[c.id] ?? 20;
                const active = conceptId === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setConceptId(c.id)}
                      className={`w-full text-left p-2 rounded-lg flex items-center justify-between gap-2 transition-all ${
                        active ? 'bg-brand-500/15 border border-brand-500/30' : 'hover:bg-white/[0.05] border border-transparent'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{c.name}</p>
                        <p className={`text-[10px] ${masteryColor(m)}`}>{masteryLabel(m)} \u00b7 {Math.round(m)}%</p>
                      </div>
                      <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: m >= 60 ? '#34d399' : m >= 40 ? '#fbbf24' : '#fb7185' }} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        </div>

        {/* chat */}
        <GlassCard className="lg:col-span-3 flex flex-col min-h-0 animate-fade-up" hover={false}>
          <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">TutorMind AI</p>
              <p className="text-xs text-slate-400">
                {concept ? `Explaining ${concept.name}` : `Ready to help with ${subject.name}`}
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} animate={animatedId === m.id} onAnimated={() => animatedId === m.id && setAnimatedId(null)} />
            ))}
            {thinking && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center">
                  <Brain size={16} className="text-white" />
                </div>
                <div className="flex gap-1.5">
                  <span className="typing-dot w-2 h-2 rounded-full bg-brand-400" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-brand-400" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-brand-400" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/[0.06]">
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder={concept ? `Ask about ${concept.name}\u2026` : 'Type your question\u2026'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button onClick={send} disabled={!input.trim() || thinking} className="btn-brand px-4">
                {thinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <Lightbulb size={12} className="text-amber-400" /> I give hints, not just answers. Try me.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ChatBubble({ message, animate, onAnimated }: { message: UIMessage; animate: boolean; onAnimated: () => void }) {
  const isStudent = message.role === 'student';
  const { displayed, done } = useTypewriter(animate ? message.content : message.content, animate ? 14 : 0);

  useEffect(() => {
    if (animate && done) onAnimated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (isStudent) {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="max-w-[80%] bg-brand-gradient text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-lg shadow-brand-500/20">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 animate-fade-up">
      <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
        <Brain size={16} className="text-white" />
      </div>
      <div className="max-w-[80%] space-y-2">
        <div className="glass rounded-2xl rounded-tl-sm px-4 py-2.5">
          <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
            {animate ? displayed : message.content}
            {animate && !done && <span className="inline-block w-1 h-3.5 bg-brand-400 ml-0.5 animate-pulse" />}
          </p>
        </div>
        {message.misconception && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-fade-in">
            <AlertTriangle size={14} className="text-rose-400 mt-0.5 shrink-0" />
            <p className="text-xs text-rose-200 leading-relaxed">{message.misconception}</p>
          </div>
        )}
        {message.probe && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <BookOpen size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200 leading-relaxed">{message.probe}</p>
          </div>
        )}
      </div>
    </div>
  );
}
