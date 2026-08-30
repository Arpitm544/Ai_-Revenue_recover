import React, { useState } from 'react';
import { ShieldCheck, Check, Clock, UserX } from 'lucide-react';
import { ComplianceEngine } from '../recovery/ComplianceEngine';
import type { ComplianceSettings } from '../recovery/types';
import { useTheme } from '../../shared/ThemeContext';

interface ComplianceConfigViewProps {
  complianceEngine: ComplianceEngine;
  onSettingsUpdated: () => void;
}

export const ComplianceConfigView: React.FC<ComplianceConfigViewProps> = ({
  complianceEngine,
  onSettingsUpdated
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<ComplianceSettings>(complianceEngine.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    complianceEngine.updateSettings(formData);
    setSavedSuccess(true);
    onSettingsUpdated();
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2000);
  };

  return (
    <div className="space-y-5 h-full overflow-y-auto pr-1 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              RBI & DPDP Compliance Policy Engine
            </h2>
            <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
              isDark ? 'bg-indigo-950/50 text-indigo-300 border border-indigo-800/40' : 'bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold'
            }`}>
              Audit Verified
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Fine-tune Do-Not-Disturb timing windows, customer touchpoint caps, and automated stopping policies
          </p>
        </div>

        <button
          onClick={handleSave}
          className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] cursor-pointer shadow-md ${
            savedSuccess
              ? 'bg-emerald-600 text-white'
              : isDark
              ? 'bg-white hover:bg-neutral-200 text-black'
              : 'bg-black hover:bg-neutral-800 text-white'
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Save Policy Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Main Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DND Window Setting */}
        <div className={`p-5 rounded-xl border space-y-4 transition-colors ${
          isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                RBI / TRAI DND Window
              </span>
            </div>
            <span className={`text-[10px] font-mono ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>IST Timezone</span>
          </div>

          <p className={`text-xs leading-relaxed ${isDark ? 'text-[#A1A1A1]' : 'text-neutral-600'}`}>
            Prevents any voice call or WhatsApp outreach during designated evening/night hours per RBI guidelines.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className={`text-[10px] uppercase font-mono block mb-1.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                DND Start (Evening)
              </label>
              <input
                type="time"
                value={formData.dndHoursStart}
                onChange={(e) => setFormData({ ...formData, dndHoursStart: e.target.value })}
                className={`w-full text-xs rounded-lg p-2.5 font-mono focus:outline-none transition-colors border ${
                  isDark ? 'bg-[#141414] border-[#262626] text-white focus:border-[#555555]' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                }`}
              />
            </div>

            <div>
              <label className={`text-[10px] uppercase font-mono block mb-1.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                DND End (Morning)
              </label>
              <input
                type="time"
                value={formData.dndHoursEnd}
                onChange={(e) => setFormData({ ...formData, dndHoursEnd: e.target.value })}
                className={`w-full text-xs rounded-lg p-2.5 font-mono focus:outline-none transition-colors border ${
                  isDark ? 'bg-[#141414] border-[#262626] text-white focus:border-[#555555]' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Max Touchpoint Cap */}
        <div className={`p-5 rounded-xl border space-y-4 transition-colors ${
          isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserX className="w-4 h-4 text-blue-500" />
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Touchpoint Cap Per Case
              </span>
            </div>
            <span className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {formData.maxTouchpointsPerWeek} Max Attempts
            </span>
          </div>

          <p className={`text-xs leading-relaxed ${isDark ? 'text-[#A1A1A1]' : 'text-neutral-600'}`}>
            Anti-harassment ceiling: Automatically halts automated recovery attempts and alerts risk operations after cap is met.
          </p>

          <div className="pt-2">
            <input
              type="range"
              min="1"
              max="5"
              value={formData.maxTouchpointsPerWeek}
              onChange={(e) => setFormData({ ...formData, maxTouchpointsPerWeek: parseInt(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#71717A] mt-1.5">
              <span>1 Strict</span>
              <span>2</span>
              <span>3 Recommended</span>
              <span>4</span>
              <span>5 Max</span>
            </div>
          </div>
        </div>
      </div>

      {/* Automated Stopping Rules */}
      <div className={`p-5 rounded-xl border space-y-3 transition-colors ${
        isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <span className={`text-xs font-semibold uppercase tracking-wider font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
          Automated Stopping Rules & Guardrails
        </span>

        <div className="space-y-2 pt-1">
          <label className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors cursor-pointer ${
            isDark ? 'bg-[#111111] border-[#222222] hover:border-[#333333]' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
          }`}>
            <div className="space-y-0.5 pr-4">
              <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Auto-Pause on Customer Dispute Signal
              </span>
              <span className={`text-[11px] block leading-relaxed ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                Instantly freezes all voice & WhatsApp dunning if customer utters cancellation, dispute, or wrong charge in conversation.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.autoPauseOnDispute}
              onChange={(e) => setFormData({ ...formData, autoPauseOnDispute: e.target.checked })}
              className="w-4 h-4 rounded cursor-pointer accent-black dark:accent-white"
            />
          </label>

          <label className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors cursor-pointer ${
            isDark ? 'bg-[#111111] border-[#222222] hover:border-[#333333]' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
          }`}>
            <div className="space-y-0.5 pr-4">
              <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Hard Decline Fast Exit
              </span>
              <span className={`text-[11px] block leading-relaxed ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                Suppresses retries on closed accounts or revoked mandates to avoid incurring bank penal charges for the merchant.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.hardDeclineFastExit}
              onChange={(e) => setFormData({ ...formData, hardDeclineFastExit: e.target.checked })}
              className="w-4 h-4 rounded cursor-pointer accent-black dark:accent-white"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
