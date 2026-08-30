import React from 'react';
import { ShieldCheck, Play, Settings, PlusCircle, AlertCircle, Activity, Radio } from 'lucide-react';
import { ComplianceEngine } from '../services/complianceEngine';

interface NavbarProps {
  onOpenBatchSimulator: () => void;
  onOpenComplianceConfig: () => void;
  onOpenNewCase: () => void;
  onOpenBankHealth: () => void;
  onOpenWebhookSandbox: () => void;
  complianceEngine: ComplianceEngine;
  degradedBankCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBatchSimulator,
  onOpenComplianceConfig,
  onOpenNewCase,
  onOpenBankHealth,
  onOpenWebhookSandbox,
  complianceEngine,
  degradedBankCount
}) => {
  const inDnd = complianceEngine.isDndTime();
  const settings = complianceEngine.getSettings();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                Razorpay RevGuard AI
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Track 03
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Revenue Recovery Engine & Guardrails
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3">
          {/* Bank Gateway Pulse Indicator */}
          <button
            onClick={onOpenBankHealth}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              degradedBankCount > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
            title="Open Bank Gateway Health Matrix"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Gateways: {degradedBankCount > 0 ? `${degradedBankCount} Degraded` : '5/5 Healthy'}</span>
          </button>

          {inDnd ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>DND Active ({settings.dndHoursStart}–{settings.dndHoursEnd})</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Active Recovery Window</span>
            </div>
          )}

          {/* Action Buttons */}
          <button
            onClick={onOpenWebhookSandbox}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 text-sm font-medium rounded-lg border border-slate-700 transition-all cursor-pointer"
            title="Razorpay Webhook Ingestion Sandbox"
          >
            <Radio className="w-4 h-4" />
            <span className="hidden sm:inline">Webhooks</span>
          </button>

          <button
            onClick={onOpenBatchSimulator}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm rounded-lg shadow-md shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Run Batch Recovery</span>
          </button>

          <button
            onClick={onOpenNewCase}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-all cursor-pointer"
            title="Simulate New Revenue Leak"
          >
            <PlusCircle className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Add Leak</span>
          </button>

          <button
            onClick={onOpenComplianceConfig}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all cursor-pointer"
            title="Compliance Policy Engine Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
