import { useMemo, useState } from 'react';
import { ArrowLeft, Network, Zap, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { SUBJECTS, SUBJECT_MAP, getConcept, type Concept } from '@/lib/curriculum';
import { useAuth } from '@/lib/auth';
import { useLearningData, masteryForSubject } from '@/lib/useLearningData';
import { masteryColor, masteryLabel } from '@/lib/mastery';
import { GlassCard } from '@/components/ui';

type NodePos = { x: number; y: number };

export function ConceptGraph({ onExit }: { onExit: () => void }) {
  const { profile } = useAuth();
  const userId = profile?.id;
  const { mastery, loading } = useLearningData(userId);
  const [subjectId, setSubjectId] = useState<string>('physics');
  const [selected, setSelected] = useState<string | null>(null);

  const subject = SUBJECT_MAP[subjectId];
  const rows = masteryForSubject(mastery, subjectId);
  const masteryByConcept = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((r) => (map[r.concept_id] = Number(r.mastery)));
    return map;
  }, [rows]);

  // layout: layered by dependency depth
  const positions = useMemo(() => {
    const depthOf = (id: string, cache: Record<string, number> = {}): number => {
      if (id in cache) return cache[id];
      const c = subject.concepts.find((x) => x.id === id);
      if (!c || c.prerequisites.length === 0) {
        cache[id] = 0;
        return 0;
      }
      const d = Math.max(...c.prerequisites.map((p) => depthOf(p, cache))) + 1;
      cache[id] = d;
      return d;
    };
    const depths: Record<string, number> = {};
    subject.concepts.forEach((c) => (depths[c.id] = depthOf(c.id, { ...depths })));
    const byDepth: Record<number, string[]> = {};
    Object.entries(depths).forEach(([id, d]) => {
      byDepth[d] = byDepth[d] ?? [];
      byDepth[d].push(id);
    });
    const pos: Record<string, NodePos> = {};
    const W = 100;
    const maxDepth = Math.max(...Object.values(depths), 0);
    Object.entries(byDepth).forEach(([d, ids]) => {
      const depth = Number(d);
      const y = ((depth + 0.5) / (maxDepth + 1)) * 100;
      ids.forEach((id, i) => {
        const x = ((i + 0.5) / ids.length) * W;
        pos[id] = { x, y };
      });
    });
    return pos;
  }, [subject]);

  const getMastery = (id: string) => masteryByConcept[id] ?? 20;
  const nodeColor = (id: string) => {
    const m = getMastery(id);
    if (m >= 60) return '#34d399';
    if (m >= 40) return '#fbbf24';
    return '#fb7185';
  };
  const selectedConcept = selected ? getConcept(subjectId, selected) : null;
  const selectedMastery = selected ? getMastery(selected) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={onExit} className="btn-ghost text-sm mb-6 py-2">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <span className="chip bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-2">
            <Network size={13} /> Concept graph
          </span>
          <h1 className="font-display text-2xl font-bold text-white">Concept dependencies</h1>
          <p className="text-sm text-slate-400 mt-1">Green = mastered, red = weak. Tap a node to see details.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSubjectId(s.id); setSelected(null); }}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                subjectId === s.id
                  ? 'bg-brand-gradient text-white shadow-lg shadow-brand-500/30'
                  : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <GlassCard className="lg:col-span-2 p-4 sm:p-6 animate-fade-up" hover={false}>
          {loading ? (
            <div className="aspect-[4/3] w-full" />
          ) : (
            <div className="relative aspect-[4/3] w-full">
              <svg viewBox="0 0 100 75" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* edges */}
                {subject.concepts.flatMap((c) =>
                  c.prerequisites.map((p) => {
                    const a = positions[p];
                    const b = positions[c.id];
                    if (!a || !b) return null;
                    const m = getMastery(c.id);
                    const mastered = m >= 60;
                    return (
                      <line
                        key={`${p}-${c.id}`}
                        x1={a.x}
                        y1={a.y * 0.75}
                        x2={b.x}
                        y2={b.y * 0.75}
                        stroke={mastered ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.12)'}
                        strokeWidth={0.4}
                        strokeDasharray={mastered ? '0' : '1.5 1.5'}
                      />
                    );
                  }),
                )}
                {/* nodes */}
                {subject.concepts.map((c) => {
                  const pos = positions[c.id];
                  if (!pos) return null;
                  const m = getMastery(c.id);
                  const color = nodeColor(c.id);
                  const isSelected = selected === c.id;
                  return (
                    <g
                      key={c.id}
                      onClick={() => setSelected(c.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {isSelected && (
                        <circle cx={pos.x} cy={pos.y * 0.75} r={5} fill="none" stroke={color} strokeWidth={0.5} opacity={0.5}>
                          <animate attributeName="r" from="3.5" to="6" dur="1s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.6" to="0" dur="1s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle
                        cx={pos.x}
                        cy={pos.y * 0.75}
                        r={3}
                        fill={color}
                        opacity={isSelected ? 1 : 0.85}
                        style={{ filter: `drop-shadow(0 0 2px ${color})`, transition: 'all 0.3s' }}
                      />
                    </g>
                  );
                })}
              </svg>
              {/* labels overlay using foreignObject-free approach: absolutely positioned divs */}
              <div className="absolute inset-0">
                {subject.concepts.map((c) => {
                  const pos = positions[c.id];
                  if (!pos) return null;
                  const m = getMastery(c.id);
                  const color = nodeColor(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 group"
                      style={{ left: `${pos.x}%`, top: `${pos.y * 0.75}%` }}
                    >
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
                          selected === c.id
                            ? 'bg-white/15 text-white scale-110'
                            : 'bg-white/[0.06] text-slate-300 group-hover:bg-white/[0.12]'
                        }`}
                        style={{ border: `1px solid ${color}40` }}
                      >
                        {c.name}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold" style={{ color }}>
                        {Math.round(m)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </GlassCard>

        {/* detail panel */}
        <div className="space-y-4 animate-fade-up">
          {selectedConcept ? (
            <GlassCard className="p-5 animate-scale-in" hover={false}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${nodeColor(selectedConcept.id)}20` }}
                >
                  {selectedMastery >= 60 ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : (
                    <AlertTriangle size={20} className="text-rose-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">{selectedConcept.name}</h3>
                  <p className={`text-xs ${masteryColor(selectedMastery)}`}>
                    {masteryLabel(selectedMastery)} \u00b7 {Math.round(selectedMastery)}%
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{selectedConcept.description}</p>

              {selectedConcept.prerequisites.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-400 mb-2">Prerequisites</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedConcept.prerequisites.map((p) => {
                      const pc = getConcept(subjectId, p);
                      const pm = getMastery(p);
                      return (
                        <span
                          key={p}
                          className="chip border text-xs"
                          style={{
                            backgroundColor: `${nodeColor(p)}15`,
                            borderColor: `${nodeColor(p)}30`,
                            color: nodeColor(p),
                          }}
                        >
                          {pc?.name} \u00b7 {Math.round(pm)}%
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs text-slate-400 mb-2">Unlocks</p>
                <div className="flex flex-wrap gap-1.5">
                  {subject.concepts
                    .filter((c) => c.prerequisites.includes(selectedConcept.id))
                    .map((c) => (
                      <span key={c.id} className="chip bg-white/[0.05] text-slate-300 border border-white/[0.08] text-xs">
                        {c.name}
                      </span>
                    ))}
                  {subject.concepts.filter((c) => c.prerequisites.includes(selectedConcept.id)).length === 0 && (
                    <span className="text-xs text-slate-500">No direct dependants.</span>
                  )}
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-6 text-center" hover={false}>
              <Network size={32} className="text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Select a concept to see its dependencies, mastery, and what it unlocks.</p>
            </GlassCard>
          )}

          <GlassCard className="p-5" hover={false}>
            <h4 className="font-display font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Zap size={15} className="text-amber-400" /> Legend
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-400" /> Mastered (60%+)</li>
              <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400" /> Developing (40\u201359%)</li>
              <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-400" /> Weak (below 40%)</li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
