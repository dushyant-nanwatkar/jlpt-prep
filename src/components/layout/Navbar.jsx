import React from 'react';
import { Menu, SlidersHorizontal, Zap } from 'lucide-react';
import { useData } from '../../context/DataContext';

const PAGE_TITLES = {
  home: { title: 'Dashboard', sub: 'Your learning overview' },
  study: { title: 'Anki Studio', sub: 'Spaced repetition flashcards' },
  vocabulary: { title: 'Vocabulary', sub: '3,521 words with radical breakdown' },
  grammar: { title: 'Grammar', sub: '831 patterns with natural examples' },
  tests: { title: 'Practice Tests', sub: 'JLPT multiple-choice quizzes' },
  results: { title: 'Analytics', sub: 'Test history & performance' },
  settings: { title: 'Settings', sub: 'Preferences & data management' },
};

export default function Navbar({ activeRoute, onNavigate }) {
  const {
    rightShelfOpen,
    setRightShelfOpen,
    sandwichDrawerOpen,
    setSandwichDrawerOpen,
    dueVocabCount,
    stats,
  } = useData();

  const page = PAGE_TITLES[activeRoute] || PAGE_TITLES.home;

  return (
    <header className="glass-nav sticky top-0 z-30 h-16 px-4 flex items-center justify-between gap-4">
      {/* Left: Hamburger + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="btn-sandwich-menu"
          onClick={() => setSandwichDrawerOpen(!sandwichDrawerOpen)}
          className="icon-btn text-white/70 hover:text-primary flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={21} />
        </button>

        <div className="min-w-0 hidden sm:block">
          <h1 className="text-base font-bold text-white leading-tight tracking-tight truncate">
            {page.title}
          </h1>
          <p className="text-[11px] text-white/40 leading-tight truncate">{page.sub}</p>
        </div>
        <div className="min-w-0 sm:hidden">
          <span className="text-sm font-bold text-white">{page.title}</span>
        </div>
      </div>

      {/* Right: Chips + Shelf */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Due cards chip */}
        {dueVocabCount > 0 && (
          <button
            onClick={() => onNavigate('study')}
            className="glow-chip hidden sm:flex"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            <span>{dueVocabCount} due</span>
          </button>
        )}

        {/* Streak pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="text-orange-400 text-sm">🔥</span>
          <span className="text-white font-bold">{stats.streakDays || 0}</span>
        </div>

        {/* Tune / Right shelf button */}
        <button
          id="btn-right-shelf"
          onClick={() => setRightShelfOpen(!rightShelfOpen)}
          className={`icon-btn transition-all ${
            rightShelfOpen
              ? 'bg-primary text-[#002B4C]'
              : 'text-white/60 hover:text-white'
          }`}
          aria-label="Toggle quick shelf"
        >
          <SlidersHorizontal size={19} />
        </button>
      </div>
    </header>
  );
}
