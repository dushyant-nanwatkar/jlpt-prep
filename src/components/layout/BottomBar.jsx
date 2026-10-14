import React from 'react';
import { Home, GraduationCap, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { useData } from '../../context/DataContext';

const ITEMS = [
  { id: 'home',       label: 'Home',    icon: Home },
  { id: 'study',      label: 'Study',   icon: GraduationCap, badge: 'due' },
  { id: 'vocabulary', label: 'Vocab',   icon: BookOpen },
  { id: 'grammar',    label: 'Grammar', icon: Layers },
  { id: 'tests',      label: 'Tests',   icon: CheckSquare },
];

export default function BottomBar({ activeRoute, onNavigate }) {
  const { dueVocabCount } = useData();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass-nav"
      style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingLeft: 8, paddingRight: 8 }}>
      {ITEMS.map(({ id, label, icon: Icon, badge }) => {
        const isActive = activeRoute === id;
        const badgeVal = badge === 'due' ? dueVocabCount : null;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="flex flex-col items-center justify-center flex-1 h-full relative"
            style={{ gap: 2 }}
          >
            {/* Active pill highlight behind icon */}
            <div className={`relative flex items-center justify-center rounded-full px-4 py-1 transition-all duration-200 ${
              isActive ? 'bg-primary/10' : ''
            }`} style={{ minWidth: 56 }}>
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="transition-all duration-200"
                style={{ color: isActive ? '#9ECAFE' : 'rgba(255,255,255,0.38)' }}
              />
              {/* Due badge dot */}
              {badgeVal > 0 && (
                <span className="absolute -top-0.5 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                  style={{ background: '#FFD180', color: '#000' }}>
                  {badgeVal > 9 ? '9+' : badgeVal}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium transition-all duration-200"
              style={{ color: isActive ? '#9ECAFE' : 'rgba(255,255,255,0.35)' }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
