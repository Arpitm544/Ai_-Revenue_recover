import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle2, RotateCcw, Zap } from 'lucide-react';
import type { BankHealthNode } from './types';
import type { RecoveryCase } from '../recovery/types';
import { BankHealthService } from './BankHealthService';
import { useTheme } from '../../shared/ThemeContext';
import { AnimatedCounter } from '../../shared/AnimatedCounter';

interface BankHealthViewProps {
  bankHealthService: BankHealthService;
  cases: RecoveryCase[];
  onUpdateCases: (updatedCases: RecoveryCase[]) => void;
}

export const BankHealthView: React.FC<BankHealthViewProps> = ({
  bankHealthService,
  cases,
  onUpdateCases
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [banks, setBanks] = useState<BankHealthNode[]>(bankHealthService.getBanks());
  const [lastActionLog, setLastActionLog] = useState<string | null>(null);

  const handleToggleOutage = (bankCode: string) => {
    const { updatedBanks, updatedCases, message } = bankHealthService.toggleBankOutage(bankCode, cases);
    setBanks([...updatedBanks]);
    onUpdateCases(updatedCases);
    setLastActionLog(message);
  };

  const totalHeldCount = banks.reduce((a, b) => a + b.casesOnHoldCount, 0);
  const totalProtectedAmt = banks.reduce((a, b) => a + b.revenueProtectedAmount, 0);
  const degradedCount = banks.filter(b => b.status === 'DEGRADED' || b.status === 'OUTAGE').length;

  return (
    <div className="space-y-5 h-full overflow-y-auto pr-1">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Bank Gateway Downtime Pulse Matrix
            </h2>
            <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
              degradedCount > 0 
                ? isDark
                  ? 'bg-amber-950/50 text-amber-400 border border-amber-800/40' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold'
                : isDark
                  ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold'
            }`}>
              {degradedCount > 0 ? `${degradedCount} Bank Degraded` : 'All Gateways Operational'}
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Real-time issuing bank uptime telemetry & intelligent mandate auto-pauser
          </p>
        </div>
      </div>

      {/* Action Alert Banner */}
      {lastActionLog && (
        <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between transition-all ${
          isDark 
            ? 'bg-[#111111] border-amber-800/40 text-amber-300' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <span className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-500" />
            <span>{lastActionLog}</span>
          </span>
          <span className={`text-[10px] ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>Policy Auto-Enforced</span>
        </div>
      )}

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`p-4 rounded-xl border transition-colors ${
          isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Protected Revenue (On Hold)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <AnimatedCounter value={totalProtectedAmt} prefix="₹" />
            </span>
            <span className="text-[10px] font-mono text-emerald-500 font-medium">Auto-Protected</span>
          </div>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Retries deferred to avoid hard customer bank charges
          </p>
        </div>

        <div className={`p-4 rounded-xl border transition-colors ${
          isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Cases on Circuit Breaker
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <AnimatedCounter value={totalHeldCount} />
            </span>
            <span className={`text-[10px] font-mono ${degradedCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {degradedCount > 0 ? 'Buffer Active' : 'Clear'}
            </span>
          </div>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Awaiting bank gateway recovery signal
          </p>
        </div>

        <div className={`p-4 rounded-xl border transition-colors ${
          isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Mean Gateway Latency
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              240ms
            </span>
            <span className="text-[10px] font-mono text-emerald-500">99.4% SLA</span>
          </div>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Direct NPCI & RBI switch heartbeat
          </p>
        </div>
      </div>

      {/* Gateway Health Nodes List */}
      <div className={`rounded-xl border overflow-hidden transition-colors ${
        isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-[#1F1F1F] bg-[#000000]' : 'border-neutral-200 bg-neutral-50'
        }`}>
          <span className={`text-xs font-semibold uppercase tracking-wider font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Major Issuing Bank Pulse Matrix
          </span>
          <span className={`text-[11px] font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
            {banks.length} Nodes Monitored
          </span>
        </div>

        <div className={`divide-y ${isDark ? 'divide-[#181818]' : 'divide-neutral-100'}`}>
          {banks.map((bank) => {
            const isDegraded = bank.status === 'DEGRADED' || bank.status === 'OUTAGE';
            return (
              <div key={bank.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                isDark ? 'hover:bg-[#111111]' : 'hover:bg-neutral-50'
              }`}>
                {/* Bank Name & Status */}
                <div className="flex items-center space-x-3 min-w-[220px]">
                  <div className={`min-w-[52px] h-9 px-2 rounded-xl flex items-center justify-center font-mono font-bold text-[11px] shrink-0 tracking-tight ${
                    isDegraded 
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}>
                    {bank.code}
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{bank.bankName}</h4>
                    <div className="flex items-center space-x-2 text-[10px] font-mono mt-0.5">
                      <span className={`flex items-center space-x-1 ${isDegraded ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {isDegraded ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        <span>{bank.status}</span>
                      </span>
                      <span className={isDark ? 'text-[#71717A]' : 'text-neutral-400'}>·</span>
                      <span className={isDark ? 'text-[#71717A]' : 'text-neutral-500'}>{bank.latencyMs}ms latency</span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center space-x-6">
                  {/* Success Rate Bar */}
                  <div className="w-36 space-y-1">
                    <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                      <span>Success Rate</span>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{bank.successRate}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#1F1F1F]' : 'bg-neutral-200'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isDegraded ? 'bg-neutral-500' : isDark ? 'bg-neutral-300' : 'bg-neutral-700'
                        }`}
                        style={{ width: `${bank.successRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Impact Counts */}
                  <div className="text-right min-w-[120px]">
                    <div className={`text-xs font-semibold font-mono ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      ₹{bank.revenueProtectedAmount.toLocaleString('en-IN')}
                    </div>
                    <div className={`text-[10px] font-mono ${isDegraded ? 'text-amber-500' : isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                      {bank.casesOnHoldCount} cases on hold
                    </div>
                  </div>

                  {/* Outage Simulation Trigger */}
                  <button
                    onClick={() => handleToggleOutage(bank.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] cursor-pointer flex items-center space-x-1.5 ${
                      isDegraded
                        ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/50 shadow-sm'
                        : isDark
                        ? 'bg-[#141414] hover:bg-[#1E1E1E] text-[#D4D4D8] hover:text-white border-[#262626]'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                    }`}
                  >
                    {isDegraded ? (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        <span>Simulate Recovery</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>Simulate Outage</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
