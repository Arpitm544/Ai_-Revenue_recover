import React, { useState } from 'react';
import { 
  Search, CheckCircle2, AlertTriangle, 
  ShieldAlert, ArrowUpRight, Clock, Plus, X, User
} from 'lucide-react';
import type { RecoveryCase, LeakVector, CaseStatus } from './types';
import { useTheme } from '../../shared/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
        return (
          <span className={`px-2 py-0.5 text-[11px] font-mono rounded flex items-center space-x-1 w-fit ${
            isDark 
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            <CheckCircle2 className="w-3 h-3" />
            <span>Recovered</span>
          </span>
        );
      case 'PROMISED_TO_PAY':
        return (
          <span className={`px-2 py-0.5 text-[11px] font-mono rounded flex items-center space-x-1 w-fit ${
            isDark 
              ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40' 
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            <Clock className="w-3 h-3" />
            <span>Promise-to-Pay</span>
          </span>
        );
      case 'INTERVENING':
        return (
          <span className={`px-2 py-0.5 text-[11px] font-mono rounded flex items-center space-x-1 w-fit ${
            isDark 
              ? 'bg-blue-950/40 text-blue-300 border border-blue-800/40' 
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <ArrowUpRight className="w-3 h-3" />
            <span>Intervening</span>
          </span>
        );
      case 'STOPPED_COMPLIANT':
        return (
          <span className={`px-2 py-0.5 text-[11px] font-mono rounded flex items-center space-x-1 w-fit ${
            isDark 
              ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' 
              : 'bg-neutral-100 text-neutral-600 border border-neutral-300'
          }`}>
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            <span>Stopped</span>
          </span>
        );
      case 'FAILED_UNRECOVERABLE':
        return (
          <span className={`px-2 py-0.5 text-[11px] font-mono rounded flex items-center space-x-1 w-fit ${
            isDark 
              ? 'bg-red-950/40 text-red-400 border border-red-800/40' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <AlertTriangle className="w-3 h-3" />
            <span>Unrecoverable</span>
          </span>
        );
      default:
        return (
          <span className={`px-2 py-0.5 text-[11px] font-mono rounded w-fit ${
            isDark 
              ? 'bg-[#161616] text-[#888888] border border-[#262626]' 
              : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
          }`}>
            Pending
          </span>
        );
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
      {/* Top Header & Search Bar with Filter Pills */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Recovery Cases
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              Live transaction stream, autonomous AI diagnosis & recovery tracking
            </p>
          </div>

          <button
            onClick={onOpenNewCaseModal}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer ${
              isDark 
                ? 'bg-white hover:bg-neutral-200 text-black' 
                : 'bg-black hover:bg-neutral-800 text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Case</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative w-64">
            <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#71717A]' : 'text-neutral-400'}`} />
            <input
              type="text"
              placeholder="Search customer, bank, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-xs rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none transition-colors ${
                isDark 
                  ? 'bg-[#111111] border border-[#222222] text-[#EDEDED] focus:border-[#444444] placeholder-[#52525B]' 
                  : 'bg-white border border-neutral-300 text-neutral-900 focus:border-neutral-500 placeholder-neutral-400'
              }`}
            />
          </div>

          {/* Vector Filter Select */}
          <select
            value={vectorFilter}
            onChange={(e) => setVectorFilter(e.target.value)}
            className={`text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer transition-colors ${
              isDark 
                ? 'bg-[#111111] border border-[#222222] text-[#A1A1A1] focus:border-[#444444]' 
                : 'bg-white border border-neutral-300 text-neutral-700 focus:border-neutral-500'
            }`}
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
            className={`text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer transition-colors ${
              isDark 
                ? 'bg-[#111111] border border-[#222222] text-[#A1A1A1] focus:border-[#444444]' 
                : 'bg-white border border-neutral-300 text-neutral-700 focus:border-neutral-500'
            }`}
          >
            <option value="ALL">All Statuses</option>
            <option value="RECOVERED">Recovered</option>
            <option value="INTERVENING">Active / P2P</option>
            <option value="STOPPED">Stopped (Compliant)</option>
          </select>

          {/* Active Filter Chips */}
          {vectorFilter !== 'ALL' && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border ${
              isDark 
                ? 'bg-[#181818] border-[#2A2A2A] text-[#EDEDED]' 
                : 'bg-neutral-100 border-neutral-300 text-neutral-800'
            }`}>
              <span>Vector: {getVectorLabel(vectorFilter as LeakVector)}</span>
              <button onClick={() => setVectorFilter('ALL')} className="text-neutral-500 hover:text-black cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {statusFilter !== 'ALL' && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border ${
              isDark 
                ? 'bg-[#181818] border-[#2A2A2A] text-[#EDEDED]' 
                : 'bg-neutral-100 border-neutral-300 text-neutral-800'
            }`}>
              <span>Status: {statusFilter}</span>
              <button onClick={() => setStatusFilter('ALL')} className="text-neutral-500 hover:text-black cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-neutral-500 hover:text-black flex items-center gap-1 px-2 py-1 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          <div className={`ml-auto text-xs font-mono ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            {filteredCases.length} of {cases.length} cases
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className={`flex-1 overflow-auto rounded-xl border transition-colors ${
        isDark ? 'border-[#1F1F1F] bg-[#0A0A0A]' : 'border-[#E5E7EB] bg-[#FFFFFF] shadow-sm'
      }`}>
        <table className={`w-full text-left text-xs ${isDark ? 'text-[#D4D4D8]' : 'text-neutral-700'}`}>
          <thead className={`sticky top-0 z-10 font-medium uppercase text-[10px] tracking-wider border-b ${
            isDark 
              ? 'bg-[#000000] text-[#71717A] border-[#1F1F1F]' 
              : 'bg-[#F9FAFB] text-neutral-500 border-[#E5E7EB]'
          }`}>
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
          <tbody className={`divide-y ${isDark ? 'divide-[#181818]' : 'divide-[#F3F4F6]'}`}>
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className={`py-12 text-center ${isDark ? 'text-[#71717A]' : 'text-neutral-400'}`}>
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
                        ? isDark 
                          ? 'bg-[#181818] border-l-2 border-white' 
                          : 'bg-neutral-100 border-l-2 border-black'
                        : isDark 
                          ? 'hover:bg-[#111111]' 
                          : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    {/* Customer Info with Avatar */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isDark ? 'bg-neutral-800 border border-neutral-700 text-white' : 'bg-neutral-200 border border-neutral-300 text-neutral-800'
                        }`}>
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className={`font-medium flex items-center gap-1.5 ${isDark ? 'text-[#EDEDED]' : 'text-neutral-900 font-semibold'}`}>
                            <span>{rcase.customerName}</span>
                          </div>
                          <div className={`text-[10px] font-mono ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                            {rcase.paymentId} · {rcase.customerPhone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Leak Vector */}
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        isDark 
                          ? 'bg-[#141414] text-[#A1A1A1] border-[#222222]' 
                          : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                      }`}>
                        {getVectorLabel(rcase.leakVector)}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3.5 font-mono">
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        ₹{rcase.amountAtRisk.toLocaleString('en-IN')}
                      </div>
                      {rcase.totalAmountRecovered > 0 && (
                        <div className="text-[10px] text-emerald-500 font-medium">
                          +₹{rcase.totalAmountRecovered.toLocaleString('en-IN')} saved
                        </div>
                      )}
                    </td>

                    {/* Bank & Failure */}
                    <td className="py-3 px-3.5">
                      <div className={`font-medium ${isDark ? 'text-[#EDEDED]' : 'text-neutral-800'}`}>{rcase.issuingBank}</div>
                      <div className={`text-[10px] font-mono truncate max-w-[140px] ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`} title={rcase.failureReason}>
                        {rcase.failureReason}
                      </div>
                    </td>

                    {/* Recommended Channel */}
                    <td className="py-3 px-3.5">
                      <span className={`text-[11px] font-mono ${isDark ? 'text-[#A1A1A1]' : 'text-neutral-600'}`}>
                        {rcase.recommendedChannel.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3.5">
                      {getStatusBadge(rcase.status)}
                    </td>

                    {/* Quick Action Shortcuts */}
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectVoiceCase(rcase)}
                          className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                            isDark 
                              ? 'bg-[#111111] hover:bg-[#1E1E1E] text-[#A1A1A1] hover:text-white border-[#222222]' 
                              : 'bg-white hover:bg-neutral-100 text-neutral-600 hover:text-black border-neutral-300 shadow-sm'
                          }`}
                          title="Hinglish Voice AI Simulation"
                        >
                          🎤
                        </button>
                        <button
                          onClick={() => onSelectWhatsAppCase(rcase)}
                          className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                            isDark 
                              ? 'bg-[#111111] hover:bg-[#1E1E1E] text-[#A1A1A1] hover:text-white border-[#222222]' 
                              : 'bg-white hover:bg-neutral-100 text-neutral-600 hover:text-black border-neutral-300 shadow-sm'
                          }`}
                          title="1-Tap UPI WhatsApp Preview"
                        >
                          💬
                        </button>
                        <button
                          onClick={() => onSelectNegotiateCase(rcase)}
                          className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                            isDark 
                              ? 'bg-[#111111] hover:bg-[#1E1E1E] text-[#A1A1A1] hover:text-white border-[#222222]' 
                              : 'bg-white hover:bg-neutral-100 text-neutral-600 hover:text-black border-neutral-300 shadow-sm'
                          }`}
                          title="B2B Settlement Negotiator"
                        >
                          🤝
                        </button>
                        <button
                          onClick={() => onSelectAuditCase(rcase)}
                          className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                            isDark 
                              ? 'bg-[#111111] hover:bg-[#1E1E1E] text-[#A1A1A1] hover:text-white border-[#222222]' 
                              : 'bg-white hover:bg-neutral-100 text-neutral-600 hover:text-black border-neutral-300 shadow-sm'
                          }`}
                          title="Immutable Audit Trail"
                        >
                          📋
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
