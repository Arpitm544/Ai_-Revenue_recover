import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Check } from 'lucide-react';
import type { RecoveryCase } from './types';
import { RevenueRecoveryAgent } from './RecoveryAgent';
import { ComplianceEngine } from './ComplianceEngine';
import confetti from 'canvas-confetti';
import { AnimatedCounter } from '../../shared/AnimatedCounter';
import { useTheme } from '../../shared/ThemeContext';

interface BatchRecoveryViewProps {
  cases: RecoveryCase[];
  onUpdateCases: (updatedCases: RecoveryCase[]) => void;
  complianceEngine: ComplianceEngine;
  recoveryAgent: RevenueRecoveryAgent;
}

export const BatchRecoveryView: React.FC<BatchRecoveryViewProps> = ({
  cases,
  onUpdateCases,
  recoveryAgent
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [batchCases, setBatchCases] = useState<RecoveryCase[]>(cases);
  const [logs, setLogs] = useState<{ time: string; text: string; type: 'success' | 'blocked' | 'info' | 'warn' }[]>([]);
  const [speed, setSpeed] = useState<number>(300);

  useEffect(() => {
    setBatchCases(cases);
  }, [cases]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isRunning && currentIndex < batchCases.length) {
      timer = setTimeout(() => {
        processNextStep();
      }, speed);
    } else if (currentIndex >= batchCases.length && isRunning) {
      setIsRunning(false);
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
    return () => clearTimeout(timer);
  }, [isRunning, currentIndex, batchCases, speed]);

  const processNextStep = () => {
    const currentCase = batchCases[currentIndex];
    if (!currentCase) return;

    const diagnosed = recoveryAgent.diagnoseCase(currentCase);
    const { updatedCase, complianceResult } = recoveryAgent.processIntervention(diagnosed);

    const updatedBatch = [...batchCases];
    updatedBatch[currentIndex] = updatedCase;
    setBatchCases(updatedBatch);
    onUpdateCases(updatedBatch);

    const nowTime = new Date().toLocaleTimeString('en-IN');
    if (updatedCase.status === 'RECOVERED') {
      setLogs(prev => [
        {
          time: nowTime,
          text: `[RECOVERED] ₹${updatedCase.totalAmountRecovered.toLocaleString('en-IN')} recovered from ${updatedCase.customerName} via ${updatedCase.recommendedChannel}`,
          type: 'success'
        },
        ...prev.slice(0, 49)
      ]);
    } else if (!complianceResult.canProceed) {
      setLogs(prev => [
        {
          time: nowTime,
          text: `[STOP RULE] ${updatedCase.customerName} (${updatedCase.leakVector}): ${complianceResult.reason}`,
          type: 'blocked'
        },
        ...prev.slice(0, 49)
      ]);
    } else {
      setLogs(prev => [
        {
          time: nowTime,
          text: `[INTERVENTION] Dispatched ${updatedCase.recommendedChannel} for ${updatedCase.customerName} (₹${updatedCase.amountAtRisk})`,
          type: 'info'
        },
        ...prev.slice(0, 49)
      ]);
    }

    setCurrentIndex(prev => prev + 1);
  };

  const handleStart = () => {
    if (currentIndex >= batchCases.length) {
      setCurrentIndex(0);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentIndex(0);
    setLogs([]);
  };

  const totalRecovered = batchCases.reduce((a, b) => a + b.totalAmountRecovered, 0);
  const progressPct = batchCases.length > 0 ? (currentIndex / batchCases.length) * 100 : 0;
  const recoveredCount = batchCases.filter(c => c.status === 'RECOVERED').length;
  const stoppedCount = batchCases.filter(c => c.status === 'STOPPED_COMPLIANT').length;

  return (
    <div className="space-y-5 h-full overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Autonomous Batch Revenue Recovery Engine
            </h2>
            <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
              isDark ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
            }`}>
              Multi-Vector Automation
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Process active cohort of payment failures with real-time RBI compliance verification and multi-channel recovery dispatch
          </p>
        </div>
      </div>

      {/* Metric Cards & Controls */}
      <div className={`p-5 rounded-xl border space-y-4 transition-colors ${
        isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#0D0D0D] border-[#1F1F1F]' : 'bg-neutral-50 border-neutral-200'}`}>
            <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>Cohort Processed</span>
            <span className={`text-xl font-bold font-mono mt-1 block ${isDark ? 'text-white' : 'text-neutral-900'}`}>{currentIndex} / {batchCases.length}</span>
            <span className={`text-[10px] block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>Cases in active batch</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#0D0D0D] border-[#1F1F1F]' : 'bg-neutral-50 border-neutral-200'}`}>
            <span className="text-[10px] uppercase font-mono text-emerald-500 block font-semibold">Money Recovered</span>
            <span className="text-xl font-bold font-mono text-emerald-500 mt-1 block">
              <AnimatedCounter value={totalRecovered} prefix="₹" />
            </span>
            <span className={`text-[10px] block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              <AnimatedCounter value={recoveredCount} /> Payments Won Back
            </span>
          </div>

          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#0D0D0D] border-[#1F1F1F]' : 'bg-neutral-50 border-neutral-200'}`}>
            <span className="text-[10px] uppercase font-mono text-amber-500 block font-semibold">Compliant Stops</span>
            <span className="text-xl font-bold font-mono text-amber-500 mt-1 block">
              <AnimatedCounter value={stoppedCount} />
            </span>
            <span className={`text-[10px] block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>DND / Hard Declines Protected</span>
          </div>

          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#0D0D0D] border-[#1F1F1F]' : 'bg-neutral-50 border-neutral-200'}`}>
            <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>Execution Speed</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <button
                onClick={() => setSpeed(500)}
                className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                  speed === 500 
                    ? isDark ? 'bg-white text-black font-semibold border-white' : 'bg-black text-white font-semibold border-black'
                    : isDark ? 'bg-[#141414] text-[#71717A] border-[#222222]' : 'bg-white text-neutral-600 border-neutral-300'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setSpeed(150)}
                className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                  speed === 150 
                    ? isDark ? 'bg-white text-black font-semibold border-white' : 'bg-black text-white font-semibold border-black'
                    : isDark ? 'bg-[#141414] text-[#71717A] border-[#222222]' : 'bg-white text-neutral-600 border-neutral-300'
                }`}
              >
                Fast (150ms)
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className={`flex justify-between text-xs font-mono ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            <span>Progress ({progressPct.toFixed(0)}%)</span>
            <span className={isDark ? 'text-white' : 'text-neutral-900 font-semibold'}>
              {currentIndex === batchCases.length ? "Batch Completed!" : isRunning ? "Processing live cohort..." : "Ready to execute"}
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1A1A1A]' : 'bg-neutral-200'}`}>
            <div
              className={`h-full rounded-full transition-all duration-300 ${isDark ? 'bg-neutral-300' : 'bg-neutral-800'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2.5">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className={`flex items-center space-x-2 px-5 py-2.5 font-semibold text-xs rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] cursor-pointer shadow-md ${
                  isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-neutral-800 text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{currentIndex > 0 ? "Resume Batch" : "Start Recovery Batch"}</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center space-x-2 px-5 py-2.5 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 font-semibold text-xs rounded-xl border border-amber-800/40 transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-amber-300" />
                <span>Pause Execution</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 text-xs font-medium rounded-xl border transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] cursor-pointer ${
                isDark 
                  ? 'bg-[#141414] hover:bg-[#1E1E1E] text-[#A1A1A1] hover:text-white border-[#262626]' 
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black border-neutral-300'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {currentIndex === batchCases.length && (
            <span className="flex items-center space-x-1.5 text-xs text-emerald-500 font-mono bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-800/40">
              <Check className="w-4 h-4" />
              <span>Cohort Execution Finished</span>
            </span>
          )}
        </div>
      </div>

      {/* Live Log Stream */}
      <div className={`p-5 rounded-xl border font-mono text-xs space-y-2 transition-colors ${
        isDark ? 'bg-[#070707] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className={`text-[10px] uppercase font-mono tracking-wider flex items-center justify-between ${
          isDark ? 'text-[#52525B]' : 'text-neutral-500'
        }`}>
          <span>Live Intervention & Audit Log Stream</span>
          <span>{logs.length} events logged</span>
        </div>

        {logs.length === 0 ? (
          <div className={`text-center py-12 text-xs font-sans ${isDark ? 'text-[#52525B]' : 'text-neutral-400'}`}>
            Click <strong className={isDark ? 'text-white' : 'text-neutral-800'}>"Start Recovery Batch"</strong> to begin autonomous multi-vector recovery.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`p-2.5 rounded-lg border flex items-start space-x-2 text-[11px] transition-all ${
                  log.type === 'success'
                    ? isDark ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                    : log.type === 'blocked'
                    ? isDark ? 'bg-amber-950/20 border-amber-800/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                    : isDark ? 'bg-[#111111] border-[#1F1F1F] text-[#EDEDED]' : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                }`}
              >
                <span className={`shrink-0 text-[10px] ${isDark ? 'text-[#71717A]' : 'text-neutral-400'}`}>{log.time}</span>
                <span className="break-words">{log.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
