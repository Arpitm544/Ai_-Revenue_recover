import type {
  SplitProposal,
  MilestonePayment,
  NegotiationMessage,
  NegotiationIntent,
  PromiseToPay,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function shortId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function auditHash(data: string): string {
  let h = 5381;
  for (let i = 0; i < data.length; i++) h = ((h << 5) + h) ^ data.charCodeAt(i);
  return Math.abs(h).toString(16).padStart(8, '0');
}

// ─── AI Split Proposal Generator ─────────────────────────────────────────────
export function generateSplitProposal(
  _caseId: string,
  customerName: string,
  totalAmountINR: number,
  daysOverdue: number,
): SplitProposal {
  const now = new Date().toISOString();

  let installments: MilestonePayment[];
  let reasoning: string;

  if (totalAmountINR >= 100000) {
    // 3-way split for invoices ≥ ₹1L
    installments = [
      { id: shortId(), installmentNumber: 1, amountINR: Math.round(totalAmountINR * 0.40), percentage: 40, dueDate: addDays(0),  paymentMethod: 'UPI',  status: 'PENDING', gstCreditNoteRef: `CN-${shortId().toUpperCase()}` },
      { id: shortId(), installmentNumber: 2, amountINR: Math.round(totalAmountINR * 0.30), percentage: 30, dueDate: addDays(15), paymentMethod: 'NEFT', status: 'SCHEDULED', gstCreditNoteRef: `CN-${shortId().toUpperCase()}` },
      { id: shortId(), installmentNumber: 3, amountINR: Math.round(totalAmountINR * 0.30), percentage: 30, dueDate: addDays(30), paymentMethod: 'NEFT', status: 'SCHEDULED', gstCreditNoteRef: `CN-${shortId().toUpperCase()}` },
    ];
    reasoning = `Invoice of ₹${totalAmountINR.toLocaleString('en-IN')} qualifies for 40/30/30 enterprise milestone plan. First tranche via UPI now, remaining via NEFT in 15 & 30 days. RBI-compliant partial credit notes issued per installment.`;
  } else if (daysOverdue > 30) {
    // 3-way split for heavily overdue
    installments = [
      { id: shortId(), installmentNumber: 1, amountINR: Math.round(totalAmountINR * 0.50), percentage: 50, dueDate: addDays(0),  paymentMethod: 'UPI',  status: 'PENDING', gstCreditNoteRef: `CN-${shortId().toUpperCase()}` },
      { id: shortId(), installmentNumber: 2, amountINR: Math.round(totalAmountINR * 0.25), percentage: 25, dueDate: addDays(10), paymentMethod: 'UPI',  status: 'SCHEDULED', gstCreditNoteRef: `CN-${shortId().toUpperCase()}` },
      { id: shortId(), installmentNumber: 3, amountINR: Math.round(totalAmountINR * 0.25), percentage: 25, dueDate: addDays(20), paymentMethod: 'NEFT', status: 'SCHEDULED', gstCreditNoteRef: `CN-${shortId().toUpperCase()}` },
    ];
    reasoning = `Invoice ${daysOverdue} days overdue. 3-installment recovery plan reduces liquidity stress: 50% immediate UPI, then 25%+25% over 20 days. Maximises recovery without forcing default.`;
  } else {
    // Standard 50/50 split
    installments = [
      { id: shortId(), installmentNumber: 1, amountINR: Math.round(totalAmountINR * 0.50), percentage: 50, dueDate: addDays(0),  paymentMethod: 'UPI',  status: 'PENDING', gstCreditNoteRef: `CN-${shortId().toUpperCase()}` },
      { id: shortId(), installmentNumber: 2, amountINR: totalAmountINR - Math.round(totalAmountINR * 0.50), percentage: 50, dueDate: addDays(15), paymentMethod: 'NEFT', status: 'SCHEDULED', gstCreditNoteRef: `CN-${shortId().toUpperCase()}` },
    ];
    reasoning = `Standard 50/50 split plan for ₹${totalAmountINR.toLocaleString('en-IN')} invoice: 50% via UPI today, remaining 50% via NEFT in 15 days. Keeps cash-flow healthy for ${customerName}.`;
  }

  return {
    id: `prop_${shortId()}`,
    totalInvoiceAmountINR: totalAmountINR,
    installments,
    aiReasoning: reasoning,
    proposedAt: now,
  };
}

// ─── Negotiation Intent Classifier ───────────────────────────────────────────
function classifyIntent(text: string): NegotiationIntent {
  const t = text.toLowerCase().trim();

  if (/\b(accept|agree|done|theek|haan|yes|okay|ok|chalega|manzoor|confirm|proceed)\b/.test(t))
    return 'ACCEPT';
  if (/\b(counter|instead|30|40|50|60|70|percent|%|different|change|modify|baar|alag|badlo|teen|do)\b/.test(t))
    return 'COUNTER_PROPOSE';
  if (/\b(extend|more time|delay|later|kal|next|agle|mahine|month|week|hafte|baad)\b/.test(t))
    return 'REQUEST_EXTENSION';
  if (/\b(dispute|wrong|galat|nahi|no|refuse|reject|fake|fraud|complaint)\b/.test(t))
    return 'DISPUTE';
  if (/\b(hi|hello|namaste|namaskar|hey|good morning|good evening)\b/.test(t))
    return 'GREETING';
  if (/\b(thank|shukriya|dhanyavaad|thanks|great|perfect|noted)\b/.test(t))
    return 'ACKNOWLEDGE';

  return 'OFF_TOPIC';
}

// ─── AI Response Generator ────────────────────────────────────────────────────
export function processNegotiationMessage(
  userText: string,
  customerName: string,
  proposal: SplitProposal,
  history: NegotiationMessage[],
): { reply: string; intent: NegotiationIntent; updatedProposal?: SplitProposal } {
  const intent = classifyIntent(userText);
  const firstName = customerName.split(' ')[0];
  const total = proposal.totalInvoiceAmountINR;

  switch (intent) {
    case 'GREETING':
      return {
        intent,
        reply: `Namaste ${firstName}ji! Main Razorpay B2B Settlement Care se bol raha hoon. Aapke outstanding invoice of ₹${total.toLocaleString('en-IN')} ke liye humne ek flexible milestone payment plan prepare kiya hai. Kya aap proposal dekhna chahenge?`,
      };

    case 'ACCEPT': {
      const inst1 = proposal.installments[0];
      return {
        intent,
        reply: `Bahut shukriya ${firstName}ji! Aapka milestone settlement plan confirm ho gaya. 🎉\n\nPehla installment: ₹${inst1.amountINR.toLocaleString('en-IN')} via ${inst1.paymentMethod} aaj. Aapko UPI payment link abhi bhej diya jayega. Remaining installments ke liye auto-reminders set ho gaye hain. GST-compliant partial credit notes har installment par issue kiye jayenge.`,
        updatedProposal: { ...proposal, acceptedAt: new Date().toISOString() },
      };
    }

    case 'COUNTER_PROPOSE': {
      const nums = userText.match(/\d+/g);
      const firstPct = nums ? Math.min(Math.max(parseInt(nums[0]), 20), 70) : 30;
      const restPct = 100 - firstPct;
      const inst1Amt = Math.round(total * firstPct / 100);
      const inst2Amt = total - inst1Amt;
      const updated: SplitProposal = {
        ...proposal,
        installments: [
          { ...proposal.installments[0], amountINR: inst1Amt, percentage: firstPct },
          { ...proposal.installments[proposal.installments.length - 1], amountINR: inst2Amt, percentage: restPct, dueDate: addDays(21) },
        ],
        counterProposedAt: new Date().toISOString(),
      };
      return {
        intent,
        reply: `${firstName}ji, aapka counter-proposal noted! Maine plan update kiya hai: ${firstPct}% (₹${inst1Amt.toLocaleString('en-IN')}) aaj + ${restPct}% (₹${inst2Amt.toLocaleString('en-IN')}) 21 din baad. Kya yeh arrangement aapko accept hai?`,
        updatedProposal: updated,
      };
    }

    case 'REQUEST_EXTENSION': {
      const updated: SplitProposal = {
        ...proposal,
        installments: proposal.installments.map((inst, i) => ({
          ...inst,
          dueDate: addDays(i === 0 ? 7 : (i + 1) * 21),
        })),
      };
      return {
        intent,
        reply: `${firstName}ji, samajh aaya. Maine aapke liye har installment ki due date 7 din extend kar di hai. Naya schedule: ${updated.installments.map(i => `₹${i.amountINR.toLocaleString('en-IN')} by ${i.dueDate}`).join(', ')}. Kya ab yeh plan theek hai?`,
        updatedProposal: updated,
      };
    }

    case 'DISPUTE':
      return {
        intent,
        reply: `${firstName}ji, mujhe samajh aaya ki koi concern hai. Main yeh case immediately humari Disputes Resolution Team ko escalate kar raha hoon. Aapko 24 ghante mein ek dedicated account manager se call aayegi. Tab tak koi further action nahi hogi. Dhanyavaad.`,
      };

    case 'ACKNOWLEDGE': {
      const isSettled = history.some(m => m.intent === 'ACCEPT');
      if (isSettled) {
        return {
          intent,
          reply: `${firstName}ji, aapka payment plan confirm hai! Pehle installment ka link aapke registered WhatsApp (+91-XXXXXXXXXX) par bhej diya gaya hai. Baki milestones ke reminders auto-schedule ho gaye hain. Koi bhi help ke liye hum available hain. ✅`,
        };
      }
      return {
        intent,
        reply: `${firstName}ji, koi baat nahi! Kya aap humara proposed split plan accept karna chahenge, ya koi modification chahiye?`,
      };
    }

    default:
      return {
        intent: 'OFF_TOPIC',
        reply: `${firstName}ji, main sirf aapke outstanding invoice ke baarey mein help kar sakta hoon. Kya aap ₹${total.toLocaleString('en-IN')} ke liye humara milestone payment plan consider karenge?`,
      };
  }
}

// ─── Promise-to-Pay Ledger Builder ────────────────────────────────────────────
export function createPromiseToPay(
  caseId: string,
  customerName: string,
  proposal: SplitProposal,
): PromiseToPay {
  const now = new Date().toISOString();
  const hash = auditHash(`${caseId}:${customerName}:${proposal.totalInvoiceAmountINR}:${now}`);

  return {
    id: `p2p_${shortId()}`,
    caseId,
    customerName,
    totalAmountINR: proposal.totalInvoiceAmountINR,
    milestones: proposal.installments,
    acceptedAt: now,
    auditHash: hash,
    gstCreditNoteRef: `GSTCN-RZPB2B-${hash.toUpperCase().substring(0, 8)}`,
    complianceNote: 'Milestone plan compliant with RBI Merchant Settlement Guidelines and DPDP Act 2023. Partial credit notes issued per installment per GST Rule 53.',
  };
}
