export type LeakVector = 
  | 'SUBSCRIPTION_FAIL' 
  | 'CHECKOUT_ABANDON' 
  | 'B2B_INVOICE' 
  | 'MANDATE_FAIL';

export type FailureCategory = 
  | 'SOFT_DECLINE'       // Insufficient funds, temp lock, bank timeout
  | 'HARD_DECLINE'       // Expired card, closed account, invalid mandate
  | 'INTENT_LOSS'        // Cart idle, checkout drop-off, price friction
  | 'TECHNICAL_TIMEOUT'; // Bank downtime, network glitch

export type CaseStatus = 
  | 'DETECTED' 
  | 'DIAGNOSED' 
  | 'INTERVENING' 
  | 'PROMISED_TO_PAY' 
  | 'RECOVERED' 
  | 'STOPPED_COMPLIANT' 
  | 'FAILED_UNRECOVERABLE';

export type ActionChannel = 'HINGLISH_VOICE_CALL' | 'WHATSAPP_UPI_LINK' | 'EMAIL_SMART_INVOICE' | 'SMART_MANDATE_RETRY';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: 'RISK_ENGINE' | 'AI_INTERVENTION_AGENT' | 'COMPLIANCE_GUARD' | 'CUSTOMER' | 'BANK_GATEWAY';
  action: string;
  details: string;
  complianceCheck: {
    dndCompliant: boolean;
    maxAttemptsRespected: boolean;
    disputeCheckPassed: boolean;
    ruleApplied?: string;
  };
}

export interface RecoveryCase {
  id: string;
  paymentId: string; // e.g., pay_Px89231920
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  preferredLanguage: 'Hinglish' | 'English' | 'Hindi';
  leakVector: LeakVector;
  amountAtRisk: number; // in INR
  currency: 'INR';
  failureCode: string; // e.g. 'INSUFFICIENT_FUNDS', 'BANK_DOWN', 'EXPIRED_CARD', 'CART_IDLE'
  failureReason: string;
  issuingBank: string; // HDFC, ICICI, SBI, Axis, Kotak
  failureCategory: FailureCategory;
  createdAt: string;
  updatedAt: string;
  status: CaseStatus;
  
  // Intelligence & Sequencing
  salaryDateEstimate?: number; // Day of month e.g., 1st or 30th
  bankDowntimeDetected?: boolean;
  recommendedChannel: ActionChannel;
  interventionReasoning: string;
  
  // Execution State
  attemptsCount: number;
  maxAttemptsAllowed: number;
  nextActionScheduledAt?: string;
  promiseToPayDate?: string;
  discountOfferedPct?: number;
  totalAmountRecovered: number;
  
  // Stop Rules / Compliance Flags
  isCustomerDisputed?: boolean;
  isOptedOut?: boolean;
  stopReason?: string;
  
  auditTrail: AuditLogEntry[];
}

export interface ComplianceSettings {
  dndHoursStart: string; // "20:00"
  dndHoursEnd: string;   // "09:00"
  maxTouchpointsPerWeek: number; // default 3
  autoPauseOnDispute: boolean; // default true
  hardDeclineFastExit: boolean; // default true
  requireExplicitConsentForVoice: boolean;
  salaryCycleWindowDays: number; // e.g., 3 days around salary
}

export interface RecoveryMetrics {
  totalCases: number;
  totalRevenueAtRisk: number;
  totalMoneyRecovered: number;
  recoveryRatePercent: number;
  activeInterventions: number;
  stoppedCompliant: number;
  failedUnrecoverable: number;
  avgRecoveryHours: number;
  vectorBreakdown: Record<LeakVector, { total: number; recovered: number; count: number }>;
}
