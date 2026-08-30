import React, { useState } from 'react';
import { Search, PhoneCall, MessageSquare, FileText, CheckCircle2, AlertTriangle, ShieldAlert, ArrowUpRight, Clock, Plus, Handshake } from 'lucide-react';
import type { RecoveryCase, LeakVector, CaseStatus } from '../types/recovery';

interface CasesTableProps {
  cases: RecoveryCase[];
  onSelectVoiceCase: (rcase: RecoveryCase) => void;
  onSelectWhatsAppCase: (rcase: RecoveryCase) => void;
  onSelectAuditCase: (rcase: RecoveryCase) => void;
  onInterveneSingle: (rcase: RecoveryCase) => void;
  onOpenNewCaseModal: () => void;
  onSelectNegotiateCase: (rcase: RecoveryCase) => void;
}

export const CasesTable: React.FC<CasesTableProps> = ({
  cases,
  onSelectVoiceCase,
  onSelectWhatsAppCase,
  onSelectAuditCase,
  onOpenNewCaseModal,
  onSelectNegotiateCase,
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
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /><span>Recovered</span></span>;
      case 'PROMISED_TO_PAY':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center space-x-1 w-fit"><Clock className="w-3.5 h-3.5" /><span>Promise-to-Pay</span></span>;
      case 'INTERVENING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center space-x-1 w-fit"><ArrowUpRight className="w-3.5 h-3.5" /><span>Intervening</span></span>;
      case 'STOPPED_COMPLIANT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1 w-fit"><ShieldAlert className="w-3.5 h-3.5" /><span>Stopped Compliant</span></span>;
      case 'FAILED_UNRECOVERABLE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center space-x-1 w-fit"><AlertTriangle className="w-3.5 h-3.5" /><span>Unrecoverable</span></span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700 w-fit">Pending Diagnosis</span>;
    }
  };

  const getVectorLabel = (vector: LeakVector) => {
    switch (vector) {
      case 'SUBSCRIPTION_FAIL': return 'Subscription Fail';
      case 'CHECKOUT_ABANDON': return 'Checkout Abandon';
      case 'B2B_INVOICE': return 'B2B Receivable';
      case 'MANDATE_FAIL': return 'UPI Mandate';
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden space-y-4 p-5">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Revenue Loss Recovery Cases</h2>
          <p className="text-xs text-slate-400">Manage real-time payment failure interventions and customer outreach</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, bank, payment ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Vector Filter */}
          <select
            value={vectorFilter}
            onChange={(e) => setVectorFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Leak Vectors</option>
            <option value="SUBSCRIPTION_FAIL">Subscription Failures</option>
            <option value="CHECKOUT_ABANDON">Checkout Drop-offs</option>
            <option value="B2B_INVOICE">B2B Overdue Invoices</option>
            <option value="MANDATE_FAIL">UPI Mandates</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="RECOVERED">Recovered</option>
            <option value="INTERVENING">Active / Intervening</option>
            <option value="STOPPED">Stopped (Compliant)</option>
          </select>

          <button
            onClick={onOpenNewCaseModal}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Customer & Payment ID</th>
              <th className="py-3.5 px-4">Leak Vector</th>
              <th className="py-3.5 px-4">Amount at Risk</th>
              <th className="py-3.5 px-4">Bank & Cause</th>
              <th className="py-3.5 px-4">Intervention Channel</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/50 font-sans">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No recovery cases match the search criteria.
                </td>
              </tr>
            ) : (
              filteredCases.map((rcase) => (
                <tr key={rcase.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Customer Info */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white text-sm">{rcase.customerName}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{rcase.paymentId} • {rcase.customerPhone}</div>
                  </td>

                  {/* Leak Vector */}
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60 inline-block">
                      {getVectorLabel(rcase.leakVector)}
                    </span>
                  </td>

                  {/* Amount at Risk */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">
                      ₹{rcase.amountAtRisk.toLocaleString('en-IN')}
                    </div>
                    {rcase.totalAmountRecovered > 0 && (
                      <div className="text-[11px] text-emerald-400 font-medium">
                        ₹{rcase.totalAmountRecovered.toLocaleString('en-IN')} Recovered
                      </div>
                    )}
                  </td>

                  {/* Bank & Failure Cause */}
                  <td className="py-3.5 px-4">
                    <div className="text-slate-200 font-medium">{rcase.issuingBank}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[160px]" title={rcase.failureReason}>
                      {rcase.failureReason}
                    </div>
                  </td>

                  {/* Recommended Channel */}
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] font-medium text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 inline-block">
                      {rcase.recommendedChannel.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    {getStatusBadge(rcase.status)}
                  </td>

                  {/* Interactive Action Trigger Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {/* B2B Negotiate Button — only for B2B invoices ≥ ₹45K */}
                      {rcase.leakVector === 'B2B_INVOICE' && rcase.amountAtRisk >= 45000 && (
                        <button
                          onClick={() => onSelectNegotiateCase(rcase)}
                          className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white rounded-lg border border-purple-500/30 transition-all cursor-pointer"
                          title="Open B2B Milestone Settlement Negotiator"
                        >
                          <Handshake className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Hinglish Voice Call Button */}
                      <button
                        onClick={() => onSelectVoiceCase(rcase)}
                        className="p-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-lg border border-indigo-500/30 transition-all cursor-pointer"
                        title="Launch Hinglish Voice Agent Call Simulator"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </button>

                      {/* WhatsApp 1-Tap Link Button */}
                      <button
                        onClick={() => onSelectWhatsAppCase(rcase)}
                        className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                        title="Preview WhatsApp 1-Tap UPI Payment Nudge"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      {/* Audit Log Button */}
                      <button
                        onClick={() => onSelectAuditCase(rcase)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all cursor-pointer"
                        title="View Immutable Audit Trail"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
