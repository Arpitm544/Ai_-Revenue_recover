import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, CheckCircle2, AlertTriangle, Shield, Radio } from 'lucide-react';
import type { RecoveryCase } from '../types/recovery';
import type { WebhookIngestionLog, WebhookTemplate, WebhookStep } from '../types/webhook';
import { WebhookService } from '../services/webhookService';

interface WebhookSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookService: WebhookService;
  onInjectCase: (newCase: RecoveryCase) => void;
}

const COLOR_MAP: Record<string, { badge: string; ring: string; text: string; dot: string }> = {
  red:    { badge: 'bg-red-950/60 border-red-500/50 text-red-200',       ring: 'ring-red-500/50',    text: 'text-red-400',    dot: 'bg-red-400' },
  amber:  { badge: 'bg-amber-950/60 border-amber-500/50 text-amber-200', ring: 'ring-amber-500/50',  text: 'text-amber-400',  dot: 'bg-amber-400' },
  orange: { badge: 'bg-orange-950/60 border-orange-500/50 text-orange-200', ring: 'ring-orange-500/50', text: 'text-orange-400', dot: 'bg-orange-400' },
  purple: { badge: 'bg-purple-950/60 border-purple-500/50 text-purple-200', ring: 'ring-purple-500/50', text: 'text-purple-400', dot: 'bg-purple-400' },
};

const EVENT_COLORS: Record<string, string> = {
  'payment.failed':      'bg-red-900/40 text-red-300 border-red-700/50',
  'subscription.halted': 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  'order.abandoned':     'bg-orange-900/40 text-orange-300 border-orange-700/50',
  'invoice.expired':     'bg-purple-900/40 text-purple-300 border-purple-700/50',
};

function StepRow({ step }: { step: WebhookStep }) {
  return (
    <div className="flex items-start gap-3 animate-[fadeInLeft_0.3s_ease_forwards]">
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${step.status === 'OK' ? 'bg-emerald-500/20 border-emerald-500/60' : 'bg-red-500/20 border-red-500/60'}`}>
        {step.status === 'OK'
          ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          : <AlertTriangle className="w-3 h-3 text-red-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-100">{step.label}</span>
          <span className="text-[10px] text-slate-500 font-mono shrink-0">{step.durationMs}ms</span>
        </div>
        <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{step.detail}</p>
      </div>
    </div>
  );
}

function LogBadge({ log }: { log: WebhookIngestionLog }) {
  return (
    <div className="p-3 bg-slate-800/50 border border-slate-700/40 rounded-xl space-y-1.5 hover:bg-slate-800 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${EVENT_COLORS[log.event] ?? 'bg-slate-700 text-slate-300'}`}>
          {log.event}
        </span>
        <span className="text-[10px] text-emerald-400 font-bold">₹{log.amountINR.toLocaleString('en-IN')}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white font-medium truncate">{log.parsedCustomerName}</span>
        <span className="text-[10px] text-slate-500 font-mono">{log.processingMs}ms</span>
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
      setParseError('Invalid JSON');
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
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="relative w-full bg-[#0d1117] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxWidth: '960px', height: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
              <Radio className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Razorpay Webhook Ingestion Sandbox</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Fire live events → HMAC verify → diagnose → recover. Real-time.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body (two columns) ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── LEFT PANEL ── */}
          <div className="flex flex-col border-r border-slate-800" style={{ width: '48%' }}>

            {/* Event Template Picker */}
            <div className="px-5 pt-5 pb-3 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Select Webhook Event</p>
              <div className="grid grid-cols-2 gap-2.5">
                {templates.map((t) => {
                  const tc = COLOR_MAP[t.color] ?? COLOR_MAP['red'];
                  const active = selectedTemplate.event === t.event;
                  return (
                    <button
                      key={t.event}
                      onClick={() => handleSelectTemplate(t)}
                      className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                        active
                          ? `${tc.badge} ring-1 ${tc.ring}`
                          : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 hover:border-slate-600/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg leading-none">{t.icon}</span>
                        <span className={`text-[11px] font-bold leading-tight ${active ? tc.text : 'text-slate-200'}`}>{t.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-slate-800 shrink-0" />

            {/* Payload Editor — fills remaining height */}
            <div className="flex flex-col flex-1 px-5 pt-3 pb-5 min-h-0 gap-2">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payload Editor</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">JSON</span>
                </div>
                {parseError
                  ? <span className="text-[10px] text-red-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{parseError}</span>
                  : <span className="text-[10px] text-emerald-500 font-medium">✓ Valid JSON</span>
                }
              </div>

              {/* Textarea fills remaining space */}
              <textarea
                className="flex-1 resize-none bg-slate-950 border border-slate-700/50 rounded-xl p-3 text-[11px] text-emerald-300 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50 leading-relaxed min-h-0"
                value={editedPayload}
                onChange={(e) => handlePayloadChange(e.target.value)}
                spellCheck={false}
              />

              {/* Fire Webhook Button */}
              <button
                onClick={handleFireWebhook}
                disabled={!!parseError || isFiring}
                className={`shrink-0 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  parseError || isFiring
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-700/30'
                }`}
              >
                {isFiring
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Ingesting…</>
                  : <><Zap className="w-4 h-4" /> Fire Webhook</>
                }
              </button>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">

            {/* Telemetry area — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-3 space-y-4 min-h-0">
              <div className="flex items-center justify-between shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Ingestion Telemetry</p>
                {isFiring && (
                  <span className="text-[10px] text-blue-400 font-semibold animate-pulse flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" /> Processing
                  </span>
                )}
              </div>

              {/* Active Steps Panel */}
              {(isFiring || activeLog) && (
                <div className="bg-slate-950/70 border border-slate-700/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isFiring ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      {isFiring ? 'Ingesting…' : `Completed in ${activeLog?.processingMs}ms`}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {(activeLog?.steps ?? []).slice(0, visibleSteps).map((step) => (
                      <StepRow key={step.step} step={step} />
                    ))}
                  </div>
                </div>
              )}

              {/* Success Summary Card */}
              {activeLog && !isFiring && (
                <div className="bg-emerald-950/30 border border-emerald-500/25 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-300">Case Injected into Recovery Ledger</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px]">
                    {[
                      { label: 'Customer', value: activeLog.parsedCustomerName, cls: 'text-white font-semibold' },
                      { label: 'Amount at Risk', value: `₹${activeLog.amountINR.toLocaleString('en-IN')}`, cls: 'text-emerald-400 font-bold' },
                      { label: 'Risk Vector', value: activeLog.diagnosedVector, cls: 'text-white' },
                      { label: 'Intervention', value: activeLog.interventionType, cls: 'text-blue-400' },
                      { label: 'Event ID', value: activeLog.eventId, cls: 'text-slate-400 font-mono text-[10px]' },
                      { label: 'HMAC Sig', value: activeLog.signatureValid ? '✓ Verified' : '✗ Invalid', cls: activeLog.signatureValid ? 'text-emerald-400' : 'text-red-400' },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="space-y-0.5">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">{label}</p>
                        <p className={`truncate ${cls}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-emerald-500/10">
                    <Shield className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] text-blue-300">RBI/DPDP Compliance Cleared · DND respected · Touchpoints within limits</span>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!isFiring && !activeLog && (
                <div className="flex flex-col items-center justify-center h-48 space-y-3 text-slate-700">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-500">Sandbox Ready</p>
                    <p className="text-[10px] text-slate-600 max-w-xs">Pick an event template, tweak the JSON payload,<br /> then click <span className="text-slate-400 font-semibold">Fire Webhook</span> to simulate ingestion.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Ingestion History — fixed at bottom */}
            {logs.length > 0 && (
              <div className="shrink-0 border-t border-slate-800 px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Ingestion History <span className="text-slate-600">({logs.length})</span>
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
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
