import React from 'react';
import {
  X, BookOpen, GraduationCap, Layers, CheckSquare,
  Settings as SettingsIcon, Volume2, Zap, Sparkles,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { speakJapanese } from '../../utils/tts';

const SHORTCUTS = [
  { id: 'grammar',    title: 'Grammar Guide',   sub: 'N5–N3 patterns & examples', icon: Layers,        color: 'rgba(215,184,238,0.1)', iconColor: '#D7B8EE', border: 'rgba(215,184,238,0.25)' },
  { id: 'vocabulary', title: 'Vocabulary Hub',  sub: '3,521 words with kanji breakdown', icon: BookOpen, color: 'rgba(158,202,254,0.1)', iconColor: '#9ECAFE', border: 'rgba(158,202,254,0.25)' },
  { id: 'study',      title: 'Flashcard Studio', sub: 'Anki SRS review deck',      icon: GraduationCap, color: 'rgba(117,240,186,0.1)', iconColor: '#75F0BA', border: 'rgba(117,240,186,0.25)' },
  { id: 'tests',      title: 'Practice Tests',  sub: 'Timed JLPT quizzes',        icon: CheckSquare,   color: 'rgba(255,209,128,0.1)', iconColor: '#FFD180', border: 'rgba(255,209,128,0.25)' },
];

export default function RightShelf({ onNavigate }) {
  const { rightShelfOpen, setRightShelfOpen, dueVocabCount, settings, updateSettings } = useData();

  if (!rightShelfOpen) return null;

  const nav = (route) => { onNavigate(route); setRightShelfOpen(false); };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setRightShelfOpen(false)} />

      <aside className="fixed top-0 bottom-0 right-0 z-50 w-80 flex flex-col overflow-y-auto animate-in"
        style={{ background: 'rgba(6,8,16,0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(40px)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: '#9ECAFE' }} />
            <span className="text-sm font-bold text-white">Quick Shelf</span>
          </div>
          <button onClick={() => setRightShelfOpen(false)} className="icon-btn text-white/30 hover:text-white">
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 p-4 space-y-5">
          {/* Due alert */}
          {dueVocabCount > 0 && (
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,209,128,0.08)', border: '1px solid rgba(255,209,128,0.22)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: '#FFD180' }}>
                  <Zap size={14} /> SRS Review Ready
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: '#FFD180', color: '#000' }}>{dueVocabCount}</span>
              </div>
              <p className="text-[11px] text-white/50 mb-3">{dueVocabCount} cards are due for spaced review now.</p>
              <button onClick={() => nav('study')} className="btn btn-filled w-full py-2 text-xs">
                Start Due Reviews
              </button>
            </div>
          )}

          {/* Quick Access */}
          <div>
            <div className="section-label mb-2.5">Quick Access</div>
            <div className="space-y-2">
              {SHORTCUTS.map(({ id, title, sub, icon: Icon, color, iconColor, border }) => (
                <button key={id} onClick={() => nav(id)}
                  className="w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all card-shine group"
                  style={{ background: color, border: `1px solid ${border}` }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,0,0,0.3)', color: iconColor }}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white group-hover:text-primary transition-colors truncate">{title}</div>
                    <div className="text-[10px] text-white/40 truncate">{sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* TTS Speed */}
          <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Volume2 size={14} className="text-primary" /> TTS Speed
              </span>
              <span className="mono text-xs font-bold" style={{ color: '#9ECAFE' }}>
                {(settings.speechRate || 1.0).toFixed(2)}x
              </span>
            </div>
            <input type="range" min="0.7" max="1.3" step="0.05"
              value={settings.speechRate || 1.0}
              onChange={(e) => updateSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full" />
            <div className="flex justify-between text-[10px] text-white/30">
              <span>0.7× Slow</span><span>1.0× Normal</span><span>1.3× Fast</span>
            </div>
            <button onClick={() => speakJapanese('日本語の音声テストです', settings.speechRate || 1.0)}
              className="btn btn-tonal w-full py-2 text-[11px]">
              <Volume2 size={13} /> Test Audio
            </button>
          </div>

          {/* Theme info */}
          <div className="p-3.5 rounded-2xl" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-white">Pitch Black AMOLED</span>
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed">
              True #000000 canvas + frosted acrylic cards for high kanji legibility on OLED displays.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={() => nav('settings')}
            className="btn btn-ghost w-full py-2.5 text-xs">
            <SettingsIcon size={14} /> All Settings & Backup
          </button>
        </div>
      </aside>
    </>
  );
}
