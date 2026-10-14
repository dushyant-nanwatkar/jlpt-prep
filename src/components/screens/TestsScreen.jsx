import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Clock, Zap, BarChart3,
  RotateCcw, ChevronRight, Trophy, Target,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

const QUESTION_COUNT = 15;
const LEVEL_COLORS = { N5: '#52D68A', N4: '#64B5F6', N3: '#CE93D8', All: '#9ECAFE' };

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function buildQuestions(vocabList, grammarList, levelFilter, count) {
  let pool = [...vocabList];
  if (levelFilter !== 'All') pool = pool.filter(w => w.level === levelFilter);
  if (pool.length < 4) return [];

  return shuffle(pool).slice(0, count).map((word) => {
    const distractors = shuffle(pool.filter(w => w.id !== word.id)).slice(0, 3).map(w => w.meaning);
    const choices = shuffle([word.meaning, ...distractors]);
    return { word, correctAnswer: word.meaning, choices };
  });
}

export default function TestsScreen() {
  const { vocabList, grammarList, saveTestResult } = useData();
  const [phase, setPhase] = useState('config'); // config | quiz | review
  const [levelFilter, setLevelFilter] = useState('All');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [timerRef, setTimerRef] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (phase === 'quiz') {
      const id = setInterval(() => setElapsed(e => e + 1), 1000);
      setTimerRef(id);
      return () => clearInterval(id);
    } else {
      if (timerRef) clearInterval(timerRef);
    }
  }, [phase]);

  const startQuiz = () => {
    const qs = buildQuestions(vocabList, grammarList, levelFilter, QUESTION_COUNT);
    if (!qs.length) return;
    setQuestions(qs);
    setAnswers({});
    setCurrentQ(0);
    setElapsed(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setPhase('quiz');
  };

  const handleAnswer = useCallback((answer) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    setShowResult(true);

    const q = questions[currentQ];
    const correct = answer === q.correctAnswer;
    const newAnswers = { ...answers, [currentQ]: { answer, correct } };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        const correctCount = Object.values(newAnswers).filter(a => a.correct).length;
        const total = questions.length;
        const passed = total > 0 ? (correctCount / total) >= 0.7 : false;
        saveTestResult?.({
          date: new Date().toISOString(),
          level: levelFilter,
          type: 'Vocabulary',
          total: total,
          totalQuestions: total,
          correct: correctCount,
          score: correctCount,
          passed: passed,
          timeSec: elapsed,
          elapsedSeconds: elapsed,
        });
        setPhase('review');
      } else {
        setCurrentQ(i => i + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      }
    }, 900);
  }, [selectedAnswer, currentQ, questions, answers, elapsed, levelFilter, saveTestResult]);

  const correctCount = Object.values(answers).filter(a => a.correct).length;
  const totalQ = questions.length;

  // Config screen
  if (phase === 'config') {
    return (
      <div className="relative min-h-screen pb-24 lg:pb-8">
        <div className="ambient-bg" aria-hidden>
          <div className="ambient-orb" style={{ width: 600, height: 600, top: -200, right: -200, background: '#FFD180' }} />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(255,209,128,0.1)', border: '1px solid rgba(255,209,128,0.25)', boxShadow: '0 0 40px rgba(255,209,128,0.15)' }}>
              <Target size={36} style={{ color: '#FFD180' }} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">JLPT Practice Quiz</h2>
            <p className="text-sm text-white/50">{QUESTION_COUNT} multiple-choice vocabulary questions</p>
          </div>

          <div className="p-5 rounded-3xl mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="section-label mb-3">JLPT Level</div>
            <div className="grid grid-cols-2 gap-2">
              {['All', 'N5', 'N4', 'N3'].map(lvl => {
                const isSelected = levelFilter === lvl;
                const color = LEVEL_COLORS[lvl];
                return (
                  <button key={lvl} onClick={() => setLevelFilter(lvl)}
                    className="py-3 rounded-2xl font-bold text-sm transition-all"
                    style={isSelected
                      ? { background: `${color}18`, border: `1px solid ${color}50`, color, boxShadow: `0 0 20px ${color}25` }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
                    }>
                    {lvl === 'All' ? 'Mixed (All)' : lvl}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Questions', val: QUESTION_COUNT, icon: Target },
              { label: 'Mode', val: 'SRS', icon: Zap },
              { label: 'Timer', val: 'Free', icon: Clock },
            ].map(({ label, val, icon: Icon }) => (
              <div key={label} className="p-3 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Icon size={16} className="mx-auto mb-1.5 text-white/30" />
                <div className="text-sm font-bold text-white">{val}</div>
                <div className="text-[10px] text-white/35">{label}</div>
              </div>
            ))}
          </div>

          <button onClick={startQuiz}
            disabled={!vocabList.length}
            className="btn btn-filled w-full py-4 text-base font-black">
            <Zap size={18} /> Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // Quiz screen
  if (phase === 'quiz') {
    const q = questions[currentQ];
    if (!q) return null;
    const progressPct = (currentQ / questions.length) * 100;
    const fmt = `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`;

    return (
      <div className="relative min-h-screen pb-24 lg:pb-8">
        <div className="relative z-10 max-w-lg mx-auto px-4 py-6">
          {/* Top meta */}
          <div className="flex items-center justify-between mb-4">
            <span className="section-label">{currentQ + 1} / {questions.length}</span>
            <div className="flex items-center gap-1.5 mono text-sm font-bold" style={{ color: '#9ECAFE' }}>
              <Clock size={14} /> {fmt}
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-bar mb-6">
            <div className="progress-fill" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #FFD180, #FF9D5E)' }} />
          </div>

          {/* Question card */}
          <div className="p-6 rounded-3xl mb-5 card-shine" style={{ background: 'linear-gradient(145deg, rgba(14,19,32,0.95), rgba(8,11,20,0.98))', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 0 0 1px rgba(158,202,254,0.06), 0 20px 60px rgba(0,0,0,0.8)' }}>
            <div className="section-label mb-3">What is the meaning of:</div>
            <div className="text-center">
              <div className="jp font-black text-white mb-2" style={{ fontSize: '4rem', lineHeight: 1.1 }}>
                {q.word.word}
              </div>
              {q.word.reading && q.word.reading !== q.word.word && (
                <div className="jp text-lg" style={{ color: '#9ECAFE' }}>{q.word.reading}</div>
              )}
              {q.word.level && (
                <span className={`badge-${q.word.level?.toLowerCase() || 'all'} mt-2 inline-flex`}>{q.word.level}</span>
              )}
            </div>
          </div>

          {/* Choices */}
          <div className="space-y-2.5">
            {q.choices.map((choice, i) => {
              const isSelected = selectedAnswer === choice;
              const isCorrect = choice === q.correctAnswer;
              let style = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' };

              if (showResult && isCorrect) {
                style = { background: 'rgba(117,240,186,0.14)', border: '1px solid rgba(117,240,186,0.5)', color: '#75F0BA', boxShadow: '0 0 20px rgba(117,240,186,0.2)' };
              } else if (showResult && isSelected && !isCorrect) {
                style = { background: 'rgba(255,90,80,0.14)', border: '1px solid rgba(255,90,80,0.5)', color: '#FF8A80', boxShadow: '0 0 20px rgba(255,90,80,0.2)' };
              } else if (isSelected && !showResult) {
                style = { background: 'rgba(158,202,254,0.1)', border: '1px solid rgba(158,202,254,0.4)', color: '#9ECAFE' };
              }

              return (
                <button key={i} onClick={() => handleAnswer(choice)}
                  className="w-full text-left px-5 py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-between group"
                  style={style}
                  disabled={!!selectedAnswer}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                      style={showResult && isCorrect
                        ? { background: '#75F0BA', color: '#002B4C' }
                        : showResult && isSelected
                          ? { background: '#FF8A80', color: '#002B4C' }
                          : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }
                      }>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {choice}
                  </div>
                  {showResult && isCorrect && <CheckCircle2 size={17} />}
                  {showResult && isSelected && !isCorrect && <XCircle size={17} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Review / Results screen
  const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
  const resultColor = accuracy >= 80 ? '#75F0BA' : accuracy >= 60 ? '#FFD180' : '#FF8A80';
  const fmt = `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative min-h-screen pb-24 lg:pb-8">
      <div className="ambient-bg" aria-hidden>
        <div className="ambient-orb" style={{ width: 600, height: 600, top: -100, right: -100, background: resultColor }} />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 py-8">
        {/* Result hero */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center"
            style={{ background: `${resultColor}18`, border: `1px solid ${resultColor}40`, boxShadow: `0 0 50px ${resultColor}25` }}>
            <Trophy size={36} style={{ color: resultColor }} />
          </div>
          <div className="text-5xl font-black mb-1" style={{ color: resultColor }}>{accuracy}%</div>
          <div className="text-white/50 text-sm">{correctCount} of {totalQ} correct · {fmt}</div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Correct', val: correctCount, color: '#75F0BA' },
            { label: 'Wrong', val: totalQ - correctCount, color: '#FF8A80' },
            { label: 'Time', val: fmt, color: '#9ECAFE' },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-2xl font-black" style={{ color }}>{val}</div>
              <div className="text-[11px] text-white/35">{label}</div>
            </div>
          ))}
        </div>

        {/* Answer review */}
        <div className="space-y-2 mb-6">
          {questions.map((q, i) => {
            const ans = answers[i];
            const correct = ans?.correct;
            return (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl"
                style={{ background: correct ? 'rgba(117,240,186,0.07)' : 'rgba(255,90,80,0.07)', border: `1px solid ${correct ? 'rgba(117,240,186,0.22)' : 'rgba(255,90,80,0.22)'}` }}>
                {correct
                  ? <CheckCircle2 size={17} style={{ color: '#75F0BA' }} className="flex-shrink-0 mt-0.5" />
                  : <XCircle size={17} style={{ color: '#FF8A80' }} className="flex-shrink-0 mt-0.5" />
                }
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="jp font-black text-white">{q.word.word}</span>
                    <span className="text-[10px] text-white/40">{q.word.reading}</span>
                  </div>
                  <div className="text-xs text-white/55">✓ {q.correctAnswer}</div>
                  {!correct && <div className="text-xs" style={{ color: '#FF8A80' }}>✗ {ans?.answer}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={startQuiz} className="btn btn-filled flex-1 py-3 text-sm">
            <RotateCcw size={15} /> Try Again
          </button>
          <button onClick={() => setPhase('config')} className="btn btn-ghost flex-1 py-3 text-sm">
            Change Level
          </button>
        </div>
      </div>
    </div>
  );
}
