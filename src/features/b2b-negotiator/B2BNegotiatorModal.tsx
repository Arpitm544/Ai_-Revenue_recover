import React, { useState, useEffect, useRef } from 'react';
import { X, Building2, CheckCircle2, Send, FileText, ShieldCheck, Banknote } from 'lucide-react';
import type { RecoveryCase } from '../recovery/types';
import type { SplitProposal, NegotiationMessage, PromiseToPay, MilestonePayment } from './types';
import {
  generateSplitProposal,
  processNegotiationMessage,
  createPromiseToPay,
} from './B2BNegotiatorService';

interface B2BNegotiatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rcase: RecoveryCase | null;
  onUpdateCase: (updated: RecoveryCase) => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-[#141414] border-[#2A2A2A] text-[#EDEDED]',
  PAID:      'bg-emerald-950/30 border-emerald-800/40 text-emerald-300',
  SCHEDULED: 'bg-[#0D0D0D] border-[#1F1F1F] text-[#71717A]',
  OVERDUE:   'bg-red-950/30 border-red-800/40 text-red-300',
};

function MilestoneCard({ m, idx, onSimulatePay }: { m: MilestonePayment; idx: number; onSimulatePay: (id: string) => void }) {
  return (
    <div className={`p-3 rounded-xl border transition-all ${STATUS_COLORS[m.status] ?? STATUS_COLORS['SCHEDULED']}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-white">
            {idx + 1}
          </div>
          <span className="text-xs font-semibold text-white">Installment {idx + 1} — {m.percentage}%</span>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#181818] border border-[#2A2A2A] text-[#D4D4D8]">
          {m.status}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-base font-bold font-mono text-white">₹{m.amountINR.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-[#71717A] font-mono mt-0.5">Due: {m.dueDate} · {m.paymentMethod}</div>
          {m.gstCreditNoteRef && (
            <div className="text-[9px] text-[#52525B] font-mono mt-0.5">Credit Note: {m.gstCreditNoteRef}</div>
          )}
        </div>

        {m.status === 'PENDING' && (
          <button
            onClick={() => onSimulatePay(m.id)}
            className="px-2.5 py-1 bg-white hover:bg-neutral-200 text-black text-[10px] font-semibold rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            Pay Now ⚡
          </button>
        )}
        {m.status === 'PAID' && (
          <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono font-medium">
            <CheckCircle2 className="w-3 h-3" /> Settled
          </div>
        )}
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: NegotiationMessage }) {
  const isAI = msg.sender === 'AI';
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
        isAI
          ? 'bg-[#111111] border border-[#1F1F1F] text-[#EDEDED] rounded-tl-none'
          : 'bg-[#1E1E1E] border border-[#333333] text-white rounded-tr-none'
      }`}>
        {msg.text}
        <div className="text-[9px] mt-1 text-[#71717A] font-mono">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {msg.intent && isAI && <span className="ml-1.5 opacity-80 uppercase">[{msg.intent}]</span>}
        </div>
      </div>
    </div>
  );
}

export const B2BNegotiatorModal: React.FC<B2BNegotiatorModalProps> = ({
  isOpen,
  onClose,
  rcase,
  onUpdateCase,
}) => {
  const [proposal, setProposal] = useState<SplitProposal | null>(null);
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [p2pLedger, setP2pLedger] = useState<PromiseToPay | null>(null);
  const [activeTab, setActiveTab] = useState<'negotiate' | 'ledger'>('negotiate');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !rcase) return;

    const daysOverdue = Math.floor(
      (Date.now() - new Date(rcase.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const prop = generateSplitProposal(rcase.id, rcase.customerName, rcase.amountAtRisk, daysOverdue);
    setProposal(prop);
    setP2pLedger(null);
    setActiveTab('negotiate');

    // Opening AI message
    const openingMsg: NegotiationMessage = {
      id: `msg_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      sender: 'AI',
      text: `Namaste ${rcase.customerName.split(' ')[0]}ji! 🙏\n\nMain Razorpay B2B Enterprise Settlement Care se hoon. Aapka invoice for ₹${rcase.amountAtRisk.toLocaleString('en-IN')} overdue hai.\n\nHumne aapke liye ek flexible milestone payment plan prepare kiya hai jo aapke cash-flow ko consider karta hai. Kya aap is proposal ko review karna chahenge?`,
      intent: 'GREETING',
    };
    setMessages([openingMsg]);
    setInputText('');
  }, [isOpen, rcase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!inputText.trim() || !proposal || !rcase) return;

    const userMsg: NegotiationMessage = {
      id: `msg_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      sender: 'CUSTOMER',
      text: inputText.trim(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const { reply, intent, updatedProposal } = processNegotiationMessage(
        userMsg.text,
        rcase.customerName,
        proposal,
        newMessages
      );

      const aiMsg: NegotiationMessage = {
        id: `msg_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        sender: 'AI',
        text: reply,
        intent,
      };

      if (updatedProposal) {
        setProposal(updatedProposal);
      }
      setMessages([...newMessages, aiMsg]);
      setIsTyping(false);

      if (intent === 'ACCEPT' && updatedProposal) {
        const ledger = createPromiseToPay(rcase.id, rcase.customerName, updatedProposal);
        setP2pLedger(ledger);

        const caseUpdate: RecoveryCase = {
          ...rcase,
          status: 'PROMISED_TO_PAY',
          auditTrail: [
            {
              id: `aud_b2b_${Math.random().toString(36).substring(2, 7)}`,
              timestamp: new Date().toISOString(),
              actor: 'AI_INTERVENTION_AGENT',
              action: 'B2B_MILESTONE_PROPOSAL_ACCEPTED',
              details: `Customer accepted structured split plan: ${updatedProposal.installments.length} installments totaling ₹${updatedProposal.totalInvoiceAmountINR.toLocaleString('en-IN')}. P2P Ref: ${ledger.id}`,
              complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true },
            },
            ...rcase.auditTrail,
          ],
        };
        onUpdateCase(caseUpdate);
      }
    }, 600);
  };

  const handleSimulatePay = (milestoneId: string) => {
    if (!proposal || !rcase) return;

    const updated: SplitProposal = {
      ...proposal,
      installments: proposal.installments.map(m =>
        m.id === milestoneId ? { ...m, status: 'PAID' as const } : m
      ),
    };
    setProposal(updated);

    const paidAmount = updated.installments
      .filter(m => m.status === 'PAID')
      .reduce((sum, m) => sum + m.amountINR, 0);

    const allPaid = updated.installments.every(m => m.status === 'PAID');

    const caseUpdate: RecoveryCase = {
      ...rcase,
      status: allPaid ? 'RECOVERED' : 'INTERVENING',
      totalAmountRecovered: paidAmount,
      auditTrail: [
        {
          id: `aud_inst_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          actor: 'CUSTOMER',
          action: 'B2B_INSTALLMENT_SETTLED',
          details: `Installment paid: ₹${updated.installments.find(m => m.id === milestoneId)?.amountINR.toLocaleString('en-IN')}. Total recovered: ₹${paidAmount.toLocaleString('en-IN')}`,
          complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true },
        },
        ...rcase.auditTrail,
      ],
    };
    onUpdateCase(caseUpdate);
  };

  if (!isOpen || !rcase) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-5xl bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ height: '86vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1F1F1F] shrink-0 bg-[#000000]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-tight">B2B Milestone Settlement Negotiator</h2>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#181818] text-[#D4D4D8] border border-[#2A2A2A]">
                  AI-Assisted
                </span>
              </div>
              <p className="text-[11px] text-[#71717A] font-mono mt-0.5">
                {rcase.customerName} · Invoice ₹{rcase.amountAtRisk.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switcher */}
            <div className="flex rounded-lg overflow-hidden border border-[#262626] bg-[#111111] p-0.5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('negotiate')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${activeTab === 'negotiate' ? 'bg-white text-black font-semibold' : 'text-[#71717A] hover:text-white'}`}
              >
                Negotiate
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === 'ledger' ? 'bg-white text-black font-semibold' : 'text-[#71717A] hover:text-white'}`}
              >
                {p2pLedger && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                P2P Ledger
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {activeTab === 'negotiate' ? (
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* LEFT: Proposal + Milestones */}
            <div className="flex flex-col border-r border-[#1F1F1F] overflow-y-auto w-[46%] p-5 space-y-4 bg-[#050505]">
              {/* AI Reasoning Card */}
              <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400">AI Proposal Strategy</span>
                </div>
                <p className="text-xs text-[#D4D4D8] leading-relaxed">{proposal?.aiReasoning}</p>
              </div>

              {/* Milestone Cards */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">Payment Milestones</p>
                {proposal?.installments.map((m, i) => (
                  <MilestoneCard key={m.id} m={m} idx={i} onSimulatePay={handleSimulatePay} />
                ))}
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-[#71717A]">
                  <span>Total Invoice</span>
                  <span className="text-white font-semibold">₹{rcase.amountAtRisk.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#71717A]">
                  <span>Settled So Far</span>
                  <span className="text-emerald-400 font-semibold">
                    ₹{(proposal?.installments.filter(m => m.status === 'PAID').reduce((s, m) => s + m.amountINR, 0) ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#71717A]">
                  <span>Remaining</span>
                  <span className="text-amber-400 font-semibold">
                    ₹{(proposal?.installments.filter(m => m.status !== 'PAID').reduce((s, m) => s + m.amountINR, 0) ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: Chat */}
            <div className="flex flex-col flex-1 overflow-hidden min-h-0 bg-[#070707]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#111111] border border-[#222222] px-3.5 py-2 rounded-xl rounded-tl-none flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-[#71717A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#71717A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#71717A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                {['I accept the plan', 'Can we do 30% first?', 'Need 7 more days', 'I have a dispute'].map(q => (
                  <button
                    key={q}
                    onClick={() => setInputText(q)}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-[#111111] border border-[#222222] text-[#A1A1A1] hover:text-white hover:bg-[#181818] transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="px-4 pb-4 pt-1 shrink-0">
                <div className="flex gap-2 bg-[#111111] border border-[#222222] rounded-xl px-3 py-2 focus-within:border-[#444444]">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your response… (e.g. 'I accept' or 'Can we do 30% first?')"
                    className="flex-1 bg-transparent text-xs text-white placeholder-[#52525B] focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputText.trim() || isTyping}
                    className="p-1.5 bg-white hover:bg-neutral-200 disabled:bg-[#1A1A1A] disabled:text-[#444444] text-black rounded-lg transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* P2P Ledger Tab */
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#050505]">
            {!p2pLedger ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3 text-[#52525B]">
                <div className="w-12 h-12 rounded-xl bg-[#111111] border border-[#222222] flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-white">No Promise-to-Pay Signed Yet</p>
                  <p className="text-[11px] text-[#71717A] mt-0.5">Accept the split proposal in the chat to generate the binding P2P ledger.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Certificate Header */}
                <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="text-xs font-semibold text-white">Promise-to-Pay Ledger</h3>
                        <p className="text-[10px] text-[#71717A] font-mono">Legally Referenced · RBI Compliant · Cryptographically Signed</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded">
                      ✓ BINDING AGREEMENT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs pt-1 border-t border-[#1F1F1F]">
                    {[
                      { label: 'P2P Reference', value: p2pLedger.id, mono: true },
                      { label: 'Audit Hash', value: p2pLedger.auditHash.toUpperCase(), mono: true },
                      { label: 'Customer', value: p2pLedger.customerName },
                      { label: 'Total Amount', value: `₹${p2pLedger.totalAmountINR.toLocaleString('en-IN')}`, bold: true, green: true },
                      { label: 'GST Credit Note Ref', value: p2pLedger.gstCreditNoteRef, mono: true },
                      { label: 'Accepted At', value: new Date(p2pLedger.acceptedAt).toLocaleString('en-IN') },
                    ].map(({ label, value, mono, bold, green }) => (
                      <div key={label}>
                        <p className="text-[9px] uppercase font-mono text-[#71717A] mb-0.5">{label}</p>
                        <p className={`truncate ${mono ? 'font-mono text-[11px]' : ''} ${bold ? 'font-bold' : ''} ${green ? 'text-emerald-400' : 'text-[#EDEDED]'}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestone Schedule */}
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] flex items-center gap-2">
                    <Banknote className="w-3.5 h-3.5" /> Milestone Payment Schedule
                  </p>
                  {p2pLedger.milestones.map((m, i) => (
                    <div key={m.id} className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-white">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold font-mono text-white">₹{m.amountINR.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-[#71717A] font-mono">Due {m.dueDate} · {m.paymentMethod}</div>
                          <div className="text-[9px] text-[#52525B] font-mono mt-0.5">{m.gstCreditNoteRef}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#181818] border border-[#2A2A2A] text-[#D4D4D8]">
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
