import { useState } from 'react';
import { Sidebar } from './shared/Sidebar';
import { ExecutiveDashboard } from './features/recovery/ExecutiveDashboard';
import { CasesTable } from './features/recovery/CasesTable';
import { CaseDetailDrawer } from './features/recovery/CaseDetailDrawer';
import { BatchSimulator } from './features/recovery/BatchSimulator';
import { VoiceAgentModal } from './features/voice/VoiceAgentModal';
import { WhatsAppPreviewModal } from './features/whatsapp/WhatsAppPreviewModal';
import { AuditTrailModal } from './features/compliance/AuditTrailModal';
import { ComplianceConfigModal } from './features/compliance/ComplianceConfigModal';
import { NewCaseModal } from './features/compliance/NewCaseModal';
import { BankHealthModal } from './features/bank-health/BankHealthModal';
import { WebhookSandboxModal } from './features/webhooks/WebhookSandboxModal';
import { B2BNegotiatorModal } from './features/b2b-negotiator/B2BNegotiatorModal';

import { INITIAL_MOCK_CASES } from './features/recovery/MockData';
import { ComplianceEngine } from './features/recovery/ComplianceEngine';
import { RevenueRecoveryAgent } from './features/recovery/RecoveryAgent';
import { BankHealthService } from './features/bank-health/BankHealthService';
import { WebhookService } from './features/webhooks/WebhookService';
import type { RecoveryCase } from './features/recovery/types';
import { ChevronRight, Play, Download, Sun, Moon } from 'lucide-react';
import { ThemeProvider, useTheme } from './shared/ThemeContext';

const complianceEngine = new ComplianceEngine();
const recoveryAgent = new RevenueRecoveryAgent(complianceEngine);
const bankHealthService = new BankHealthService();
const webhookService = new WebhookService();

function RevGuardApp() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [cases, setCases] = useState<RecoveryCase[]>(INITIAL_MOCK_CASES);
  const [activeView, setActiveView] = useState<'cases' | 'analytics'>('cases');
  const [selectedDrawerCase, setSelectedDrawerCase] = useState<RecoveryCase | null>(null);

  // Modal Dialogs State
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isBankHealthOpen, setIsBankHealthOpen] = useState(false);
  const [isWebhookOpen, setIsWebhookOpen] = useState(false);

  const [selectedVoiceCase, setSelectedVoiceCase] = useState<RecoveryCase | null>(null);
  const [selectedWhatsAppCase, setSelectedWhatsAppCase] = useState<RecoveryCase | null>(null);
  const [selectedAuditCase, setSelectedAuditCase] = useState<RecoveryCase | null>(null);
  const [selectedNegotiateCase, setSelectedNegotiateCase] = useState<RecoveryCase | null>(null);

  // Computed Bank Outage Count
  const degradedBankCount = bankHealthService.getBanks().filter(b => b.status === 'DEGRADED' || b.status === 'OUTAGE').length;

  // Single Case Update Handler
  const handleUpdateCase = (updated: RecoveryCase) => {
    setCases(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedDrawerCase?.id === updated.id) {
      setSelectedDrawerCase(updated);
    }
  };

  // Batch Update Handler
  const handleUpdateBatchCases = (updatedList: RecoveryCase[]) => {
    setCases(updatedList);
    if (selectedDrawerCase) {
      const refreshed = updatedList.find(c => c.id === selectedDrawerCase.id);
      if (refreshed) setSelectedDrawerCase(refreshed);
    }
  };

  // Add New Case Handler
  const handleAddCase = (newCase: RecoveryCase) => {
    const diagnosed = recoveryAgent.diagnoseCase(newCase);
    setCases(prev => [diagnosed, ...prev]);
    setSelectedDrawerCase(diagnosed);
  };

  // Single Case Intervene Execution
  const handleInterveneSingle = (rcase: RecoveryCase) => {
    const diagnosed = recoveryAgent.diagnoseCase(rcase);
    const { updatedCase } = recoveryAgent.processIntervention(diagnosed);
    handleUpdateCase(updatedCase);
  };

  // Export Audit Report
  const handleExportReport = () => {
    const totalRisk = cases.reduce((a, b) => a + b.amountAtRisk, 0);
    const totalRecovered = cases.reduce((a, b) => a + b.totalAmountRecovered, 0);
    const recoveryRate = totalRisk > 0 ? (totalRecovered / totalRisk) * 100 : 0;

    const reportData = {
      reportTitle: "Razorpay RevGuard AI - Revenue Recovery & Compliance Audit Ledger",
      generatedAt: new Date().toISOString(),
      track: "Track 03 · AI Revenue Recovery",
      merchant: "Razorpay Verified Merchant",
      executiveSummary: {
        totalCases: cases.length,
        totalAmountAtRiskINR: totalRisk,
        totalAmountRecoveredINR: totalRecovered,
        recoveryRatePercent: Number(recoveryRate.toFixed(2)),
        compliantStopsCount: cases.filter(c => c.status === 'STOPPED_COMPLIANT').length,
        activeInterventionsCount: cases.filter(c => c.status === 'INTERVENING' || c.status === 'PROMISED_TO_PAY').length
      },
      complianceSettings: complianceEngine.getSettings(),
      casesLedger: cases
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Razorpay_RevGuard_Audit_Report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`h-screen w-screen font-sans flex overflow-hidden select-none transition-colors duration-150 ${
      isDark ? 'bg-black text-[#EDEDED]' : 'bg-[#F9FAFB] text-[#111827]'
    }`}>
      {/* Column 1: Left Navigation Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
        onOpenBatchSimulator={() => setIsBatchOpen(true)}
        onOpenComplianceConfig={() => setIsComplianceOpen(true)}
        onOpenNewCase={() => setIsNewCaseOpen(true)}
        onOpenBankHealth={() => setIsBankHealthOpen(true)}
        onOpenWebhookSandbox={() => setIsWebhookOpen(true)}
        complianceEngine={complianceEngine}
        degradedBankCount={degradedBankCount}
        totalCasesCount={cases.length}
      />

      {/* Column 2: Center Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Breadcrumb Bar */}
        <header className={`h-12 border-b px-6 flex items-center justify-between shrink-0 text-xs transition-colors ${
          isDark ? 'border-[#1F1F1F] bg-[#000000]' : 'border-[#E5E7EB] bg-[#FFFFFF]'
        }`}>
          <div className={`flex items-center space-x-2 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            <span>Razorpay RevGuard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={`font-medium capitalize ${isDark ? 'text-white' : 'text-neutral-900 font-semibold'}`}>
              {activeView === 'cases' ? 'All Recovery Cases' : 'Executive Overview'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsBankHealthOpen(true)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] cursor-pointer ${
                degradedBankCount > 0
                  ? isDark 
                    ? 'bg-amber-950/40 border-amber-800/40 text-amber-300' 
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                  : isDark 
                    ? 'bg-[#111111] border-[#222222] text-[#A1A1A1] hover:text-white' 
                    : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:text-black'
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                {degradedBankCount > 0 ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                ) : (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${degradedBankCount > 0 ? 'bg-amber-400' : 'bg-emerald-500'}`} />
              </span>
              <span>Gateways: {degradedBankCount > 0 ? `${degradedBankCount} Alert` : 'Healthy'}</span>
            </button>

            <button
              onClick={handleExportReport}
              className={`flex items-center space-x-1.5 px-2.5 py-1 font-mono text-[11px] rounded-md border transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] cursor-pointer ${
                isDark 
                  ? 'bg-[#111111] hover:bg-[#1A1A1A] text-[#D4D4D8] hover:text-white border-[#222222]' 
                  : 'bg-white hover:bg-neutral-100 text-neutral-700 hover:text-black border-neutral-300 shadow-sm'
              }`}
              title="Download Compliance & Recovery JSON Report"
            >
              <Download className="w-3 h-3" />
              <span>Export Audit</span>
            </button>

            {/* Theme Toggle Button in Header */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-md border transition-all duration-150 hover:scale-[1.05] active:scale-[0.95] cursor-pointer ${
                isDark 
                  ? 'bg-[#111111] hover:bg-[#1A1A1A] border-[#222222] text-[#D4D4D8] hover:text-white' 
                  : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-black shadow-sm'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            </button>

            <button
              onClick={() => setIsBatchOpen(true)}
              className={`flex items-center space-x-1.5 px-3 py-1 font-semibold text-xs rounded-md transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] shadow-sm cursor-pointer ${
                isDark 
                  ? 'bg-white hover:bg-neutral-200 text-black' 
                  : 'bg-black hover:bg-neutral-800 text-white'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run Batch</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 overflow-auto p-6 transition-colors ${
          isDark ? 'bg-black' : 'bg-[#F9FAFB]'
        }`}>
          {activeView === 'cases' ? (
            <CasesTable
              cases={cases}
              selectedCaseId={selectedDrawerCase?.id ?? null}
              onSelectCase={(c) => setSelectedDrawerCase(c)}
              onSelectVoiceCase={(c) => setSelectedVoiceCase(c)}
              onSelectWhatsAppCase={(c) => setSelectedWhatsAppCase(c)}
              onSelectAuditCase={(c) => setSelectedAuditCase(c)}
              onSelectNegotiateCase={(c) => setSelectedNegotiateCase(c)}
              onOpenNewCaseModal={() => setIsNewCaseOpen(true)}
            />
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Executive Analytics
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                  Aggregated revenue loss metrics, recovery rate %, and lifecycle distribution
                </p>
              </div>
              <ExecutiveDashboard cases={cases} />
            </div>
          )}
        </main>
      </div>

      {/* Column 3: Right Slide-in Case Inspector Drawer */}
      {selectedDrawerCase && (
        <CaseDetailDrawer
          rcase={selectedDrawerCase}
          onClose={() => setSelectedDrawerCase(null)}
          onSelectVoiceCase={(c) => setSelectedVoiceCase(c)}
          onSelectWhatsAppCase={(c) => setSelectedWhatsAppCase(c)}
          onSelectAuditCase={(c) => setSelectedAuditCase(c)}
          onSelectNegotiateCase={(c) => setSelectedNegotiateCase(c)}
          onInterveneSingle={handleInterveneSingle}
        />
      )}

      {/* Modals & Dialogs */}
      <BatchSimulator
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        cases={cases}
        recoveryAgent={recoveryAgent}
        complianceEngine={complianceEngine}
        onUpdateCases={handleUpdateBatchCases}
      />

      <VoiceAgentModal
        isOpen={!!selectedVoiceCase}
        onClose={() => setSelectedVoiceCase(null)}
        rcase={selectedVoiceCase}
        recoveryAgent={recoveryAgent}
        onUpdateCase={handleUpdateCase}
      />

      <WhatsAppPreviewModal
        isOpen={!!selectedWhatsAppCase}
        onClose={() => setSelectedWhatsAppCase(null)}
        rcase={selectedWhatsAppCase}
        onUpdateCase={handleUpdateCase}
      />

      <AuditTrailModal
        isOpen={!!selectedAuditCase}
        onClose={() => setSelectedAuditCase(null)}
        rcase={selectedAuditCase}
      />

      <ComplianceConfigModal
        isOpen={isComplianceOpen}
        onClose={() => setIsComplianceOpen(false)}
        complianceEngine={complianceEngine}
        onSettingsUpdated={() => {}}
      />

      <NewCaseModal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        onAddCase={handleAddCase}
      />

      <BankHealthModal
        isOpen={isBankHealthOpen}
        onClose={() => setIsBankHealthOpen(false)}
        bankHealthService={bankHealthService}
        cases={cases}
        onUpdateCases={handleUpdateBatchCases}
      />

      <WebhookSandboxModal
        isOpen={isWebhookOpen}
        onClose={() => setIsWebhookOpen(false)}
        webhookService={webhookService}
        onInjectCase={(newCase) => {
          setCases(prev => [newCase, ...prev]);
          setSelectedDrawerCase(newCase);
        }}
      />

      <B2BNegotiatorModal
        isOpen={!!selectedNegotiateCase}
        onClose={() => setSelectedNegotiateCase(null)}
        rcase={selectedNegotiateCase}
        onUpdateCase={handleUpdateCase}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <RevGuardApp />
    </ThemeProvider>
  );
}
