import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Zap, Shield } from 'lucide-react';
import type { RecoveryCase } from '../recovery/types';

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

  useEffect(() => {
    if (rcase) {
      setIsProcessingPay(false);
      setIsPaid(rcase.status === 'RECOVERED');
    }
  }, [rcase, isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="bg-[#000000] border-b border-[#1F1F1F] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">
              RZ
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Razorpay Revenue Care</h3>
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Verified Business Account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* WhatsApp Chat Background Body */}
        <div className="p-5 space-y-4 bg-[#050505] min-h-[340px] flex flex-col justify-between">
          <div className="space-y-3">
            {/* Timestamp Badge */}
            <div className="text-center">
              <span className="px-2.5 py-0.5 text-[9px] font-mono bg-[#141414] text-[#71717A] rounded-full border border-[#222222]">
                TODAY {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Message Bubble */}
            <div className="max-w-[95%] bg-[#111111] border border-[#1F1F1F] text-[#EDEDED] p-4 rounded-2xl rounded-tl-none shadow-xl space-y-3">
              <p className="text-xs leading-relaxed">
                Namaste <strong>{rcase.customerName}</strong>! 👋
              </p>

              {rcase.leakVector === 'CHECKOUT_ABANDON' ? (
                <p className="text-xs leading-relaxed text-[#A1A1A1]">
                  Aapka checkout payment of <strong className="text-white">₹{rcase.amountAtRisk.toLocaleString('en-IN')}</strong> complete nahi ho paya tha. 
                  {rcase.discountOfferedPct && (
                    <span className="block mt-1 font-semibold text-emerald-400 font-mono">
                      🎉 Special 5% Instant UPI Discount applied!
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-xs leading-relaxed text-[#A1A1A1]">
                  Aapka payment for <strong className="text-white">{rcase.leakVector}</strong> of <strong className="text-white">₹{rcase.amountAtRisk.toLocaleString('en-IN')}</strong> soft-decline ho gaya. 
                  1-tap UPI link se abhi complete karein.
                </p>
              )}

              {/* Payment Action Card inside Bubble */}
              <div className="p-3 bg-[#080808] rounded-xl border border-[#222222] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#A1A1A1]">Razorpay Payment Link</span>
                  <span className="text-white font-mono">₹{finalAmount.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="text-[10px] font-mono text-[#71717A] flex justify-between">
                    <span>Original: ₹{rcase.amountAtRisk}</span>
                    <span className="text-emerald-400 font-medium">Saved ₹{discountAmount}</span>
                  </div>
                )}
                <div className="text-[10px] text-[#71717A] flex items-center space-x-1 font-mono">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>256-bit Encrypted Razorpay Gateway</span>
                </div>
              </div>

              {/* Action Button inside WhatsApp */}
              {!isPaid ? (
                <button
                  onClick={handleSimulatePayment}
                  disabled={isProcessingPay}
                  className="w-full py-2.5 px-3 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  {isProcessingPay ? (
                    <span className="font-mono">Opening UPI App (GPay / PhonePe)...</span>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-black" />
                      <span>Pay 1-Tap via Razorpay UPI</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 font-mono font-medium text-xs rounded-xl flex items-center justify-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Payment Successfully Settled!</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-[10px] font-mono text-[#52525B]">
            Powered by Razorpay RevGuard AI Nudge Engine
          </div>
        </div>
      </div>
    </div>
  );
};
