const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const ROOT_DIR = path.resolve(__dirname, '..');
const BREAKDOWN_DIR = path.join(ROOT_DIR, 'exported_csv_data', 'active_app_data', 'vocabulary_breakdown');
const RELATED_DIR = path.join(ROOT_DIR, 'exported_csv_data', 'active_app_data', 'related_vocabulary');
const GRAMMAR_FILE = path.join(ROOT_DIR, 'exported_csv_data', 'active_app_data', 'grammar', 'jlpt_grammar.csv');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'data');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function parseCsvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse(content, {
    skipEmptyLines: true,
    dynamicTyping: false
  });
  return parsed.data;
}

// 1. Process Related Vocabularies
const relatedMap = new Map(); // key -> list of related words

['n5', 'n4', 'n3'].forEach(level => {
  const relFile = path.join(RELATED_DIR, `jlpt_${level}_related_vocab.csv`);
  if (!fs.existsSync(relFile)) {
    console.warn(`Related file not found: ${relFile}`);
    return;
  }
  const rows = parseCsvFile(relFile);
  if (rows.length < 2) return;

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.length < 6) continue;
    const kanji = (cols[2] || '').trim();
    const kana = (cols[3] || '').trim();
    const key = kanji || kana;
    if (!key) continue;

    const relatedList = [];
    let j = 6;
    while (j < cols.length) {
      const relWord = (cols[j] || '').trim();
      const relReading = (cols[j + 1] || '').trim();
      const relMeaning = (cols[j + 2] || '').trim();
      const relBreakdown = (cols[j + 3] || '').trim();

      if (relWord && relWord !== 'N/A') {
        relatedList.push({
          word: relWord,
          reading: relReading,
          meaning: relMeaning,
          breakdown: (relBreakdown && relBreakdown !== 'N/A') ? relBreakdown : undefined
        });
      }
      j += 4;
    }

    if (relatedList.length > 0) {
      relatedMap.set(key, relatedList);
      if (kanji && kana && kanji !== kana) {
        relatedMap.set(kana, relatedList);
      }
    }
  }
});

console.log(`Loaded related vocabulary entries for ${relatedMap.size} keys.`);

// 2. Process Breakdown CSVs (Vocabulary Track)
const allVocabulary = [];
let vocabIdCounter = 1;

['n5', 'n4', 'n3'].forEach(level => {
  const breakdownFile = path.join(BREAKDOWN_DIR, `jlpt_${level}_breakdown.csv`);
  if (!fs.existsSync(breakdownFile)) {
    console.warn(`Breakdown file not found: ${breakdownFile}`);
    return;
  }
  const rows = parseCsvFile(breakdownFile);
  if (rows.length < 2) return;

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.length < 5) continue;

    const lvl = (cols[1] || level.toUpperCase()).trim();
    const kanji = (cols[2] || '').trim();
    const furigana = (cols[3] || '').trim();
    const type = (cols[4] || 'Noun').trim();
    const meaning = (cols[5] || '').trim();

    const japanese = kanji || furigana;
    const reading = furigana || kanji;
    if (!japanese && !reading) continue;

    // Sub-kanjis & radicals
    const subKanjis = [];
    let j = 6;
    while (j < cols.length - 1) {
      const subKanji = (cols[j] || '').trim();
      const subMeaning = (cols[j + 1] || '').trim();
      if (subKanji && subKanji !== 'N/A' && subMeaning && subMeaning !== 'N/A') {
        subKanjis.push({
          kanji: subKanji,
          meaning: subMeaning
        });
      }
      j += 2;
    }

    const collectiveMeaning = (cols[cols.length - 1] || '').trim();
    const hasCollective = collectiveMeaning && collectiveMeaning !== 'N/A';

    // Lookup related words
    const relatedWords = relatedMap.get(japanese) || relatedMap.get(reading) || [];

    allVocabulary.push({
      id: vocabIdCounter++,
      japanese,
      reading,
      type: type || 'Noun',
      meaning,
      level: lvl,
      subKanjis,
      collectiveMeaning: hasCollective ? collectiveMeaning : null,
      relatedWords
    });
  }
});

console.log(`Processed ${allVocabulary.length} total vocabulary items.`);

// 3. Process Grammar CSV
const allGrammar = [];
if (fs.existsSync(GRAMMAR_FILE)) {
  const gRows = parseCsvFile(GRAMMAR_FILE);
  for (let i = 1; i < gRows.length; i++) {
    const cols = gRows[i];
    if (!cols || cols.length < 5) continue;

    const level = (cols[0] || 'N5').trim();
    const id = parseInt(cols[1], 10) || i;
    const grammar = (cols[2] || '').trim();
    const reading = (cols[3] || '').trim();
    const meaning = (cols[4] || '').trim();

    if (!grammar && !meaning) continue;

    const notes = [];
    for (let n = 5; n <= 9; n++) {
      const note = (cols[n] || '').trim();
      if (note && note !== 'N/A') {
        notes.push(note);
      }
    }

    const source = (cols[10] || '').trim();

    const examples = [];
    let e = 11;
    while (e < cols.length - 1) {
      const jp = (cols[e] || '').trim();
      const en = (cols[e + 1] || '').trim();
      if (jp) {
        examples.push({ japanese: jp, english: en });
      }
      e += 2;
    }

    allGrammar.push({
      id,
      level,
      grammar,
      reading,
      meaning,
      notes: notes.join('\n'),
      source: source || null,
      examples
    });
  }
}

console.log(`Processed ${allGrammar.length} grammar points.`);

// Write JSON files
fs.writeFileSync(path.join(OUTPUT_DIR, 'vocabulary.json'), JSON.stringify(allVocabulary));
fs.writeFileSync(path.join(OUTPUT_DIR, 'grammar.json'), JSON.stringify(allGrammar));

const metadata = {
  totalVocab: allVocabulary.length,
  vocabByLevel: {
    N5: allVocabulary.filter(v => v.level === 'N5').length,
    N4: allVocabulary.filter(v => v.level === 'N4').length,
    N3: allVocabulary.filter(v => v.level === 'N3').length
  },
  totalGrammar: allGrammar.length,
  grammarByLevel: {
    N5: allGrammar.filter(g => g.level === 'N5').length,
    N4: allGrammar.filter(g => g.level === 'N4').length,
    N3: allGrammar.filter(g => g.level === 'N3').length
  },
  builtAt: new Date().toISOString()
};

fs.writeFileSync(path.join(OUTPUT_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));

console.log('Build completed successfully!', metadata);
