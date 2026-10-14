import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import BottomBar from './components/layout/BottomBar';
import RightShelf from './components/layout/RightShelf';

import HomeScreen from './components/screens/HomeScreen';
import StudyScreen from './components/screens/StudyScreen';
import VocabularyScreen from './components/screens/VocabularyScreen';
import GrammarScreen from './components/screens/GrammarScreen';
import TestsScreen from './components/screens/TestsScreen';
import ResultsScreen from './components/screens/ResultsScreen';
import SettingsScreen from './components/screens/SettingsScreen';

function MainAppContent() {
  const [activeRoute, setActiveRoute] = useState('home');
  const { loading, error } = useData();

  const handleNavigate = (route) => {
    setActiveRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center text-center p-6 select-none">
        <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#0D1B2A] to-[#1E293B] border border-[var(--md-sys-color-outline-primary)] flex items-center justify-center font-bold text-[var(--md-sys-color-primary)] text-2xl shadow-2xl mb-4 pulse-glow">
          語
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">Loading Nihongo JLPT Engine</h2>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">
          Ingesting correlated N5–N3 radical breakdowns and natural grammar examples...
        </p>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-6">
          <div className="h-full bg-gradient-to-r from-[var(--md-sys-color-primary)] to-[#75F0BA] animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center text-center p-6">
        <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/30 max-w-md">
          <h2 className="text-lg font-bold text-red-300">Data Ingestion Notice</h2>
          <p className="text-xs text-gray-300 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-m3 btn-primary px-5 py-2 text-xs font-bold mt-4"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-[var(--md-sys-color-primary)] selection:text-black">
      {/* Desktop & Mobile Navigation Sidebar */}
      <Sidebar activeRoute={activeRoute} onNavigate={handleNavigate} />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <div className="flex-1 flex flex-col lg:pl-[280px] min-h-screen">
        {/* Top App Bar */}
        <Navbar activeRoute={activeRoute} onNavigate={handleNavigate} />

        {/* Page Container */}
        <main className={`flex-1 w-full px-4 sm:px-6 lg:px-8 ${activeRoute === 'study' ? 'pt-2 pb-2 lg:pb-3' : 'pt-6 pb-24 lg:pb-12'}`}>
          {activeRoute === 'home' && <HomeScreen onNavigate={handleNavigate} />}
          {activeRoute === 'study' && <StudyScreen onNavigate={handleNavigate} />}
          {activeRoute === 'vocabulary' && <VocabularyScreen onNavigate={handleNavigate} />}
          {activeRoute === 'grammar' && <GrammarScreen onNavigate={handleNavigate} />}
          {activeRoute === 'tests' && <TestsScreen onNavigate={handleNavigate} />}
          {activeRoute === 'results' && <ResultsScreen onNavigate={handleNavigate} />}
          {activeRoute === 'settings' && <SettingsScreen onNavigate={handleNavigate} />}
        </main>
      </div>

      {/* Right Shelf Slide-Over Panel */}
      <RightShelf onNavigate={handleNavigate} />

      {/* Mobile Bottom Navigation Bar (Hidden during study sessions to free vertical estate) */}
      {activeRoute !== 'study' && <BottomBar activeRoute={activeRoute} onNavigate={handleNavigate} />}
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <MainAppContent />
    </DataProvider>
  );
}
