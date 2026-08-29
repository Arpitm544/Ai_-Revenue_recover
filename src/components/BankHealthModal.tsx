import React, { useState } from 'react';
import { Activity, X, Shield } from 'lucide-react';
import type { BankHealthNode } from '../types/bankHealth';
import type { RecoveryCase } from '../types/recovery';
import { BankHealthService } from '../services/bankHealthService';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Bank Gateway Downtime Pulse Matrix</h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  degradedCount > 0 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {degradedCount > 0 ? `${degradedCount} Bank Degraded` : 'All Gateways Healthy'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time issuing bank uptime monitoring & intelligent mandate retry sequestering
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Alert Banner */}
        {lastActionLog && (
          <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 text-xs font-semibold text-amber-300 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>{lastActionLog}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Real-time Policy Enforced</span>
          </div>
        )}

        {/* Top Summary Metrics */}
        <div className="p-6 bg-slate-950 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Smart Downtime Holds</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block">{totalHeldCount} Retries Held</span>
              <span className="text-[11px] text-slate-500">Auto-deferred to 04:00 AM off-peak</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30">
              <span className="text-xs text-emerald-400 block font-semibold">Protected Revenue</span>
              <span className="text-2xl font-bold text-white mt-1 block">₹{totalProtectedAmt.toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-emerald-500/80">Saved from failed mandate penalty charges</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 flex flex-col justify-between">
              <span className="text-xs text-indigo-300 block font-semibold">Smart Mandate Sequencer</span>
              <span className="text-xs text-slate-300 mt-1 block leading-relaxed">
                Prevents random blind retries that incur bank charges. Delays until issuing bank health recovers.
              </span>
            </div>
          </div>

          {/* Banks Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Issuing Bank Gateways (Live Status)
              </h4>
              <span className="text-[11px] text-slate-500">Click toggle to simulate bank failure</span>
            </div>

            <div className="space-y-3">
              {banks.map((bank) => {
                const isDegraded = bank.status === 'DEGRADED' || bank.status === 'OUTAGE';
                return (
                  <div
                    key={bank.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDegraded 
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/30' 
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left Bank Details */}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{bank.bankName}</span>
                          <span className="text-xs text-slate-400 font-mono">({bank.code})</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center space-x-1 ${
                            isDegraded 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isDegraded ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                            <span>{bank.status}</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span>Channel: <strong className="text-slate-200">{bank.channel}</strong></span>
                          <span>•</span>
                          <span>Success Rate: <strong className={isDegraded ? 'text-rose-400' : 'text-emerald-400'}>{bank.successRate}%</strong></span>
                          <span>•</span>
                          <span>Latency: <strong className="text-slate-200">{bank.latencyMs}ms</strong></span>
                        </div>
                      </div>

                      {/* Right Action & Hold Status */}
                      <div className="flex items-center space-x-3 self-end sm:self-auto">
                        {isDegraded ? (
                          <div className="text-right">
                            <span className="text-xs font-bold text-amber-300 block">{bank.casesOnHoldCount} Retries Held</span>
                            <span className="text-[10px] text-slate-400 block">{bank.recommendedWindow}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-400 font-medium">Optimal Window Active</span>
                        )}

                        <button
                          onClick={() => handleToggleOutage(bank.code)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isDegraded
                              ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {isDegraded ? 'Restore Gateway' : 'Simulate Outage'}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar for Success Rate */}
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDegraded ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-emerald-500'
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
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Razorpay Smart Mandate Retry Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Close Gateway Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
