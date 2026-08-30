import React from 'react';
import { ShieldCheck, X, FileText, UserCheck, Lock, Clock } from 'lucide-react';
import type { RecoveryCase } from '../recovery/types';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rcase: RecoveryCase | null;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose, rcase }) => {
  if (!isOpen || !rcase) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-[#1F1F1F] bg-[#000000] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Immutable Compliance Audit Trail</h3>
              <p className="text-[10px] text-[#71717A] font-mono mt-0.5">{rcase.customerName} · {rcase.paymentId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Audit Log Timeline */}
        <div className="p-5 overflow-y-auto space-y-3 bg-[#050505] flex-1">
          {rcase.auditTrail.length === 0 ? (
            <div className="text-center py-8 text-[#52525B] text-xs font-mono">No audit entries recorded yet.</div>
          ) : (
            rcase.auditTrail.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] space-y-2 relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-[#181818] text-[#D4D4D8] border border-[#2A2A2A]">
                      {entry.actor}
                    </span>
                    <span className="text-xs font-semibold text-white">{entry.action}</span>
                  </div>

                  <span className="text-[10px] text-[#71717A] flex items-center space-x-1 font-mono shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(entry.timestamp).toLocaleTimeString('en-IN')}</span>
                  </span>
                </div>

                <p className="text-xs text-[#D4D4D8] leading-relaxed break-words">{entry.details}</p>

                {/* Compliance Checklist Meta */}
                <div className="pt-2 border-t border-[#1F1F1F] flex items-center justify-between text-[10px] text-[#71717A]">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className={`w-3 h-3 ${entry.complianceCheck.dndCompliant ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <span>DND: {entry.complianceCheck.dndCompliant ? 'Passed' : 'Hold'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <UserCheck className={`w-3 h-3 ${entry.complianceCheck.maxAttemptsRespected ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <span>Touchpoints: {entry.complianceCheck.maxAttemptsRespected ? 'OK' : 'Cap Hit'}</span>
                    </span>
                  </div>

                  {entry.complianceCheck.ruleApplied && (
                    <span className="text-[10px] text-[#52525B] font-mono">
                      {entry.complianceCheck.ruleApplied}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#000000] border-t border-[#1F1F1F] flex justify-between items-center text-xs text-[#71717A] shrink-0">
          <span className="flex items-center space-x-1.5 font-mono text-[10px]">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cryptographically Verified Audit Log</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#141414] hover:bg-[#222222] text-[#EDEDED] font-medium rounded-lg border border-[#262626] transition-colors cursor-pointer text-xs"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};
