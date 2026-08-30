import React from 'react';
import { 
  ShieldCheck, LayoutDashboard, AlertCircle, Activity, Radio, 
  Play, Settings, PlusCircle, UserCheck, Shield
} from 'lucide-react';
import type { ComplianceEngine } from '../features/recovery/ComplianceEngine';

interface SidebarProps {
  activeView: 'cases' | 'analytics';
  onSelectView: (view: 'cases' | 'analytics') => void;
  onOpenBatchSimulator: () => void;
  onOpenComplianceConfig: () => void;
  onOpenNewCase: () => void;
  onOpenBankHealth: () => void;
  onOpenWebhookSandbox: () => void;
  complianceEngine: ComplianceEngine;
  degradedBankCount: number;
  totalCasesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onOpenBatchSimulator,
  onOpenComplianceConfig,
  onOpenNewCase,
  onOpenBankHealth,
  onOpenWebhookSandbox,
  complianceEngine,
  degradedBankCount,
  totalCasesCount
}) => {
  const inDnd = complianceEngine.isDndTime();
  const settings = complianceEngine.getSettings();

  return (
    <aside className="w-60 shrink-0 bg-[#080808] border-r border-[#1F1F1F] flex flex-col h-full overflow-hidden text-[#EDEDED] select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1F1F1F] flex items-center justify-between shrink-0 bg-[#000000]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-xs font-semibold tracking-tight text-white flex items-center gap-1.5">
              <span>Razorpay RevGuard</span>
            </h1>
            <span className="text-[10px] text-[#71717A] font-mono">Track 03 · AI Recovery</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
        {/* Section 1: Workspaces */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#52525B]">
            Workspaces
          </div>

          <button
            onClick={() => onSelectView('cases')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors cursor-pointer text-xs font-medium ${
              activeView === 'cases'
                ? 'bg-[#181818] text-white'
                : 'text-[#A1A1A1] hover:text-white hover:bg-[#121212]'
            }`}
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-emerald-400" />
              <span>Recovery Cases</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#222222] text-[#D4D4D8]">
              {totalCasesCount}
            </span>
          </button>

          <button
            onClick={() => onSelectView('analytics')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors cursor-pointer text-xs font-medium ${
              activeView === 'analytics'
                ? 'bg-[#181818] text-white'
                : 'text-[#A1A1A1] hover:text-white hover:bg-[#121212]'
            }`}
          >
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Executive Analytics</span>
            </div>
          </button>
        </div>

        {/* Section 2: Automations & Tools */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#52525B]">
            Automation Engines
          </div>

          <button
            onClick={onOpenBankHealth}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[#A1A1A1] hover:text-white hover:bg-[#121212] transition-colors cursor-pointer text-xs"
          >
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Gateway Health</span>
            </div>
            {degradedBankCount > 0 ? (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                {degradedBankCount} Outage
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={onOpenWebhookSandbox}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[#A1A1A1] hover:text-white hover:bg-[#121212] transition-colors cursor-pointer text-xs"
          >
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-purple-400" />
              <span>Webhook Sandbox</span>
            </div>
          </button>

          <button
            onClick={onOpenBatchSimulator}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer text-xs font-semibold border border-white/10"
          >
            <div className="flex items-center space-x-2">
              <Play className="w-4 h-4 fill-white" />
              <span>Run Batch Recovery</span>
            </div>
          </button>
        </div>

        {/* Section 3: Governance */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#52525B]">
            Governance & Policy
          </div>

          <button
            onClick={onOpenComplianceConfig}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[#A1A1A1] hover:text-white hover:bg-[#121212] transition-colors cursor-pointer text-xs"
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>RBI & DPDP Guardrails</span>
            </div>
            <Settings className="w-3.5 h-3.5 text-[#52525B]" />
          </button>

          <button
            onClick={onOpenNewCase}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[#A1A1A1] hover:text-white hover:bg-[#121212] transition-colors cursor-pointer text-xs"
          >
            <div className="flex items-center space-x-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Inject Revenue Leak</span>
            </div>
          </button>
        </div>
      </div>

      {/* DND Status Banner & User Profile Footer */}
      <div className="p-3 border-t border-[#1F1F1F] bg-[#000000] space-y-2 shrink-0">
        <div className="p-2 rounded-lg bg-[#111111] border border-[#222222] flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${inDnd ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="text-[#A1A1A1] font-mono">
              {inDnd ? `DND (${settings.dndHoursStart}–${settings.dndHoursEnd})` : 'Active Recovery'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 px-1 py-1">
          <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-white text-[11px] font-semibold">
            RZ
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate">Razorpay Merchant</div>
            <div className="text-[10px] text-[#71717A] font-mono flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-400" /> Verified Business
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
