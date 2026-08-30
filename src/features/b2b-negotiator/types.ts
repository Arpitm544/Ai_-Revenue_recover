export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'SCHEDULED';
export type NegotiationIntent =
  | 'ACCEPT'
  | 'COUNTER_PROPOSE'
  | 'REQUEST_EXTENSION'
  | 'DISPUTE'
  | 'ACKNOWLEDGE'
  | 'GREETING'
  | 'OFF_TOPIC';

export interface MilestonePayment {
  id: string;
  installmentNumber: number;
  amountINR: number;
  percentage: number;
  dueDate: string; // ISO date string
  paymentMethod: 'UPI' | 'NEFT' | 'RTGS' | 'CHEQUE';
  status: InstallmentStatus;
  paidAt?: string;
  referenceId?: string;
  gstCreditNoteRef?: string;
}

export interface SplitProposal {
  id: string;
  totalInvoiceAmountINR: number;
  installments: MilestonePayment[];
  aiReasoning: string;
  proposedAt: string;
  acceptedAt?: string;
  counterProposedAt?: string;
}

export interface NegotiationMessage {
  id: string;
  timestamp: string;
  sender: 'AI' | 'CUSTOMER';
  text: string;
  intent?: NegotiationIntent;
}

export interface PromiseToPay {
  id: string;
  caseId: string;
  customerName: string;
  totalAmountINR: number;
  milestones: MilestonePayment[];
  acceptedAt: string;
  auditHash: string;
  gstCreditNoteRef: string;
  complianceNote: string;
}
