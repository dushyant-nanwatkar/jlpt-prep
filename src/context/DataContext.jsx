import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
import {
  pushProgressToSupabase,
  pullProgressFromSupabase,
  testSupabaseConnection,
  SUPABASE_SCHEMA_SQL
} from '../utils/supabaseSync';

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

  // Cloud Sync state
  const [cloudSyncStatus, setCloudSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [cloudSyncError, setCloudSyncError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => {
    return localStorage.getItem('nihongo_last_cloud_sync') || null;
  });
  const autoSyncTimerRef = useRef(null);


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

        const normalizedGrammars = (Array.isArray(grammars) ? grammars : []).map((g, idx) => ({
          ...g,
          uniqueId: `${g.level || 'JLPT'}_${g.id || idx}`,
          pattern: g.grammar || g.pattern || '',
          grammar: g.grammar || g.pattern || '',
          reading: g.reading || '',
          meaning: g.meaning || '',
          notes: g.notes || '',
          usage: g.usage || g.notes || '',
          examples: (g.examples || []).map(ex => ({
            ...ex,
            japanese: ex.japanese || ex.sentence || '',
            sentence: ex.japanese || ex.sentence || '',
            english: ex.english || ex.translation || '',
            translation: ex.english || ex.translation || ''
          }))
        }));

        setMetadata(metaData);
        setVocabList(normalizedVocabs);
        setGrammarList(normalizedGrammars);
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

  // Push to Supabase Cloud
  const triggerCloudPush = useCallback(async () => {
    setCloudSyncStatus('syncing');
    setCloudSyncError(null);
    const res = await pushProgressToSupabase({
      vocabSrsMap,
      grammarSrsMap,
      stats,
      settings
    });
    if (res.success) {
      setCloudSyncStatus('synced');
      const nowIso = new Date().toISOString();
      setLastSyncedAt(nowIso);
      localStorage.setItem('nihongo_last_cloud_sync', nowIso);
      setTimeout(() => setCloudSyncStatus('idle'), 3000);
      return { success: true };
    } else {
      setCloudSyncStatus('error');
      setCloudSyncError(res.error);
      return { success: false, error: res.error };
    }
  }, [vocabSrsMap, grammarSrsMap, stats, settings]);

  // Pull from Supabase Cloud
  const triggerCloudPull = useCallback(async () => {
    setCloudSyncStatus('syncing');
    setCloudSyncError(null);
    const res = await pullProgressFromSupabase();
    if (res.success && res.payload) {
      const p = res.payload;
      if (p.vocabSrs) {
        setVocabSrsMapState(p.vocabSrs);
        saveVocabSrsMap(p.vocabSrs);
      }
      if (p.grammarSrs) {
        setGrammarSrsMapState(p.grammarSrs);
        saveGrammarSrsMap(p.grammarSrs);
      }
      if (p.stats) {
        setStatsState(p.stats);
        localStorage.setItem('nihongo_study_stats_v1', JSON.stringify(p.stats));
      }
      if (p.settings) {
        setSettingsState(p.settings);
        saveAppSettings(p.settings);
      }
      setCloudSyncStatus('synced');
      const syncTime = res.updatedAt || new Date().toISOString();
      setLastSyncedAt(syncTime);
      localStorage.setItem('nihongo_last_cloud_sync', syncTime);
      setTimeout(() => setCloudSyncStatus('idle'), 3000);
      return { success: true };
    } else {
      setCloudSyncStatus('error');
      setCloudSyncError(res.error || 'Failed to pull cloud progress');
      return { success: false, error: res.error };
    }
  }, []);

  // Debounced auto-push to Supabase on state change (every 5 seconds of stillness)
  useEffect(() => {
    if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    autoSyncTimerRef.current = setTimeout(() => {
      const hasReviews = Object.values(vocabSrsMap).some(s => s && s.timesSeen > 0);
      if (hasReviews) {
        pushProgressToSupabase({ vocabSrsMap, grammarSrsMap, stats, settings })
          .then(res => {
            if (res.success) {
              const nowIso = new Date().toISOString();
              setLastSyncedAt(nowIso);
              localStorage.setItem('nihongo_last_cloud_sync', nowIso);
            }
          })
          .catch(() => {});
      }
    }, 5000);

    return () => {
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    };
  }, [vocabSrsMap, grammarSrsMap, stats, settings]);

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
        setSandwichDrawerOpen,
        // Supabase Cloud Sync
        cloudSyncStatus,
        cloudSyncError,
        lastSyncedAt,
        triggerCloudPush,
        triggerCloudPull,
        testSupabaseConnection
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
