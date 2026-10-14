import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, X, Volume2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { speakJapanese } from '../../utils/tts';

const LEVELS = ['All', 'N5', 'N4', 'N3'];
const LEVEL_COLORS = { N5: '#52D68A', N4: '#64B5F6', N3: '#CE93D8' };

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
        g.pattern?.toLowerCase().includes(q) ||
        g.meaning?.toLowerCase().includes(q) ||
        g.examples?.some(e => e.sentence?.toLowerCase().includes(q))
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
            placeholder="Search grammar patterns or meanings…"
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
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all`}
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
        <div className="space-y-2">
          {filtered.slice(0, 150).map((grammar) => {
            const isExpanded = expandedId === grammar.id;
            const levelColor = LEVEL_COLORS[grammar.level] || '#9ECAFE';

            return (
              <div key={grammar.id} className="glass-card rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : grammar.id)}
                >
                  <div className="w-1 h-10 rounded-full flex-shrink-0 mt-1"
                    style={{ background: levelColor, boxShadow: `0 0 8px ${levelColor}60` }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="jp text-base font-black text-white">{grammar.pattern}</span>
                      {grammar.level && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: `${levelColor}18`, color: levelColor, border: `1px solid ${levelColor}35` }}>
                          {grammar.level}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/55">{grammar.meaning}</div>
                  </div>
                  {isExpanded ? <ChevronUp size={15} className="text-white/25 flex-shrink-0 mt-1" /> : <ChevronDown size={15} className="text-white/20 flex-shrink-0 mt-1" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t animate-in" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {grammar.usage && (
                      <div className="p-3 rounded-2xl" style={{ background: 'rgba(215,184,238,0.07)', border: '1px solid rgba(215,184,238,0.18)' }}>
                        <div className="section-label mb-1.5">Usage</div>
                        <p className="jp text-sm text-white/80 leading-relaxed">{grammar.usage}</p>
                      </div>
                    )}

                    {grammar.examples?.length > 0 && (
                      <div>
                        <div className="section-label mb-2">Examples</div>
                        <div className="space-y-2">
                          {grammar.examples.map((ex, i) => (
                            <div key={i} className="p-3 rounded-2xl flex items-start gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                              <button
                                onClick={() => speakJapanese(ex.sentence, settings.speechRate)}
                                className="icon-btn w-7 h-7 flex-shrink-0 text-primary hover:bg-primary/10 mt-0.5"
                              >
                                <Volume2 size={13} />
                              </button>
                              <div>
                                <p className="jp text-sm text-white/85 leading-relaxed">{ex.sentence}</p>
                                {ex.translation && <p className="text-xs text-white/40 mt-1 italic">{ex.translation}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
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
