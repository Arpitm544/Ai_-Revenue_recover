import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, X, Zap, Check } from 'lucide-react';
import type { RecoveryCase } from './types';
import { RevenueRecoveryAgent } from './RecoveryAgent';
import { ComplianceEngine } from './ComplianceEngine';
import confetti from 'canvas-confetti';

interface BatchSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  cases: RecoveryCase[];
  onUpdateCases: (updatedCases: RecoveryCase[]) => void;
  complianceEngine: ComplianceEngine;
  recoveryAgent: RevenueRecoveryAgent;
}

export const BatchSimulator: React.FC<BatchSimulatorProps> = ({
  isOpen,
  onClose,
  cases,
  onUpdateCases,
  recoveryAgent
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [batchCases, setBatchCases] = useState<RecoveryCase[]>(cases);
  const [logs, setLogs] = useState<{ time: string; text: string; type: 'success' | 'blocked' | 'info' | 'warn' }[]>([]);
  const [speed, setSpeed] = useState<number>(300); // ms per step

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
      // Trigger Confetti!
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

    // Step 1: Diagnose case
    const diagnosed = recoveryAgent.diagnoseCase(currentCase);

    // Step 2: Execute intervention with compliance
    const { updatedCase, complianceResult } = recoveryAgent.processIntervention(diagnosed);

    const updatedBatch = [...batchCases];
    updatedBatch[currentIndex] = updatedCase;
    setBatchCases(updatedBatch);
    onUpdateCases(updatedBatch);

    // Log output
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

  if (!isOpen) return null;

  const totalRecovered = batchCases.reduce((a, b) => a + b.totalAmountRecovered, 0);
  const progressPct = batchCases.length > 0 ? (currentIndex / batchCases.length) * 100 : 0;
  const recoveredCount = batchCases.filter(c => c.status === 'RECOVERED').length;
  const stoppedCount = batchCases.filter(c => c.status === 'STOPPED_COMPLIANT').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F1F] bg-[#000000] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Autonomous Batch Revenue Recovery Engine</h2>
              <p className="text-[11px] text-[#71717A] mt-0.5">Process cohort of payment failures with real-time compliance & recovery dispatch</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Control Bar & Progress */}
        <div className="p-6 space-y-5 bg-[#050505] border-b border-[#1F1F1F]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F]">
              <span className="text-[10px] uppercase font-mono text-[#71717A] block">Cohort Processed</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{currentIndex} / {batchCases.length}</span>
              <span className="text-[10px] text-[#71717A] block">Cases in queue</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F]">
              <span className="text-[10px] uppercase font-mono text-emerald-400 block">Money Recovered</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">₹{totalRecovered.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-[#71717A] block">{recoveredCount} Payments Won Back</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F]">
              <span className="text-[10px] uppercase font-mono text-amber-400 block">Compliant Stops</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">{stoppedCount}</span>
              <span className="text-[10px] text-[#71717A] block">DND / Hard Declines Protected</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] flex flex-col justify-between">
              <span className="text-[10px] uppercase font-mono text-[#71717A] block">Execution Speed</span>
              <div className="flex items-center space-x-1.5 mt-1">
                <button
                  onClick={() => setSpeed(500)}
                  className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                    speed === 500 ? 'bg-white text-black font-semibold border-white' : 'bg-[#141414] text-[#71717A] border-[#222222]'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setSpeed(150)}
                  className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                    speed === 150 ? 'bg-white text-black font-semibold border-white' : 'bg-[#141414] text-[#71717A] border-[#222222]'
                  }`}
                >
                  Fast (150ms)
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar with neutral color */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#71717A] font-mono">
              <span>Progress ({progressPct.toFixed(0)}%)</span>
              <span className="text-white">{currentIndex === batchCases.length ? "Batch Complete!" : "Processing live cohort..."}</span>
            </div>
            <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-300 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>{currentIndex > 0 ? "Resume Batch" : "Start Recovery Batch"}</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center space-x-2 px-4 py-2 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 font-semibold text-xs rounded-lg border border-amber-800/40 transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-amber-300" />
                  <span>Pause Execution</span>
                </button>
              )}

              <button
                onClick={handleReset}
                className="flex items-center space-x-1.5 px-3 py-2 bg-[#141414] hover:bg-[#1E1E1E] text-[#A1A1A1] hover:text-white text-xs font-medium rounded-lg border border-[#262626] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {currentIndex === batchCases.length && (
              <span className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 px-3 py-1 rounded-md border border-emerald-800/40">
                <Check className="w-3.5 h-3.5" />
                <span>Cohort Finished</span>
              </span>
            )}
          </div>
        </div>

        {/* Live Execution Stream / Console */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#070707] font-mono text-[11px] space-y-1.5 min-h-[220px]">
          <div className="text-[#52525B] text-[10px] font-mono uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Live Intervention & Audit Stream</span>
            <span>{logs.length} events</span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-10 text-[#52525B] font-sans text-xs">
              Press <strong className="text-white">"Start Recovery Batch"</strong> to trigger autonomous multi-vector recovery.
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg border flex items-start space-x-2 transition-all ${
                  log.type === 'success'
                    ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-300'
                    : log.type === 'blocked'
                    ? 'bg-amber-950/20 border-amber-800/30 text-amber-300'
                    : 'bg-[#111111] border-[#1F1F1F] text-[#EDEDED]'
                }`}
              >
                <span className="text-[#71717A] shrink-0 font-mono text-[10px]">{log.time}</span>
                <span className="break-words font-medium">{log.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
