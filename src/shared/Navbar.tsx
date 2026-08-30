import React from 'react';
import { ShieldCheck, Play, Settings, PlusCircle, AlertCircle, Activity, Radio } from 'lucide-react';
import { ComplianceEngine } from '../features/recovery/ComplianceEngine';

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
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-[#1F1F1F] text-white px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-semibold tracking-tight text-[#EDEDED]">
                Razorpay RevGuard
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-[#161616] text-[#888888] border border-[#262626]">
                Track 03
              </span>
            </div>
            <p className="text-[11px] text-[#71717A]">
              Autonomous Revenue Recovery Engine
            </p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center space-x-2">
          {/* Bank Gateway Pulse Indicator */}
          <button
            onClick={onOpenBankHealth}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
              degradedBankCount > 0
                ? 'bg-amber-950/30 border-amber-800/40 text-amber-300 hover:bg-amber-900/40'
                : 'bg-[#111111] border-[#222222] text-[#A1A1A1] hover:text-white hover:border-[#333333]'
            }`}
            title="Bank Gateway Health Matrix"
          >
            <Activity className={`w-3.5 h-3.5 ${degradedBankCount > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
            <span>Gateways: {degradedBankCount > 0 ? `${degradedBankCount} Degraded` : '5/5 Healthy'}</span>
          </button>

          {/* DND Status Indicator */}
          {inDnd ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-400 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>DND Active ({settings.dndHoursStart}–{settings.dndHoursEnd})</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#111111] border border-[#222222] text-[#A1A1A1] text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Recovery Active</span>
            </div>
          )}

          {/* Webhooks Trigger */}
          <button
            onClick={onOpenWebhookSandbox}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111111] hover:bg-[#1A1A1A] text-[#EDEDED] text-xs font-medium rounded-lg border border-[#262626] hover:border-[#3A3A3A] transition-all cursor-pointer"
            title="Razorpay Webhook Ingestion Sandbox"
          >
            <Radio className="w-3.5 h-3.5 text-[#A1A1A1]" />
            <span className="hidden sm:inline">Webhooks</span>
          </button>

          {/* New Case Trigger */}
          <button
            onClick={onOpenNewCase}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111111] hover:bg-[#1A1A1A] text-[#EDEDED] text-xs font-medium rounded-lg border border-[#262626] hover:border-[#3A3A3A] transition-all cursor-pointer"
            title="Simulate New Revenue Leak"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#A1A1A1]" />
            <span className="hidden sm:inline">Add Leak</span>
          </button>

          {/* Batch Recovery Primary Button (Linear White Button) */}
          <button
            onClick={onOpenBatchSimulator}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Run Batch</span>
          </button>

          {/* Compliance Settings Button */}
          <button
            onClick={onOpenComplianceConfig}
            className="p-1.5 bg-[#111111] hover:bg-[#1A1A1A] text-[#A1A1A1] hover:text-white rounded-lg border border-[#262626] hover:border-[#3A3A3A] transition-all cursor-pointer"
            title="Compliance Policy Engine Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
