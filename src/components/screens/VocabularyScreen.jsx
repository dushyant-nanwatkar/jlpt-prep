import React, { useState, useMemo, useCallback } from 'react';
import {
  Search, Filter, Volume2, ChevronDown, ChevronUp,
  Bookmark, BookmarkCheck, X, SlidersHorizontal,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { speakJapanese } from '../../utils/tts';

const LEVELS = ['All', 'N5', 'N4', 'N3'];
const SRS_STATES = ['All', 'New', 'Learning', 'Review', 'Mastered'];

function getSrsState(prog) {
  if (!prog || !prog.learningState || prog.learningState === 'NEW') return 'New';
  if (prog.learningState === 'MASTERED') return 'Mastered';
  if (prog.learningState === 'REVIEW') return 'Review';
  return 'Learning';
}

const SRS_BADGE = {
  New: 'srs-new', Learning: 'srs-learning', Review: 'srs-review', Mastered: 'srs-mastered',
};

export default function VocabularyScreen() {
  const { vocabList, vocabSrsMap, toggleVocabBookmark, settings } = useData();
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [srsFilter, setSrsFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('level');

  const filtered = useMemo(() => {
    let list = vocabList;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(w =>
        w.word?.toLowerCase().includes(q) ||
        w.meaning?.toLowerCase().includes(q) ||
        w.reading?.toLowerCase().includes(q)
      );
    }
    if (levelFilter !== 'All') list = list.filter(w => w.level === levelFilter);
    if (srsFilter !== 'All') list = list.filter(w => getSrsState(vocabSrsMap[String(w.id)]) === srsFilter);

    if (sortBy === 'level') {
      const ORDER = { N5: 0, N4: 1, N3: 2 };
      list = [...list].sort((a, b) => (ORDER[a.level] ?? 9) - (ORDER[b.level] ?? 9));
    } else if (sortBy === 'mastery') {
      list = [...list].sort((a, b) => {
        const ai = vocabSrsMap[String(a.id)]?.intervalDays ?? -1;
        const bi = vocabSrsMap[String(b.id)]?.intervalDays ?? -1;
        return bi - ai;
      });
    }

    return list;
  }, [vocabList, query, levelFilter, srsFilter, vocabSrsMap, sortBy]);

  const toggleExpand = useCallback((id) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const LEVEL_COLORS = { N5: '#52D68A', N4: '#64B5F6', N3: '#CE93D8' };

  return (
    <div className="relative min-h-screen pb-24 lg:pb-8">
      {/* Ambient */}
      <div className="ambient-bg" aria-hidden>
        <div className="ambient-orb" style={{ width: 500, height: 500, top: -100, right: -100, background: '#9ECAFE' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6">

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search in Japanese, reading or meaning…"
            className="input-glass pl-10 pr-10"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 icon-btn w-7 h-7 text-white/30 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Level filter pills */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
          {LEVELS.map(lvl => (
            <button key={lvl} onClick={() => setLevelFilter(lvl)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                levelFilter === lvl
                  ? 'text-[#002B4C]'
                  : 'text-white/50 hover:text-white'
              }`}
              style={levelFilter === lvl
                ? { background: LEVEL_COLORS[lvl] || 'linear-gradient(135deg, #9ECAFE, #68A7F8)', boxShadow: `0 0 20px ${LEVEL_COLORS[lvl] || '#9ECAFE'}55` }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }
              }>
              {lvl}
            </button>
          ))}
          <div className="ml-auto flex-shrink-0">
            <button onClick={() => setShowFilters(f => !f)}
              className={`icon-btn ${showFilters ? 'bg-primary/10 text-primary' : 'text-white/40'}`}>
              <SlidersHorizontal size={17} />
            </button>
          </div>
        </div>

        {/* Extra filters */}
        {showFilters && (
          <div className="p-4 rounded-2xl mb-4 animate-in" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="section-label mb-2">SRS State</div>
                <div className="flex flex-wrap gap-1.5">
                  {SRS_STATES.map(s => (
                    <button key={s} onClick={() => setSrsFilter(s)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        srsFilter === s ? 'bg-primary text-[#002B4C]' : 'text-white/50 hover:text-white'
                      }`}
                      style={srsFilter !== s ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="section-label mb-2">Sort by</div>
                <div className="flex flex-wrap gap-1.5">
                  {[['level', 'Level'], ['mastery', 'Mastery']].map(([val, txt]) => (
                    <button key={val} onClick={() => setSortBy(val)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        sortBy === val ? 'bg-primary text-[#002B4C]' : 'text-white/50 hover:text-white'
                      }`}
                      style={sortBy !== val ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
                      {txt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result count */}
        <div className="flex items-center justify-between mb-3">
          <span className="section-label">{filtered.length.toLocaleString()} words</span>
          {(query || levelFilter !== 'All' || srsFilter !== 'All') && (
            <button onClick={() => { setQuery(''); setLevelFilter('All'); setSrsFilter('All'); }}
              className="text-xs text-primary hover:underline flex items-center gap-1">
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* ── Word List ── */}
        <div className="space-y-2">
          {filtered.slice(0, 200).map((word) => {
            const isExpanded = expandedId === word.id;
            const wordSrs = vocabSrsMap[String(word.id)];
            const srsState = getSrsState(wordSrs);
            const isBookmarked = !!wordSrs?.isBookmarked;
            const levelColor = LEVEL_COLORS[word.level] || '#9ECAFE';

            return (
              <div key={word.id} className={`rounded-2xl overflow-hidden glass-card card-shine transition-all ${isExpanded ? 'border-white/15' : ''}`}>
                {/* Row */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  onClick={() => toggleExpand(word.id)}
                >
                  {/* Level indicator */}
                  <div className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ background: levelColor, boxShadow: `0 0 8px ${levelColor}60` }} />

                  {/* Word */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="jp text-lg font-black text-white">{word.word}</span>
                      {word.reading && word.reading !== word.word && (
                        <span className="jp text-xs" style={{ color: '#9ECAFE' }}>{word.reading}</span>
                      )}
                    </div>
                    <div className="text-xs text-white/55 truncate mt-0.5">{word.meaning}</div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={SRS_BADGE[srsState]}>{srsState}</span>
                    {isExpanded ? <ChevronUp size={15} className="text-white/30" /> : <ChevronDown size={15} className="text-white/20" />}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t animate-in" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3">
                      <button
                        onClick={() => speakJapanese(word.word, settings?.speechRate || 1.0)}
                        className="btn btn-tonal px-4 py-1.5 text-xs">
                        <Volume2 size={13} /> Speak
                      </button>
                      <button
                        onClick={() => toggleVocabBookmark(word.id)}
                        className="btn btn-ghost px-4 py-1.5 text-xs">
                        {isBookmarked ? <BookmarkCheck size={13} className="text-yellow-400" /> : <Bookmark size={13} />}
                        {isBookmarked ? 'Saved' : 'Save'}
                      </button>
                    </div>

                    {/* Part of speech */}
                    {word.partOfSpeech && (
                      <div className="flex items-center gap-2">
                        <span className="section-label">Part of Speech</span>
                        <span className="text-xs px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgba(215,184,238,0.1)', color: '#D7B8EE', border: '1px solid rgba(215,184,238,0.2)' }}>
                          {word.partOfSpeech}
                        </span>
                      </div>
                    )}

                    {/* Radicals */}
                    {word.radicals?.length > 0 && (
                      <div>
                        <div className="section-label mb-1.5">Radical Breakdown</div>
                        <div className="flex flex-wrap gap-2">
                          {word.radicals.map((r, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                              style={{ background: 'rgba(158,202,254,0.07)', border: '1px solid rgba(158,202,254,0.18)', color: '#D1E4FF' }}>
                              <span className="jp text-sm font-bold">{r.kanji}</span>
                              <span className="text-[11px] text-white/50">{r.meaning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Example sentence */}
                    {word.exampleSentence && (
                      <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="section-label mb-1.5">Example</div>
                        <p className="jp text-sm text-white/80 leading-relaxed">{word.exampleSentence}</p>
                        {word.exampleTranslation && (
                          <p className="text-xs text-white/40 mt-1 italic leading-relaxed">{word.exampleTranslation}</p>
                        )}
                      </div>
                    )}

                    {/* SRS info */}
                    {wordSrs && (
                      <div className="flex gap-3 pt-1">
                        <div className="text-center">
                          <div className="mono text-xs font-bold text-primary">{wordSrs.intervalDays || 0}d</div>
                          <div className="text-[10px] text-white/30">Interval</div>
                        </div>
                        <div className="text-center">
                          <div className="mono text-xs font-bold" style={{ color: '#FFD180' }}>{wordSrs.streak || 0}</div>
                          <div className="text-[10px] text-white/30">Streak</div>
                        </div>
                        <div className="text-center">
                          <div className="mono text-xs font-bold" style={{ color: '#75F0BA' }}>{wordSrs.difficulty || 2.5}</div>
                          <div className="text-[10px] text-white/30">Difficulty</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length > 200 && (
            <p className="text-center text-xs text-white/30 py-4">
              Showing first 200 results — use the search to narrow down.
            </p>
          )}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-white/30">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No words match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
