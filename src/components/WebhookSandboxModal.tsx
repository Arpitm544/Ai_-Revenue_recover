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

const COLOR_MAP: Record<string, { badge: string; ring: string; text: string; glow: string }> = {
  red:    { badge: 'bg-red-900/40 border-red-500/40 text-red-300',     ring: 'ring-red-500/60',    text: 'text-red-400',    glow: 'shadow-red-500/20' },
  amber:  { badge: 'bg-amber-900/40 border-amber-500/40 text-amber-300', ring: 'ring-amber-500/60', text: 'text-amber-400',  glow: 'shadow-amber-500/20' },
  orange: { badge: 'bg-orange-900/40 border-orange-500/40 text-orange-300', ring: 'ring-orange-500/60', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  purple: { badge: 'bg-purple-900/40 border-purple-500/40 text-purple-300', ring: 'ring-purple-500/60', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
};

function StepRow({ step, visible }: { step: WebhookStep; visible: boolean }) {
  return (
    <div className={`flex items-start gap-3 transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.status === 'OK' ? 'bg-emerald-500/20 border border-emerald-500/60' : 'bg-red-500/20 border border-red-500/60'}`}>
        {step.status === 'OK'
          ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          : <AlertTriangle className="w-3 h-3 text-red-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-white">{step.label}</span>
          <span className="text-[10px] text-slate-500 shrink-0">{step.durationMs}ms</span>
        </div>
        <p className="text-[10px] text-slate-400 font-mono truncate">{step.detail}</p>
      </div>
    </div>
  );
}

function LogBadge({ log }: { log: WebhookIngestionLog }) {
  const eventColors: Record<string, string> = {
    'payment.failed':      'bg-red-900/40 text-red-300 border-red-700/40',
    'subscription.halted': 'bg-amber-900/40 text-amber-300 border-amber-700/40',
    'order.abandoned':     'bg-orange-900/40 text-orange-300 border-orange-700/40',
    'invoice.expired':     'bg-purple-900/40 text-purple-300 border-purple-700/40',
  };
  return (
    <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${eventColors[log.event] ?? 'bg-slate-700 text-slate-300'}`}>
          {log.event}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">{log.processingMs}ms</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white font-medium truncate">{log.parsedCustomerName}</span>
        <span className="text-xs text-emerald-400 font-bold shrink-0">₹{log.amountINR.toLocaleString('en-IN')}</span>
      </div>
      <p className="text-[10px] text-slate-400 font-mono">{log.eventId}</p>
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
  };

  const handlePayloadChange = (val: string) => {
    setEditedPayload(val);
    try {
      JSON.parse(val);
      setParseError('');
    } catch {
      setParseError('Invalid JSON — please fix before firing');
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
    }, 280);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Radio className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Razorpay Webhook Ingestion Sandbox</h2>
              <p className="text-[10px] text-slate-400">Fire live webhook events and watch RevGuard AI ingest, verify, and recover in real-time</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left: Template Picker + JSON Editor */}
          <div className="w-1/2 flex flex-col border-r border-slate-800 overflow-hidden">
            {/* Event Templates */}
            <div className="px-4 pt-4 pb-3 space-y-2 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Select Webhook Event</p>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((t) => {
                  const c = COLOR_MAP[t.color] ?? COLOR_MAP['red'];
                  const active = selectedTemplate.event === t.event;
                  return (
                    <button
                      key={t.event}
                      onClick={() => handleSelectTemplate(t)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${active ? `${c.badge} ring-1 ${c.ring}` : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-base">{t.icon}</span>
                        <span className={`text-[10px] font-bold ${active ? c.text : 'text-slate-300'}`}>{t.label}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* JSON Editor */}
            <div className="flex-1 px-4 pb-4 flex flex-col min-h-0 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payload Editor</p>
                {parseError && (
                  <span className="text-[10px] text-red-400 font-medium">{parseError}</span>
                )}
              </div>
              <div className="flex-1 relative min-h-0">
                <textarea
                  className="absolute inset-0 w-full h-full resize-none bg-slate-950 border border-slate-700/60 rounded-xl p-3 text-[11px] text-emerald-300 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/60 leading-relaxed"
                  value={editedPayload}
                  onChange={(e) => handlePayloadChange(e.target.value)}
                  spellCheck={false}
                />
              </div>

              {/* Fire Button */}
              <button
                onClick={handleFireWebhook}
                disabled={!!parseError || isFiring}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer
                  ${parseError || isFiring
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40'
                  }`}
              >
                {isFiring ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                ) : (
                  <><Zap className="w-4 h-4" /> Fire Webhook</>
                )}
              </button>
            </div>
          </div>

          {/* Right: Telemetry + Logs */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            {/* Live Telemetry Panel */}
            <div className="flex-1 px-4 pt-4 overflow-y-auto min-h-0 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0">Live Ingestion Telemetry</p>

              {/* Steps */}
              {(isFiring || activeLog) && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${isFiring ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      {isFiring ? 'Ingesting…' : `Completed in ${activeLog?.processingMs}ms`}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {(activeLog?.steps ?? []).slice(0, visibleSteps).map((step) => (
                      <StepRow key={step.step} step={step} visible={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* Success Summary */}
              {activeLog && !isFiring && (
                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300">Case Injected into Recovery Ledger</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="space-y-0.5">
                      <p className="text-slate-500 uppercase tracking-wider">Customer</p>
                      <p className="text-white font-semibold">{activeLog.parsedCustomerName}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-slate-500 uppercase tracking-wider">Amount at Risk</p>
                      <p className="text-emerald-400 font-bold">₹{activeLog.amountINR.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-slate-500 uppercase tracking-wider">Vector</p>
                      <p className="text-white font-semibold">{activeLog.diagnosedVector}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-slate-500 uppercase tracking-wider">Intervention</p>
                      <p className="text-blue-400 font-semibold">{activeLog.interventionType}</p>
                    </div>
                    <div className="col-span-2 space-y-0.5">
                      <p className="text-slate-500 uppercase tracking-wider">HMAC Signature</p>
                      <p className="text-slate-300 font-mono text-[9px] truncate">{activeLog.signatureValid ? '✓ Valid' : '✗ Invalid'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] text-blue-300">RBI/DPDP Compliance: Cleared</span>
                  </div>
                </div>
              )}

              {!isFiring && !activeLog && (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 text-slate-600">
                  <Radio className="w-8 h-8" />
                  <p className="text-xs text-center">Select a webhook template, optionally edit the JSON payload,<br />then click <strong className="text-slate-400">Fire Webhook</strong> to start.</p>
                </div>
              )}
            </div>

            {/* Ingestion History Log */}
            {logs.length > 0 && (
              <div className="px-4 pb-4 border-t border-slate-800 pt-3 shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Ingestion History ({logs.length})</p>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
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
