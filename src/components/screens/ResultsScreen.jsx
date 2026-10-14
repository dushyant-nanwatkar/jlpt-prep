import React from 'react';
import { BarChart3, Award, Clock, Calendar, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function ResultsScreen({ onNavigate }) {
  const { stats } = useData();
  const testScores = stats.testScores || [];

  const totalTests = testScores.length;
  const passedTests = testScores.filter(t => {
    if (typeof t.passed === 'boolean') return t.passed;
    const s = t.score ?? t.correct ?? 0;
    const tot = t.totalQuestions ?? t.total ?? 1;
    return (s / tot) >= 0.7;
  }).length;
  const avgScore = totalTests > 0 
    ? Math.round(testScores.reduce((acc, t) => {
        const s = t.score ?? t.correct ?? 0;
        const tot = t.totalQuestions ?? t.total ?? 1;
        return acc + (s / tot) * 100;
      }, 0) / totalTests)
    : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      <div className="acrylic-surface rounded-3xl p-6 sm:p-7 border border-[var(--md-sys-color-outline)] shadow-xl">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-1">
          <BarChart3 size={22} className="text-[var(--md-sys-color-primary)]" />
          Test Analytics & History
        </h2>
        <p className="text-xs text-gray-400">
          Track historical examination results, pass rates, and completion times
        </p>

        {/* High-level stats banner */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
          <div className="acrylic-card rounded-2xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--md-sys-color-primary)]">
              {totalTests}
            </span>
            <span className="text-[11px] text-gray-400 block mt-0.5">Quizzes Taken</span>
          </div>

          <div className="acrylic-card rounded-2xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {avgScore}%
            </span>
            <span className="text-[11px] text-gray-400 block mt-0.5">Average Accuracy</span>
          </div>

          <div className="acrylic-card rounded-2xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {passedTests}
            </span>
            <span className="text-[11px] text-gray-400 block mt-0.5">Passed (&ge;70%)</span>
          </div>
        </div>
      </div>

      {/* History table / cards */}
      <div className="acrylic-card rounded-3xl p-6 border border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-300">Recent Quiz Sessions</h3>
          {testScores.length > 0 && (
            <button
              onClick={() => onNavigate('tests')}
              className="text-xs text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1"
            >
              Take Another Quiz <ArrowRight size={13} />
            </button>
          )}
        </div>

        {testScores.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Award size={40} className="mx-auto mb-2 opacity-30 text-gray-400" />
            <p className="text-sm text-gray-300 font-semibold">No quiz history recorded yet</p>
            <p className="text-xs text-gray-500 mt-1">Complete a practice test to view historical analytics here</p>
            <button
              onClick={() => onNavigate('tests')}
              className="btn-m3 btn-primary px-5 py-2 text-xs font-bold mt-4"
            >
              Start First Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {testScores.map(test => {
              const score = test.score ?? test.correct ?? 0;
              const total = test.totalQuestions ?? test.total ?? 1;
              const pct = Math.round((score / total) * 100);
              const isPassed = typeof test.passed === 'boolean' ? test.passed : pct >= 70;
              const quizType = (test.type || 'Vocabulary Quiz').replace('_', ' ');
              const dateStr = new Date(test.date).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={test.id}
                  className="p-3.5 rounded-2xl bg-[#0B0F18] border border-[rgba(255,255,255,0.05)] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      isPassed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    }`}>
                      {isPassed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>JLPT {test.level} Quiz</span>
                        <span className="text-[10px] text-gray-500 font-normal">
                          ({quizType})
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1"><Calendar size={11} /> {dateStr}</span>
                        {(test.elapsedSeconds || test.timeSec) && (
                          <span className="flex items-center gap-1"><Clock size={11} /> {test.elapsedSeconds || test.timeSec}s</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-bold ${isPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {score} / {total} ({pct}%)
                    </span>
                    <span className="block text-[10px] text-gray-500">
                      {isPassed ? 'Passed' : 'Needs Review'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
