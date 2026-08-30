import React, { useState } from 'react';
import { Activity, X, Shield } from 'lucide-react';
import type { BankHealthNode } from './types';
import type { RecoveryCase } from '../recovery/types';
import { BankHealthService } from './BankHealthService';

interface BankHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankHealthService: BankHealthService;
  cases: RecoveryCase[];
  onUpdateCases: (updatedCases: RecoveryCase[]) => void;
}

export const BankHealthModal: React.FC<BankHealthModalProps> = ({
  isOpen,
  onClose,
  bankHealthService,
  cases,
  onUpdateCases
}) => {
  const [banks, setBanks] = useState<BankHealthNode[]>(bankHealthService.getBanks());
  const [lastActionLog, setLastActionLog] = useState<string | null>(null);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1F1F1F] bg-[#000000] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">Bank Gateway Downtime Pulse Matrix</h3>
                <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                  degradedCount > 0 
                    ? 'bg-amber-950/50 text-amber-400 border border-amber-800/40' 
                    : 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                }`}>
                  {degradedCount > 0 ? `${degradedCount} Bank Degraded` : 'All Gateways Healthy'}
                </span>
              </div>
              <p className="text-[11px] text-[#71717A] mt-0.5">
                Real-time issuing bank uptime monitoring & intelligent mandate retry sequencer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Action Alert Banner */}
        {lastActionLog && (
          <div className="px-6 py-2.5 bg-[#111111] border-b border-[#1F1F1F] text-xs font-mono text-amber-300 flex items-center justify-between shrink-0">
            <span className="flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>{lastActionLog}</span>
            </span>
            <span className="text-[10px] text-[#71717A]">Policy Enforced</span>
          </div>
        )}

        {/* Top Summary Metrics */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-[#050505]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] space-y-1">
              <span className="text-[10px] text-[#71717A] uppercase font-mono block">Smart Downtime Holds</span>
              <span className="text-xl font-bold text-amber-400 font-mono block">{totalHeldCount} Retries Held</span>
              <span className="text-[11px] text-[#71717A] block">Auto-deferred to 04:00 AM off-peak</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-mono block">Protected Revenue</span>
              <span className="text-xl font-bold text-white font-mono block">₹{totalProtectedAmt.toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-[#71717A] block">Saved from failed penalty charges</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] flex flex-col justify-between space-y-1">
              <span className="text-[10px] text-[#A1A1A1] uppercase font-mono block">Smart Sequencer</span>
              <span className="text-[11px] text-[#D4D4D8] leading-relaxed block">
                Prevents random blind retries that incur penalty charges. Delays until bank health recovers.
              </span>
            </div>
          </div>

          {/* Banks Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                Issuing Bank Gateways (Live Health)
              </h4>
              <span className="text-[11px] text-[#52525B] font-mono">Click action to simulate outage</span>
            </div>

            <div className="space-y-2.5">
              {banks.map((bank) => {
                const isDegraded = bank.status === 'DEGRADED' || bank.status === 'OUTAGE';
                return (
                  <div
                    key={bank.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isDegraded 
                        ? 'bg-amber-950/20 border-amber-800/40' 
                        : 'bg-[#0D0D0D] border-[#1F1F1F]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left Bank Details */}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white text-xs">{bank.bankName}</span>
                          <span className="text-[10px] text-[#71717A] font-mono">({bank.code})</span>
                          <span className={`px-2 py-0.5 text-[9px] font-mono rounded flex items-center space-x-1 ${
                            isDegraded 
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40' 
                              : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isDegraded ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                            <span>{bank.status}</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-[#71717A]">
                          <span>Channel: <strong className="text-[#D4D4D8] font-normal">{bank.channel}</strong></span>
                          <span>·</span>
                          <span>Success Rate: <strong className={`font-mono ${isDegraded ? 'text-amber-400' : 'text-emerald-400'}`}>{bank.successRate}%</strong></span>
                          <span>·</span>
                          <span>Latency: <strong className="text-[#D4D4D8] font-mono font-normal">{bank.latencyMs}ms</strong></span>
                        </div>
                      </div>

                      {/* Right Action & Hold Status */}
                      <div className="flex items-center space-x-3 self-end sm:self-auto">
                        {isDegraded ? (
                          <div className="text-right">
                            <span className="text-xs font-mono font-semibold text-amber-300 block">{bank.casesOnHoldCount} Retries Held</span>
                            <span className="text-[10px] text-[#71717A] font-mono block">{bank.recommendedWindow}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-mono">Optimal Window Active</span>
                        )}

                        <button
                          onClick={() => handleToggleOutage(bank.code)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            isDegraded
                              ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/50'
                              : 'bg-[#181818] hover:bg-[#222222] text-[#EDEDED] border-[#2A2A2A]'
                          }`}
                        >
                          {isDegraded ? 'Restore Gateway' : 'Simulate Outage'}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar for Success Rate */}
                    <div className="mt-3">
                      <div className="w-full h-1 bg-[#1C1C1C] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDegraded ? 'bg-neutral-600' : 'bg-neutral-300'
                          }`}
                          style={{ width: `${bank.successRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#000000] border-t border-[#1F1F1F] flex justify-between items-center text-xs text-[#71717A] shrink-0">
          <span className="font-mono text-[11px]">Razorpay Smart Mandate Retry Sequencer</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#181818] hover:bg-[#222222] text-white font-medium rounded-lg border border-[#2A2A2A] transition-colors cursor-pointer text-xs"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
