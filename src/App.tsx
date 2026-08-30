import { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { CasesTable } from './components/CasesTable';
import { BatchSimulator } from './components/BatchSimulator';
import { VoiceAgentModal } from './components/VoiceAgentModal';
import { WhatsAppPreviewModal } from './components/WhatsAppPreviewModal';
import { AuditTrailModal } from './components/AuditTrailModal';
import { ComplianceConfigModal } from './components/ComplianceConfigModal';
import { NewCaseModal } from './components/NewCaseModal';
import { BankHealthModal } from './components/BankHealthModal';
import { WebhookSandboxModal } from './components/WebhookSandboxModal';
import { B2BNegotiatorModal } from './components/B2BNegotiatorModal';

import { INITIAL_MOCK_CASES, generateMockBatchCases } from './services/mockData';
import { ComplianceEngine } from './services/complianceEngine';
import { RevenueRecoveryAgent } from './services/recoveryAgent';
import { BankHealthService } from './services/bankHealthService';
import { WebhookService } from './services/webhookService';
import type { RecoveryCase } from './types/recovery';

export function App() {
  const complianceEngine = useMemo(() => new ComplianceEngine(), []);
  const recoveryAgent = useMemo(() => new RevenueRecoveryAgent(complianceEngine), [complianceEngine]);
  const bankHealthService = useMemo(() => new BankHealthService(), []);
  const webhookService = useMemo(() => new WebhookService(), []);

  const [cases, setCases] = useState<RecoveryCase[]>(() => [
    ...INITIAL_MOCK_CASES,
    ...generateMockBatchCases(45)
  ]);

  // Modal States
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
  };

  // Batch Update Handler
  const handleUpdateBatchCases = (updatedList: RecoveryCase[]) => {
    setCases(updatedList);
  };

  // Add New Case Handler
  const handleAddCase = (newCase: RecoveryCase) => {
    const diagnosed = recoveryAgent.diagnoseCase(newCase);
    setCases(prev => [diagnosed, ...prev]);
  };

  // Single Case Intervene Execution
  const handleInterveneSingle = (rcase: RecoveryCase) => {
    const diagnosed = recoveryAgent.diagnoseCase(rcase);
    const { updatedCase } = recoveryAgent.processIntervention(diagnosed);
    handleUpdateCase(updatedCase);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenBatchSimulator={() => setIsBatchOpen(true)}
        onOpenComplianceConfig={() => setIsComplianceOpen(true)}
        onOpenNewCase={() => setIsNewCaseOpen(true)}
        onOpenBankHealth={() => setIsBankHealthOpen(true)}
        onOpenWebhookSandbox={() => setIsWebhookOpen(true)}
        complianceEngine={complianceEngine}
        degradedBankCount={degradedBankCount}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Announcement */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/20 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Razorpay Hackathon • Track 03
              </span>
              <h2 className="text-sm font-bold text-white">AI Revenue Recovery Engine</h2>
            </div>
            <p className="text-xs text-slate-300">
              Autonomous multi-vector detection, Hinglish Voice & 1-Tap UPI interventions, Bank Downtime Hold Sequencer, and live money recovery ledger.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsBankHealthOpen(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Bank Health Pulse
            </button>
            <button
              onClick={() => setIsBatchOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              Run Batch Simulator
            </button>
          </div>
        </div>

        {/* Executive Dashboard KPIs & Visualizations */}
        <ExecutiveDashboard cases={cases} />

        {/* Recovery Cases Interactive Table */}
        <CasesTable
          cases={cases}
          onSelectVoiceCase={(c) => setSelectedVoiceCase(c)}
          onSelectWhatsAppCase={(c) => setSelectedWhatsAppCase(c)}
          onSelectAuditCase={(c) => setSelectedAuditCase(c)}
          onInterveneSingle={handleInterveneSingle}
          onOpenNewCaseModal={() => setIsNewCaseOpen(true)}
          onSelectNegotiateCase={(c) => setSelectedNegotiateCase(c)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Razorpay RevGuard AI • Track 03: AI Revenue Recovery</span>
          <span>Compliant Escalation & Bank Gateway Sequencer</span>
        </div>
      </footer>

      {/* Modals */}
      <BatchSimulator
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        cases={cases}
        onUpdateCases={handleUpdateBatchCases}
        complianceEngine={complianceEngine}
        recoveryAgent={recoveryAgent}
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
        onSettingsUpdated={() => setCases([...cases])}
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
        onInjectCase={(newCase) => setCases(prev => [newCase, ...prev])}
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

export default App;

