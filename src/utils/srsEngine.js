// Spaced Repetition (SRS) Engine inspired by Anki SM-2 and Nihongo Android App
const STORAGE_KEY_VOCAB_SRS = 'nihongo_vocab_srs_v1';
const STORAGE_KEY_GRAMMAR_SRS = 'nihongo_grammar_srs_v1';
const STORAGE_KEY_STATS = 'nihongo_study_stats_v1';
const STORAGE_KEY_SETTINGS = 'nihongo_app_settings_v1';

export const DeckOrdering = {
  ANKI_DAILY: { id: 'ANKI_DAILY', label: 'Daily Study (Due + 20 New)', desc: 'Standard Anki daily mix of due cards & fresh items' },
  REVIEW_DUE: { id: 'REVIEW_DUE', label: 'All Due Reviews', desc: 'Prioritize overdue items that need immediate reinforcement' },
  NEW_ONLY: { id: 'NEW_ONLY', label: 'New Words Only', desc: 'Focus strictly on discovering unstudied vocabulary' },
  RANDOM: { id: 'RANDOM', label: 'Random Shuffle', desc: 'Study across the entire level without SRS constraints' },
  ASCENDING: { id: 'ASCENDING', label: 'Sequential Order', desc: 'Canonical list order from seed syllabus' }
};

export const Answer = {
  AGAIN: 'AGAIN',
  HARD: 'HARD',
  GOOD: 'GOOD',
  EASY: 'EASY'
};

// Retrieve loaded states from localStorage
export function getVocabSrsMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOCAB_SRS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load vocab SRS state:', e);
    return {};
  }
}

export function saveVocabSrsMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY_VOCAB_SRS, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save vocab SRS state:', e);
  }
}

export function getGrammarSrsMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GRAMMAR_SRS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load grammar SRS state:', e);
    return {};
  }
}

export function saveGrammarSrsMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY_GRAMMAR_SRS, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save grammar SRS state:', e);
  }
}

// User settings
export function getAppSettings() {
  const defaults = {
    speechRate: 1.0,
    autoPlayAudio: false,
    dailyNewLimit: 20,
    studyLevel: 'All',
    showRomaji: true,
    showSubKanji: true,
    amoledTrueBlack: true
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

export function saveAppSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

// Stats tracking for dashboard
export function getStudyStats() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaults = {
    lastStudyDate: todayStr,
    streakDays: 0,
    studiedToday: 0,
    totalReviews: 0,
    testScores: []
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (!raw) return defaults;
    const stats = JSON.parse(raw);

    // If day changed, reset today count; manage streak
    if (stats.lastStudyDate !== todayStr) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (stats.lastStudyDate === yesterday) {
        // streak continues
      } else {
        // streak broken if more than 1 day missed
        stats.streakDays = 0;
      }
      stats.lastStudyDate = todayStr;
      stats.studiedToday = 0;
    }
    return { ...defaults, ...stats };
  } catch {
    return defaults;
  }
}

export function recordStudyAction(isSuccess) {
  const stats = getStudyStats();
  stats.totalReviews += 1;
  stats.studiedToday += 1;
  if (stats.streakDays === 0) {
    stats.streakDays = 1;
  }
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  } catch (e) {
    console.error(e);
  }
  return stats;
}

export function recordTestScore(testResult) {
  const stats = getStudyStats();
  if (!stats.testScores) stats.testScores = [];
  stats.testScores.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    ...testResult
  });
  if (stats.testScores.length > 30) stats.testScores = stats.testScores.slice(0, 30);
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  } catch (e) {
    console.error(e);
  }
}

// Calculate next SRS state from card review
export function calculateNextSrs(currentState = null, answer) {
  const state = currentState || {
    timesSeen: 0,
    knownCount: 0,
    unknownCount: 0,
    masteryScore: 0,
    intervalDays: 0,
    difficulty: 2.5,
    streak: 0,
    lastSeen: 0,
    nextReview: 0,
    learningState: 'NEW',
    isBookmarked: false
  };

  let newDifficulty = state.difficulty || 2.5;
  let newStreak = state.streak || 0;
  let newInterval = state.intervalDays || 0;

  switch (answer) {
    case Answer.AGAIN:
      newDifficulty = Math.max(1.3, newDifficulty - 0.2);
      newStreak = 0;
      newInterval = 0; // immediate review
      break;

    case Answer.HARD:
      newDifficulty = Math.max(1.3, newDifficulty - 0.15);
      if (newStreak === 0) {
        newInterval = 1;
      } else {
        newInterval = Math.max(1, Math.round(newInterval * 1.2));
      }
      newStreak += 1;
      break;

    case Answer.GOOD:
      if (newStreak === 0) {
        newInterval = 1;
      } else if (newStreak === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.max(1, Math.round(newInterval * newDifficulty));
      }
      newStreak += 1;
      break;

    case Answer.EASY:
      newDifficulty = Math.min(3.0, newDifficulty + 0.15);
      if (newStreak === 0) {
        newInterval = 2;
      } else if (newStreak === 1) {
        newInterval = 8;
      } else {
        newInterval = Math.max(2, Math.round(newInterval * (newDifficulty * 1.3)));
      }
      newStreak += 1;
      break;

    default:
      break;
  }

  const now = Date.now();
  // Next review timestamp in milliseconds
  const nextReviewMs = now + (newInterval * 24 * 60 * 60 * 1000);
  const newMastery = Math.min(1.0, Number((newInterval / 21).toFixed(2)));

  let newStateStr = 'NEW';
  if (newInterval >= 21) {
    newStateStr = 'MASTERED';
  } else if (newInterval >= 7) {
    newStateStr = 'REVIEW';
  } else if (newInterval > 0) {
    newStateStr = 'LEARNING';
  }

  return {
    ...state,
    timesSeen: (state.timesSeen || 0) + 1,
    knownCount: (state.knownCount || 0) + (answer !== Answer.AGAIN ? 1 : 0),
    unknownCount: (state.unknownCount || 0) + (answer === Answer.AGAIN ? 1 : 0),
    masteryScore: newMastery,
    intervalDays: newInterval,
    difficulty: Number(newDifficulty.toFixed(2)),
    streak: newStreak,
    lastSeen: now,
    nextReview: nextReviewMs,
    learningState: newStateStr
  };
}

// Deck builder according to selected ordering strategy
export function buildStudyDeck({ items = [], srsMap = {}, ordering = 'ANKI_DAILY', maxNew = 20 }) {
  const now = Date.now();

  const decorated = items.map(item => {
    const key = String(item.id);
    const srs = srsMap[key] || null;
    const isDue = srs && srs.learningState !== 'NEW' && srs.nextReview <= now;
    const isNew = !srs || srs.learningState === 'NEW';
    return {
      item: { ...item, srs },
      srs,
      isDue,
      isNew
    };
  });

  const strat = ordering === 'srs' ? 'ANKI_DAILY' : ordering;

  let result = [];
  switch (strat) {
    case 'ANKI_DAILY': {
      const due = decorated.filter(d => d.isDue);
      const fresh = decorated.filter(d => d.isNew).slice(0, maxNew);
      result = shuffleArray([...due, ...fresh]);
      // If no due cards and no new cards left, fallback to random active review items or fresh items
      if (result.length === 0 && items.length > 0) {
        result = shuffleArray(decorated).slice(0, maxNew);
      }
      break;
    }

    case 'REVIEW_DUE': {
      result = decorated
        .filter(d => d.isDue)
        .sort((a, b) => (a.srs?.nextReview || 0) - (b.srs?.nextReview || 0));
      break;
    }

    case 'NEW_ONLY': {
      result = shuffleArray(decorated.filter(d => d.isNew)).slice(0, maxNew);
      break;
    }

    case 'RANDOM': {
      result = shuffleArray(decorated);
      break;
    }

    case 'ASCENDING':
    default: {
      result = decorated.sort((a, b) => (a.item.id || 0) - (b.item.id || 0));
      break;
    }
  }

  return result.map(d => d.item);
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
