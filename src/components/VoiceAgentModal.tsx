import React, { useState, useEffect } from 'react';
import { PhoneCall, Mic, Volume2, Calendar, Check, AlertCircle } from 'lucide-react';
import type { RecoveryCase } from '../types/recovery';
import { RevenueRecoveryAgent } from '../services/recoveryAgent';

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rcase: RecoveryCase | null;
  recoveryAgent: RevenueRecoveryAgent;
  onUpdateCase: (updatedCase: RecoveryCase) => void;
}

export const VoiceAgentModal: React.FC<VoiceAgentModalProps> = ({
  isOpen,
  onClose,
  rcase,
  recoveryAgent,
  onUpdateCase
}) => {
  const [callState, setCallState] = useState<'IDLE' | 'CALLING' | 'CONNECTED' | 'ENDED'>('IDLE');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [promisedDate, setPromisedDate] = useState<string>('');

  useEffect(() => {
    if (rcase) {
      const script = recoveryAgent.generateHinglishVoiceScript(rcase);
      setTranscript(script.text);
      setCallState('IDLE');
    }
  }, [rcase]);

  if (!isOpen || !rcase) return null;

  const handleStartCall = () => {
    setCallState('CALLING');
    setTimeout(() => {
      setCallState('CONNECTED');
      speakTranscript(transcript);
    }, 1500);
  };

  const speakTranscript = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleEndCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCallState('ENDED');
  };

  const handleCustomerPayNow = () => {
    handleEndCall();
    const { updatedCase } = recoveryAgent.processIntervention({
      ...rcase,
      recommendedChannel: 'HINGLISH_VOICE_CALL'
    });
    // Force recovered state for interactive demo
    const recovered: RecoveryCase = {
      ...updatedCase,
      status: 'RECOVERED',
      totalAmountRecovered: rcase.amountAtRisk,
      auditTrail: [
        {
          id: `aud_voice_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          actor: 'CUSTOMER',
          action: 'HINGLISH_VOICE_PAYMENT_ACCEPTED',
          details: `Customer accepted payment during Hinglish Voice Call. ₹${rcase.amountAtRisk.toLocaleString('en-IN')} settled via UPI link.`,
          complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true }
        },
        ...updatedCase.auditTrail
      ]
    };
    onUpdateCase(recovered);
    onClose();
  };

  const handleCustomerPromiseToPay = () => {
    handleEndCall();
    const targetDate = promisedDate || new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString();
    const updated = recoveryAgent.recordPromiseToPay(
      rcase,
      targetDate,
      "Customer promised to pay after salary credit."
    );
    onUpdateCase(updated);
    onClose();
  };

  const handleCustomerDispute = () => {
    handleEndCall();
    const disputed: RecoveryCase = {
      ...rcase,
      isCustomerDisputed: true,
      status: 'STOPPED_COMPLIANT',
      stopReason: 'STOP RULE TRIGGERED: Customer marked dispute during Voice Call.',
      auditTrail: [
        {
          id: `aud_disp_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          actor: 'CUSTOMER',
          action: 'DISPUTE_RAISED',
          details: 'Customer indicated dispute during Hinglish call. Dunning frozen instantly.',
          complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: false, ruleApplied: 'CUSTOMER_DISPUTE_FREEZE' }
        },
        ...rcase.auditTrail
      ]
    };
    onUpdateCase(disputed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Visual Call Screen Header */}
        <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 p-6 text-center border-b border-slate-800">
          <div className="mx-auto w-20 h-20 rounded-full bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20">
            {callState === 'CONNECTED' ? (
              <Volume2 className={`w-9 h-9 text-indigo-400 ${isSpeaking ? 'animate-bounce' : ''}`} />
            ) : (
              <PhoneCall className="w-9 h-9 text-indigo-400" />
            )}
          </div>

          <h2 className="text-xl font-bold text-white">{rcase.customerName}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{rcase.customerPhone} • {rcase.preferredLanguage} AI Bot</p>

          <div className="mt-3 flex items-center justify-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
              {rcase.leakVector} • ₹{rcase.amountAtRisk.toLocaleString('en-IN')}
            </span>
            {callState === 'CONNECTED' && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Call Connected</span>
              </span>
            )}
          </div>
        </div>

        {/* Script & Voice Wave area */}
        <div className="p-6 space-y-4 bg-slate-950">
          {callState === 'IDLE' && (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-slate-400">
                Ready to initiate automated Hinglish voice call to recover revenue at risk.
              </p>
              <button
                onClick={handleStartCall}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Dial Out Hinglish AI Agent</span>
              </button>
            </div>
          )}

          {callState === 'CALLING' && (
            <div className="text-center py-8 space-y-2">
              <div className="text-sm font-semibold text-indigo-300 animate-pulse">
                Dialing customer line (+91 98201...)...
              </div>
              <p className="text-xs text-slate-500">Checking RBI DND Policy & Time Window...</p>
            </div>
          )}

          {(callState === 'CONNECTED' || callState === 'ENDED') && (
            <div className="space-y-4">
              {/* Transcript Box */}
              <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold">
                  <span className="flex items-center space-x-1">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Hinglish Voice Agent Transcript</span>
                  </span>
                  {isSpeaking && <span className="text-emerald-400 text-[10px]">Speaking...</span>}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans italic bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  "{transcript}"
                </p>
              </div>

              {/* Interactive Customer Outcome Action Simulator */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">
                  Simulate Customer Call Outcome:
                </span>

                <div className="space-y-2">
                  <button
                    onClick={handleCustomerPayNow}
                    className="w-full py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>1. Customer Agrees & Pays Now via UPI</span>
                    <Check className="w-4 h-4 text-emerald-400" />
                  </button>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-amber-300">
                      <span>2. Customer Promises to Pay Later (P2P)</span>
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="date"
                      value={promisedDate ? promisedDate.split('T')[0] : ''}
                      onChange={(e) => setPromisedDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2"
                    />
                    <button
                      onClick={handleCustomerPromiseToPay}
                      className="w-full py-2 bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/40 text-amber-200 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                    >
                      Record Promise-to-Pay Commitment
                    </button>
                  </div>

                  <button
                    onClick={handleCustomerDispute}
                    className="w-full py-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-medium text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>3. Customer Disputes Transaction / Opts Out</span>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
          <span className="text-[11px] text-slate-400">Razorpay RevGuard Voice Engine</span>
          <button
            onClick={() => {
              handleEndCall();
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
