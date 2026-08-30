export type RazorpayWebhookEvent =
  | 'payment.failed'
  | 'subscription.halted'
  | 'order.abandoned'
  | 'invoice.expired';

export type WebhookIngestionStatus =
  | 'PENDING'
  | 'SIGNATURE_VERIFIED'
  | 'PARSED'
  | 'COMPLIANCE_CHECKED'
  | 'DISPATCHED'
  | 'FAILED';

export interface WebhookHeaders {
  'X-Razorpay-Signature': string;
  'X-Razorpay-Event-Id': string;
  'Content-Type': 'application/json';
}

export interface RazorpayPaymentFailedPayload {
  event: 'payment.failed';
  account_id: string;
  entity: 'event';
  contains: ['payment'];
  payload: {
    payment: {
      entity: {
        id: string;
        entity: 'payment';
        amount: number;
        currency: 'INR';
        status: 'failed';
        method: 'upi' | 'card' | 'netbanking';
        error_code: string;
        error_description: string;
        error_source: string;
        bank: string;
        vpa?: string;
        contact: string;
        email: string;
        notes: { customer_name?: string };
        created_at: number;
      };
    };
  };
}

export interface RazorpaySubscriptionHaltedPayload {
  event: 'subscription.halted';
  account_id: string;
  entity: 'event';
  contains: ['subscription'];
  payload: {
    subscription: {
      entity: {
        id: string;
        entity: 'subscription';
        plan_id: string;
        status: 'halted';
        paid_count: number;
        payment_method: 'emandate' | 'upi_autopay';
        charge_at: number;
        notes: { customer_name?: string; customer_phone?: string };
        created_at: number;
        current_period_end: number;
      };
    };
    payment?: {
      entity: {
        id: string;
        amount: number;
        status: 'failed';
        error_code: string;
        error_description: string;
      };
    };
  };
}

export interface RazorpayOrderAbandonedPayload {
  event: 'order.abandoned';
  account_id: string;
  entity: 'event';
  contains: ['order'];
  payload: {
    order: {
      entity: {
        id: string;
        entity: 'order';
        amount: number;
        currency: 'INR';
        status: 'abandoned';
        receipt: string;
        notes: { customer_name?: string; customer_phone?: string; product?: string };
        created_at: number;
        attempts: number;
      };
    };
  };
}

export interface RazorpayInvoiceExpiredPayload {
  event: 'invoice.expired';
  account_id: string;
  entity: 'event';
  contains: ['invoice'];
  payload: {
    invoice: {
      entity: {
        id: string;
        entity: 'invoice';
        type: 'invoice';
        status: 'expired';
        customer_id: string;
        customer_details: { name?: string; contact?: string; email?: string; gstin?: string };
        gross_amount: number;
        date: number;
        due_by: number;
        description: string;
      };
    };
  };
}

export type RazorpayWebhookPayload =
  | RazorpayPaymentFailedPayload
  | RazorpaySubscriptionHaltedPayload
  | RazorpayOrderAbandonedPayload
  | RazorpayInvoiceExpiredPayload;

export interface WebhookStep {
  step: number;
  label: string;
  detail: string;
  status: 'OK' | 'WARN' | 'ERROR';
  durationMs: number;
}

export interface WebhookIngestionLog {
  id: string;
  timestamp: string;
  event: RazorpayWebhookEvent;
  eventId: string;
  signatureValid: boolean;
  rawPayload: string;
  parsedCustomerName: string;
  amountINR: number;
  diagnosedVector: string;
  complianceCleared: boolean;
  interventionType: string;
  status: WebhookIngestionStatus;
  processingMs: number;
  steps: WebhookStep[];
}

export interface WebhookTemplate {
  event: RazorpayWebhookEvent;
  label: string;
  icon: string;
  description: string;
  color: string;
  payload: RazorpayWebhookPayload;
}
