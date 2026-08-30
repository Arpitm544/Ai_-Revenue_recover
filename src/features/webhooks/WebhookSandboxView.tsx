import React, { useState, useEffect, useRef } from 'react';
import { Zap, CheckCircle2, AlertTriangle, Check } from 'lucide-react';
import type { RecoveryCase } from '../recovery/types';
import type { WebhookIngestionLog, WebhookTemplate, WebhookStep } from './types';
import { WebhookService } from './WebhookService';
import { useTheme } from '../../shared/ThemeContext';

interface WebhookSandboxViewProps {
  onInjectCase: (newCase: RecoveryCase) => void;
  webhookService: WebhookService;
}

const COLOR_MAP: Record<string, { badge: string; text: string }> = {
  red:    { badge: 'bg-red-950/40 border-red-800/50 text-red-300', text: 'text-red-400' },
  amber:  { badge: 'bg-amber-950/40 border-amber-800/50 text-amber-300', text: 'text-amber-400' },
  orange: { badge: 'bg-orange-950/40 border-orange-800/50 text-orange-300', text: 'text-orange-400' },
  purple: { badge: 'bg-purple-950/40 border-purple-800/50 text-purple-300', text: 'text-purple-400' },
};

function StepRow({ step, isDark }: { step: WebhookStep; isDark: boolean }) {
  return (
    <div className="flex items-start gap-2.5 animate-in fade-in slide-in-from-left duration-200">
      <div className={`mt-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 border ${
        step.status === 'OK' 
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
          : 'bg-red-500/10 border-red-500/40 text-red-400'
      }`}>
        {step.status === 'OK'
          ? <Check className="w-2.5 h-2.5" />
          : <AlertTriangle className="w-2.5 h-2.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>{step.label}</span>
          <span className={`text-[10px] font-mono shrink-0 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>{step.durationMs}ms</span>
        </div>
        <p className={`text-[10px] font-mono truncate mt-0.5 ${isDark ? 'text-[#A1A1A1]' : 'text-neutral-600'}`}>{step.detail}</p>
      </div>
    </div>
  );
}

export const WebhookSandboxView: React.FC<WebhookSandboxViewProps> = ({
  webhookService,
  onInjectCase,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
    setLogs(webhookService.getLogs());
  }, [webhookService]);

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

  return (
    <div className="space-y-5 h-full overflow-y-auto pr-1">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Webhook Sandbox & Live Ingestion Engine
            </h2>
            <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
              isDark ? 'bg-purple-950/50 text-purple-300 border border-purple-800/40' : 'bg-purple-50 text-purple-800 border border-purple-200 font-semibold'
            }`}>
              HMAC-SHA256 Telemetry
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            Simulate incoming Razorpay webhooks, inspect payload verification, and stream auto-created recovery cases
          </p>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Template Picker & Payload Editor */}
        <div className="lg:col-span-7 space-y-4">
          {/* Template Selector Cards */}
          <div className="space-y-2">
            <label className={`text-[11px] font-mono uppercase tracking-wider block ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              Select Event Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => {
                const isSelected = selectedTemplate.event === t.event;
                const colors = COLOR_MAP[t.color] || COLOR_MAP.purple;
                return (
                  <button
                    key={t.event}
                    onClick={() => handleSelectTemplate(t)}
                    className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? isDark 
                          ? 'bg-[#141414] border-white text-white' 
                          : 'bg-neutral-100 border-black text-black'
                        : isDark
                          ? 'bg-[#0A0A0A] border-[#1F1F1F] text-[#A1A1A1] hover:border-[#333333]'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${colors.badge}`}>
                          {t.event.split('.')[1]}
                        </span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </div>
                      <div className={`text-xs font-semibold ${isSelected ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-[#EDEDED]' : 'text-neutral-800')}`}>
                        {t.label}
                      </div>
                    </div>
                    <p className={`text-[10px] mt-1 line-clamp-1 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>{t.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* JSON Payload Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                JSON Payload Editor
              </label>
              {parseError ? (
                <span className="text-[10px] text-red-400 font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {parseError}
                </span>
              ) : (
                <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid JSON
                </span>
              )}
            </div>

            <textarea
              value={editedPayload}
              onChange={(e) => handlePayloadChange(e.target.value)}
              rows={12}
              className={`w-full p-3.5 rounded-xl font-mono text-xs focus:outline-none transition-colors border text-emerald-400 bg-[#020804] border-emerald-950/70 focus:border-emerald-800`}
              spellCheck={false}
            />

            {/* Fire Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <span className={`text-[11px] font-mono ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                Target: <code className="text-emerald-500">/api/v1/webhooks/razorpay</code>
              </span>

              <button
                onClick={handleFireWebhook}
                disabled={!!parseError || isFiring}
                className={`flex items-center space-x-2 px-5 py-2.5 font-semibold text-xs rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] cursor-pointer shadow-md ${
                  isFiring
                    ? 'bg-purple-950/50 text-purple-300 border border-purple-800 animate-pulse'
                    : isDark
                    ? 'bg-white hover:bg-neutral-200 text-black'
                    : 'bg-black hover:bg-neutral-800 text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{isFiring ? 'Simulating Ingestion...' : 'Fire Webhook Event'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Pipeline Trace & Ingested Ledger */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Ingestion Pipeline Trace */}
          <div className={`p-4 rounded-xl border transition-colors ${
            isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
          }`}>
            <span className={`text-[10px] uppercase font-mono tracking-wider block mb-3 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              Pipeline Execution Trace
            </span>

            {isFiring || activeLog ? (
              <div className="space-y-3">
                {activeLog?.steps.slice(0, visibleSteps).map((step, idx) => (
                  <StepRow key={idx} step={step} isDark={isDark} />
                ))}

                {activeLog && !isFiring && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                      <span>✓ Ingestion Completed</span>
                      <span className="font-mono text-[10px]">{activeLog.processingMs}ms total</span>
                    </div>
                    <p className="text-[11px] text-[#D4D4D8] leading-relaxed font-mono">
                      Injected case for <strong>{activeLog.parsedCustomerName}</strong> (₹{activeLog.amountINR.toLocaleString('en-IN')}) into live CRM table.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className={`text-center py-10 text-xs font-mono ${isDark ? 'text-[#52525B]' : 'text-neutral-400'}`}>
                Select a template and click "Fire Webhook Event" to view the live signature verification and diagnosis pipeline.
              </div>
            )}
          </div>

          {/* Ingestion History Ledger */}
          <div className={`p-4 rounded-xl border transition-colors ${
            isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
          }`}>
            <span className={`text-[10px] uppercase font-mono tracking-wider block mb-2 ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              Recent Webhook Events ({logs.length})
            </span>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {logs.length === 0 ? (
                <p className={`text-xs ${isDark ? 'text-[#52525B]' : 'text-neutral-400'}`}>No events logged yet.</p>
              ) : (
                logs.slice(0, 5).map((log) => (
                  <div key={log.id} className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#111111] border-[#222222]' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{log.parsedCustomerName}</div>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>{log.event}</span>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-emerald-500 font-semibold">₹{log.amountINR.toLocaleString('en-IN')}</div>
                      <span className={`text-[10px] ${isDark ? 'text-[#71717A]' : 'text-neutral-400'}`}>{log.processingMs}ms</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
