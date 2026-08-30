import React, { useState } from 'react';
import { 
  X, User, Phone, Mail, Building, Copy, Check, PhoneCall, MessageSquare, 
  ShieldCheck, ArrowUpRight, Clock, Handshake, CheckCircle2,
  Calendar, ChevronRight
} from 'lucide-react';
import type { RecoveryCase } from './types';

interface CaseDetailDrawerProps {
  rcase: RecoveryCase | null;
  onClose: () => void;
  onSelectVoiceCase: (rcase: RecoveryCase) => void;
  onSelectWhatsAppCase: (rcase: RecoveryCase) => void;
  onSelectAuditCase: (rcase: RecoveryCase) => void;
  onSelectNegotiateCase: (rcase: RecoveryCase) => void;
  onInterveneSingle: (rcase: RecoveryCase) => void;
}

export const CaseDetailDrawer: React.FC<CaseDetailDrawerProps> = ({
  rcase,
  onClose,
  onSelectVoiceCase,
  onSelectWhatsAppCase,
  onSelectAuditCase,
  onSelectNegotiateCase,
  onInterveneSingle
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'actions'>('details');
  const [copied, setCopied] = useState(false);

  if (!rcase) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <aside className="w-[390px] min-w-[360px] max-w-[420px] shrink-0 bg-[#0A0A0A] border-l border-[#1F1F1F] flex flex-col h-full overflow-hidden text-[#EDEDED] select-none z-20">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-[#1F1F1F] flex items-center justify-between shrink-0 bg-[#000000]">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shrink-0">
            <User className="w-4 h-4 text-neutral-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white tracking-tight truncate">
              {rcase.customerName}
            </h3>
            <div className="flex items-center space-x-1.5 text-[10px] text-[#71717A] font-mono truncate">
              <span className="truncate">{rcase.paymentId}</span>
              <button 
                onClick={() => copyToClipboard(rcase.paymentId)} 
                className="hover:text-white transition-colors cursor-pointer shrink-0"
                title="Copy Payment ID"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1.5 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1F1F1F] bg-[#0A0A0A] px-4 text-xs font-medium shrink-0">
        <button
          onClick={() => setActiveTab('details')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'details'
              ? 'border-white text-white font-semibold'
              : 'border-transparent text-[#71717A] hover:text-[#D4D4D8]'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'activity'
              ? 'border-white text-white font-semibold'
              : 'border-transparent text-[#71717A] hover:text-[#D4D4D8]'
          }`}
        >
          <span>Activity</span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#1A1A1A] text-[#A1A1A1]">
            {rcase.auditTrail.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'actions'
              ? 'border-white text-white font-semibold'
              : 'border-transparent text-[#71717A] hover:text-[#D4D4D8]'
          }`}
        >
          Interventions
        </button>
      </div>

      {/* Body Area with strict overflow-x-hidden */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 text-xs w-full">
        {/* Financial Summary Card */}
        <div className="rounded-xl bg-[#111111] border border-[#222222] p-3.5 space-y-2.5 w-full">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#71717A] uppercase font-mono tracking-wider">Status</span>
            {rcase.status === 'RECOVERED' && (
              <span className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 font-mono text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Recovered
              </span>
            )}
            {rcase.status === 'PROMISED_TO_PAY' && (
              <span className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40 font-mono text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3" /> Promised
              </span>
            )}
            {rcase.status === 'INTERVENING' && (
              <span className="px-2 py-0.5 rounded bg-blue-950/50 text-blue-300 border border-blue-800/40 font-mono text-[10px] flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Intervening
              </span>
            )}
            {rcase.status === 'STOPPED_COMPLIANT' && (
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono text-[10px]">
                Stopped Compliant
              </span>
            )}
            {rcase.status === 'FAILED_UNRECOVERABLE' && (
              <span className="px-2 py-0.5 rounded bg-red-950/50 text-red-400 border border-red-800/40 font-mono text-[10px]">
                Unrecoverable
              </span>
            )}
            {(rcase.status === 'DETECTED' || rcase.status === 'DIAGNOSED') && (
              <span className="px-2 py-0.5 rounded bg-[#181818] text-[#A1A1A1] border border-[#27272A] font-mono text-[10px]">
                Pending
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#222222]">
            <div>
              <span className="text-[10px] text-[#71717A] uppercase font-mono block">Amount at Risk</span>
              <span className="text-base font-semibold text-white">₹{rcase.amountAtRisk.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#71717A] uppercase font-mono block">Recovered</span>
              <span className="text-base font-semibold text-emerald-400">
                ₹{rcase.totalAmountRecovered.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1: Details View */}
        {activeTab === 'details' && (
          <div className="space-y-4 w-full">
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSelectVoiceCase(rcase)}
                className="flex items-center justify-center space-x-1.5 py-2 px-2 bg-[#161616] hover:bg-[#222222] text-[#EDEDED] rounded-lg border border-[#27272A] hover:border-[#3A3A3A] transition-colors cursor-pointer text-xs font-medium"
              >
                <PhoneCall className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">Voice AI Call</span>
              </button>
              <button
                onClick={() => onSelectWhatsAppCase(rcase)}
                className="flex items-center justify-center space-x-1.5 py-2 px-2 bg-[#161616] hover:bg-[#222222] text-[#EDEDED] rounded-lg border border-[#27272A] hover:border-[#3A3A3A] transition-colors cursor-pointer text-xs font-medium"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">WhatsApp 1-Tap</span>
              </button>
            </div>

            {rcase.leakVector === 'B2B_INVOICE' && rcase.amountAtRisk >= 45000 && (
              <button
                onClick={() => onSelectNegotiateCase(rcase)}
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 rounded-lg border border-purple-800/40 transition-colors cursor-pointer text-xs font-medium"
              >
                <Handshake className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Open B2B Milestone Negotiator</span>
              </button>
            )}

            {/* Failure & Diagnostic Card with strict text wrapping */}
            <div className="space-y-2 w-full">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                Failure Diagnosis
              </h4>
              <div className="rounded-xl bg-[#111111] border border-[#222222] p-3 space-y-2.5 w-full overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[#71717A] uppercase font-mono block">Failure Code</span>
                    <span className="font-mono text-xs text-amber-300 break-all leading-tight block mt-0.5">
                      {rcase.failureCode}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#181818] border border-[#27272A] text-[#A1A1A1] font-mono shrink-0">
                    {rcase.issuingBank}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#71717A] uppercase font-mono block">Reason</span>
                  <p className="text-xs text-[#D4D4D8] leading-relaxed break-words mt-0.5">
                    {rcase.failureReason}
                  </p>
                </div>
                {rcase.interventionReasoning && (
                  <div className="pt-2 border-t border-[#222222]">
                    <span className="text-[10px] text-[#71717A] uppercase font-mono block">AI Strategy</span>
                    <p className="text-xs text-blue-300/90 leading-relaxed break-words mt-0.5">
                      {rcase.interventionReasoning}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Properties List */}
            <div className="space-y-2 w-full">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                Customer Properties
              </h4>
              <div className="rounded-xl bg-[#111111] border border-[#222222] divide-y divide-[#1F1F1F] w-full overflow-hidden">
                <div className="p-2.5 flex items-center justify-between text-xs gap-2">
                  <span className="text-[#71717A] flex items-center gap-1.5 shrink-0">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </span>
                  <span className="font-mono text-[#EDEDED] truncate">{rcase.customerPhone}</span>
                </div>
                {rcase.customerEmail && (
                  <div className="p-2.5 flex items-center justify-between text-xs gap-2">
                    <span className="text-[#71717A] flex items-center gap-1.5 shrink-0">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </span>
                    <span className="text-[#EDEDED] truncate font-mono">{rcase.customerEmail}</span>
                  </div>
                )}
                <div className="p-2.5 flex items-center justify-between text-xs gap-2">
                  <span className="text-[#71717A] flex items-center gap-1.5 shrink-0">
                    <Building className="w-3.5 h-3.5" /> Issuing Bank
                  </span>
                  <span className="text-[#EDEDED] truncate">{rcase.issuingBank}</span>
                </div>
                {rcase.salaryDateEstimate && (
                  <div className="p-2.5 flex items-center justify-between text-xs gap-2">
                    <span className="text-[#71717A] flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5" /> Salary Window
                    </span>
                    <span className="text-[#EDEDED] font-mono">{rcase.salaryDateEstimate}th of month</span>
                  </div>
                )}
                <div className="p-2.5 flex items-center justify-between text-xs gap-2">
                  <span className="text-[#71717A] flex items-center gap-1.5 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Touchpoints
                  </span>
                  <span className="font-mono text-[#EDEDED]">{rcase.attemptsCount} / {rcase.maxAttemptsAllowed} max</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Activity / Audit Trail */}
        {activeTab === 'activity' && (
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                Immutable Event Trail
              </span>
              <button 
                onClick={() => onSelectAuditCase(rcase)}
                className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Full Ledger</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-[#222222]">
              {rcase.auditTrail.map((log) => (
                <div key={log.id} className="relative pl-6 space-y-1">
                  <div className="absolute left-2 top-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-[#0A0A0A]" />
                  <div className="flex items-center justify-between text-[10px] gap-2">
                    <span className="font-mono font-semibold text-white truncate">{log.action}</span>
                    <span className="text-[#71717A] font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A1A1A1] leading-relaxed bg-[#111111] p-2 rounded-lg border border-[#222222] break-words">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Actions View */}
        {activeTab === 'actions' && (
          <div className="space-y-3 w-full">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              Autonomous Interventions
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => onSelectVoiceCase(rcase)}
                className="w-full p-3 rounded-xl bg-[#111111] hover:bg-[#161616] border border-[#222222] text-left transition-colors flex items-start gap-3 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Speech-to-Speech Voice AI</div>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    Trigger real-time Hinglish phone call with P2P date capture.
                  </p>
                </div>
              </button>

              <button
                onClick={() => onSelectWhatsAppCase(rcase)}
                className="w-full p-3 rounded-xl bg-[#111111] hover:bg-[#161616] border border-[#222222] text-left transition-colors flex items-start gap-3 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">WhatsApp 1-Tap UPI Nudge</div>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    Send verified Razorpay 1-tap deep link with dynamic discounts.
                  </p>
                </div>
              </button>

              {rcase.leakVector === 'B2B_INVOICE' && (
                <button
                  onClick={() => onSelectNegotiateCase(rcase)}
                  className="w-full p-3 rounded-xl bg-[#111111] hover:bg-[#161616] border border-[#222222] text-left transition-colors flex items-start gap-3 cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                    <Handshake className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">B2B Milestone Settlement</div>
                    <p className="text-[11px] text-[#71717A] mt-0.5">
                      Propose structured split-pay plans with signed P2P ledger.
                    </p>
                  </div>
                </button>
              )}

              <button
                onClick={() => onInterveneSingle(rcase)}
                className="w-full p-3 rounded-xl bg-white hover:bg-neutral-200 text-black text-left transition-colors flex items-center justify-between font-medium cursor-pointer"
              >
                <span>Execute Single Auto-Intervention</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
