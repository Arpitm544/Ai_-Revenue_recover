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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Autonomous Batch Revenue Recovery Engine</h2>
              <p className="text-xs text-slate-400">Process batch of payment failures with real-time compliance & recovery execution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Control Bar & Progress */}
        <div className="p-6 space-y-5 bg-slate-950/40">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Batch Progress</span>
              <span className="text-xl font-bold text-white">{currentIndex} / {batchCases.length}</span>
              <span className="text-xs text-slate-500 block mt-0.5">Cases Processed</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30">
              <span className="text-xs text-emerald-400 block font-semibold">Money Recovered</span>
              <span className="text-xl font-bold text-emerald-400">₹{totalRecovered.toLocaleString('en-IN')}</span>
              <span className="text-xs text-emerald-500/80 block mt-0.5">{recoveredCount} Payments Won Back</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30">
              <span className="text-xs text-amber-400 block font-semibold">Compliant Stops</span>
              <span className="text-xl font-bold text-amber-400">{stoppedCount}</span>
              <span className="text-xs text-amber-500/80 block mt-0.5">DND / Hard Declines Saved</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-xs text-slate-400 block font-medium">Simulation Speed</span>
              <div className="flex items-center space-x-2 mt-1">
                <button
                  onClick={() => setSpeed(500)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border ${speed === 500 ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setSpeed(150)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border ${speed === 150 ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  Fast (150ms)
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
              <span>Execution Progress ({progressPct.toFixed(0)}%)</span>
              <span>{currentIndex === batchCases.length ? "Batch Complete!" : "Processing active cohort..."}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 shadow-md shadow-blue-500/50"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{currentIndex > 0 ? "Resume Batch" : "Start Recovery Batch"}</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause Execution</span>
                </button>
              )}

              <button
                onClick={handleReset}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>

            {currentIndex === batchCases.length && (
              <span className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                <Check className="w-4 h-4" />
                <span>Batch Simulation Finished</span>
              </span>
            )}
          </div>
        </div>

        {/* Live Execution Stream / Console */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950 font-mono text-xs space-y-2 border-t border-slate-800 min-h-[220px]">
          <div className="text-slate-500 text-[11px] font-sans font-semibold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Live Agent Intervention & Audit Log Stream</span>
            <span>{logs.length} events logged</span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-600 font-sans text-sm">
              Press <strong className="text-slate-400">"Start Recovery Batch"</strong> to begin live autonomous revenue recovery.
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`p-2.5 rounded-lg border flex items-start space-x-2 transition-all ${
                  log.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : log.type === 'blocked'
                    ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <span className="text-slate-500 shrink-0 font-sans">{log.time}</span>
                <span className="break-words font-medium">{log.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
