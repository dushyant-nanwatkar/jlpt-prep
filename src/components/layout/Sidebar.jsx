import React from 'react';
import {
  Home,
  GraduationCap,
  BookOpen,
  Layers,
  CheckSquare,
  BarChart3,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

const NAV_ITEMS = [
  { id: 'home',       title: 'Home',           icon: Home,          badge: null },
  { id: 'study',      title: 'Anki Studio',    icon: GraduationCap, badge: 'due' },
  { id: 'vocabulary', title: 'Vocabulary Hub', icon: BookOpen,      badge: null },
  { id: 'grammar',    title: 'Grammar Guide',  icon: Layers,        badge: null },
  { id: 'tests',      title: 'Practice Tests', icon: CheckSquare,   badge: null },
  { id: 'results',    title: 'Analytics',      icon: BarChart3,     badge: null },
  { id: 'settings',   title: 'Settings',       icon: Settings,      badge: null },
];

export default function Sidebar({ activeRoute, onNavigate }) {
  const {
    sandwichDrawerOpen,
    setSandwichDrawerOpen,
    learnedVocabCount,
    vocabList,
    dueVocabCount,
  } = useData();

  const handleSelect = (id) => {
    onNavigate(id);
    setSandwichDrawerOpen(false);
  };

  const totalWords = vocabList.length || 3521;
  const pct = totalWords > 0 ? Math.round((learnedVocabCount / totalWords) * 100) : 0;

  return (
    <>
      {/* Mobile overlay */}
      {sandwichDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={() => setSandwichDrawerOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-[280px] flex flex-col
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sandwichDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: '#050810', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Header */}
        <div className="p-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-base font-black"
              style={{
                background: 'linear-gradient(135deg, #0D1B2A, #1A2540)',
                border: '1px solid rgba(158,202,254,0.3)',
                color: '#9ECAFE',
                boxShadow: '0 0 20px rgba(158,202,254,0.15)',
              }}>
              語
            </div>
            <div>
              <div className="text-sm font-bold text-white">日本語</div>
              <div className="text-[10px] text-white/40">JLPT N5・N4・N3</div>
            </div>
          </div>
          <button
            onClick={() => setSandwichDrawerOpen(false)}
            className="icon-btn text-white/30 hover:text-white lg:hidden"
          >
            <X size={17} />
          </button>
        </div>

        {/* Progress mini card */}
        <div className="px-4 py-3">
          <div className="p-3 rounded-2xl" style={{ background: 'rgba(158,202,254,0.05)', border: '1px solid rgba(158,202,254,0.12)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-white/50 flex items-center gap-1">
                <Sparkles size={11} className="text-primary" />
                Retention Progress
              </span>
              <span className="text-[11px] font-bold" style={{ color: '#9ECAFE' }}>
                {learnedVocabCount}<span className="text-white/30 font-normal"> / {totalWords}</span>
              </span>
            </div>
            <div className="progress-bar" style={{ height: '5px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #9ECAFE, #75F0BA)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <div className="section-label px-2 pt-1 pb-2">Navigation</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            const badgeVal = item.badge === 'due' ? (dueVocabCount > 0 ? dueVocabCount : null) : item.badge;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} className={isActive ? 'text-primary' : 'text-white/40'} />
                  <span className="text-[13px]">{item.title}</span>
                </div>
                {badgeVal && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold mono"
                    style={isActive
                      ? { background: '#9ECAFE', color: '#002B4C' }
                      : { background: 'rgba(255,209,128,0.15)', color: '#FFD180', border: '1px solid rgba(255,209,128,0.25)' }
                    }>
                    {badgeVal}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-white/40">AMOLED True Black</span>
            </div>
            <span className="text-[10px] text-white/20 mono">v2.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
