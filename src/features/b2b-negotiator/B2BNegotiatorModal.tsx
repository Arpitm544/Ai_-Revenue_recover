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
  PENDING:   'bg-blue-500/20 border-blue-500/40 text-blue-300',
  PAID:      'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  SCHEDULED: 'bg-slate-700/60 border-slate-600/40 text-slate-400',
  OVERDUE:   'bg-red-500/20 border-red-500/40 text-red-300',
};

function MilestoneCard({ m, idx, onSimulatePay }: { m: MilestonePayment; idx: number; onSimulatePay: (id: string) => void }) {
  return (
    <div className={`p-3.5 rounded-xl border transition-all ${STATUS_COLORS[m.status] ?? STATUS_COLORS['SCHEDULED']}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
            {idx + 1}
          </div>
          <span className="text-xs font-bold">Installment {idx + 1} — {m.percentage}%</span>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_COLORS[m.status]}`}>
          {m.status}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-bold text-white">₹{m.amountINR.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Due: {m.dueDate} · via {m.paymentMethod}</div>
          {m.gstCreditNoteRef && (
            <div className="text-[9px] text-slate-500 font-mono mt-0.5">Credit Note: {m.gstCreditNoteRef}</div>
          )}
        </div>

        {m.status === 'PENDING' && (
          <button
            onClick={() => onSimulatePay(m.id)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shrink-0 shadow-lg shadow-blue-700/30"
          >
            Pay Now ⚡
          </button>
        )}
        {m.status === 'PAID' && (
          <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
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
      <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
        isAI
          ? 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-tl-none'
          : 'bg-blue-600 text-white rounded-tr-none'
      }`}>
        {msg.text}
        <div className={`text-[9px] mt-1 ${isAI ? 'text-slate-500' : 'text-blue-200/70'}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {msg.intent && isAI && <span className="ml-1.5 opacity-60 font-mono uppercase">[{msg.intent}]</span>}
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
        newMessages,
      );

      if (updatedProposal) setProposal(updatedProposal);

      const aiMsg: NegotiationMessage = {
        id: `msg_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        sender: 'AI',
        text: reply,
        intent,
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);

      // If accepted → create P2P ledger, update case
      if (intent === 'ACCEPT' && rcase) {
        const usedProposal = updatedProposal ?? proposal;
        const p2p = createPromiseToPay(rcase.id, rcase.customerName, usedProposal);
        setP2pLedger(p2p);

        const updated: RecoveryCase = {
          ...rcase,
          status: 'PROMISED_TO_PAY',
          updatedAt: new Date().toISOString(),
          auditTrail: [
            {
              id: `aud_b2b_${Math.random().toString(36).substring(2, 7)}`,
              timestamp: new Date().toISOString(),
              actor: 'AI_INTERVENTION_AGENT',
              action: 'B2B_MILESTONE_PLAN_ACCEPTED',
              details: `Customer accepted ${usedProposal.installments.length}-installment split plan for ₹${rcase.amountAtRisk.toLocaleString('en-IN')}. P2P Ledger created. Audit hash: ${p2p.auditHash}`,
              complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true },
            },
            ...rcase.auditTrail,
          ],
        };
        onUpdateCase(updated);
      }
    }, 900 + Math.random() * 400);
  };

  const handleSimulatePay = (milestoneId: string) => {
    if (!proposal || !rcase) return;
    const updated = {
      ...proposal,
      installments: proposal.installments.map(m =>
        m.id === milestoneId
          ? { ...m, status: 'PAID' as const, paidAt: new Date().toISOString(), referenceId: `NEFT${Math.random().toString(36).substring(2, 10).toUpperCase()}` }
          : m.status === 'SCHEDULED'
          ? { ...m, status: 'PENDING' as const }
          : m
      ),
    };
    setProposal(updated);

    const paidCount = updated.installments.filter(m => m.status === 'PAID').length;
    const allPaid = paidCount === updated.installments.length;

    const paidAmount = updated.installments
      .filter(m => m.status === 'PAID')
      .reduce((s, m) => s + m.amountINR, 0);

    const caseUpdate: RecoveryCase = {
      ...rcase,
      status: allPaid ? 'RECOVERED' : 'PROMISED_TO_PAY',
      totalAmountRecovered: paidAmount,
      updatedAt: new Date().toISOString(),
      auditTrail: [
        {
          id: `aud_pay_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          actor: 'CUSTOMER',
          action: allPaid ? 'B2B_FULLY_SETTLED' : 'B2B_MILESTONE_PAID',
          details: `Installment paid: ₹${updated.installments.find(m => m.id === milestoneId)?.amountINR.toLocaleString('en-IN')}. Total recovered so far: ₹${paidAmount.toLocaleString('en-IN')}`,
          complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true },
        },
        ...rcase.auditTrail,
      ],
    };
    onUpdateCase(caseUpdate);
  };

  if (!isOpen || !rcase) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="relative w-full bg-[#0d1117] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxWidth: '980px', height: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">B2B Milestone Settlement Negotiator</h2>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AI-Powered
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {rcase.customerName} · Invoice ₹{rcase.amountAtRisk.toLocaleString('en-IN')} · {rcase.issuingBank !== 'N/A' ? rcase.issuingBank : 'Enterprise Account'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switcher */}
            <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('negotiate')}
                className={`px-3 py-1.5 transition-colors cursor-pointer ${activeTab === 'negotiate' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Negotiate
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className={`px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-1 ${activeTab === 'ledger' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {p2pLedger && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                P2P Ledger
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        {activeTab === 'negotiate' ? (
          <div className="flex flex-1 overflow-hidden min-h-0">

            {/* LEFT: Proposal + Milestones */}
            <div className="flex flex-col border-r border-slate-800 overflow-y-auto" style={{ width: '45%' }}>
              <div className="px-5 pt-5 pb-3 space-y-4">
                {/* AI Reasoning Card */}
                <div className="bg-purple-950/30 border border-purple-500/25 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">AI Proposal Reasoning</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{proposal?.aiReasoning}</p>
                </div>

                {/* Milestone Cards */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payment Milestones</p>
                  {proposal?.installments.map((m, i) => (
                    <MilestoneCard key={m.id} m={m} idx={i} onSimulatePay={handleSimulatePay} />
                  ))}
                </div>

                {/* Summary */}
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Invoice</span>
                    <span className="text-white font-bold">₹{rcase.amountAtRisk.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Settled So Far</span>
                    <span className="text-emerald-400 font-bold">
                      ₹{(proposal?.installments.filter(m => m.status === 'PAID').reduce((s, m) => s + m.amountINR, 0) ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Remaining</span>
                    <span className="text-amber-400 font-bold">
                      ₹{(proposal?.installments.filter(m => m.status !== 'PAID').reduce((s, m) => s + m.amountINR, 0) ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Chat */}
            <div className="flex flex-col flex-1 overflow-hidden min-h-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-slate-700/50 px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                    className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="px-4 pb-4 pt-1 shrink-0">
                <div className="flex gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-blue-500/50">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your response… (e.g. 'I accept' or 'Can we do 30% first?')"
                    className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputText.trim() || isTyping}
                    className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── P2P Ledger Tab ── */
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {!p2pLedger ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-600">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-500">No Promise-to-Pay yet</p>
                  <p className="text-xs text-slate-600 mt-1">Accept the split proposal in the negotiation chat to generate the P2P ledger.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Certificate Header */}
                <div className="bg-gradient-to-r from-purple-900/30 via-blue-900/20 to-indigo-900/30 border border-purple-500/25 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="text-sm font-bold text-white">Promise-to-Pay Ledger</h3>
                        <p className="text-[10px] text-slate-400">Legally Referenced · RBI Compliant · Cryptographically Signed</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                      ✓ BINDING AGREEMENT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs pt-1">
                    {[
                      { label: 'P2P Reference', value: p2pLedger.id, mono: true },
                      { label: 'Audit Hash', value: p2pLedger.auditHash.toUpperCase(), mono: true },
                      { label: 'Customer', value: p2pLedger.customerName },
                      { label: 'Total Amount', value: `₹${p2pLedger.totalAmountINR.toLocaleString('en-IN')}`, bold: true, green: true },
                      { label: 'GST Credit Note Ref', value: p2pLedger.gstCreditNoteRef, mono: true },
                      { label: 'Accepted At', value: new Date(p2pLedger.acceptedAt).toLocaleString('en-IN') },
                    ].map(({ label, value, mono, bold, green }) => (
                      <div key={label}>
                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
                        <p className={`truncate ${mono ? 'font-mono text-[11px]' : ''} ${bold ? 'font-bold' : ''} ${green ? 'text-emerald-400' : 'text-slate-200'}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestone Ledger Rows */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Banknote className="w-3.5 h-3.5" /> Milestone Payment Schedule
                  </p>
                  {p2pLedger.milestones.map((m, i) => (
                    <div key={m.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${STATUS_COLORS[m.status] ?? STATUS_COLORS['SCHEDULED']}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">₹{m.amountINR.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-slate-400">Due {m.dueDate} · {m.paymentMethod}</div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5">{m.gstCreditNoteRef}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${STATUS_COLORS[m.status]}`}>
                          {m.status}
                        </span>
                        {m.referenceId && <div className="text-[9px] font-mono text-slate-500 mt-1">{m.referenceId}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compliance Footer */}
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3.5 text-[10px] text-slate-400 leading-relaxed">
                  <p className="font-semibold text-slate-300 mb-1">⚖️ Compliance Note</p>
                  {p2pLedger.complianceNote}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
