import React, { useState } from 'react';
import { 
  Search, PhoneCall, MessageSquare, FileText, CheckCircle2, AlertTriangle, 
  ShieldAlert, ArrowUpRight, Clock, Plus, Handshake, X, User
} from 'lucide-react';
import type { RecoveryCase, LeakVector, CaseStatus } from './types';

interface CasesTableProps {
  cases: RecoveryCase[];
  selectedCaseId: string | null;
  onSelectCase: (rcase: RecoveryCase) => void;
  onSelectVoiceCase: (rcase: RecoveryCase) => void;
  onSelectWhatsAppCase: (rcase: RecoveryCase) => void;
  onSelectAuditCase: (rcase: RecoveryCase) => void;
  onSelectNegotiateCase: (rcase: RecoveryCase) => void;
  onOpenNewCaseModal: () => void;
}

export const CasesTable: React.FC<CasesTableProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onSelectVoiceCase,
  onSelectWhatsAppCase,
  onSelectAuditCase,
  onSelectNegotiateCase,
  onOpenNewCaseModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vectorFilter, setVectorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerPhone.includes(searchTerm) ||
      c.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.issuingBank.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVector = vectorFilter === 'ALL' || c.leakVector === vectorFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'RECOVERED') matchesStatus = c.status === 'RECOVERED';
    else if (statusFilter === 'INTERVENING') matchesStatus = c.status === 'INTERVENING' || c.status === 'PROMISED_TO_PAY';
    else if (statusFilter === 'STOPPED') matchesStatus = c.status === 'STOPPED_COMPLIANT' || c.status === 'FAILED_UNRECOVERABLE';

    return matchesSearch && matchesVector && matchesStatus;
  });

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'RECOVERED':
        return <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 flex items-center space-x-1 w-fit"><CheckCircle2 className="w-3 h-3" /><span>Recovered</span></span>;
      case 'PROMISED_TO_PAY':
        return <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 flex items-center space-x-1 w-fit"><Clock className="w-3 h-3" /><span>Promise-to-Pay</span></span>;
      case 'INTERVENING':
        return <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-blue-950/40 text-blue-300 border border-blue-800/40 flex items-center space-x-1 w-fit"><ArrowUpRight className="w-3 h-3" /><span>Intervening</span></span>;
      case 'STOPPED_COMPLIANT':
        return <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center space-x-1 w-fit"><ShieldAlert className="w-3 h-3 text-amber-400" /><span>Stopped</span></span>;
      case 'FAILED_UNRECOVERABLE':
        return <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-red-950/40 text-red-400 border border-red-800/40 flex items-center space-x-1 w-fit"><AlertTriangle className="w-3 h-3" /><span>Unrecoverable</span></span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#161616] text-[#888888] border border-[#262626] w-fit">Pending</span>;
    }
  };

  const getVectorLabel = (vector: LeakVector) => {
    switch (vector) {
      case 'SUBSCRIPTION_FAIL': return 'Subscription';
      case 'CHECKOUT_ABANDON': return 'Cart Drop-off';
      case 'B2B_INVOICE': return 'B2B Invoice';
      case 'MANDATE_FAIL': return 'UPI Mandate';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setVectorFilter('ALL');
    setStatusFilter('ALL');
  };

  const hasActiveFilters = searchTerm !== '' || vectorFilter !== 'ALL' || statusFilter !== 'ALL';

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-3">
      {/* Top Header & Search Bar with Filter Pills (like user's screenshot) */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">Recovery Cases</h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Live transaction stream, autonomous AI diagnosis & recovery tracking
            </p>
          </div>

          <button
            onClick={onOpenNewCaseModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Case</span>
          </button>
        </div>

        {/* Filter Toolbar matching user reference */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, bank, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] text-[#EDEDED] text-xs rounded-lg pl-8 pr-2.5 py-1.5 focus:border-[#444444] focus:outline-none placeholder-[#52525B]"
            />
          </div>

          {/* Vector Filter Select */}
          <select
            value={vectorFilter}
            onChange={(e) => setVectorFilter(e.target.value)}
            className="bg-[#111111] border border-[#222222] text-[#A1A1A1] text-xs rounded-lg px-2.5 py-1.5 focus:border-[#444444] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Vectors</option>
            <option value="SUBSCRIPTION_FAIL">Subscriptions</option>
            <option value="CHECKOUT_ABANDON">Cart Drop-offs</option>
            <option value="B2B_INVOICE">B2B Invoices</option>
            <option value="MANDATE_FAIL">UPI Mandates</option>
          </select>

          {/* Status Filter Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111111] border border-[#222222] text-[#A1A1A1] text-xs rounded-lg px-2.5 py-1.5 focus:border-[#444444] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="RECOVERED">Recovered</option>
            <option value="INTERVENING">Active / P2P</option>
            <option value="STOPPED">Stopped (Compliant)</option>
          </select>

          {/* Active Filter Chips (like user screenshot) */}
          {vectorFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181818] border border-[#2A2A2A] text-xs text-[#EDEDED]">
              <span>Vector: {getVectorLabel(vectorFilter as LeakVector)}</span>
              <button onClick={() => setVectorFilter('ALL')} className="text-[#71717A] hover:text-white cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {statusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181818] border border-[#2A2A2A] text-xs text-[#EDEDED]">
              <span>Status: {statusFilter}</span>
              <button onClick={() => setStatusFilter('ALL')} className="text-[#71717A] hover:text-white cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#71717A] hover:text-white flex items-center gap-1 px-2 py-1 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          <div className="ml-auto text-xs text-[#71717A] font-mono">
            {filteredCases.length} of {cases.length} cases
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="flex-1 overflow-auto rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]">
        <table className="w-full text-left text-xs text-[#D4D4D8]">
          <thead className="sticky top-0 z-10 bg-[#000000] text-[#71717A] font-medium uppercase text-[10px] tracking-wider border-b border-[#1F1F1F]">
            <tr>
              <th className="py-3 px-3.5">Customer & ID</th>
              <th className="py-3 px-3.5">Leak Vector</th>
              <th className="py-3 px-3.5">Amount at Risk</th>
              <th className="py-3 px-3.5">Bank & Failure</th>
              <th className="py-3 px-3.5">Intervention</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181818]">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#71717A]">
                  No recovery cases match the current filter criteria.
                </td>
              </tr>
            ) : (
              filteredCases.map((rcase) => {
                const isSelected = selectedCaseId === rcase.id;
                return (
                  <tr 
                    key={rcase.id} 
                    onClick={() => onSelectCase(rcase)}
                    className={`transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-[#181818] border-l-2 border-white' 
                        : 'hover:bg-[#111111]'
                    }`}
                  >
                    {/* Customer Info with Avatar */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shrink-0">
                          <User className="w-3.5 h-3.5 text-neutral-300" />
                        </div>
                        <div>
                          <div className="font-medium text-[#EDEDED] flex items-center gap-1.5">
                            <span>{rcase.customerName}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                          </div>
                          <div className="text-[10px] text-[#71717A] font-mono mt-0.5">
                            {rcase.paymentId} · {rcase.customerPhone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Leak Vector */}
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#141414] text-[#A1A1A1] text-[11px] font-mono border border-[#222222]">
                        {getVectorLabel(rcase.leakVector)}
                      </span>
                    </td>

                    {/* Amount at Risk */}
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-[#EDEDED]">
                        ₹{rcase.amountAtRisk.toLocaleString('en-IN')}
                      </div>
                      {rcase.totalAmountRecovered > 0 && (
                        <div className="text-[10px] text-emerald-400 font-mono">
                          +₹{rcase.totalAmountRecovered.toLocaleString('en-IN')} recovered
                        </div>
                      )}
                    </td>

                    {/* Bank & Failure Cause */}
                    <td className="py-3 px-3.5">
                      <div className="text-[#D4D4D8] font-medium">{rcase.issuingBank}</div>
                      <div className="text-[10px] text-[#71717A] truncate max-w-[150px]" title={rcase.failureReason}>
                        {rcase.failureReason}
                      </div>
                    </td>

                    {/* Recommended Channel */}
                    <td className="py-3 px-3.5">
                      <span className="text-[10px] font-mono text-[#A1A1A1] bg-[#141414] px-2 py-0.5 rounded border border-[#222222]">
                        {rcase.recommendedChannel.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3.5">
                      {getStatusBadge(rcase.status)}
                    </td>

                    {/* Quick Action Buttons */}
                    <td className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        {rcase.leakVector === 'B2B_INVOICE' && rcase.amountAtRisk >= 45000 && (
                          <button
                            onClick={() => onSelectNegotiateCase(rcase)}
                            className="p-1.5 bg-[#141414] hover:bg-[#222222] text-purple-400 hover:text-purple-300 rounded border border-[#262626] hover:border-[#3A3A3A] transition-all cursor-pointer"
                            title="Open B2B Milestone Settlement Negotiator"
                          >
                            <Handshake className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onSelectVoiceCase(rcase)}
                          className="p-1.5 bg-[#141414] hover:bg-[#222222] text-[#A1A1A1] hover:text-white rounded border border-[#262626] hover:border-[#3A3A3A] transition-all cursor-pointer"
                          title="Launch Hinglish Voice Agent Call Simulator"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onSelectWhatsAppCase(rcase)}
                          className="p-1.5 bg-[#141414] hover:bg-[#222222] text-emerald-400 hover:text-emerald-300 rounded border border-[#262626] hover:border-[#3A3A3A] transition-all cursor-pointer"
                          title="Preview WhatsApp 1-Tap UPI Payment Nudge"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onSelectAuditCase(rcase)}
                          className="p-1.5 bg-[#141414] hover:bg-[#222222] text-[#71717A] hover:text-white rounded border border-[#262626] hover:border-[#3A3A3A] transition-all cursor-pointer"
                          title="View Immutable Audit Trail"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
