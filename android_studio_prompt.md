# Gemini Android Studio Prompt: Supabase 2-Way Progress Sync

Copy and paste everything below into **Gemini in Android Studio** to automatically implement bidirectional synchronization between this Android app (`jlpt_learning_app`) and the JLPT Web App.

---

```markdown
You are an expert Android developer specializing in Kotlin, Android Architecture Components, Room SQLite, and Coroutines.

### TASK:
Implement 2-way cloud progress synchronization with Supabase for our Android JLPT app (`com.nihongo.app`).
This will keep flashcard SRS learning states, intervals, mastery scores, and streaks synchronized with our JLPT Web App.

---

### 1. SUPABASE CREDENTIALS & CONFIGURATION
- **Supabase URL**: `https://fqtucqexdfwztsnfxfbl.supabase.co`
- **Supabase Publishable Key**: `sb_publishable_WpfKpgUzxO_cy6-cYMt__Q_5rx7n3w3`
- **Target Table in Supabase**: `sync_snapshots` (and optional relational table `learning_states`)

The Supabase project has the following table schema:
```sql
CREATE TABLE IF NOT EXISTS sync_snapshots (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sync_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read/write sync_snapshots" 
ON sync_snapshots FOR ALL TO anon USING (true) WITH CHECK (true);
```

The payload structure stored in `sync_snapshots` with `id = 'latest_progress'` is:
```json
{
  "version": 1,
  "source": "android",
  "updatedAt": "2026-10-15T01:30:00.000Z",
  "vocabSrs": {
    "1": {
      "timesSeen": 5,
      "knownCount": 4,
      "unknownCount": 1,
      "masteryScore": 0.45,
      "intervalDays": 6.0,
      "difficulty": 2.5,
      "streak": 3,
      "lastSeen": 1792000000000,
      "nextReview": 1792691200000,
      "learningState": "REVIEW",
      "isBookmarked": false
    }
  },
  "stats": {
    "streakDays": 4,
    "totalReviews": 120
  }
}
```

---

### 2. EXISTING ANDROID ROOM ARCHITECTURE
Review our existing classes in `com.nihongo.app`:
1. `com.nihongo.app.data.database.entity.LearningStateEntity`:
   - `id: Long`
   - `vocabularyId: Long`
   - `timesSeen: Int`
   - `knownCount: Int`
   - `unknownCount: Int`
   - `masteryScore: Float`
   - `intervalDays: Float`
   - `difficulty: Float`
   - `streak: Int`
   - `lastSeen: Long`
   - `nextReview: Long`
   - `starred: Boolean`
   - `learningState: String` ("NEW", "LEARNING", "REVIEW", "MASTERED")

2. `com.nihongo.app.data.database.dao.LearningStateDao`:
   - `getLearningStateForWord(vocabularyId: Long): LearningStateEntity?`
   - `getAllLearningStatesSync(): List<LearningStateEntity>`
   - `updateLearningState(state: LearningStateEntity)`
   - `insertLearningState(state: LearningStateEntity)`

3. `com.nihongo.app.ui.study.StudyViewModel`:
   - Manages flashcard sessions and calls `learningStateDao.updateLearningState(updatedState)`.

---

### 3. WHAT YOU NEED TO IMPLEMENT

Please write clean, production-ready Kotlin code for the following:

#### Step 1: Add Dependencies (if missing)
In `app/build.gradle.kts`:
- Ensure `com.squareup.okhttp3:okhttp` (or `io.ktor`) and `com.google.code.gson:gson` (or `kotlinx.serialization`) are available for HTTP REST calls to Supabase PostgREST.

#### Step 2: Create `SupabaseSyncManager.kt`
Create a singleton or injectable class in `com.nihongo.app.data.sync.SupabaseSyncManager`:
- It should use OkHttp with headers:
  - `apikey: sb_publishable_WpfKpgUzxO_cy6-cYMt__Q_5rx7n3w3`
  - `Authorization: Bearer sb_publishable_WpfKpgUzxO_cy6-cYMt__Q_5rx7n3w3`
  - `Content-Type: application/json`
  - `Prefer: resolution=merge-duplicates`
- Provide `suspend fun pushProgressToCloud(context: Context): Result<Unit>`:
  - Queries all local states via `database.learningStateDao().getAllLearningStatesSync()`.
  - Builds the JSON payload mapping `vocabularyId` -> state attributes.
  - Sends an upsert request via `POST https://fqtucqexdfwztsnfxfbl.supabase.co/rest/v1/sync_snapshots`.
- Provide `suspend fun pullProgressFromCloud(context: Context): Result<Unit>`:
  - Sends a `GET https://fqtucqexdfwztsnfxfbl.supabase.co/rest/v1/sync_snapshots?id=eq.latest_progress&select=payload,updated_at`.
  - Parses the JSON payload `vocabSrs`.
  - Upserts/updates each `LearningStateEntity` in Room for the matching `vocabularyId`.

#### Step 3: Hook into `StudyViewModel.kt`
- When a study session is completed (`_sessionComplete.value = true`), trigger `pushProgressToCloud` in a background coroutine (`viewModelScope.launch(Dispatchers.IO)`).
- Handle offline / no internet scenarios gracefully without throwing uncaught exceptions or blocking the UI.

#### Step 4: UI Trigger
- Provide a "Sync with Cloud" button and status text in the Settings or Study screen that lets the user manually trigger pull/push and shows "Synced just now" or "Offline".

Please output the code with exact file paths and clear instructions on where to place each snippet.
```
