export type BankGatewayStatus = 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';

export interface BankHealthNode {
  id: string;
  bankName: string;
  code: 'SBI' | 'HDFC' | 'ICICI' | 'AXIS' | 'KOTAK';
  status: BankGatewayStatus;
  successRate: number; // percentage e.g. 98.5
  latencyMs: number;
  channel: 'UPI AutoPay' | 'eNACH' | 'Recurring Cards' | 'Netbanking';
  casesOnHoldCount: number;
  revenueProtectedAmount: number; // in INR
  recommendedWindow: string; // e.g. "04:00 AM IST (Off-Peak)"
  lastIncidentTime?: string;
}

export interface BankDowntimeActionLog {
  timestamp: string;
  bankCode: string;
  action: 'DOWNTIME_DETECTED' | 'RETRY_HOLD_ENGAGED' | 'GATEWAY_RECOVERED' | 'OFF_PEAK_RETRY_DISPATCHED';
  details: string;
}
