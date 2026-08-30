import React, { useState } from 'react';
import { 
  X, User, Phone, Mail, Copy, Check, PhoneCall, MessageSquare, 
  ArrowUpRight, Handshake, Calendar, ChevronRight
} from 'lucide-react';
import type { RecoveryCase } from './types';
import { useTheme } from '../../shared/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'actions'>('details');
  const [copied, setCopied] = useState(false);

  if (!rcase) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <aside className={`w-[390px] min-w-[360px] max-w-[420px] shrink-0 border-l flex flex-col h-full overflow-hidden select-none z-20 transition-colors animate-drawer-slide ${
      isDark 
        ? 'bg-[#0A0A0A] border-[#1F1F1F] text-[#EDEDED]' 
        : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#111827] shadow-xl'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3.5 border-b flex items-center justify-between shrink-0 transition-colors ${
        isDark ? 'border-[#1F1F1F] bg-[#000000]' : 'border-[#E5E7EB] bg-[#F9FAFB]'
      }`}>
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isDark ? 'bg-neutral-800 border border-neutral-700 text-white' : 'bg-neutral-200 border border-neutral-300 text-neutral-800 font-bold'
          }`}>
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className={`text-sm font-semibold tracking-tight truncate ${isDark ? 'text-white' : 'text-neutral-900 font-bold'}`}>
              {rcase.customerName}
            </h3>
            <div className={`flex items-center space-x-1.5 text-[10px] font-mono truncate ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              <span className="truncate">{rcase.paymentId}</span>
              <button 
                onClick={() => copyToClipboard(rcase.paymentId)} 
                className={`hover:text-black transition-colors cursor-pointer shrink-0 ${isDark ? 'hover:text-white' : 'hover:text-neutral-900'}`}
                title="Copy Payment ID"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-2 ${
            isDark ? 'text-[#71717A] hover:text-white hover:bg-[#1A1A1A]' : 'text-neutral-500 hover:text-black hover:bg-neutral-200'
          }`}
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex border-b text-xs font-medium px-4 shrink-0 transition-colors ${
        isDark ? 'border-[#1F1F1F] bg-[#0A0A0A]' : 'border-[#E5E7EB] bg-[#FFFFFF]'
      }`}>
        <button
          onClick={() => setActiveTab('details')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'details'
              ? isDark ? 'border-white text-white font-semibold' : 'border-black text-black font-bold'
              : isDark ? 'border-transparent text-[#71717A] hover:text-[#D4D4D8]' : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'activity'
              ? isDark ? 'border-white text-white font-semibold' : 'border-black text-black font-bold'
              : isDark ? 'border-transparent text-[#71717A] hover:text-[#D4D4D8]' : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          <span>Activity</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
            isDark ? 'bg-[#181818] text-[#A1A1A1]' : 'bg-neutral-100 text-neutral-600'
          }`}>
            {rcase.auditTrail.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'actions'
              ? isDark ? 'border-white text-white font-semibold' : 'border-black text-black font-bold'
              : isDark ? 'border-transparent text-[#71717A] hover:text-[#D4D4D8]' : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          Interventions
        </button>
      </div>

      {/* Drawer Body */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 text-xs transition-colors ${
        isDark ? 'bg-[#050505]' : 'bg-[#F9FAFB]'
      }`}>
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Financial Summary Card */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isDark ? 'bg-[#0D0D0D] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
            }`}>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${
                isDark ? 'text-[#71717A]' : 'text-neutral-500'
              }`}>
                Financial Exposure
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    ₹{rcase.amountAtRisk.toLocaleString('en-IN')}
                  </div>
                  <span className={`text-[10px] ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>At Risk Balance</span>
                </div>

                {rcase.totalAmountRecovered > 0 && (
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-emerald-500">
                      ₹{rcase.totalAmountRecovered.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-emerald-500 font-medium">Recovered</span>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostics & Root Cause */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-[#0D0D0D] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
            }`}>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${
                isDark ? 'text-[#71717A]' : 'text-neutral-500'
              }`}>
                Failure Diagnostics
              </span>

              <div className="space-y-2 text-xs">
                <div>
                  <span className={`text-[11px] block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>Issuing Bank</span>
                  <span className={`font-semibold ${isDark ? 'text-[#EDEDED]' : 'text-neutral-900'}`}>{rcase.issuingBank}</span>
                </div>

                <div>
                  <span className={`text-[11px] block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>Failure Code</span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded break-all inline-block max-w-full ${
                    isDark ? 'bg-[#181818] text-[#D4D4D8] border border-[#2A2A2A]' : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                  }`}>
                    {rcase.failureCode}
                  </span>
                </div>

                <div>
                  <span className={`text-[11px] block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>Root Cause Reasoning</span>
                  <p className={`text-xs leading-relaxed mt-0.5 break-words ${isDark ? 'text-[#D4D4D8]' : 'text-neutral-700'}`}>
                    {rcase.interventionReasoning || rcase.failureReason}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Properties */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-[#0D0D0D] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
            }`}>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${
                isDark ? 'text-[#71717A]' : 'text-neutral-500'
              }`}>
                Customer Properties
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </span>
                  <span className={`font-mono ${isDark ? 'text-[#EDEDED]' : 'text-neutral-900'}`}>{rcase.customerPhone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                    <Mail className="w-3.5 h-3.5" /> Email
                  </span>
                  <span className={`font-mono truncate max-w-[180px] ${isDark ? 'text-[#EDEDED]' : 'text-neutral-900'}`}>{rcase.customerEmail}</span>
                </div>

                {rcase.salaryDateEstimate && (
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                      <Calendar className="w-3.5 h-3.5" /> Estimated Salary
                    </span>
                    <span className="font-mono text-emerald-500 font-semibold">{rcase.salaryDateEstimate}th of Month</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                Audit Trail Stream
              </span>
              <button 
                onClick={() => onSelectAuditCase(rcase)}
                className={`text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                  isDark ? 'text-white hover:underline' : 'text-black font-semibold hover:underline'
                }`}
              >
                <span>Full Modal</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {rcase.auditTrail.map((log, idx) => (
                <div 
                  key={log.id || idx}
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    isDark ? 'bg-[#0D0D0D] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                      isDark ? 'bg-[#181818] text-[#D4D4D8] border-[#2A2A2A]' : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                    }`}>
                      {log.actor}
                    </span>
                    <span className={`text-[10px] font-mono ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-neutral-900'}`}>{log.action}</div>
                  <p className={`text-[11px] leading-relaxed break-words ${isDark ? 'text-[#A1A1A1]' : 'text-neutral-600'}`}>{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3">
            <span className={`text-[10px] font-mono uppercase tracking-wider block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              Available Interventions
            </span>

            {/* 1-Click Auto Diagnose & Intervene */}
            <button
              onClick={() => onInterveneSingle(rcase)}
              className={`w-full p-3 rounded-xl border transition-colors flex items-center justify-between cursor-pointer ${
                isDark 
                  ? 'bg-white hover:bg-neutral-200 text-black border-transparent shadow-sm' 
                  : 'bg-black hover:bg-neutral-800 text-white border-transparent shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ArrowUpRight className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-semibold text-xs">Execute Smart Recovery</div>
                  <div className={`text-[10px] ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`}>Diagnose + dispatch channel</div>
                </div>
              </div>
            </button>

            {/* Voice AI Simulator */}
            <button
              onClick={() => onSelectVoiceCase(rcase)}
              className={`w-full p-3 rounded-xl border transition-colors flex items-center justify-between cursor-pointer ${
                isDark 
                  ? 'bg-[#0D0D0D] hover:bg-[#141414] border-[#1F1F1F] text-[#EDEDED]' 
                  : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-900 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <PhoneCall className="w-4 h-4 text-emerald-500" />
                <div className="text-left">
                  <div className="font-semibold text-xs">Hinglish Voice AI Call</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>Speech synthesis & microphone</div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${isDark ? 'text-[#71717A]' : 'text-neutral-400'}`} />
            </button>

            {/* WhatsApp 1-Tap UPI */}
            <button
              onClick={() => onSelectWhatsAppCase(rcase)}
              className={`w-full p-3 rounded-xl border transition-colors flex items-center justify-between cursor-pointer ${
                isDark 
                  ? 'bg-[#0D0D0D] hover:bg-[#141414] border-[#1F1F1F] text-[#EDEDED]' 
                  : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-900 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <div className="text-left">
                  <div className="font-semibold text-xs">WhatsApp 1-Tap UPI</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>Dynamic discount link</div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${isDark ? 'text-[#71717A]' : 'text-neutral-400'}`} />
            </button>

            {/* B2B Milestone Negotiator */}
            <button
              onClick={() => onSelectNegotiateCase(rcase)}
              className={`w-full p-3 rounded-xl border transition-colors flex items-center justify-between cursor-pointer ${
                isDark 
                  ? 'bg-[#0D0D0D] hover:bg-[#141414] border-[#1F1F1F] text-[#EDEDED]' 
                  : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-900 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Handshake className="w-4 h-4 text-purple-500" />
                <div className="text-left">
                  <div className="font-semibold text-xs">B2B Milestone Split</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>Enterprise payment plan</div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${isDark ? 'text-[#71717A]' : 'text-neutral-400'}`} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
