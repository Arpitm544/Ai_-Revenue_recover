import React, { useState } from 'react';
import { PlusCircle, X, Zap } from 'lucide-react';
import type { RecoveryCase, LeakVector } from '../recovery/types';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCase: (newCase: RecoveryCase) => void;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({ isOpen, onClose, onAddCase }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [leakVector, setLeakVector] = useState<LeakVector>('SUBSCRIPTION_FAIL');
  const [amountAtRisk, setAmountAtRisk] = useState<number>(2499);
  const [issuingBank, setIssuingBank] = useState('HDFC Bank');
  const [failureReason, setFailureReason] = useState('Insufficient funds / soft decline');

  if (!isOpen) return null;

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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1F1F1F] bg-[#000000] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Simulate New Revenue Leak</h3>
              <p className="text-[11px] text-[#71717A] mt-0.5">Inject payment failure to trigger live AI recovery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#050505]">
          <div>
            <label className="text-[10px] uppercase font-mono text-[#71717A] block mb-1">Customer Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Anand Kumar"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] text-white text-xs rounded-lg p-2.5 focus:border-[#444444] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-[#71717A] block mb-1">Leak Vector</label>
              <select
                value={leakVector}
                onChange={(e) => setLeakVector(e.target.value as LeakVector)}
                className="w-full bg-[#111111] border border-[#222222] text-white text-xs rounded-lg p-2.5 focus:border-[#444444] focus:outline-none cursor-pointer"
              >
                <option value="SUBSCRIPTION_FAIL">Subscription Fail</option>
                <option value="CHECKOUT_ABANDON">Checkout Abandon</option>
                <option value="B2B_INVOICE">B2B Invoice</option>
                <option value="MANDATE_FAIL">UPI Mandate</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-[#71717A] block mb-1">Amount at Risk (₹)</label>
              <input
                type="number"
                required
                min="100"
                value={amountAtRisk}
                onChange={(e) => setAmountAtRisk(parseInt(e.target.value) || 0)}
                className="w-full bg-[#111111] border border-[#222222] text-white text-xs rounded-lg p-2.5 focus:border-[#444444] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-[#71717A] block mb-1">Issuing Bank</label>
              <select
                value={issuingBank}
                onChange={(e) => setIssuingBank(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] text-white text-xs rounded-lg p-2.5 focus:border-[#444444] focus:outline-none cursor-pointer"
              >
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="SBI">SBI</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra">Kotak Mahindra</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-[#71717A] block mb-1">Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] text-white text-xs rounded-lg p-2.5 focus:border-[#444444] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-[#71717A] block mb-1">Failure Reason</label>
            <input
              type="text"
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] text-white text-xs rounded-lg p-2.5 focus:border-[#444444] focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 cursor-pointer transition-colors"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>Submit & Trigger AI Recovery</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
