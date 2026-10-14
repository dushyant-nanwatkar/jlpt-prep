// Web Speech API wrapper with Japanese Voice discovery and speed control
let japaneseVoice = null;
let voicesLoaded = false;

function initVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const updateVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural/Google/Apple Japanese voices
    japaneseVoice = 
      voices.find(v => v.lang.startsWith('ja') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Kyoko') || v.name.includes('Otoya'))) ||
      voices.find(v => v.lang.startsWith('ja') || v.lang === 'ja_JP' || v.lang === 'ja-JP') ||
      null;
    voicesLoaded = true;
  };

  updateVoice();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoice;
  }
}

initVoices();

export function speakJapanese(text, rate = 1.0) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (!text) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending utterance
    const cleanText = text.replace(/[\(\)\[\]\{\}「」『』]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ja-JP';
    utterance.rate = Math.max(0.5, Math.min(2.0, rate));

    if (japaneseVoice) {
      utterance.voice = japaneseVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('TTS playback error:', err);
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
