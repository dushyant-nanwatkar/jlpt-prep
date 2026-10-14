import React, { useMemo } from 'react';
import {
  GraduationCap, BookOpen, Layers, CheckSquare,
  TrendingUp, Zap, Flame, Trophy, Clock, ChevronRight,
  Sparkles, Target, BarChart3,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

const LEVEL_CONFIG = {
  N5: { color: '#52D68A', glow: 'rgba(80,200,120,0.25)', bg: 'rgba(80,200,120,0.08)', border: 'rgba(80,200,120,0.25)' },
  N4: { color: '#64B5F6', glow: 'rgba(100,181,246,0.25)', bg: 'rgba(100,181,246,0.08)', border: 'rgba(100,181,246,0.25)' },
  N3: { color: '#CE93D8', glow: 'rgba(206,147,216,0.25)', bg: 'rgba(206,147,216,0.08)', border: 'rgba(206,147,216,0.25)' },
};

function StatPill({ icon: Icon, label, value, color, glow }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-2xl flex-1 min-w-0 card-shine"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: glow ? `0 0 20px ${glow}` : undefined }}>
      <Icon size={16} style={{ color, marginBottom: 6 }} />
      <span className="text-lg font-black text-white">{value}</span>
      <span className="text-[10px] text-white/40 text-center leading-tight mt-0.5">{label}</span>
    </div>
  );
}

function RadialRing({ pct, label, sub, color, size = 100 }) {
  const r = (size / 2) - 9;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 1.2s cubic-bezier(0.25,0.8,0.25,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white">{pct}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-bold text-white">{label}</div>
        <div className="text-[10px] text-white/40">{sub}</div>
      </div>
    </div>
  );
}

export default function HomeScreen({ onNavigate }) {
  const {
    vocabList, grammarList, learnedVocabCount,
    dueVocabCount, masteredVocabCount, stats,
    vocabSrsMap,
  } = useData();

  const totalVocab = vocabList.length || 3521;
  const totalGrammar = grammarList.length || 831;
  const overallPct = totalVocab > 0 ? Math.round((learnedVocabCount / totalVocab) * 100) : 0;

  const levelBreakdown = useMemo(() => {
    const levels = ['N5', 'N4', 'N3'];
    return levels.map((lvl) => {
      const levelWords = vocabList.filter(v => v.level === lvl);
      const total = levelWords.length || 100;
      const learned = levelWords.filter(v => {
        const itemSrs = vocabSrsMap?.[String(v.id)];
        return itemSrs && itemSrs.learningState !== 'NEW';
      }).length;
      const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
      return { lvl, total, learned, pct, ...LEVEL_CONFIG[lvl] };
    });
  }, [vocabSrsMap, vocabList]);

  return (
    <div className="relative min-h-screen">
      {/* Ambient background orbs */}
      <div className="ambient-bg" aria-hidden>
        <div className="ambient-orb" style={{ width: 700, height: 700, top: -200, left: -200, background: '#9ECAFE' }} />
        <div className="ambient-orb" style={{ width: 500, height: 500, bottom: -150, right: -150, background: '#D7B8EE' }} />
        <div className="ambient-orb" style={{ width: 400, height: 400, top: '40%', left: '40%', background: '#75F0BA' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24 lg:pb-8">

        {/* ── Hero Section ── */}
        <div className="p-6 rounded-3xl overflow-hidden relative card-shine"
          style={{
            background: 'linear-gradient(145deg, rgba(14,19,32,0.9), rgba(8,11,20,0.95))',
            border: '1px solid rgba(158,202,254,0.2)',
            boxShadow: '0 0 0 1px rgba(158,202,254,0.06), 0 20px 60px rgba(0,0,0,0.8)',
          }}>
          {/* Decorative glow spot */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(158,202,254,0.1) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} style={{ color: '#9ECAFE' }} />
                <span className="section-label">Good {getGreeting()}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 leading-tight">
                Keep going 頑張って<span className="text-gradient-primary">！</span>
              </h2>
              <p className="text-sm text-white/50">
                {learnedVocabCount.toLocaleString()} of {totalVocab.toLocaleString()} vocabulary cards retained.
              </p>
              {dueVocabCount > 0 && (
                <div className="glow-chip mt-3 inline-flex">
                  <Zap size={11} />
                  {dueVocabCount} SRS cards ready for review
                </div>
              )}
            </div>

            {/* Overall ring */}
            <div className="flex-shrink-0">
              <RadialRing pct={overallPct} label="Overall" sub={`${learnedVocabCount} cards`} color="#9ECAFE" size={96} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button onClick={() => onNavigate('study')} className="btn btn-filled px-5 py-2.5 text-sm">
              <Zap size={15} /> Review Cards
            </button>
            <button onClick={() => onNavigate('vocabulary')} className="btn btn-tonal px-5 py-2.5 text-sm">
              <BookOpen size={15} /> Browse Vocab
            </button>
            <button onClick={() => onNavigate('tests')} className="btn btn-ghost px-5 py-2.5 text-sm">
              <CheckSquare size={15} /> Take a Test
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="flex gap-2.5">
          <StatPill icon={Flame} label="Day Streak" value={stats.streakDays || 0} color="#FF8A50" glow="rgba(255,138,80,0.2)" />
          <StatPill icon={Trophy} label="Mastered" value={masteredVocabCount || 0} color="#75F0BA" glow="rgba(117,240,186,0.2)" />
          <StatPill icon={Target} label="Seen Today" value={stats.reviewsToday || 0} color="#9ECAFE" glow="rgba(158,202,254,0.2)" />
          <StatPill icon={BarChart3} label="Accuracy" value={`${stats.accuracy || 0}%`} color="#D7B8EE" glow="rgba(215,184,238,0.2)" />
        </div>

        {/* ── Level Progress ── */}
        <div>
          <div className="section-label mb-3">Level Breakdown</div>
          <div className="grid sm:grid-cols-3 gap-3">
            {levelBreakdown.map(({ lvl, total, learned, pct, color, glow, bg, border }) => (
              <button
                key={lvl}
                onClick={() => onNavigate('vocabulary')}
                className="text-left p-4 rounded-3xl transition-all card-shine"
                style={{ background: bg, border: `1px solid ${border}`, boxShadow: `0 0 0 1px rgba(0,0,0,0)` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-black" style={{ color }}>{lvl}</span>
                  <ChevronRight size={14} className="text-white/25" />
                </div>
                <div className="text-2xl font-black text-white mb-0.5">{pct}%</div>
                <div className="text-[11px] mb-2.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {learned} / {total} words
                </div>
                <div className="progress-bar" style={{ height: 4 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${glow}` }} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Quick Access Grid ── */}
        <div>
          <div className="section-label mb-3">Study Tools</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'study',      icon: GraduationCap, title: 'Anki Studio',    sub: `${dueVocabCount || 0} due now`,        color: '#75F0BA', bg: 'rgba(117,240,186,0.07)', border: 'rgba(117,240,186,0.2)' },
              { id: 'grammar',    icon: Layers,        title: 'Grammar Guide',  sub: `${totalGrammar} patterns`,              color: '#D7B8EE', bg: 'rgba(215,184,238,0.07)', border: 'rgba(215,184,238,0.2)' },
              { id: 'vocabulary', icon: BookOpen,      title: 'Vocab Hub',      sub: `${totalVocab} words`,                   color: '#9ECAFE', bg: 'rgba(158,202,254,0.07)', border: 'rgba(158,202,254,0.2)' },
              { id: 'tests',      icon: CheckSquare,   title: 'Practice Test',  sub: 'Timed JLPT quiz',                      color: '#FFD180', bg: 'rgba(255,209,128,0.07)', border: 'rgba(255,209,128,0.2)' },
            ].map(({ id, icon: Icon, title, sub, color, bg, border }) => (
              <button key={id} onClick={() => onNavigate(id)}
                className="p-4 rounded-3xl text-left transition-all card-shine group"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(0,0,0,0.35)', color, boxShadow: `0 0 16px ${color}30` }}>
                  <Icon size={18} />
                </div>
                <div className="text-sm font-bold text-white group-hover:text-gradient-primary transition-colors">{title}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{sub}</div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
