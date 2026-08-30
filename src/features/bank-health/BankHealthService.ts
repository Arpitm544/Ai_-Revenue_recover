import type { BankHealthNode } from './types';
import type { RecoveryCase } from '../recovery/types';

export const INITIAL_BANK_HEALTH: BankHealthNode[] = [
  {
    id: 'bank_sbi',
    bankName: 'State Bank of India',
    code: 'SBI',
    status: 'DEGRADED',
    successRate: 41.8,
    latencyMs: 3840,
    channel: 'UPI AutoPay',
    casesOnHoldCount: 14,
    revenueProtectedAmount: 48900,
    recommendedWindow: '04:00 AM IST (Off-Peak)',
    lastIncidentTime: '12 mins ago'
  },
  {
    id: 'bank_hdfc',
    bankName: 'HDFC Bank',
    code: 'HDFC',
    status: 'OPERATIONAL',
    successRate: 98.6,
    latencyMs: 142,
    channel: 'Recurring Cards',
    casesOnHoldCount: 0,
    revenueProtectedAmount: 0,
    recommendedWindow: 'Immediate Real-time',
  },
  {
    id: 'bank_icici',
    bankName: 'ICICI Bank',
    code: 'ICICI',
    status: 'OPERATIONAL',
    successRate: 97.2,
    latencyMs: 185,
    channel: 'UPI AutoPay',
    casesOnHoldCount: 0,
    revenueProtectedAmount: 0,
    recommendedWindow: 'Immediate Real-time',
  },
  {
    id: 'bank_axis',
    bankName: 'Axis Bank',
    code: 'AXIS',
    status: 'OPERATIONAL',
    successRate: 96.9,
    latencyMs: 210,
    channel: 'eNACH',
    casesOnHoldCount: 0,
    revenueProtectedAmount: 0,
    recommendedWindow: 'Immediate Real-time',
  },
  {
    id: 'bank_kotak',
    bankName: 'Kotak Mahindra Bank',
    code: 'KOTAK',
    status: 'OPERATIONAL',
    successRate: 98.1,
    latencyMs: 160,
    channel: 'Netbanking',
    casesOnHoldCount: 0,
    revenueProtectedAmount: 0,
    recommendedWindow: 'Immediate Real-time',
  }
];

export class BankHealthService {
  private banks: BankHealthNode[] = [...INITIAL_BANK_HEALTH];

  public getBanks(): BankHealthNode[] {
    return this.banks;
  }

  public toggleBankOutage(bankCode: string, cases: RecoveryCase[]): { updatedBanks: BankHealthNode[]; updatedCases: RecoveryCase[]; message: string } {
    let affectedBankName = '';
    let isNowDown = false;

    this.banks = this.banks.map(b => {
      if (b.code === bankCode) {
        affectedBankName = b.bankName;
        if (b.status === 'OPERATIONAL') {
          isNowDown = true;
          return {
            ...b,
            status: 'DEGRADED',
            successRate: 36.4,
            latencyMs: 4200,
            recommendedWindow: '04:00 AM IST (Off-Peak)',
            lastIncidentTime: 'Just now'
          };
        } else {
          isNowDown = false;
          return {
            ...b,
            status: 'OPERATIONAL',
            successRate: 98.4,
            latencyMs: 155,
            casesOnHoldCount: 0,
            revenueProtectedAmount: 0,
            recommendedWindow: 'Immediate Real-time',
            lastIncidentTime: undefined
          };
        }
      }
      return b;
    });

    let holdCount = 0;
    let protectedAmt = 0;

    const updatedCases = cases.map(c => {
      const isMatchingBank = c.issuingBank.toLowerCase().includes(bankCode.toLowerCase()) || 
        (bankCode === 'SBI' && c.issuingBank.includes('SBI')) ||
        (bankCode === 'HDFC' && c.issuingBank.includes('HDFC')) ||
        (bankCode === 'ICICI' && c.issuingBank.includes('ICICI')) ||
        (bankCode === 'AXIS' && c.issuingBank.includes('Axis')) ||
        (bankCode === 'KOTAK' && c.issuingBank.includes('Kotak'));

      if (isMatchingBank) {
        if (isNowDown) {
          holdCount++;
          protectedAmt += c.amountAtRisk;
          return {
            ...c,
            bankDowntimeDetected: true,
            failureCategory: 'TECHNICAL_TIMEOUT' as const,
            interventionReasoning: `${affectedBankName} gateway degraded (${bankCode} API downtime). Smart Retry hold engaged.`,
            auditTrail: [
              {
                id: `aud_bdown_${Math.random().toString(36).substring(2, 7)}`,
                timestamp: new Date().toISOString(),
                actor: 'RISK_ENGINE' as const,
                action: 'BANK_DOWNTIME_HOLD_ENGAGED',
                details: `${affectedBankName} success rate dropped below 50%. Auto-deferred retry to 04:00 AM off-peak window to avoid merchant penalty fee.`,
                complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true, ruleApplied: 'BANK_GATEWAY_UPTIME_POLICY' }
              },
              ...c.auditTrail
            ]
          };
        } else {
          return {
            ...c,
            bankDowntimeDetected: false,
            interventionReasoning: `${affectedBankName} gateway recovered. Scheduled for immediate batch retry.`,
            auditTrail: [
              {
                id: `aud_brec_${Math.random().toString(36).substring(2, 7)}`,
                timestamp: new Date().toISOString(),
                actor: 'RISK_ENGINE' as const,
                action: 'GATEWAY_HEALTH_RESTORED',
                details: `${affectedBankName} success rate back to 98%+. Cleared for immediate autonomous mandate retry.`,
                complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true }
              },
              ...c.auditTrail
            ]
          };
        }
      }
      return c;
    });

    // Update the bank node with counts
    this.banks = this.banks.map(b => {
      if (b.code === bankCode && isNowDown) {
        return {
          ...b,
          casesOnHoldCount: holdCount,
          revenueProtectedAmount: protectedAmt
        };
      }
      return b;
    });

    const msg = isNowDown 
      ? `🚨 ${affectedBankName} outage simulated! ${holdCount} retries held (₹${protectedAmt.toLocaleString('en-IN')} protected from penalty fees).`
      : `✅ ${affectedBankName} gateway restored to 98.4% uptime! Retries released for processing.`;

    return { updatedBanks: this.banks, updatedCases, message: msg };
  }
}
