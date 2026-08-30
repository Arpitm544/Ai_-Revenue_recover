import React from 'react';
import { 
  ShieldCheck, LayoutDashboard, AlertCircle, Activity, Radio, 
  Play, Settings, PlusCircle, UserCheck, Shield, Sun, Moon
} from 'lucide-react';
import type { ComplianceEngine } from '../features/recovery/ComplianceEngine';
import { useTheme } from './ThemeContext';

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
  const { theme, toggleTheme } = useTheme();
  const inDnd = complianceEngine.isDndTime();
  const settings = complianceEngine.getSettings();

  const isDark = theme === 'dark';

  return (
    <aside className={`w-60 shrink-0 border-r flex flex-col h-full overflow-hidden select-none transition-colors duration-150 ${
      isDark 
        ? 'bg-[#080808] border-[#1F1F1F] text-[#EDEDED]' 
        : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#111827]'
    }`}>
      {/* Brand Header */}
      <div className={`p-4 border-b flex items-center justify-between shrink-0 transition-colors ${
        isDark ? 'border-[#1F1F1F] bg-[#000000]' : 'border-[#E5E7EB] bg-[#F9FAFB]'
      }`}>
        <div className="flex items-center space-x-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isDark ? 'bg-white/10 border border-white/15 text-white' : 'bg-black text-white shadow-sm'
          }`}>
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className={`text-xs font-semibold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
              Razorpay RevGuard
            </h1>
            <span className={`text-[10px] font-mono ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              Track 03 · AI Recovery
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
        {/* Section 1: Workspaces */}
        <div className="space-y-1">
          <div className={`px-2 pb-1 text-[10px] font-mono uppercase tracking-wider ${
            isDark ? 'text-[#52525B]' : 'text-neutral-400 font-semibold'
          }`}>
            Workspaces
          </div>

          <button
            onClick={() => onSelectView('cases')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors cursor-pointer text-xs font-medium ${
              activeView === 'cases'
                ? isDark 
                  ? 'bg-[#181818] text-white' 
                  : 'bg-[#F3F4F6] text-black font-semibold'
                : isDark
                  ? 'text-[#A1A1A1] hover:text-white hover:bg-[#121212]'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-emerald-500" />
              <span>Recovery Cases</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              isDark ? 'bg-[#222222] text-[#D4D4D8]' : 'bg-neutral-200 text-neutral-700'
            }`}>
              {totalCasesCount}
            </span>
          </button>

          <button
            onClick={() => onSelectView('analytics')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors cursor-pointer text-xs font-medium ${
              activeView === 'analytics'
                ? isDark 
                  ? 'bg-[#181818] text-white' 
                  : 'bg-[#F3F4F6] text-black font-semibold'
                : isDark
                  ? 'text-[#A1A1A1] hover:text-white hover:bg-[#121212]'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="w-4 h-4 text-blue-500" />
              <span>Executive Analytics</span>
            </div>
          </button>
        </div>

        {/* Section 2: Automations & Tools */}
        <div className="space-y-1">
          <div className={`px-2 pb-1 text-[10px] font-mono uppercase tracking-wider ${
            isDark ? 'text-[#52525B]' : 'text-neutral-400 font-semibold'
          }`}>
            Automation Engines
          </div>

          <button
            onClick={onOpenBankHealth}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors cursor-pointer text-xs ${
              isDark 
                ? 'text-[#A1A1A1] hover:text-white hover:bg-[#121212]' 
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-amber-500" />
              <span>Gateway Health</span>
            </div>
            {degradedBankCount > 0 ? (
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                isDark 
                  ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold'
              }`}>
                {degradedBankCount} Outage
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={onOpenWebhookSandbox}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors cursor-pointer text-xs ${
              isDark 
                ? 'text-[#A1A1A1] hover:text-white hover:bg-[#121212]' 
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-purple-500" />
              <span>Webhook Sandbox</span>
            </div>
          </button>

          <button
            onClick={onOpenBatchSimulator}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors cursor-pointer text-xs font-semibold ${
              isDark 
                ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' 
                : 'bg-black text-white hover:bg-neutral-800 shadow-sm'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Play className="w-4 h-4 fill-current" />
              <span>Run Batch Recovery</span>
            </div>
          </button>
        </div>

        {/* Section 3: Governance */}
        <div className="space-y-1">
          <div className={`px-2 pb-1 text-[10px] font-mono uppercase tracking-wider ${
            isDark ? 'text-[#52525B]' : 'text-neutral-400 font-semibold'
          }`}>
            Governance & Policy
          </div>

          <button
            onClick={onOpenComplianceConfig}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors cursor-pointer text-xs ${
              isDark 
                ? 'text-[#A1A1A1] hover:text-white hover:bg-[#121212]' 
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>RBI & DPDP Guardrails</span>
            </div>
            <Settings className={`w-3.5 h-3.5 ${isDark ? 'text-[#52525B]' : 'text-neutral-400'}`} />
          </button>

          <button
            onClick={onOpenNewCase}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors cursor-pointer text-xs ${
              isDark 
                ? 'text-[#A1A1A1] hover:text-white hover:bg-[#121212]' 
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              <span>Inject Revenue Leak</span>
            </div>
          </button>
        </div>
      </div>

      {/* DND Status Banner, Theme Switcher & Profile Footer */}
      <div className={`p-3 border-t space-y-2 shrink-0 transition-colors ${
        isDark ? 'border-[#1F1F1F] bg-[#000000]' : 'border-[#E5E7EB] bg-[#F9FAFB]'
      }`}>
        {/* DND and Theme Switcher Row */}
        <div className="flex items-center justify-between gap-1.5">
          <div className={`flex-1 p-1.5 rounded-lg border flex items-center space-x-2 text-[10px] font-mono ${
            isDark ? 'bg-[#111111] border-[#222222] text-[#A1A1A1]' : 'bg-white border-neutral-200 text-neutral-600'
          }`}>
            <span className="relative flex h-2 w-2 shrink-0">
              {!inDnd && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${inDnd ? 'bg-amber-400' : 'bg-emerald-500'}`} />
            </span>
            <span className="truncate">
              {inDnd ? `DND (${settings.dndHoursStart}–${settings.dndHoursEnd})` : 'Active Engine'}
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
              isDark 
                ? 'bg-[#111111] hover:bg-[#1A1A1A] border-[#222222] text-[#D4D4D8] hover:text-white' 
                : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700 hover:text-black shadow-sm'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
          </button>
        </div>

        {/* User Profile Footer */}
        <div className="flex items-center space-x-2.5 px-1 py-0.5">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold ${
            isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-800 font-bold'
          }`}>
            RZ
          </div>
          <div className="truncate">
            <div className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-black'}`}>
              Razorpay Merchant
            </div>
            <div className={`text-[10px] font-mono flex items-center gap-1 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              <UserCheck className="w-3 h-3 text-emerald-500" /> Verified
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
