import { supabase } from '../lib/supabase';

export const SUPABASE_SCHEMA_SQL = `
-- 1. Snapshot table (Fast universal JSON sync for Web & Android)
CREATE TABLE IF NOT EXISTS sync_snapshots (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Itemized learning state table (for per-word relational sync)
CREATE TABLE IF NOT EXISTS learning_states (
    item_key TEXT PRIMARY KEY,
    vocabulary_id BIGINT,
    level TEXT,
    japanese TEXT,
    reading TEXT,
    times_seen INT DEFAULT 0,
    known_count INT DEFAULT 0,
    unknown_count INT DEFAULT 0,
    mastery_score REAL DEFAULT 0.0,
    interval_days REAL DEFAULT 0.0,
    difficulty REAL DEFAULT 2.5,
    streak INT DEFAULT 0,
    last_seen BIGINT DEFAULT 0,
    next_review BIGINT DEFAULT 0,
    learning_state TEXT DEFAULT 'NEW',
    is_bookmarked BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Public RLS Policies (Allow Anon Read/Write for your personal app)
ALTER TABLE sync_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read/write sync_snapshots" 
ON sync_snapshots FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write learning_states" 
ON learning_states FOR ALL TO anon USING (true) WITH CHECK (true);
`;

/**
 * Test connectivity to Supabase
 */
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('sync_snapshots')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        // relation does not exist
        return { connected: true, tablesExist: false, error: 'Table sync_snapshots does not exist yet. Run the SQL schema in Supabase.' };
      }
      return { connected: false, error: error.message };
    }

    return { connected: true, tablesExist: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

/**
 * Push current progress snapshot to Supabase
 */
export async function pushProgressToSupabase({ vocabSrsMap, grammarSrsMap, stats, settings }) {
  try {
    const payload = {
      version: 1,
      source: 'web',
      updatedAt: new Date().toISOString(),
      vocabSrs: vocabSrsMap,
      grammarSrs: grammarSrsMap,
      stats,
      settings
    };

    const { error: snapError } = await supabase
      .from('sync_snapshots')
      .upsert({
        id: 'latest_progress',
        payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (snapError) {
      console.warn('Supabase snapshot upsert error:', snapError);
      return { success: false, error: snapError.message };
    }

    // Optional: Also sync top modified learning states
    try {
      const rows = Object.entries(vocabSrsMap)
        .filter(([, s]) => s && s.timesSeen > 0)
        .slice(0, 500) // safeguard batch size
        .map(([key, s]) => ({
          item_key: String(key),
          times_seen: s.timesSeen || 0,
          known_count: s.knownCount || 0,
          unknown_count: s.unknownCount || 0,
          mastery_score: s.masteryScore || 0,
          interval_days: s.intervalDays || 0,
          difficulty: s.difficulty || 2.5,
          streak: s.streak || 0,
          last_seen: s.lastSeen || 0,
          next_review: s.nextReview || 0,
          learning_state: s.learningState || 'NEW',
          is_bookmarked: !!s.isBookmarked,
          updated_at: new Date().toISOString()
        }));

      if (rows.length > 0) {
        await supabase.from('learning_states').upsert(rows, { onConflict: 'item_key' });
      }
    } catch (e) {
      // Non-fatal if relational table not yet configured
      console.log('Relational sync skipped or deferred:', e.message);
    }

    return { success: true, timestamp: Date.now() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Pull latest progress snapshot from Supabase
 */
export async function pullProgressFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('sync_snapshots')
      .select('payload, updated_at')
      .eq('id', 'latest_progress')
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || !data.payload) {
      return { success: false, error: 'No existing progress found on Supabase cloud.' };
    }

    return {
      success: true,
      payload: data.payload,
      updatedAt: data.updated_at
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
