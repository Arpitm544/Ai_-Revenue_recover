import type { RecoveryCase, FailureCategory, ActionChannel } from '../recovery/types';
import type {
  RazorpayWebhookEvent,
  RazorpayWebhookPayload,
  WebhookIngestionLog,
  WebhookStep,
  WebhookTemplate,
} from './types';

// ─── HMAC Signature Simulator ────────────────────────────────────────────────
function simulateHmacVerification(): { valid: boolean; hash: string } {
  const chars = 'abcdef0123456789';
  const hash = Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return { valid: true, hash };
}

// ─── Payload → RecoveryCase Transformer ──────────────────────────────────────
function webhookToRecoveryCase(payload: RazorpayWebhookPayload): RecoveryCase {
  const id = `rzp_wh_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  if (payload.event === 'payment.failed') {
    const p = payload.payload?.payment?.entity ?? ({} as any);
    const amountVal = typeof p.amount === 'number' && p.amount > 0 ? Math.round(p.amount / 100) : 1499;
    const category: FailureCategory = p.error_code?.includes('TIMEOUT') ? 'TECHNICAL_TIMEOUT' : 'SOFT_DECLINE';
    const channel: ActionChannel = 'HINGLISH_VOICE_CALL';
    return {
      id,
      paymentId: p.id ?? `pay_${id}`,
      customerName: p.notes?.customer_name ?? 'Unknown Customer',
      customerPhone: p.contact ?? '+919876543210',
      customerEmail: p.email ?? 'customer@example.com',
      preferredLanguage: 'Hinglish',
      amountAtRisk: amountVal,
      currency: 'INR',
      leakVector: 'SUBSCRIPTION_FAIL',
      status: 'DETECTED',
      failureCategory: category,
      failureCode: p.error_code ?? 'PAYMENT_FAILED',
      failureReason: p.error_description ?? 'Payment soft decline by bank',
      issuingBank: p.bank ?? 'HDFC',
      attemptsCount: 0,
      maxAttemptsAllowed: 3,
      recommendedChannel: channel,
      interventionReasoning: `Webhook: payment.failed — ${p.error_description ?? 'Payment decline'}`,
      totalAmountRecovered: 0,
      discountOfferedPct: 0,
      bankDowntimeDetected: false,
      createdAt: now,
      updatedAt: now,
      auditTrail: [
        {
          id: `aud_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: now,
          actor: 'RISK_ENGINE',
          action: 'PAYMENT_FAILED_RECEIVED',
          details: `Razorpay webhook: payment.failed — ${p.error_description ?? 'Soft decline'}`,
          complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true },
        },
      ],
    };
  }

  if (payload.event === 'subscription.halted') {
    const s = payload.payload?.subscription?.entity ?? ({} as any);
    const pmt = payload.payload?.payment?.entity;
    const pmtAmount = typeof pmt?.amount === 'number' && pmt.amount > 0 ? Math.round(pmt.amount / 100) : 1499;
    const channel: ActionChannel = 'SMART_MANDATE_RETRY';
    return {
      id,
      paymentId: pmt?.id ?? `pay_${id}`,
      customerName: s.notes?.customer_name ?? 'Unknown Customer',
      customerPhone: s.notes?.customer_phone ?? '+919988776655',
      customerEmail: '',
      preferredLanguage: 'Hinglish',
      amountAtRisk: pmtAmount,
      currency: 'INR',
      leakVector: 'SUBSCRIPTION_FAIL',
      status: 'DETECTED',
      failureCategory: 'SOFT_DECLINE',
      failureCode: pmt?.error_code ?? 'EMANDATE_FAIL',
      failureReason: pmt?.error_description ?? 'eMandate debit failed',
      issuingBank: 'HDFC',
      attemptsCount: 0,
      maxAttemptsAllowed: 3,
      recommendedChannel: channel,
      interventionReasoning: `Webhook: subscription.halted — ${s.payment_method ?? 'eMandate'} mandate failed`,
      totalAmountRecovered: 0,
      discountOfferedPct: 0,
      bankDowntimeDetected: false,
      createdAt: now,
      updatedAt: now,
      auditTrail: [
        {
          id: `aud_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: now,
          actor: 'RISK_ENGINE',
          action: 'SUBSCRIPTION_HALTED_RECEIVED',
          details: `Razorpay webhook: subscription.halted — ${s.payment_method ?? 'eMandate'} mandate failed`,
          complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true },
        },
      ],
    };
  }

  if (payload.event === 'order.abandoned') {
    const o = payload.payload?.order?.entity ?? ({} as any);
    const amountVal = typeof o.amount === 'number' && o.amount > 0 ? Math.round(o.amount / 100) : 2999;
    const channel: ActionChannel = 'WHATSAPP_UPI_LINK';
    return {
      id,
      paymentId: o.id ?? `order_${id}`,
      customerName: o.notes?.customer_name ?? 'Unknown Customer',
      customerPhone: o.notes?.customer_phone ?? '+919123456789',
      customerEmail: '',
      preferredLanguage: 'Hinglish',
      amountAtRisk: amountVal,
      currency: 'INR',
      leakVector: 'CHECKOUT_ABANDON',
      status: 'DETECTED',
      failureCategory: 'INTENT_LOSS',
      failureCode: 'CHECKOUT_ABANDONED',
      failureReason: `Cart abandoned after ${o.attempts ?? 1} attempt(s). Product: ${o.notes?.product ?? 'Premium Plan'}`,
      issuingBank: 'N/A',
      attemptsCount: 0,
      maxAttemptsAllowed: 2,
      recommendedChannel: channel,
      interventionReasoning: `Webhook: order.abandoned — ₹${amountVal.toLocaleString('en-IN')} cart drop-off`,
      totalAmountRecovered: 0,
      discountOfferedPct: 5,
      bankDowntimeDetected: false,
      createdAt: now,
      updatedAt: now,
      auditTrail: [
        {
          id: `aud_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: now,
          actor: 'RISK_ENGINE',
          action: 'ORDER_ABANDONED_RECEIVED',
          details: `Razorpay webhook: order.abandoned — ₹${amountVal.toLocaleString('en-IN')} cart drop-off`,
          complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true },
        },
      ],
    };
  }

  // invoice.expired
  const inv = (payload as any).payload?.invoice?.entity ?? ({} as any);
  const grossVal = typeof inv.gross_amount === 'number' && inv.gross_amount > 0 ? Math.round(inv.gross_amount / 100) : 45000;
  const channel: ActionChannel = 'WHATSAPP_UPI_LINK';
  return {
    id,
    paymentId: inv.id ?? `inv_${id}`,
    customerName: inv.customer_details?.name ?? 'Enterprise Client',
    customerPhone: inv.customer_details?.contact ?? '+918000112233',
    customerEmail: inv.customer_details?.email ?? 'accounts@enterprise.com',
    preferredLanguage: 'English',
    amountAtRisk: grossVal,
    currency: 'INR',
    leakVector: 'B2B_INVOICE',
    status: 'DETECTED',
    failureCategory: 'TECHNICAL_TIMEOUT',
    failureCode: 'INVOICE_EXPIRED',
    failureReason: `Invoice expired: ${inv.description ?? 'Overdue enterprise receivable'}`,
    issuingBank: 'N/A',
    attemptsCount: 0,
    maxAttemptsAllowed: 3,
    recommendedChannel: channel,
    interventionReasoning: `Webhook: invoice.expired — ₹${grossVal.toLocaleString('en-IN')} B2B receivable`,
    totalAmountRecovered: 0,
    discountOfferedPct: 0,
    bankDowntimeDetected: false,
    createdAt: now,
    updatedAt: now,
    auditTrail: [
      {
        id: `aud_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now,
        actor: 'RISK_ENGINE',
        action: 'INVOICE_EXPIRED_RECEIVED',
        details: `Razorpay webhook: invoice.expired — ₹${grossVal.toLocaleString('en-IN')} B2B receivable`,
        complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true },
      },
    ],
  };
}

// ─── Ingestion Telemetry Builder ──────────────────────────────────────────────
function buildIngestionSteps(
  signatureHash: string,
  vector: string,
  intervention: string,
): { steps: WebhookStep[]; totalMs: number } {
  const steps: WebhookStep[] = [
    { step: 1, label: 'HTTP 200 OK Received', detail: `POST /webhooks/razorpay — Content-Type: application/json`, status: 'OK', durationMs: 12 },
    { step: 2, label: 'HMAC-SHA256 Verified', detail: `X-Razorpay-Signature: ${signatureHash.substring(0, 16)}…`, status: 'OK', durationMs: 28 },
    { step: 3, label: 'Risk Vector Diagnosed', detail: `Leak vector classified as ${vector}`, status: 'OK', durationMs: 47 },
    { step: 4, label: 'RBI/DPDP Compliance Cleared', detail: 'DND hours respected · Max touchpoints not exceeded · No dispute flag', status: 'OK', durationMs: 35 },
    { step: 5, label: 'Intervention Dispatched', detail: `Strategy: ${intervention} · Case injected into recovery ledger`, status: 'OK', durationMs: 18 },
  ];
  const totalMs = steps.reduce((acc, s) => acc + s.durationMs, 0);
  return { steps, totalMs };
}

// ─── Webhook Templates ────────────────────────────────────────────────────────
export const WEBHOOK_TEMPLATES: WebhookTemplate[] = [
  {
    event: 'payment.failed',
    label: 'Payment Failed',
    icon: '💳',
    description: 'Card/UPI/Netbanking hard or soft decline',
    color: 'red',
    payload: {
      event: 'payment.failed',
      account_id: 'acc_razorpay_demo',
      entity: 'event',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: 'pay_PmhXDnAbcde1234',
            entity: 'payment',
            amount: 149900,
            currency: 'INR',
            status: 'failed',
            method: 'upi',
            error_code: 'BAD_REQUEST_PAYMENT_DECLINED_BY_BANK_DUE_TO_INSUFFICIENT_FUNDS',
            error_description: 'Payment failed due to insufficient funds in linked bank account',
            error_source: 'customer',
            bank: 'HDFC',
            vpa: 'rohit.sharma@okaxis',
            contact: '+919876543210',
            email: 'rohit.sharma@example.com',
            notes: { customer_name: 'Rohit Sharma' },
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      },
    },
  },
  {
    event: 'subscription.halted',
    label: 'Subscription Halted',
    icon: '🔄',
    description: 'UPI AutoPay mandate debit failed',
    color: 'amber',
    payload: {
      event: 'subscription.halted',
      account_id: 'acc_razorpay_demo',
      entity: 'event',
      contains: ['subscription'],
      payload: {
        subscription: {
          entity: {
            id: 'sub_Qn7GhKlmnop5678',
            entity: 'subscription',
            plan_id: 'plan_premium_monthly',
            status: 'halted',
            paid_count: 4,
            payment_method: 'upi_autopay',
            charge_at: Math.floor(Date.now() / 1000),
            notes: { customer_name: 'Priya Patel', customer_phone: '+919988776655' },
            created_at: Math.floor(Date.now() / 1000) - 7776000,
            current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          },
        },
        payment: {
          entity: {
            id: 'pay_Rr9StUvwxy6789',
            amount: 49900,
            status: 'failed',
            error_code: 'BAD_REQUEST_EMANDATE_DEBIT_FAILED_INSUFFICIENT_BALANCE',
            error_description: 'eMandate debit failed due to insufficient balance in bank account',
          },
        },
      },
    },
  },
  {
    event: 'order.abandoned',
    label: 'Order Abandoned',
    icon: '🛒',
    description: 'High-intent checkout cart drop-off',
    color: 'orange',
    payload: {
      event: 'order.abandoned',
      account_id: 'acc_razorpay_demo',
      entity: 'event',
      contains: ['order'],
      payload: {
        order: {
          entity: {
            id: 'order_AnkitPremium001',
            entity: 'order',
            amount: 299900,
            currency: 'INR',
            status: 'abandoned',
            receipt: 'rcpt_2024_Q3_001',
            notes: { customer_name: 'Ankit Verma', customer_phone: '+919123456789', product: 'Premium Annual Plan' },
            created_at: Math.floor(Date.now() / 1000),
            attempts: 1,
          },
        },
      },
    },
  },
  {
    event: 'invoice.expired',
    label: 'Invoice Expired',
    icon: '📄',
    description: 'B2B enterprise invoice past due date',
    color: 'purple',
    payload: {
      event: 'invoice.expired',
      account_id: 'acc_razorpay_demo',
      entity: 'event',
      contains: ['invoice'],
      payload: {
        invoice: {
          entity: {
            id: 'inv_TechCorpQ3_2024',
            entity: 'invoice',
            type: 'invoice',
            status: 'expired',
            customer_id: 'cust_enterprise_001',
            customer_details: {
              name: 'TechCorp Solutions Pvt. Ltd.',
              contact: '+918000112233',
              email: 'accounts@techcorp.in',
              gstin: '27AABCT1234F1Z5',
            },
            gross_amount: 4500000,
            date: Math.floor(Date.now() / 1000) - 1296000,
            due_by: Math.floor(Date.now() / 1000) - 86400,
            description: 'Enterprise SaaS License Q3 — Platform + API Access',
          },
        },
      },
    },
  },
];

// ─── WebhookService Class ─────────────────────────────────────────────────────
export class WebhookService {
  private logs: WebhookIngestionLog[] = [];

  getLogs(): WebhookIngestionLog[] {
    return [...this.logs].reverse();
  }

  ingestWebhook(
    event: RazorpayWebhookEvent,
    rawPayload: string,
  ): { log: WebhookIngestionLog; recoveryCase: RecoveryCase } {
    const parsed: RazorpayWebhookPayload = JSON.parse(rawPayload);
    const { valid, hash } = simulateHmacVerification();
    const recoveryCase = webhookToRecoveryCase(parsed);
    const { steps, totalMs } = buildIngestionSteps(hash, recoveryCase.leakVector, recoveryCase.recommendedChannel);

    const log: WebhookIngestionLog = {
      id: `wh_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      event,
      eventId: `evt_${Math.random().toString(36).substring(2, 11)}`,
      signatureValid: valid,
      rawPayload,
      parsedCustomerName: recoveryCase.customerName,
      amountINR: recoveryCase.amountAtRisk,
      diagnosedVector: recoveryCase.leakVector,
      complianceCleared: true,
      interventionType: recoveryCase.recommendedChannel,
      status: 'DISPATCHED',
      processingMs: totalMs,
      steps,
    };

    this.logs.push(log);
    return { log, recoveryCase };
  }

  getTemplates(): WebhookTemplate[] {
    return WEBHOOK_TEMPLATES;
  }
}
