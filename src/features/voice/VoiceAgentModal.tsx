import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, PhoneOff, Mic, MicOff, Volume2, Sparkles, Send, Check, Bot, User } from 'lucide-react';
import type { RecoveryCase } from '../recovery/types';
import { RevenueRecoveryAgent } from '../recovery/RecoveryAgent';

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

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleCustomerUtterance(transcript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentCase]);

  if (!isOpen || !currentCase) return null;

  // Text-to-Speech synthesis in Hinglish
  const speakHinglish = (text: string, onEndCallback?: () => void) => {
    if (!('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.lang = 'hi-IN';

    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
    if (hindiVoice) utterance.voice = hindiVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStartCall = () => {
    setCallState('CALLING');
    setTimeout(() => {
      setCallState('CONNECTED');
      // Opening speech turn by AI Agent
      const response = recoveryAgent.processConversationalSpeech(currentCase, "");
      
      const agentMsg: Message = {
        sender: 'AGENT',
        text: response.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intentTag: response.detectedIntent
      };
      setMessages([agentMsg]);
      speakHinglish(response.replyText);
    }, 1200);
  };

  const handleCustomerUtterance = (text: string) => {
    if (!text.trim() || !currentCase) return;

    const userMsg: Message = {
      sender: 'CUSTOMER',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputSpeech('');

    // Process turn with Recovery Agent
    setTimeout(() => {
      const response = recoveryAgent.processConversationalSpeech(currentCase, text);

      const agentMsg: Message = {
        sender: 'AGENT',
        text: response.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intentTag: response.detectedIntent
      };

      setMessages((prev) => [...prev, agentMsg]);

      // Apply case state transitions
      if (response.updatedCase) {
        setCurrentCase(response.updatedCase);
        onUpdateCase(response.updatedCase);
      }

      if (response.actionTaken) {
        setActionAlert(response.actionTaken);
      }

      speakHinglish(response.replyText);
    }, 600);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. You can still type below!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEndCall = () => {
    window.speechSynthesis?.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    setIsSpeaking(false);
    setCallState('ENDED');
  };

  const samplePrompts = [
    { label: "Pay on 5th (P2P)", text: "Main 5 tareekh ko salary aane par pay kar dunga." },
    { label: "Wrong Charge (Dispute)", text: "Maine yeh service cancel kar di thi, main pay nahi karunga!" },
    { label: "Send Link Now (WhatsApp)", text: "Haan please mujhe WhatsApp par Razorpay payment link bhej do." },
    { label: "Card Expired", text: "Mera credit card expire ho gaya hai, naya card add karna hai." }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-[#1F1F1F] bg-[#000000] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">Hinglish Voice AI Agent Simulator</h3>
                <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                  callState === 'CONNECTED' 
                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' 
                    : callState === 'CALLING' 
                    ? 'bg-amber-950/50 text-amber-300 border border-amber-800/40 animate-pulse'
                    : 'bg-[#181818] text-[#A1A1A1] border border-[#27272A]'
                }`}>
                  {callState === 'CONNECTED' ? 'Live Call' : callState === 'CALLING' ? 'Dialing...' : callState}
                </span>
              </div>
              <p className="text-[11px] text-[#71717A] mt-0.5 font-mono">
                {currentCase.customerName} ({currentCase.customerPhone}) · ₹{currentCase.amountAtRisk.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Speed Selector */}
            <div className="flex items-center space-x-1 bg-[#111111] p-1 rounded-lg border border-[#222222] text-[10px] font-mono">
              {[0.8, 1.0, 1.2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                    speechRate === rate
                      ? 'bg-white text-black font-semibold'
                      : 'text-[#71717A] hover:text-white'
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
                className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Call</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-[#181818] hover:bg-[#222222] text-white rounded-lg text-xs font-medium border border-[#2A2A2A] transition-colors cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Live Audio Status & Dynamic Action Banner */}
        {actionAlert && (
          <div className="px-6 py-2 bg-emerald-950/30 border-b border-emerald-800/40 text-emerald-300 text-xs font-mono flex items-center justify-between shrink-0">
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{actionAlert}</span>
            </span>
            <span className="text-[10px] text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              State: {currentCase.status}
            </span>
          </div>
        )}

        {/* Call Body */}
        <div className="flex-1 p-6 bg-[#050505] overflow-y-auto space-y-4 min-h-[300px] max-h-[440px]">
          {callState === 'IDLE' && (
            <div className="text-center py-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <PhoneCall className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Initiate Live Speech-to-Speech Call</h4>
                <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                  Multi-turn conversational AI in Hinglish with real-time speech synthesis & microphone capture.
                </p>
              </div>
              <button
                onClick={handleStartCall}
                className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Start Live Hinglish Voice Call
              </button>
            </div>
          )}

          {callState === 'CALLING' && (
            <div className="text-center py-14 space-y-3">
              <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-white">Dialing customer line in Mumbai...</p>
              <p className="text-[11px] text-[#71717A] font-mono">Checking RBI TRAI DND Guardrails...</p>
            </div>
          )}

          {(callState === 'CONNECTED' || callState === 'ENDED') && (
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start space-x-2.5 ${msg.sender === 'CUSTOMER' ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.sender === 'AGENT' ? 'bg-[#181818] border border-[#2A2A2A] text-indigo-400' : 'bg-[#181818] border border-[#2A2A2A] text-emerald-400'
                  }`}>
                    {msg.sender === 'AGENT' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed space-y-1.5 ${
                    msg.sender === 'AGENT' ? 'bg-[#111111] border border-[#1F1F1F] text-[#EDEDED]' : 'bg-[#181818] border border-[#2A2A2A] text-white'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] text-[#71717A] font-mono">
                      <span>{msg.sender === 'AGENT' ? 'Razorpay Voice AI' : 'Customer (You)'}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <p className="text-xs leading-relaxed">{msg.text}</p>

                    {msg.intentTag && (
                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-mono rounded bg-[#161616] text-[#A1A1A1] border border-[#2A2A2A]">
                        Intent: {msg.intentTag}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Dynamic Waveform Visualizer */}
              {isSpeaking && (
                <div className="flex items-center space-x-2.5 py-1.5 px-3 rounded-lg bg-[#111111] border border-[#222222] w-fit shadow-md">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span className="text-[10px] text-[#D4D4D8] font-mono">Agent Speaking</span>
                  {/* 5-Bar Equalizer */}
                  <div className="flex items-center space-x-0.5 h-4 px-1">
                    <span className="w-1 bg-indigo-400 rounded-full animate-wave-1" />
                    <span className="w-1 bg-indigo-400 rounded-full animate-wave-2" />
                    <span className="w-1 bg-indigo-400 rounded-full animate-wave-3" />
                    <span className="w-1 bg-indigo-400 rounded-full animate-wave-4" />
                    <span className="w-1 bg-indigo-400 rounded-full animate-wave-5" />
                  </div>
                </div>
              )}

              {isListening && (
                <div className="flex items-center space-x-2 py-1.5 px-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 w-fit shadow-md">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-emerald-300 font-mono">Listening to your voice... Speak now!</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Live Mic & Quick Utterance Controls */}
        {callState === 'CONNECTED' && (
          <div className="p-4 bg-[#000000] border-t border-[#1F1F1F] space-y-3 shrink-0">
            {/* Quick Test Speech Chips */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] block mb-1.5 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Quick Utterance Simulator</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCustomerUtterance(p.text)}
                    className="px-2 py-1 text-[10px] font-mono bg-[#111111] hover:bg-[#181818] text-[#A1A1A1] hover:text-white rounded border border-[#222222] hover:border-[#333333] transition-all hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
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
                className={`relative p-2.5 rounded-lg border flex items-center justify-center transition-all duration-150 hover:scale-[1.05] active:scale-[0.95] cursor-pointer ${
                  isListening
                    ? 'bg-red-950/60 text-red-300 border-red-700 shadow-lg shadow-red-900/40'
                    : 'bg-[#181818] hover:bg-[#222222] text-[#EDEDED] border-[#2A2A2A]'
                }`}
                title={isListening ? "Stop Microphone" : "Speak into Microphone"}
              >
                {isListening && (
                  <span className="animate-ping absolute inset-0 rounded-lg bg-red-500 opacity-30" />
                )}
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
                  className="w-full bg-[#111111] border border-[#222222] text-white text-xs rounded-lg pl-3 pr-9 py-2 focus:border-[#444444] focus:outline-none"
                />
                <button
                  onClick={() => handleCustomerUtterance(inputSpeech)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#71717A] hover:text-white transition-colors cursor-pointer"
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
