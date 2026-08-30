import React, { useState } from 'react';
import { Zap, Check } from 'lucide-react';
import type { RecoveryCase, LeakVector } from '../recovery/types';
import { useTheme } from '../../shared/ThemeContext';

interface InjectLeakViewProps {
  onAddCase: (newCase: RecoveryCase) => void;
  onNavigateToCases: () => void;
}

export const InjectLeakView: React.FC<InjectLeakViewProps> = ({ onAddCase, onNavigateToCases }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [leakVector, setLeakVector] = useState<LeakVector>('SUBSCRIPTION_FAIL');
  const [amountAtRisk, setAmountAtRisk] = useState<number>(2499);
  const [issuingBank, setIssuingBank] = useState('HDFC Bank');
  const [failureReason, setFailureReason] = useState('Insufficient funds / soft decline');
  const [injectedSuccess, setInjectedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = customerName || "Anand Kumar";
    const paymentId = `pay_Custom${Math.floor(100000 + Math.random() * 900000)}`;

    const newCase: RecoveryCase = {
      id: `rc_custom_${Date.now()}`,
      paymentId,
      customerName: name,
      customerPhone,
      customerEmail: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      preferredLanguage: "Hinglish",
      leakVector,
      amountAtRisk,
      currency: "INR",
      failureCode: leakVector === 'CHECKOUT_ABANDON' ? "CART_IDLE" : "INSUFFICIENT_FUNDS",
      failureReason,
      issuingBank,
      failureCategory: "SOFT_DECLINE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "DETECTED",
      recommendedChannel: leakVector === 'CHECKOUT_ABANDON' ? "WHATSAPP_UPI_LINK" : "HINGLISH_VOICE_CALL",
      interventionReasoning: `Newly submitted ${leakVector} revenue leak tagged for immediate AI diagnosis.`,
      attemptsCount: 0,
      maxAttemptsAllowed: 3,
      totalAmountRecovered: 0,
      isCustomerDisputed: false,
      isOptedOut: false,
      auditTrail: [
        {
          id: `aud_new_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          actor: "RISK_ENGINE",
          action: "REVENUE_LEAK_INJECTED",
          details: `Manual test injection of ${leakVector} with ₹${amountAtRisk.toLocaleString('en-IN')} at risk.`,
          complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true }
        }
      ]
    };

    onAddCase(newCase);
    setInjectedSuccess(true);
    setTimeout(() => {
      setInjectedSuccess(false);
      onNavigateToCases();
    }, 900);
  };

  return (
    <div className="space-y-5 h-full overflow-y-auto pr-1 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Inject Revenue Leak Scenario
            </h2>
            <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
              isDark ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
            }`}>
              Sandbox Generator
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Manually trigger custom payment drops, cart abandonment, or invoice disputes into the live recovery pipeline
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={`p-6 rounded-xl border space-y-4 transition-colors ${
        isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div>
          <label className={`text-[10px] uppercase font-mono block mb-1.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Customer Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Anand Kumar"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={`w-full text-xs rounded-lg p-3 font-sans focus:outline-none transition-colors border ${
              isDark ? 'bg-[#111111] border-[#222222] text-white focus:border-[#444444]' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`text-[10px] uppercase font-mono block mb-1.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              Leak Vector
            </label>
            <select
              value={leakVector}
              onChange={(e) => setLeakVector(e.target.value as LeakVector)}
              className={`w-full text-xs rounded-lg p-3 font-sans focus:outline-none transition-colors border cursor-pointer ${
                isDark ? 'bg-[#111111] border-[#222222] text-white focus:border-[#444444]' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
              }`}
            >
              <option value="SUBSCRIPTION_FAIL">Subscription Recurring Fail</option>
              <option value="CHECKOUT_ABANDON">E-Commerce Checkout Abandon</option>
              <option value="B2B_INVOICE">B2B Overdue Invoice</option>
              <option value="MANDATE_FAIL">UPI AutoPay Mandate Decline</option>
            </select>
          </div>

          <div>
            <label className={`text-[10px] uppercase font-mono block mb-1.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              Amount at Risk (₹)
            </label>
            <input
              type="number"
              required
              min="1"
              value={amountAtRisk}
              onChange={(e) => setAmountAtRisk(parseInt(e.target.value) || 0)}
              className={`w-full text-xs rounded-lg p-3 font-mono focus:outline-none transition-colors border ${
                isDark ? 'bg-[#111111] border-[#222222] text-white focus:border-[#444444]' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`text-[10px] uppercase font-mono block mb-1.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              Issuing Bank
            </label>
            <select
              value={issuingBank}
              onChange={(e) => setIssuingBank(e.target.value)}
              className={`w-full text-xs rounded-lg p-3 font-sans focus:outline-none transition-colors border cursor-pointer ${
                isDark ? 'bg-[#111111] border-[#222222] text-white focus:border-[#444444]' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
              }`}
            >
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="ICICI Bank">ICICI Bank</option>
              <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
              <option value="Axis Bank">Axis Bank</option>
              <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
            </select>
          </div>

          <div>
            <label className={`text-[10px] uppercase font-mono block mb-1.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              Customer Phone
            </label>
            <input
              type="text"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className={`w-full text-xs rounded-lg p-3 font-mono focus:outline-none transition-colors border ${
                isDark ? 'bg-[#111111] border-[#222222] text-white focus:border-[#444444]' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
              }`}
            />
          </div>
        </div>

        <div>
          <label className={`text-[10px] uppercase font-mono block mb-1.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Failure Reason Description
          </label>
          <input
            type="text"
            value={failureReason}
            onChange={(e) => setFailureReason(e.target.value)}
            className={`w-full text-xs rounded-lg p-3 font-sans focus:outline-none transition-colors border ${
              isDark ? 'bg-[#111111] border-[#222222] text-white focus:border-[#444444]' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
            }`}
          />
        </div>

        <div className="pt-3 flex items-center justify-between">
          <span className={`text-[11px] font-mono ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Autonomous AI agent will auto-diagnose on submission
          </span>

          <button
            type="submit"
            className={`flex items-center space-x-2 px-6 py-3 font-semibold text-xs rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] cursor-pointer shadow-md ${
              injectedSuccess
                ? 'bg-emerald-600 text-white'
                : isDark
                ? 'bg-white hover:bg-neutral-200 text-black'
                : 'bg-black hover:bg-neutral-800 text-white'
            }`}
          >
            {injectedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Injected & Navigating...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Inject Leak Scenario</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
