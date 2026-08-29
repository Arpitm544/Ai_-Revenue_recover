import React, { useState } from 'react';
import { X, ShieldCheck, Check, Clock, UserX } from 'lucide-react';
import { ComplianceEngine } from '../services/complianceEngine';
import type { ComplianceSettings } from '../types/recovery';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Compliance & Policy Engine Config</h3>
              <p className="text-xs text-slate-400">Configure RBI / DPDP rules and automated stopping policies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 bg-slate-950 overflow-y-auto max-h-[70vh]">
          {/* DND Hours */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>RBI / TRAI DND Window (IST)</span>
              </span>
              <span className="text-[11px] text-slate-400">No calls / SMS permitted in this window</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">DND Start Time</label>
                <input
                  type="time"
                  value={formData.dndHoursStart}
                  onChange={(e) => setFormData({ ...formData, dndHoursStart: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">DND End Time</label>
                <input
                  type="time"
                  value={formData.dndHoursEnd}
                  onChange={(e) => setFormData({ ...formData, dndHoursEnd: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg p-2 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Max Touchpoints */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center space-x-1.5">
                <UserX className="w-4 h-4 text-blue-400" />
                <span>Max Touchpoint Cap Per Week</span>
              </span>
              <span className="text-sm font-bold text-blue-400">{formData.maxTouchpointsPerWeek} Attempts</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.maxTouchpointsPerWeek}
              onChange={(e) => setFormData({ ...formData, maxTouchpointsPerWeek: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[11px] text-slate-400">
              Prevents harassment. Automatically halts outreach and escalates to human agent after limit is reached.
            </p>
          </div>

          {/* Stopping Rules Switches */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-white block">Automated Stopping Rules</span>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-slate-200 block">Auto-Pause on Customer Dispute</span>
                <span className="text-[10px] text-slate-400 block">Instantly freezes all voice & WhatsApp dunning if customer disputes charge</span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoPauseOnDispute}
                onChange={(e) => setFormData({ ...formData, autoPauseOnDispute: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-slate-200 block">Hard Decline Fast Exit</span>
                <span className="text-[10px] text-slate-400 block">Suppresses retries on invalid accounts / expired cards to avoid bank penalty charges</span>
              </div>
              <input
                type="checkbox"
                checked={formData.hardDeclineFastExit}
                onChange={(e) => setFormData({ ...formData, hardDeclineFastExit: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
          {savedSuccess ? (
            <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>Compliance Settings Saved!</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">RBI / DPDP Compliant Engine</span>
          )}

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              Save Policy Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
