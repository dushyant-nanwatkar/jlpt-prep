import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getVocabSrsMap,
  saveVocabSrsMap,
  getGrammarSrsMap,
  saveGrammarSrsMap,
  getStudyStats,
  recordStudyAction,
  recordTestScore,
  getAppSettings,
  saveAppSettings,
  calculateNextSrs
} from '../utils/srsEngine';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [vocabList, setVocabList] = useState([]);
  const [grammarList, setGrammarList] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [vocabSrsMap, setVocabSrsMapState] = useState(getVocabSrsMap());
  const [grammarSrsMap, setGrammarSrsMapState] = useState(getGrammarSrsMap());
  const [stats, setStatsState] = useState(getStudyStats());
  const [settings, setSettingsState] = useState(getAppSettings());

  // UI Drawer & Shelf state
  const [rightShelfOpen, setRightShelfOpen] = useState(false);
  const [sandwichDrawerOpen, setSandwichDrawerOpen] = useState(false);

  // Load JSON datasets on boot
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [metaRes, vocabRes, grammarRes] = await Promise.all([
          fetch('/data/metadata.json'),
          fetch('/data/vocabulary.json'),
          fetch('/data/grammar.json')
        ]);

        if (!vocabRes.ok || !grammarRes.ok) {
          throw new Error('Could not fetch data sets');
        }

        const metaData = metaRes.ok ? await metaRes.json() : null;
        const vocabs = await vocabRes.json();
        const grammars = await grammarRes.json();

        const normalizedVocabs = (Array.isArray(vocabs) ? vocabs : []).map(v => ({
          ...v,
          word: v.japanese || v.word || '',
          japanese: v.japanese || v.word || '',
          reading: v.reading || '',
          meaning: v.meaning || '',
          partOfSpeech: v.type || v.partOfSpeech || 'Noun',
          radicals: v.subKanjis || v.radicals || [],
          subKanjis: v.subKanjis || v.radicals || [],
          collectiveMeaning: v.collectiveMeaning || null,
          relatedWords: v.relatedWords || []
        }));

        setMetadata(metaData);
        setVocabList(normalizedVocabs);
        setGrammarList(grammars);
        setLoading(false);
      } catch (err) {
        console.error('Data loading error:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    loadAllData();
  }, []);

  // Update vocabulary SRS on card answer
  const answerVocabCard = useCallback((vocabId, answer) => {
    const key = String(vocabId);
    const current = vocabSrsMap[key] || null;
    const nextState = calculateNextSrs(current, answer);

    const nextMap = { ...vocabSrsMap, [key]: nextState };
    setVocabSrsMapState(nextMap);
    saveVocabSrsMap(nextMap);

    const updatedStats = recordStudyAction(answer !== 'AGAIN');
    setStatsState(updatedStats);
    return nextState;
  }, [vocabSrsMap]);

  // Update grammar SRS on card answer
  const answerGrammarCard = useCallback((grammarId, answer) => {
    const key = String(grammarId);
    const current = grammarSrsMap[key] || null;
    const nextState = calculateNextSrs(current, answer);

    const nextMap = { ...grammarSrsMap, [key]: nextState };
    setGrammarSrsMapState(nextMap);
    saveGrammarSrsMap(nextMap);

    const updatedStats = recordStudyAction(answer !== 'AGAIN');
    setStatsState(updatedStats);
    return nextState;
  }, [grammarSrsMap]);

  // Bookmark toggles
  const toggleVocabBookmark = useCallback((vocabId) => {
    const key = String(vocabId);
    const current = vocabSrsMap[key] || {
      timesSeen: 0,
      knownCount: 0,
      unknownCount: 0,
      masteryScore: 0,
      intervalDays: 0,
      difficulty: 2.5,
      streak: 0,
      lastSeen: 0,
      nextReview: 0,
      learningState: 'NEW'
    };
    const nextMap = {
      ...vocabSrsMap,
      [key]: { ...current, isBookmarked: !current.isBookmarked }
    };
    setVocabSrsMapState(nextMap);
    saveVocabSrsMap(nextMap);
  }, [vocabSrsMap]);

  const toggleGrammarBookmark = useCallback((grammarId) => {
    const key = String(grammarId);
    const current = grammarSrsMap[key] || {
      timesSeen: 0,
      knownCount: 0,
      unknownCount: 0,
      masteryScore: 0,
      intervalDays: 0,
      difficulty: 2.5,
      streak: 0,
      lastSeen: 0,
      nextReview: 0,
      learningState: 'NEW'
    };
    const nextMap = {
      ...grammarSrsMap,
      [key]: { ...current, isBookmarked: !current.isBookmarked }
    };
    setGrammarSrsMapState(nextMap);
    saveGrammarSrsMap(nextMap);
  }, [grammarSrsMap]);

  // Save settings
  const updateSettings = useCallback((newSettings) => {
    setSettingsState(prev => {
      const merged = { ...prev, ...newSettings };
      saveAppSettings(merged);
      return merged;
    });
  }, []);

  // Save test score
  const saveTestResult = useCallback((result) => {
    recordTestScore(result);
    setStatsState(getStudyStats());
  }, []);

  // Export progress
  const exportProgressJson = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      vocabSrs: vocabSrsMap,
      grammarSrs: grammarSrsMap,
      stats,
      settings
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nihongo_jlpt_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [vocabSrsMap, grammarSrsMap, stats, settings]);

  // Import progress
  const importProgressJson = useCallback((jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.vocabSrs) {
        setVocabSrsMapState(parsed.vocabSrs);
        saveVocabSrsMap(parsed.vocabSrs);
      }
      if (parsed.grammarSrs) {
        setGrammarSrsMapState(parsed.grammarSrs);
        saveGrammarSrsMap(parsed.grammarSrs);
      }
      if (parsed.stats) {
        localStorage.setItem('nihongo_study_stats_v1', JSON.stringify(parsed.stats));
        setStatsState(parsed.stats);
      }
      if (parsed.settings) {
        setSettingsState(parsed.settings);
        saveAppSettings(parsed.settings);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, []);

  // Reset progress
  const resetAllProgress = useCallback(() => {
    localStorage.removeItem('nihongo_vocab_srs_v1');
    localStorage.removeItem('nihongo_grammar_srs_v1');
    localStorage.removeItem('nihongo_study_stats_v1');
    setVocabSrsMapState({});
    setGrammarSrsMapState({});
    setStatsState(getStudyStats());
  }, []);

  // Quick stats computed
  const learnedVocabCount = Object.values(vocabSrsMap).filter(s => s && s.learningState !== 'NEW').length;
  const masteredVocabCount = Object.values(vocabSrsMap).filter(s => s && s.learningState === 'MASTERED').length;
  const dueVocabCount = Object.values(vocabSrsMap).filter(s => s && s.learningState !== 'NEW' && s.nextReview <= Date.now()).length;

  return (
    <DataContext.Provider
      value={{
        vocabList,
        grammarList,
        metadata,
        loading,
        error,
        vocabSrsMap,
        grammarSrsMap,
        stats,
        settings,
        learnedVocabCount,
        masteredVocabCount,
        dueVocabCount,
        answerVocabCard,
        answerGrammarCard,
        toggleVocabBookmark,
        toggleGrammarBookmark,
        updateSettings,
        saveTestResult,
        exportProgressJson,
        importProgressJson,
        resetAllProgress,
        rightShelfOpen,
        setRightShelfOpen,
        sandwichDrawerOpen,
        setSandwichDrawerOpen
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
