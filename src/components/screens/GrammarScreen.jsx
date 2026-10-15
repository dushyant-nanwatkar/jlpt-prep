import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, X, Volume2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { speakJapanese } from '../../utils/tts';

const LEVELS = ['All', 'N5', 'N4', 'N3', 'N2', 'N1'];
const LEVEL_COLORS = {
  N5: '#52D68A',
  N4: '#64B5F6',
  N3: '#CE93D8',
  N2: '#F6AD55',
  N1: '#FC8181'
};

export default function GrammarScreen() {
  const { grammarList, settings } = useData();
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    let list = grammarList;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(g =>
        (g.grammar || g.pattern)?.toLowerCase().includes(q) ||
        g.reading?.toLowerCase().includes(q) ||
        g.meaning?.toLowerCase().includes(q) ||
        g.examples?.some(e =>
          (e.japanese || e.sentence)?.toLowerCase().includes(q) ||
          (e.english || e.translation)?.toLowerCase().includes(q)
        )
      );
    }
    if (levelFilter !== 'All') list = list.filter(g => g.level === levelFilter);
    return list;
  }, [grammarList, query, levelFilter]);

  return (
    <div className="relative min-h-screen pb-24 lg:pb-8">
      <div className="ambient-bg" aria-hidden>
        <div className="ambient-orb" style={{ width: 500, height: 500, top: -100, left: -100, background: '#D7B8EE' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6">

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search grammar patterns, readings, or meanings…"
            className="input-glass pl-10 pr-10"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 icon-btn w-7 h-7 text-white/30">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Level pills */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {LEVELS.map(lvl => (
            <button key={lvl} onClick={() => setLevelFilter(lvl)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={levelFilter === lvl
                ? { background: LEVEL_COLORS[lvl] || 'linear-gradient(135deg, #9ECAFE, #68A7F8)', color: '#002B4C', boxShadow: `0 0 20px ${LEVEL_COLORS[lvl] || '#9ECAFE'}55` }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
              }>
              {lvl}
            </button>
          ))}
          <span className="ml-auto section-label">{filtered.length} patterns</span>
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {filtered.slice(0, 150).map((grammar, idx) => {
            const itemKey = grammar.uniqueId || `${grammar.level || 'all'}_${grammar.id || idx}`;
            const isExpanded = expandedId === itemKey;
            const levelColor = LEVEL_COLORS[grammar.level] || '#9ECAFE';
            const pattern = grammar.grammar || grammar.pattern || '';
            const examples = grammar.examples || [];
            const notes = grammar.usage || grammar.notes || '';

            return (
              <div key={itemKey} className="glass-card rounded-2xl overflow-hidden transition-all duration-200">
                <button
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left group"
                  onClick={() => setExpandedId(isExpanded ? null : itemKey)}
                >
                  <div className="w-1.5 h-10 rounded-full flex-shrink-0 mt-1 transition-transform group-hover:scale-y-110"
                    style={{ background: levelColor, boxShadow: `0 0 10px ${levelColor}80` }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="jp text-base font-black text-white tracking-wide">
                        {pattern}
                      </span>
                      {grammar.reading && (
                        <span className="text-[11px] text-white/50 font-mono bg-white/[0.06] px-2 py-0.5 rounded-md border border-white/10">
                          {grammar.reading}
                        </span>
                      )}
                      {grammar.level && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto sm:ml-0"
                          style={{ background: `${levelColor}18`, color: levelColor, border: `1px solid ${levelColor}35` }}>
                          {grammar.level}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/70 leading-relaxed font-normal">{grammar.meaning}</div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-white/40 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-white/20 flex-shrink-0 mt-1" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t animate-in" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {notes && (
                      <div className="p-3 rounded-2xl" style={{ background: 'rgba(215,184,238,0.07)', border: '1px solid rgba(215,184,238,0.18)' }}>
                        <div className="section-label mb-1.5 text-[#D7B8EE]">Notes & Usage</div>
                        <p className="jp text-sm text-white/80 leading-relaxed">{notes}</p>
                      </div>
                    )}

                    {examples.length > 0 ? (
                      <div>
                        <div className="section-label mb-2 text-white/60">Examples ({examples.length})</div>
                        <div className="space-y-2">
                          {examples.map((ex, i) => {
                            const sentence = ex.japanese || ex.sentence;
                            const translation = ex.english || ex.translation;
                            return (
                              <div
                                key={i}
                                className="p-3 rounded-2xl flex items-start gap-2.5 transition-colors hover:bg-white/[0.06]"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakJapanese(sentence, settings?.speechRate || 1.0);
                                  }}
                                  className="icon-btn w-7 h-7 flex-shrink-0 text-primary hover:bg-primary/10 mt-0.5 rounded-xl border border-primary/20"
                                  title="Pronounce example sentence"
                                >
                                  <Volume2 size={13} />
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className="jp text-sm text-white/90 leading-relaxed font-medium">{sentence}</p>
                                  {translation && <p className="text-xs text-white/50 mt-1 italic leading-relaxed">{translation}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/35 italic">
                        No example sentences available for this pattern yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-white/30">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No patterns match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
