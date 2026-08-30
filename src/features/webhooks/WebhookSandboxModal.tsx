import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, CheckCircle2, AlertTriangle, Shield, Radio, Check } from 'lucide-react';
import type { RecoveryCase } from '../recovery/types';
import type { WebhookIngestionLog, WebhookTemplate, WebhookStep } from './types';
import { WebhookService } from './WebhookService';

interface WebhookSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectCase: (newCase: RecoveryCase) => void;
  webhookService: WebhookService;
}

const COLOR_MAP: Record<string, { badge: string; ring: string; text: string; dot: string }> = {
  red:    { badge: 'bg-red-950/40 border-red-800/50 text-red-300',       ring: 'ring-1 ring-red-500/40',    text: 'text-red-400',    dot: 'bg-red-400' },
  amber:  { badge: 'bg-amber-950/40 border-amber-800/50 text-amber-300', ring: 'ring-1 ring-amber-500/40',  text: 'text-amber-400',  dot: 'bg-amber-400' },
  orange: { badge: 'bg-orange-950/40 border-orange-800/50 text-orange-300', ring: 'ring-1 ring-orange-500/40', text: 'text-orange-400', dot: 'bg-orange-400' },
  purple: { badge: 'bg-purple-950/40 border-purple-800/50 text-purple-300', ring: 'ring-1 ring-purple-500/40', text: 'text-purple-400', dot: 'bg-purple-400' },
};

function StepRow({ step }: { step: WebhookStep }) {
  return (
    <div className="flex items-start gap-2.5 animate-in fade-in slide-in-from-left duration-200">
      <div className={`mt-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 border ${step.status === 'OK' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}>
        {step.status === 'OK'
          ? <Check className="w-2.5 h-2.5" />
          : <AlertTriangle className="w-2.5 h-2.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-white">{step.label}</span>
          <span className="text-[10px] text-[#71717A] font-mono shrink-0">{step.durationMs}ms</span>
        </div>
        <p className="text-[10px] text-[#A1A1A1] font-mono truncate mt-0.5">{step.detail}</p>
      </div>
    </div>
  );
}

function LogBadge({ log }: { log: WebhookIngestionLog }) {
  return (
    <div className="p-2.5 bg-[#111111] border border-[#222222] rounded-lg space-y-1 hover:border-[#333333] transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#181818] text-[#D4D4D8] border border-[#2A2A2A]">
          {log.event}
        </span>
        <span className="text-[10px] text-emerald-400 font-mono font-semibold">₹{log.amountINR.toLocaleString('en-IN')}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#EDEDED] truncate font-medium">{log.parsedCustomerName}</span>
        <span className="text-[10px] text-[#71717A] font-mono">{log.processingMs}ms</span>
      </div>
    </div>
  );
}

export const WebhookSandboxModal: React.FC<WebhookSandboxModalProps> = ({
  isOpen,
  onClose,
  webhookService,
  onInjectCase,
}) => {
  const templates = webhookService.getTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<WebhookTemplate>(templates[0]);
  const [editedPayload, setEditedPayload] = useState(JSON.stringify(templates[0].payload, null, 2));
  const [isFiring, setIsFiring] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [activeLog, setActiveLog] = useState<WebhookIngestionLog | null>(null);
  const [logs, setLogs] = useState<WebhookIngestionLog[]>([]);
  const [parseError, setParseError] = useState('');
  const stepsInterval = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLogs(webhookService.getLogs());
  }, [isOpen, webhookService]);

  const handleSelectTemplate = (t: WebhookTemplate) => {
    setSelectedTemplate(t);
    setEditedPayload(JSON.stringify(t.payload, null, 2));
    setParseError('');
    setActiveLog(null);
    setVisibleSteps(0);
    if (stepsInterval.current) clearInterval(stepsInterval.current);
    setIsFiring(false);
  };

  const handlePayloadChange = (val: string) => {
    setEditedPayload(val);
    try {
      JSON.parse(val);
      setParseError('');
    } catch {
      setParseError('Invalid JSON syntax');
    }
  };

  const handleFireWebhook = () => {
    if (parseError || isFiring) return;
    setIsFiring(true);
    setActiveLog(null);
    setVisibleSteps(0);

    const { log, recoveryCase } = webhookService.ingestWebhook(selectedTemplate.event, editedPayload);

    let stepIdx = 0;
    stepsInterval.current = window.setInterval(() => {
      stepIdx++;
      setVisibleSteps(stepIdx);
      if (stepIdx >= log.steps.length) {
        clearInterval(stepsInterval.current!);
        setActiveLog(log);
        setIsFiring(false);
        setLogs(webhookService.getLogs());
        onInjectCase(recoveryCase);
      }
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-5xl bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ height: '84vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1F1F1F] shrink-0 bg-[#000000]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <Radio className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Razorpay Webhook Sandbox</h2>
              <p className="text-[11px] text-[#71717A]">Fire simulated failure events → HMAC verify → diagnose & recover</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body Split Columns */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Panel: Templates & JSON Editor */}
          <div className="flex flex-col border-r border-[#1F1F1F] w-[50%] p-5 space-y-4 overflow-hidden">
            {/* Event Template Buttons */}
            <div className="shrink-0 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                Select Event Template
              </div>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((t) => {
                  const tc = COLOR_MAP[t.color] ?? COLOR_MAP['red'];
                  const active = selectedTemplate.event === t.event;
                  return (
                    <button
                      key={t.event}
                      onClick={() => handleSelectTemplate(t)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? `${tc.badge} ${tc.ring}`
                          : 'bg-[#111111] border-[#222222] hover:border-[#333333]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{t.icon}</span>
                        <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-[#EDEDED]'}`}>{t.label}</span>
                      </div>
                      <p className="text-[10px] text-[#71717A] line-clamp-1">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* JSON Payload Editor */}
            <div className="flex flex-col flex-1 min-h-0 space-y-2">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">Payload Editor</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#161616] text-[#888888] font-mono border border-[#222222]">JSON</span>
                </div>
                {parseError ? (
                  <span className="text-[10px] text-red-400 flex items-center gap-1 font-mono">
                    <AlertTriangle className="w-3 h-3" /> {parseError}
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-mono">✓ Valid Payload</span>
                )}
              </div>

              <textarea
                className="flex-1 resize-none bg-[#020804] border border-emerald-950/70 rounded-xl p-3.5 text-[11px] text-emerald-400 font-mono focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 leading-relaxed min-h-0 selection:bg-emerald-500/30 selection:text-white"
                value={editedPayload}
                onChange={(e) => handlePayloadChange(e.target.value)}
                spellCheck={false}
              />

              {/* Action Button */}
              <button
                onClick={handleFireWebhook}
                disabled={!!parseError || isFiring}
                className={`shrink-0 w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                  parseError || isFiring
                    ? 'bg-[#181818] text-[#52525B] cursor-not-allowed border border-[#262626]'
                    : 'bg-white hover:bg-neutral-200 text-black'
                }`}
              >
                {isFiring ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Ingesting Event…</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    <span>Fire Webhook Event</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Ingestion Telemetry & Ledger Injection */}
          <div className="flex flex-col flex-1 overflow-hidden min-h-0 bg-[#070707] p-5 space-y-4">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                Live Ingestion Telemetry
              </span>
              {isFiring && (
                <span className="text-[10px] text-purple-400 font-mono animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                  Processing HMAC & Diagnostic Pipeline
                </span>
              )}
            </div>

            {/* Scrollable Telemetry Area */}
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {(isFiring || activeLog) && (
                <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 font-mono">
                      <span className={`w-2 h-2 rounded-full ${isFiring ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400'}`} />
                      <span className="text-white font-semibold">
                        {isFiring ? 'Pipeline Ingesting…' : `Completed in ${activeLog?.processingMs}ms`}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {(activeLog?.steps ?? []).slice(0, visibleSteps).map((step) => (
                      <StepRow key={step.step} step={step} />
                    ))}
                  </div>
                </div>
              )}

              {/* Success Result Card */}
              {activeLog && !isFiring && (
                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-300">
                      Injected into Live Recovery Ledger
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    {[
                      { label: 'Customer', value: activeLog.parsedCustomerName, cls: 'text-white font-medium' },
                      { label: 'Amount at Risk', value: `₹${activeLog.amountINR.toLocaleString('en-IN')}`, cls: 'text-emerald-400 font-semibold font-mono' },
                      { label: 'Risk Vector', value: activeLog.diagnosedVector, cls: 'text-white' },
                      { label: 'Intervention', value: activeLog.interventionType, cls: 'text-blue-300 font-mono text-[10px]' },
                      { label: 'Event ID', value: activeLog.eventId, cls: 'text-[#A1A1A1] font-mono text-[10px]' },
                      { label: 'HMAC Sig', value: activeLog.signatureValid ? '✓ Verified' : '✗ Invalid', cls: activeLog.signatureValid ? 'text-emerald-400 font-mono' : 'text-red-400 font-mono' },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="space-y-0.5">
                        <p className="text-[9px] uppercase font-mono text-[#71717A]">{label}</p>
                        <p className={`truncate ${cls}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 pt-2 border-t border-emerald-800/20 text-[10px] text-emerald-300/80">
                    <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>RBI & DPDP Guardrails Verified · DND Policy Active</span>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isFiring && !activeLog && (
                <div className="flex flex-col items-center justify-center h-44 space-y-2 text-center text-[#52525B]">
                  <div className="w-10 h-10 rounded-xl bg-[#111111] border border-[#222222] flex items-center justify-center text-[#71717A]">
                    <Radio className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-[#A1A1A1] font-medium">Sandbox Ready</p>
                  <p className="text-[11px] text-[#71717A] max-w-xs">
                    Select an event template, modify the payload if needed, then click <strong className="text-white">Fire Webhook Event</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Ingestion History */}
            {logs.length > 0 && (
              <div className="shrink-0 border-t border-[#1F1F1F] pt-3 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                  Ingestion History ({logs.length})
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <LogBadge key={log.id} log={log} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
