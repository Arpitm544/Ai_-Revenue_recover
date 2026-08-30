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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Immutable Audit Trail</h3>
              <p className="text-xs text-slate-400">Case ID: {rcase.id} • {rcase.customerName} ({rcase.paymentId})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Log Timeline */}
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-950 flex-1">
          {rcase.auditTrail.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No audit entries recorded yet.</div>
          ) : (
            rcase.auditTrail.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${
                      entry.actor === 'COMPLIANCE_GUARD' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : entry.actor === 'RISK_ENGINE'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : entry.actor === 'AI_INTERVENTION_AGENT'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {entry.actor}
                    </span>
                    <span className="text-xs font-semibold text-white">{entry.action}</span>
                  </div>

                  <span className="text-[11px] text-slate-500 flex items-center space-x-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(entry.timestamp).toLocaleString('en-IN')}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">{entry.details}</p>

                {/* Compliance Checklist Meta */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className={`w-3.5 h-3.5 ${entry.complianceCheck.dndCompliant ? 'text-emerald-400' : 'text-rose-400'}`} />
                      <span>DND Window: {entry.complianceCheck.dndCompliant ? 'Passed' : 'DND Hold'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <UserCheck className={`w-3.5 h-3.5 ${entry.complianceCheck.maxAttemptsRespected ? 'text-emerald-400' : 'text-rose-400'}`} />
                      <span>Max Touchpoints: {entry.complianceCheck.maxAttemptsRespected ? 'OK' : 'Cap Reached'}</span>
                    </span>
                  </div>

                  {entry.complianceCheck.ruleApplied && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Policy: {entry.complianceCheck.ruleApplied}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span className="flex items-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cryptographically Verified Audit Log</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};
