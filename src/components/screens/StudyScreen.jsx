import React, { useState, useCallback, useEffect } from 'react';
import {
  Volume2, RotateCcw, Bookmark, BookmarkCheck,
  Zap, Trophy, RefreshCw, ArrowLeft, Layers, BookOpen,
  Keyboard, Settings2, X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { buildStudyDeck } from '../../utils/srsEngine';
import { speakJapanese } from '../../utils/tts';

const STORAGE_KEY_SHORTCUTS = 'nihongo_anki_keymap_v1';

const DEFAULT_KEYMAP = {
  flip: 'Space',
  again: '1',
  hard: '2',
  good: '3',
  easy: '4'
};

const KEYMAP_PRESETS = [
  {
    name: 'Numbers (Default)',
    desc: 'Standard Anki number keys',
    map: { flip: 'Space', again: '1', hard: '2', good: '3', easy: '4' }
  },
  {
    name: 'Home Row / Vim',
    desc: 'Ergonomic touch-typing layout',
    map: { flip: 'Space', again: 'j', hard: 'k', good: 'l', easy: ';' }
  },
  {
    name: 'Arrow Keys',
    desc: 'Intuitive spatial navigation',
    map: { flip: 'Space', again: 'ArrowLeft', hard: 'ArrowDown', good: 'ArrowUp', easy: 'ArrowRight' }
  }
];

function getKeymap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHORTCUTS);
    return raw ? { ...DEFAULT_KEYMAP, ...JSON.parse(raw) } : DEFAULT_KEYMAP;
  } catch {
    return DEFAULT_KEYMAP;
  }
}

function saveKeymap(map) {
  try {
    localStorage.setItem(STORAGE_KEY_SHORTCUTS, JSON.stringify(map));
  } catch (e) {
    console.error(e);
  }
}

function formatKeyDisplay(k) {
  if (!k) return '';
  if (k === ' ' || k === 'Space') return 'Space';
  if (k === 'ArrowLeft') return '←';
  if (k === 'ArrowRight') return '→';
  if (k === 'ArrowUp') return '↑';
  if (k === 'ArrowDown') return '↓';
  if (k === 'Enter') return '↵';
  return k.toUpperCase();
}

function matchesKey(eventKey, eventCode, target) {
  if (!target) return false;
  if (target === 'Space' && (eventKey === ' ' || eventCode === 'Space')) return true;
  if (eventKey.toLowerCase() === target.toLowerCase()) return true;
  if (eventCode.toLowerCase() === target.toLowerCase()) return true;
  return false;
}

const RATING_CONFIG = [
  { key: 'AGAIN', id: 'again', label: 'Again', kanji: 'また', className: 'anki-again', sub: '< 1 min' },
  { key: 'HARD',  id: 'hard',  label: 'Hard',  kanji: '難',    className: 'anki-hard',  sub: '~5 min' },
  { key: 'GOOD',  id: 'good',  label: 'Good',  kanji: '良',    className: 'anki-good',  sub: '~1 day' },
  { key: 'EASY',  id: 'easy',  label: 'Easy',  kanji: '易',    className: 'anki-easy',  sub: '~4 days' },
];

function EmptyState({ onNavigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center h-[calc(100vh-120px)]">
      <div className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center"
        style={{ background: 'rgba(117,240,186,0.1)', border: '1px solid rgba(117,240,186,0.25)', boxShadow: '0 0 40px rgba(117,240,186,0.15)' }}>
        <Trophy size={32} style={{ color: '#75F0BA' }} />
      </div>
      <h3 className="text-xl font-black text-white mb-2 text-center">All caught up！</h3>
      <p className="text-sm text-white/50 max-w-xs leading-relaxed text-center">
        No SRS cards are due for review. Your future self is grateful for the consistency.
      </p>
      <div className="flex gap-3 mt-6 justify-center">
        <button onClick={() => onNavigate('vocabulary')} className="btn btn-tonal px-5 py-2.5 text-sm">
          <BookOpen size={15} /> Browse Vocab
        </button>
        <button onClick={() => onNavigate('tests')} className="btn btn-ghost px-5 py-2.5 text-sm">
          <Layers size={15} /> Take a Test
        </button>
      </div>
    </div>
  );
}

function FinishScreen({ stats, deck, onRestart, onNavigate }) {
  const accuracy = stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0;
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] px-6 text-center">
      <div className="w-24 h-24 rounded-3xl mb-6 flex items-center justify-center mx-auto"
        style={{ background: 'rgba(117,240,186,0.12)', border: '1px solid rgba(117,240,186,0.3)', boxShadow: '0 0 50px rgba(117,240,186,0.2)' }}>
        <Trophy size={40} style={{ color: '#75F0BA' }} />
      </div>
      <h2 className="text-2xl font-black text-white mb-2 text-center">Session Complete！</h2>
      <p className="text-white/50 text-sm mb-6 text-center">お疲れ様でした — Great work keeping up your streak.</p>

      <div className="flex gap-4 mb-8 justify-center">
        <div className="text-center">
          <div className="text-3xl font-black text-white text-center">{stats.reviewed}</div>
          <div className="text-[11px] text-white/40 text-center">Reviewed</div>
        </div>
        <div className="w-px h-12 self-center" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="text-center">
          <div className="text-3xl font-black text-center" style={{ color: '#75F0BA' }}>{accuracy}%</div>
          <div className="text-[11px] text-white/40 text-center">Accuracy</div>
        </div>
        <div className="w-px h-12 self-center" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="text-center">
          <div className="text-3xl font-black text-center" style={{ color: '#9ECAFE' }}>{stats.correct}</div>
          <div className="text-[11px] text-white/40 text-center">Correct</div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button onClick={onRestart} className="btn btn-filled px-6 py-2.5 text-sm">
          <RefreshCw size={15} /> New Session
        </button>
        <button onClick={() => onNavigate('home')} className="btn btn-ghost px-6 py-2.5 text-sm">
          ← Dashboard
        </button>
      </div>
    </div>
  );
}

export default function StudyScreen({ onNavigate }) {
  const {
    vocabList, vocabSrsMap, answerVocabCard,
    toggleVocabBookmark, settings,
  } = useData();

  const [deck, setDeck] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [finished, setFinished] = useState(false);

  // Key mapping state
  const [keymap, setKeymap] = useState(getKeymap);
  const [showKeymapModal, setShowKeymapModal] = useState(false);
  const [listeningAction, setListeningAction] = useState(null);

  // Build deck on mount
  useEffect(() => {
    if (vocabList.length) {
      const d = buildStudyDeck({ items: vocabList, srsMap: vocabSrsMap, ordering: 'srs', maxNew: 20 });
      setDeck(d);
    }
  }, [vocabList, vocabSrsMap]);

  const card = deck[cardIndex];
  const progressPct = deck.length > 0 ? Math.round((cardIndex / deck.length) * 100) : 0;
  const isBookmarked = card ? !!(vocabSrsMap[String(card.id)]?.isBookmarked) : false;

  const kanjiFace = card?.japanese || card?.word || '';
  const furiganaReading = card?.reading || '';

  // Automatically play audio on the main flash card screen before reveal
  useEffect(() => {
    if (card) {
      speakJapanese(card.japanese || card.word, settings?.speechRate || 1.0);
    }
  }, [cardIndex, card?.id]);

  // Immediate flip without animation delays + immediate audio
  const handleFlip = useCallback(() => {
    if (!card) return;
    setFlipped(prev => {
      const next = !prev;
      if (next) {
        speakJapanese(card.japanese || card.word, settings?.speechRate || 1.0);
      }
      return next;
    });
  }, [card, settings]);

  const rateCard = useCallback((rating) => {
    if (!card) return;
    const isCorrect = rating === 'GOOD' || rating === 'EASY';
    answerVocabCard(card.id, rating);
    setSessionStats(s => ({ reviewed: s.reviewed + 1, correct: s.correct + (isCorrect ? 1 : 0) }));

    if (cardIndex + 1 >= deck.length) {
      setFinished(true);
    } else {
      setCardIndex(i => i + 1);
      setFlipped(false);
    }
  }, [card, cardIndex, deck.length, answerVocabCard]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (listeningAction) {
        e.preventDefault();
        const newKey = e.key === ' ' ? 'Space' : e.key;
        setKeymap(prev => {
          const next = { ...prev, [listeningAction]: newKey };
          saveKeymap(next);
          return next;
        });
        setListeningAction(null);
        return;
      }

      // Replay Audio (R)
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (card) {
          speakJapanese(card.japanese || card.word, settings?.speechRate || 1.0);
        }
        return;
      }

      // 1. Flip Trigger (Space / mapped key)
      if (matchesKey(e.key, e.code, keymap.flip)) {
        e.preventDefault();
        handleFlip();
        return;
      }

      // 2. Rating buttons (when flipped)
      if (flipped) {
        if (matchesKey(e.key, e.code, keymap.again)) {
          e.preventDefault();
          rateCard('AGAIN');
        } else if (matchesKey(e.key, e.code, keymap.hard)) {
          e.preventDefault();
          rateCard('HARD');
        } else if (matchesKey(e.key, e.code, keymap.good)) {
          e.preventDefault();
          rateCard('GOOD');
        } else if (matchesKey(e.key, e.code, keymap.easy)) {
          e.preventDefault();
          rateCard('EASY');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipped, keymap, listeningAction, handleFlip, rateCard]);

  const restart = () => {
    const d = buildStudyDeck({ items: vocabList, srsMap: vocabSrsMap, ordering: 'srs', maxNew: 20 });
    setDeck(d);
    setCardIndex(0);
    setFlipped(false);
    setSessionStats({ reviewed: 0, correct: 0 });
    setFinished(false);
  };

  if (!deck.length) return <EmptyState onNavigate={onNavigate} />;
  if (finished) return <FinishScreen stats={sessionStats} deck={deck} onRestart={restart} onNavigate={onNavigate} />;
  if (!card) return null;

  const srsInfo = vocabSrsMap[String(card.id)];
  const srsBadgeClass = !srsInfo || srsInfo.learningState === 'NEW' ? 'srs-new' : srsInfo.learningState === 'LEARNING' ? 'srs-learning' : srsInfo.learningState === 'MASTERED' ? 'srs-mastered' : 'srs-review';
  const srsBadgeLabel = !srsInfo || srsInfo.learningState === 'NEW' ? 'New' : srsInfo.learningState === 'LEARNING' ? 'Learning' : srsInfo.learningState === 'MASTERED' ? 'Mastered' : 'Review';

  const radicals = card.subKanjis || card.radicals || [];
  const relatedWords = card.relatedWords || [];

  return (
    <div className="relative w-full h-[calc(100vh-76px)] flex flex-col justify-between overflow-hidden px-2 sm:px-4 pb-2">
      {/* Ambient background */}
      <div className="ambient-bg" aria-hidden>
        <div className="ambient-orb" style={{ width: 700, height: 700, top: -150, right: -150, background: '#9ECAFE' }} />
        <div className="ambient-orb" style={{ width: 600, height: 600, bottom: -200, left: -200, background: '#D7B8EE' }} />
      </div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto flex flex-col h-full justify-between">

        {/* ── TOP CONTROL BAR ── */}
        <div className="flex-shrink-0 pt-1">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => onNavigate('home')} className="icon-btn text-white/40 hover:text-white -ml-2">
              <ArrowLeft size={19} />
            </button>
            <div className="flex items-center gap-3">
              <span className="section-label">{cardIndex + 1} / {deck.length}</span>
              <span className={srsBadgeClass}>{srsBadgeLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowKeymapModal(true)}
                className="icon-btn text-white/40 hover:text-primary"
                title="Keyboard Shortcuts"
                aria-label="Keyboard Shortcuts"
              >
                <Keyboard size={18} />
              </button>
              <button
                onClick={() => toggleVocabBookmark(card.id)}
                className="icon-btn text-white/40 hover:text-yellow-400"
                title="Bookmark"
              >
                {isBookmarked ? <BookmarkCheck size={19} className="text-yellow-400" /> : <Bookmark size={19} />}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-bar mb-2">
            <div
              className="progress-fill"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #9ECAFE, #75F0BA)' }}
            />
          </div>
        </div>

        {/* ═══ MAIN WORKSPACE: CARD (LEFT) + ACTION BUTTONS (RIGHT) ═══ */}
        <div className="flex-1 w-full flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden my-1">

          {/* ── LEFT: THE FLASHCARD ── */}
          <div
            onClick={handleFlip}
            className="flex-1 min-w-0 h-full cursor-pointer select-none rounded-[28px] p-6 lg:p-8 flex flex-col justify-between items-stretch border border-[rgba(158,202,254,0.22)] hover:border-[rgba(158,202,254,0.45)] transition-colors overflow-hidden"
            style={{
              background: 'linear-gradient(150deg, rgba(14,20,34,0.97) 0%, rgba(6,9,16,0.99) 100%)',
              boxShadow: '0 0 0 1px rgba(158,202,254,0.08), 0 24px 60px rgba(0,0,0,0.85)',
            }}
          >
            {/* Card Header Row */}
            <div className="flex items-center justify-between w-full flex-shrink-0 mb-1">
              <div className="flex items-center gap-2">
                {card.level && (
                  <span className={`badge-${card.level?.toLowerCase() || 'all'} px-3 py-0.5 text-xs font-bold`}>{card.level}</span>
                )}
                {card.partOfSpeech && (
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(215,184,238,0.14)', color: '#D7B8EE', border: '1px solid rgba(215,184,238,0.28)' }}
                  >
                    {card.partOfSpeech}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakJapanese(kanjiFace, settings?.speechRate || 1.0);
                }}
                className="icon-btn text-primary hover:bg-primary/10 w-8 h-8 rounded-full"
                title="Play Japanese pronunciation"
              >
                <Volume2 size={18} />
              </button>
            </div>

            {/* ── CARD MAIN BODY: FRONT VS HORIZONTAL 2-COLUMN BACK ── */}
            {!flipped ? (
              /* FRONT: PURE MASSIVE KANJI (MASSIVE HUGE FONT, ZERO FURIGANA) */
              <div className="flex-1 flex flex-col items-center justify-center text-center w-full my-auto">
                <div
                  className="jp font-black text-white leading-none tracking-tight mb-2 text-center drop-shadow-[0_12px_44px_rgba(158,202,254,0.35)]"
                  style={{
                    fontSize: kanjiFace.length > 4 ? '5.5rem' : kanjiFace.length > 2 ? '7.5rem' : '10.5rem',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {kanjiFace}
                </div>
              </div>
            ) : (
              /* BACK: 2-COLUMN HORIZONTAL SPLIT (NO SCROLLING) */
              <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-center my-auto overflow-hidden">
                {/* Left Column (5 of 12 cols): Kanji, Reading, Meaning */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-3 lg:border-r border-white/10 h-full">
                  <div
                    className="jp font-black text-white leading-none tracking-tight mb-2 text-center drop-shadow-[0_4px_24px_rgba(158,202,254,0.25)]"
                    style={{ fontSize: kanjiFace.length > 3 ? '4rem' : '5.5rem' }}
                  >
                    {kanjiFace}
                  </div>
                  {furiganaReading && (
                    <div className="jp text-2xl lg:text-3xl font-bold tracking-wide mb-2 text-primary">
                      {furiganaReading}
                    </div>
                  )}
                  <div className="text-2xl lg:text-3xl font-extrabold text-white mt-1 leading-snug">
                    {card.meaning}
                  </div>
                </div>

                {/* Right Column (7 of 12 cols): Radicals, Mnemonic, Compounds */}
                <div className="lg:col-span-7 flex flex-col justify-center space-y-2.5 h-full overflow-hidden">
                  {/* 1. Radical Breakdown */}
                  {radicals.length > 0 && (
                    <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                      <div className="section-label mb-1.5 text-primary/80">Kanji Radical Breakdown</div>
                      <div className="flex flex-wrap gap-1.5">
                        {radicals.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-primary/10 border border-primary/25 text-[#D1E4FF]"
                          >
                            <span className="jp font-bold text-sm">{r.kanji}</span>
                            <span className="text-white/65 text-[11px]">({r.meaning})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Mnemonic / Collective Meaning */}
                  {card.collectiveMeaning && (
                    <div className="p-3 rounded-2xl bg-purple-500/[0.06] border border-purple-500/20">
                      <div className="section-label mb-1 text-tertiary">Mnemonic & Composition</div>
                      <p className="jp text-xs lg:text-[13px] text-white/85 leading-relaxed">
                        {card.collectiveMeaning}
                      </p>
                    </div>
                  )}

                  {/* 3. Related Compound Words */}
                  {relatedWords.length > 0 && (
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                      <div className="section-label mb-1.5 text-white/50">Related Compound Words</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {relatedWords.slice(0, 6).map((rw, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-center sm:text-left"
                          >
                            <div className="flex items-baseline justify-center sm:justify-start gap-1.5 truncate">
                              <span className="jp font-bold text-white text-sm">{rw.word}</span>
                              {rw.reading && <span className="jp text-[10px] text-primary truncate">{rw.reading}</span>}
                            </div>
                            <div className="text-[11px] text-white/60 truncate mt-0.5">{rw.meaning}</div>
                            {rw.breakdown && (
                              <div className="text-[9px] text-white/40 truncate font-mono mt-0.5">{rw.breakdown}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Example sentence */}
                  {card.exampleSentence && relatedWords.length === 0 && (
                    <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                      <div className="section-label mb-1 text-white/50">Example</div>
                      <p className="jp text-xs lg:text-sm text-white/90 leading-relaxed">{card.exampleSentence}</p>
                      {card.exampleTranslation && (
                        <p className="text-[11px] text-white/45 mt-1 italic leading-relaxed">{card.exampleTranslation}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom instruction hint */}
            <div className="flex items-center justify-center text-center w-full pt-1 text-xs text-white/40 gap-2 flex-shrink-0">
              <span className="flex items-center justify-center gap-1.5 text-center">
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-xs border border-white/15">
                  {formatKeyDisplay(keymap.flip)}
                </kbd>
                <span>{!flipped ? 'to reveal answer' : 'to toggle card'}</span>
              </span>
              <span className="text-white/20">•</span>
              <span className="text-white/30">click anywhere to flip</span>
            </div>
          </div>

          {/* ── RIGHT: DEDICATED CONTROL / RATING BUTTONS PANEL ── */}
          <div className="w-full md:w-56 lg:w-64 xl:w-72 flex-shrink-0 flex flex-col justify-between gap-3 h-full">
            {flipped ? (
              /* Stacks the 4 rating buttons vertically on the right side */
              <div className="flex-1 flex flex-col gap-2.5 h-full">
                {RATING_CONFIG.map(({ key, id, label, kanji, className, sub }) => (
                  <button
                    key={key}
                    onClick={() => rateCard(key)}
                    className={`${className} relative flex-1 w-full rounded-2xl py-3 px-3 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
                  >
                    {/* Keyboard shortcut badge */}
                    <span className="absolute top-2 right-2.5 px-2 py-0.5 rounded bg-black/60 text-white font-mono text-[11px] border border-white/20">
                      {formatKeyDisplay(keymap[id])}
                    </span>
                    <span className="jp text-2xl font-black mb-0.5 text-center">{kanji}</span>
                    <span className="text-sm font-bold text-center">{label}</span>
                    <span className="text-[10px] opacity-65 text-center">{sub}</span>
                  </button>
                ))}
              </div>
            ) : (
              /* When unflipped: Large prominent vertical Reveal Button */
              <div className="flex-1 flex flex-col gap-3 h-full">
                <button
                  onClick={handleFlip}
                  className="btn btn-filled flex-1 w-full rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 shadow-2xl group hover:scale-[1.01] transition-transform"
                >
                  <RotateCcw size={28} className="group-hover:rotate-180 transition-transform duration-500 text-[#002B4C]" />
                  <span className="text-lg font-black text-[#002B4C]">Reveal Answer</span>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 text-[#002B4C] font-mono text-xs font-bold border border-black/20">
                    <span>Press</span>
                    <kbd className="px-1.5 py-0.2 rounded bg-black/30 text-white">{formatKeyDisplay(keymap.flip)}</kbd>
                  </div>
                </button>

                <button
                  onClick={restart}
                  className="btn btn-ghost py-3 text-xs w-full rounded-2xl flex items-center justify-center gap-2 border border-white/10 text-white/50 hover:text-white"
                  title="Restart session"
                >
                  <RefreshCw size={14} /> Restart Deck
                </button>
              </div>
            )}

            {/* Session Stats Mini Card */}
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs text-white/40 flex-shrink-0">
              <div>
                <span className="block font-bold text-white text-sm">{sessionStats.reviewed}</span>
                <span className="text-[10px]">Reviewed</span>
              </div>
              <div className="text-right">
                <span className="block font-bold text-success text-sm">{sessionStats.correct}</span>
                <span className="text-[10px]">Passed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ KEYBOARD SHORTCUTS MAPPING MODAL ═══ */}
      {showKeymapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            className="w-full max-w-md rounded-3xl p-6 border border-white/15 card-shine"
            style={{ background: 'linear-gradient(150deg, #101424, #080a12)', boxShadow: '0 25px 60px rgba(0,0,0,0.9)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard size={20} className="text-primary" />
                <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => {
                  setShowKeymapModal(false);
                  setListeningAction(null);
                }}
                className="icon-btn text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-white/50 mb-5 text-center">
              Click any key button and press a key on your keyboard to customize your Anki study controls.
            </p>

            {/* Custom key assignment rows */}
            <div className="space-y-2.5 mb-6">
              {[
                { id: 'flip', label: 'Flip Card / Reveal Answer', desc: 'Immediately flips & plays TTS audio' },
                { id: 'again', label: 'Again (また)', desc: 'Fail card, repeat immediately' },
                { id: 'hard', label: 'Hard (難)', desc: 'Difficult review interval' },
                { id: 'good', label: 'Good (良)', desc: 'Standard passing interval' },
                { id: 'easy', label: 'Easy (易)', desc: 'Bonus interval multiplier' },
                { id: 'audio', label: 'Replay Audio (R)', desc: 'Replays Japanese voice pronunciation', fixed: 'R' },
              ].map(({ id, label, desc, fixed }) => {
                const isListening = listeningAction === id;
                return (
                  <div
                    key={id}
                    className="p-3 rounded-2xl flex items-center justify-between border border-white/10"
                    style={{ background: isListening ? 'rgba(158,202,254,0.1)' : 'rgba(255,255,255,0.03)' }}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{label}</div>
                      <div className="text-[10px] text-white/40">{desc}</div>
                    </div>
                    {fixed ? (
                      <span className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-white/10 text-primary border border-white/20">
                        {fixed}
                      </span>
                    ) : (
                      <button
                        onClick={() => setListeningAction(isListening ? null : id)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border ${
                          isListening
                            ? 'bg-primary text-black border-primary'
                            : 'bg-white/10 text-white border-white/20 hover:border-primary/60'
                        }`}
                      >
                        {isListening ? 'Press key…' : formatKeyDisplay(keymap[id])}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Presets */}
            <div className="border-t border-white/10 pt-4 mb-4">
              <div className="section-label mb-2 text-white/40 text-center">Quick Presets</div>
              <div className="grid grid-cols-3 gap-2">
                {KEYMAP_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setKeymap(preset.map);
                      saveKeymap(preset.map);
                    }}
                    className="p-2 rounded-xl text-center border border-white/10 hover:border-primary/50 text-xs"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <div className="font-bold text-white text-[11px] truncate text-center">{preset.name}</div>
                    <div className="text-[9px] text-white/40 truncate text-center">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setKeymap(DEFAULT_KEYMAP);
                  saveKeymap(DEFAULT_KEYMAP);
                  setListeningAction(null);
                }}
                className="btn btn-ghost py-2 text-xs flex-1 text-center"
              >
                Reset Default
              </button>
              <button
                onClick={() => {
                  setShowKeymapModal(false);
                  setListeningAction(null);
                }}
                className="btn btn-filled py-2 text-xs flex-1 text-center"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
