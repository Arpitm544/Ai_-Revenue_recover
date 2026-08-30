import React, { useState } from 'react';
import { X, ShieldCheck, Check, Clock, UserX } from 'lucide-react';
import { ComplianceEngine } from '../recovery/ComplianceEngine';
import type { ComplianceSettings } from '../recovery/types';

interface ComplianceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  complianceEngine: ComplianceEngine;
  onSettingsUpdated: () => void;
}

export const ComplianceConfigModal: React.FC<ComplianceConfigModalProps> = ({
  isOpen,
  onClose,
  complianceEngine,
  onSettingsUpdated
}) => {
  const [formData, setFormData] = useState<ComplianceSettings>(complianceEngine.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    complianceEngine.updateSettings(formData);
    setSavedSuccess(true);
    onSettingsUpdated();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1F1F1F] bg-[#000000] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Compliance & Policy Engine Config</h3>
              <p className="text-[11px] text-[#71717A] mt-0.5">Configure RBI / DPDP rules and automated stopping policies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 bg-[#050505] overflow-y-auto max-h-[70vh]">
          {/* DND Hours */}
          <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>RBI / TRAI DND Window (IST)</span>
              </span>
              <span className="text-[10px] text-[#71717A] font-mono">No calls / SMS in window</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#71717A] uppercase font-mono block mb-1">DND Start Time</label>
                <input
                  type="time"
                  value={formData.dndHoursStart}
                  onChange={(e) => setFormData({ ...formData, dndHoursStart: e.target.value })}
                  className="w-full bg-[#141414] border border-[#262626] text-white text-xs rounded-lg p-2 font-mono focus:border-[#444444] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#71717A] uppercase font-mono block mb-1">DND End Time</label>
                <input
                  type="time"
                  value={formData.dndHoursEnd}
                  onChange={(e) => setFormData({ ...formData, dndHoursEnd: e.target.value })}
                  className="w-full bg-[#141414] border border-[#262626] text-white text-xs rounded-lg p-2 font-mono focus:border-[#444444] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Max Touchpoints */}
          <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center space-x-1.5">
                <UserX className="w-3.5 h-3.5 text-blue-400" />
                <span>Max Touchpoint Cap Per Week</span>
              </span>
              <span className="text-xs font-mono font-semibold text-white">{formData.maxTouchpointsPerWeek} Attempts</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.maxTouchpointsPerWeek}
              onChange={(e) => setFormData({ ...formData, maxTouchpointsPerWeek: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-[#1F1F1F] rounded-lg appearance-none cursor-pointer accent-white"
            />
            <p className="text-[11px] text-[#71717A] leading-relaxed">
              Prevents harassment. Automatically halts outreach and escalates to human agent after limit is reached.
            </p>
          </div>

          {/* Stopping Rules Switches */}
          <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] space-y-2.5">
            <span className="text-[10px] uppercase font-mono text-[#71717A] tracking-wider block">
              Automated Stopping Rules
            </span>

            <label className="flex items-center justify-between p-3 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#333333] transition-colors cursor-pointer">
              <div className="space-y-0.5 pr-3">
                <span className="text-xs font-medium text-[#EDEDED] block">Auto-Pause on Customer Dispute</span>
                <span className="text-[10px] text-[#71717A] block">Instantly freezes all voice & WhatsApp dunning if customer disputes charge</span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoPauseOnDispute}
                onChange={(e) => setFormData({ ...formData, autoPauseOnDispute: e.target.checked })}
                className="w-4 h-4 rounded border-[#333333] text-white focus:ring-0 bg-[#222222] cursor-pointer accent-white"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#333333] transition-colors cursor-pointer">
              <div className="space-y-0.5 pr-3">
                <span className="text-xs font-medium text-[#EDEDED] block">Hard Decline Fast Exit</span>
                <span className="text-[10px] text-[#71717A] block">Suppresses retries on invalid accounts / expired cards to avoid bank penalty charges</span>
              </div>
              <input
                type="checkbox"
                checked={formData.hardDeclineFastExit}
                onChange={(e) => setFormData({ ...formData, hardDeclineFastExit: e.target.checked })}
                className="w-4 h-4 rounded border-[#333333] text-white focus:ring-0 bg-[#222222] cursor-pointer accent-white"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#000000] border-t border-[#1F1F1F] flex justify-between items-center shrink-0">
          {savedSuccess ? (
            <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Compliance Settings Saved!</span>
            </span>
          ) : (
            <span className="text-[11px] text-[#71717A] font-mono">RBI / DPDP Compliant Engine</span>
          )}

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#141414] hover:bg-[#222222] text-[#A1A1A1] hover:text-white text-xs font-medium rounded-lg border border-[#262626] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Save Policy Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
