import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, PhoneOff, Mic, MicOff, Volume2, Sparkles, Send, Check, Bot, User } from 'lucide-react';
import type { RecoveryCase } from '../recovery/types';
import { RevenueRecoveryAgent, type SpeechTurnResponse } from '../recovery/RecoveryAgent';

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rcase: RecoveryCase | null;
  recoveryAgent: RevenueRecoveryAgent;
  onUpdateCase: (updatedCase: RecoveryCase) => void;
}

interface Message {
  sender: 'AGENT' | 'CUSTOMER';
  text: string;
  timestamp: string;
  intentTag?: string;
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
  const [isListening, setIsListening] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputSpeech, setInputSpeech] = useState('');
  const [currentCase, setCurrentCase] = useState<RecoveryCase | null>(rcase);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rcase) {
      setCurrentCase(rcase);
      setCallState('IDLE');
      setMessages([]);
      setActionAlert(null);
    }
  }, [rcase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSpeaking, isListening]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN'; // Hinglish / Hindi & English supported

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcriptText = event.results[0][0].transcript;
        if (transcriptText) {
          handleCustomerUtterance(transcriptText);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentCase]);

  if (!isOpen || !currentCase) return null;

  const handleStartCall = () => {
    setCallState('CALLING');
    setTimeout(() => {
      setCallState('CONNECTED');
      const script = recoveryAgent.generateHinglishVoiceScript(currentCase);
      const initialMsg: Message = {
        sender: 'AGENT',
        text: script.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([initialMsg]);
      speakVoice(script.text);
    }, 1500);
  };

  const speakVoice = (text: string, onEndCallback?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;
      
      // Select natural Indian or Hindi voice if available
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN') || v.name.includes('India'));
      if (indianVoice) utterance.voice = indianVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEndCallback) onEndCallback();
      };
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      try {
        recognitionRef.current?.start();
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const handleCustomerUtterance = (spokenText: string) => {
    if (!spokenText.trim() || !currentCase) return;

    // Add Customer Message to chat
    const customerMsg: Message = {
      sender: 'CUSTOMER',
      text: spokenText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, customerMsg]);
    setInputSpeech('');

    // Process through AI Conversational Intent Engine
    const result: SpeechTurnResponse = recoveryAgent.processConversationalSpeech(currentCase, spokenText);
    setCurrentCase(result.updatedCase);
    onUpdateCase(result.updatedCase);

    if (result.actionTaken) {
      setActionAlert(result.actionTaken);
    }

    // Agent Responds
    setTimeout(() => {
      const agentReplyMsg: Message = {
        sender: 'AGENT',
        text: result.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intentTag: result.detectedIntent
      };
      setMessages(prev => [...prev, agentReplyMsg]);
      speakVoice(result.replyText);
    }, 400);
  };

  const handleEndCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsSpeaking(false);
    setIsListening(false);
    setCallState('ENDED');
  };

  const samplePrompts = [
    { label: "📅 Promise to Pay (5th)", text: "Main salary aane ke baad 5 tareekh ko pay karunga." },
    { label: "⚡ Pay Now via UPI", text: "Haan abhi mere WhatsApp pe 1-tap UPI link bhej do." },
    { label: "❓ Query Amount", text: "Mera kitna amount pending hai aur kyu fail hua tha?" },
    { label: "🛑 Dispute / Cancel", text: "Nahi mujhe ye charge nahi chahiye, subscription cancel karo." }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Visual Call Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                {callState === 'CONNECTED' ? (
                  <Volume2 className={`w-6 h-6 text-white ${isSpeaking ? 'animate-bounce' : ''}`} />
                ) : (
                  <PhoneCall className="w-6 h-6 text-white" />
                )}
              </div>
              {callState === 'CONNECTED' && (
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">{currentCase.customerName}</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  Hinglish AI Voice
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentCase.customerPhone} • ₹{currentCase.amountAtRisk.toLocaleString('en-IN')} ({currentCase.leakVector})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Speed Toggle */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px]">
              {[0.8, 1.0, 1.2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`px-2 py-0.5 rounded-lg font-medium transition-all cursor-pointer ${
                    speechRate === rate
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Set Voice Speed to ${rate}x`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {callState === 'CONNECTED' ? (
              <button
                onClick={handleEndCall}
                className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Call</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Live Audio Status & Dynamic Action Banner */}
        {actionAlert && (
          <div className="px-6 py-2 bg-emerald-950/60 border-b border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{actionAlert}</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              State: {currentCase.status}
            </span>
          </div>
        )}

        {/* Call Body */}
        <div className="flex-1 p-6 bg-slate-950 overflow-y-auto space-y-4 min-h-[320px] max-h-[460px]">
          {callState === 'IDLE' && (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <PhoneCall className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Initiate Live Speech-to-Speech Call</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Experience multi-turn conversational AI in Hinglish with real-time speech synthesis & microphone recognition.
                </p>
              </div>
              <button
                onClick={handleStartCall}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Start Live Hinglish Voice Call
              </button>
            </div>
          )}

          {callState === 'CALLING' && (
            <div className="text-center py-14 space-y-3">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-indigo-300">Dialing customer line in Mumbai...</p>
              <p className="text-xs text-slate-500">Checking RBI TRAI DND Guardrails...</p>
            </div>
          )}

          {(callState === 'CONNECTED' || callState === 'ENDED') && (
            <div className="space-y-3.5">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start space-x-2.5 ${msg.sender === 'CUSTOMER' ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.sender === 'AGENT' ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400' : 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                  }`}>
                    {msg.sender === 'AGENT' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1.5 shadow-md ${
                    msg.sender === 'AGENT' ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none' : 'bg-indigo-950/60 border border-indigo-500/30 text-white rounded-tr-none'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{msg.sender === 'AGENT' ? 'Razorpay Voice AI' : 'Customer (You)'}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <p className="font-sans text-[13px]">{msg.text}</p>

                    {msg.intentTag && (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        Intent: {msg.intentTag}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Dynamic Waveform Visualizer */}
              {isSpeaking && (
                <div className="flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 w-fit">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span className="text-[11px] text-indigo-300 font-medium">Agent Speaking...</span>
                  <div className="flex space-x-1 items-center h-3">
                    <span className="w-1 h-2 bg-indigo-400 animate-bounce" />
                    <span className="w-1 h-3.5 bg-indigo-400 animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1 h-2 bg-indigo-400 animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              )}

              {isListening && (
                <div className="flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 w-fit">
                  <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-emerald-300 font-medium">Listening to your voice... Speak now!</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Live Mic & Quick Utterance Controls (When Connected) */}
        {callState === 'CONNECTED' && (
          <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
            {/* Quick Test Speech Chips */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Or Click Quick Voice Test Prompts:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCustomerUtterance(p.text)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-950 hover:bg-indigo-900/30 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Microphone & Input Bar */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleListening}
                className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-lg shadow-rose-600/30'
                    : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                }`}
                title={isListening ? "Stop Microphone" : "Speak into Microphone"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={isListening ? "Listening... Speak into microphone..." : "Type or speak in Hinglish (e.g. '5 tareekh ko pay karunga')..."}
                  value={inputSpeech}
                  onChange={(e) => setInputSpeech(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCustomerUtterance(inputSpeech);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-3 pr-9 py-2.5 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => handleCustomerUtterance(inputSpeech)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
