import React, { useState } from 'react';
import { X, CheckCircle2, Zap, Shield } from 'lucide-react';
import type { RecoveryCase } from '../types/recovery';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rcase: RecoveryCase | null;
  onUpdateCase: (updatedCase: RecoveryCase) => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  onClose,
  rcase,
  onUpdateCase
}) => {
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  if (!isOpen || !rcase) return null;

  const discountAmount = rcase.discountOfferedPct 
    ? (rcase.amountAtRisk * rcase.discountOfferedPct) / 100 
    : 0;
  const finalAmount = rcase.amountAtRisk - discountAmount;

  const handleSimulatePayment = () => {
    setIsProcessingPay(true);
    setTimeout(() => {
      setIsProcessingPay(false);
      setIsPaid(true);

      const recovered: RecoveryCase = {
        ...rcase,
        status: 'RECOVERED',
        totalAmountRecovered: finalAmount,
        discountOfferedPct: rcase.discountOfferedPct,
        auditTrail: [
          {
            id: `aud_wa_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            actor: 'CUSTOMER',
            action: 'WHATSAPP_UPI_PAYMENT_COMPLETED',
            details: `Customer completed 1-Tap UPI payment via WhatsApp link. Net recovered: ₹${finalAmount.toLocaleString('en-IN')}`,
            complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true }
          },
          ...rcase.auditTrail
        ]
      };
      onUpdateCase(recovered);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* WhatsApp Top Bar */}
        <div className="bg-emerald-800 text-white px-5 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-200 font-bold text-xs border border-white/20">
              RZP
            </div>
            <div>
              <h3 className="text-sm font-semibold">Razorpay Revenue Care</h3>
              <p className="text-[10px] text-emerald-200">Verified Business Account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700/50 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Chat Background Body */}
        <div className="p-5 space-y-4 bg-emerald-950/20 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px] min-h-[360px] flex flex-col justify-between">
          <div className="space-y-3">
            {/* Timestamp Badge */}
            <div className="text-center">
              <span className="px-2.5 py-0.5 text-[10px] font-medium bg-slate-800/80 text-slate-400 rounded-full border border-slate-700">
                TODAY {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Message Bubble */}
            <div className="max-w-[90%] bg-slate-900 border border-slate-800 text-slate-200 p-4 rounded-2xl rounded-tl-none shadow-xl space-y-3">
              <p className="text-xs leading-relaxed">
                Namaste <strong>{rcase.customerName}</strong>! 👋
              </p>

              {rcase.leakVector === 'CHECKOUT_ABANDON' ? (
                <p className="text-xs leading-relaxed text-slate-300">
                  Aapka checkout payment of <strong className="text-white">₹{rcase.amountAtRisk.toLocaleString('en-IN')}</strong> complete nahi ho paya tha. 
                  {rcase.discountOfferedPct && (
                    <span className="block mt-1 font-semibold text-emerald-400">
                      🎉 Special 5% Instant UPI Discount applied!
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-xs leading-relaxed text-slate-300">
                  Aapka payment for <strong className="text-white">{rcase.leakVector}</strong> of <strong className="text-white">₹{rcase.amountAtRisk.toLocaleString('en-IN')}</strong> soft-decline ho gaya. 
                  1-tap UPI link se abhi complete karein.
                </p>
              )}

              {/* Payment Action Card inside Bubble */}
              <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Razorpay Payment Link</span>
                  <span className="text-emerald-400">₹{finalAmount.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>Original Amount: ₹{rcase.amountAtRisk}</span>
                    <span className="text-emerald-400 font-medium">Saved ₹{discountAmount}</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-blue-400" />
                  <span>256-bit Encrypted Razorpay Gateway</span>
                </div>
              </div>

              {/* Action Button inside WhatsApp */}
              {!isPaid ? (
                <button
                  onClick={handleSimulatePayment}
                  disabled={isProcessingPay}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  {isProcessingPay ? (
                    <span>Opening UPI App (GPay / PhonePe)...</span>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>Pay 1-Tap via Razorpay UPI</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Payment Successfully Settled!</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-500">
            Powered by Razorpay RevGuard AI Nudge Engine
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
