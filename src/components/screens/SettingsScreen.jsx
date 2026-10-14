import React, { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  Download, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  Info, 
  Sparkles,
  Eye,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { speakJapanese } from '../../utils/tts';

export default function SettingsScreen() {
  const { 
    settings, 
    updateSettings, 
    exportProgressJson, 
    importProgressJson, 
    resetAllProgress,
    metadata
  } = useData();

  const [confirmReset, setConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleSpeechRateChange = (e) => {
    updateSettings({ speechRate: parseFloat(e.target.value) });
  };

  const handleTestAudio = () => {
    speakJapanese('日本語の音声テストです。スムーズに再生されます。', settings.speechRate || 1.0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importProgressJson(content);
        if (res.success) {
          setImportStatus('success');
        } else {
          setImportStatus('error: ' + res.error);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Settings Header */}
      <div className="acrylic-surface rounded-3xl p-6 sm:p-7 border border-[var(--md-sys-color-outline)] shadow-xl">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-1">
          <SettingsIcon size={22} className="text-[var(--md-sys-color-primary)]" />
          Settings & Data Management
        </h2>
        <p className="text-xs text-gray-400">
          Customize audio rates, study session behavior, and backup your SRS progress
        </p>
      </div>

      {/* Audio & Pronunciation Card */}
      <div className="acrylic-card rounded-3xl p-6 border border-[rgba(255,255,255,0.06)] space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Volume2 size={18} className="text-[var(--md-sys-color-primary)]" />
          <span>Japanese Text-to-Speech (TTS)</span>
        </div>

        {/* Speech rate slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 font-medium">Pronunciation Speed</span>
            <span className="font-mono text-[var(--md-sys-color-primary)] font-bold">
              {settings.speechRate || 1.0}x
            </span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.05"
            value={settings.speechRate || 1.0}
            onChange={handleSpeechRateChange}
            className="w-full accent-[var(--md-sys-color-primary)] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>0.7x (Slow & Clear)</span>
            <span>1.0x (Standard)</span>
            <span>1.3x (Native Fast)</span>
          </div>
        </div>

        {/* Auto-play toggle */}
        <div className="flex items-center justify-between py-2 border-t border-[rgba(255,255,255,0.06)]">
          <div>
            <div className="text-xs font-semibold text-white">Auto-play Pronunciation</div>
            <div className="text-[11px] text-gray-400">Automatically speak the word when card appears</div>
          </div>
          <button
            onClick={() => updateSettings({ autoPlayAudio: !settings.autoPlayAudio })}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              settings.autoPlayAudio ? 'bg-[var(--md-sys-color-primary)]' : 'bg-white/10'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#002B4C] absolute top-1 transition-transform ${
                settings.autoPlayAudio ? 'translate-x-6 bg-[#002B4C]' : 'translate-x-1 bg-white'
              }`}
            />
          </button>
        </div>

        {/* Test voice button */}
        <button
          onClick={handleTestAudio}
          className="btn-m3 btn-tonal py-2.5 px-4 text-xs font-semibold w-full sm:w-auto"
        >
          <Volume2 size={14} /> Test Audio Output
        </button>
      </div>

      {/* Study Session Preferences */}
      <div className="acrylic-card rounded-3xl p-6 border border-[rgba(255,255,255,0.06)] space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Sparkles size={18} className="text-purple-400" />
          <span>Flashcard Study Preferences</span>
        </div>

        {/* Daily New Limit */}
        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <div className="font-semibold text-white">Daily New Cards Limit</div>
            <div className="text-[11px] text-gray-400">Target number of fresh words introduced daily</div>
          </div>
          <select
            value={settings.dailyNewLimit || 20}
            onChange={(e) => updateSettings({ dailyNewLimit: parseInt(e.target.value, 10) })}
            className="bg-[#0E131F] border border-[rgba(255,255,255,0.1)] text-white text-xs rounded-xl px-3 py-1.5 outline-none"
          >
            <option value={10}>10 words</option>
            <option value={20}>20 words (Standard)</option>
            <option value={30}>30 words</option>
            <option value={50}>50 words</option>
          </select>
        </div>
      </div>

      {/* Backup & Progress Sync */}
      <div className="acrylic-card rounded-3xl p-6 border border-[rgba(255,255,255,0.06)] space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <ShieldCheck size={18} className="text-emerald-400" />
          <span>Progress Backup & Data Sync</span>
        </div>
        <p className="text-xs text-gray-400">
          All your intervals, retention mastery, streaks, and quiz results are stored locally in your browser. Export a JSON backup to transfer your progress anywhere.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportProgressJson}
            className="btn-m3 btn-glass py-2.5 px-4 text-xs font-semibold flex items-center gap-2"
          >
            <Download size={15} /> Export Backup (JSON)
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-m3 btn-glass py-2.5 px-4 text-xs font-semibold flex items-center gap-2"
          >
            <Upload size={15} /> Import Backup (JSON)
          </button>
        </div>

        {importStatus && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            importStatus === 'success' 
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-300 border border-red-500/20'
          }`}>
            {importStatus === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{importStatus === 'success' ? 'Backup restored successfully!' : importStatus}</span>
          </div>
        )}

        {/* Danger zone: Reset */}
        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
          {confirmReset ? (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3">
              <div className="text-xs text-red-200 font-bold flex items-center gap-1.5">
                <AlertTriangle size={15} /> Confirm Reset All Learning Progress?
              </div>
              <p className="text-[11px] text-gray-300">
                This will clear all SRS stages, intervals, and study streaks. This action cannot be undone unless you have an exported backup.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    resetAllProgress();
                    setConfirmReset(false);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all"
                >
                  Yes, Reset Everything
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={14} /> Reset all study intervals and history
            </button>
          )}
        </div>
      </div>

      {/* Dataset & Architecture Info */}
      <div className="acrylic-card rounded-3xl p-6 border border-[rgba(255,255,255,0.06)] space-y-3 text-xs text-gray-400">
        <div className="flex items-center gap-2 font-bold text-gray-300">
          <Info size={16} className="text-[var(--md-sys-color-primary)]" />
          <span>Dataset Co-Relation & Room SQLite Schema Match</span>
        </div>
        <p className="leading-relaxed">
          This web application operates directly on the correlated JLPT N5, N4, and N3 data from <code className="text-white font-mono bg-white/5 px-1 rounded">/exported_csv_data</code>, including radical breakdowns, collective mnemonics, compound word relations, and natural usage grammar examples.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono text-gray-300">
          <div className="p-2 rounded-xl bg-white/5">Vocab: 3,521</div>
          <div className="p-2 rounded-xl bg-white/5">Grammar: 831</div>
          <div className="p-2 rounded-xl bg-white/5">Radicals: 12-slot</div>
          <div className="p-2 rounded-xl bg-white/5">Examples: 8,300+</div>
        </div>
      </div>
    </div>
  );
}
