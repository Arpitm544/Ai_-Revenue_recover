import type { RecoveryCase } from '../types/recovery';

const IndianNames = [
  "Rohit Sharma", "Priya Nair", "Vikramaditya Verma", "Ananya Deshmukh", "Rahul Dravid",
  "Siddharth Rao", "Kavya Kulkarni", "Amitabh Joshi", "Sneha Agarwal", "Arjun Kapoor",
  "Meera Iyer", "Varun Mehta", "Deepika Padukone", "Suresh Raina", "Tanya Gupta",
  "Aditya Roy", "Neha Sharma", "Rohan Gupta", "Pooja Hegde", "Gaurav Malhotra"
];

const Banks = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra"];

export const INITIAL_MOCK_CASES: RecoveryCase[] = [
  {
    id: "rc_101",
    paymentId: "pay_Nx92019482",
    customerName: "Rohit Sharma",
    customerPhone: "+91 98201 44321",
    customerEmail: "rohit.sharma@example.com",
    preferredLanguage: "Hinglish",
    leakVector: "SUBSCRIPTION_FAIL",
    amountAtRisk: 1499,
    currency: "INR",
    failureCode: "INSUFFICIENT_FUNDS",
    failureReason: "Card balance low / Soft decline",
    issuingBank: "HDFC Bank",
    failureCategory: "SOFT_DECLINE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    status: "DETECTED",
    salaryDateEstimate: 1,
    bankDowntimeDetected: false,
    recommendedChannel: "HINGLISH_VOICE_CALL",
    interventionReasoning: "Soft decline (Insufficient funds). Salary date near 1st of month. Hinglish voice call recommended.",
    attemptsCount: 0,
    maxAttemptsAllowed: 3,
    totalAmountRecovered: 0,
    isCustomerDisputed: false,
    isOptedOut: false,
    auditTrail: [
      {
        id: "aud_001",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        actor: "RISK_ENGINE",
        action: "REVENUE_AT_RISK_DETECTED",
        details: "Subscription auto-debit of ₹1,499 failed on HDFC card. Leak vector tagged as SUBSCRIPTION_FAIL.",
        complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true }
      }
    ]
  },
  {
    id: "rc_102",
    paymentId: "pay_Nx92019889",
    customerName: "Priya Nair",
    customerPhone: "+91 98450 11234",
    customerEmail: "priya.nair@techfirm.in",
    preferredLanguage: "English",
    leakVector: "CHECKOUT_ABANDON",
    amountAtRisk: 4999,
    currency: "INR",
    failureCode: "CART_IDLE_INTENT",
    failureReason: "Checkout abandoned at UPI payment step",
    issuingBank: "ICICI Bank",
    failureCategory: "INTENT_LOSS",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    status: "DETECTED",
    bankDowntimeDetected: false,
    recommendedChannel: "WHATSAPP_UPI_LINK",
    interventionReasoning: "Customer abandoned checkout after selecting UPI. High intent. Send 1-tap WhatsApp link with 5% discount.",
    attemptsCount: 0,
    maxAttemptsAllowed: 3,
    discountOfferedPct: 5,
    totalAmountRecovered: 0,
    isCustomerDisputed: false,
    isOptedOut: false,
    auditTrail: [
      {
        id: "aud_002",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        actor: "RISK_ENGINE",
        action: "CHECKOUT_ABANDONMENT_DETECTED",
        details: "User dropped out at checkout stage with cart value ₹4,999.",
        complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true }
      }
    ]
  },
  {
    id: "rc_103",
    paymentId: "inv_Razor_9920",
    customerName: "Vikramaditya Verma",
    customerPhone: "+91 91234 56789",
    customerEmail: "finance@verma-logistics.com",
    preferredLanguage: "Hinglish",
    leakVector: "B2B_INVOICE",
    amountAtRisk: 45000,
    currency: "INR",
    failureCode: "OVERDUE_15_DAYS",
    failureReason: "B2B Enterprise invoice 15 days overdue",
    issuingBank: "SBI",
    failureCategory: "SOFT_DECLINE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
    status: "INTERVENING",
    recommendedChannel: "EMAIL_SMART_INVOICE",
    interventionReasoning: "Aging invoice (>15 days). Send Smart Escalation Email with partial P2P option.",
    attemptsCount: 1,
    maxAttemptsAllowed: 3,
    totalAmountRecovered: 0,
    isCustomerDisputed: false,
    isOptedOut: false,
    auditTrail: [
      {
        id: "aud_003",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        actor: "AI_INTERVENTION_AGENT",
        action: "INTERVENTION_DISPATCHED",
        details: "Sent executive invoice reminder with Razorpay Payment Link attached.",
        complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true }
      }
    ]
  },
  {
    id: "rc_104",
    paymentId: "mandate_UPI_8820",
    customerName: "Ananya Deshmukh",
    customerPhone: "+91 97110 99887",
    customerEmail: "ananya.d@gmail.com",
    preferredLanguage: "Hinglish",
    leakVector: "MANDATE_FAIL",
    amountAtRisk: 2999,
    currency: "INR",
    failureCode: "BANK_DOWN",
    failureReason: "SBI UPI AutoPay gateway timeout / server down",
    issuingBank: "SBI",
    failureCategory: "TECHNICAL_TIMEOUT",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    status: "DETECTED",
    bankDowntimeDetected: true,
    recommendedChannel: "SMART_MANDATE_RETRY",
    interventionReasoning: "SBI gateway downtime detected. Pause instant retry; auto-sequence execution for 04:00 AM off-peak window.",
    attemptsCount: 0,
    maxAttemptsAllowed: 3,
    totalAmountRecovered: 0,
    isCustomerDisputed: false,
    isOptedOut: false,
    auditTrail: [
      {
        id: "aud_004",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        actor: "RISK_ENGINE",
        action: "BANK_DOWNTIME_DETECTED",
        details: "SBI auto-pay endpoint experiencing 42% failure rate. Marked as TECHNICAL_TIMEOUT.",
        complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true }
      }
    ]
  },
  {
    id: "rc_105",
    paymentId: "pay_Px7729104",
    customerName: "Siddharth Rao",
    customerPhone: "+91 99001 22334",
    customerEmail: "siddharth.rao@yahoo.com",
    preferredLanguage: "English",
    leakVector: "SUBSCRIPTION_FAIL",
    amountAtRisk: 899,
    currency: "INR",
    failureCode: "CARD_EXPIRED",
    failureReason: "Credit Card expired on 08/26",
    issuingBank: "Axis Bank",
    failureCategory: "HARD_DECLINE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
    status: "STOPPED_COMPLIANT",
    stopReason: "STOP RULE TRIGGERED: Hard decline (expired card). Automated retry suppressed to avoid merchant bank fee.",
    recommendedChannel: "EMAIL_SMART_INVOICE",
    interventionReasoning: "Hard decline detected. Fast-exit policy triggered.",
    attemptsCount: 0,
    maxAttemptsAllowed: 3,
    totalAmountRecovered: 0,
    isCustomerDisputed: false,
    isOptedOut: false,
    auditTrail: [
      {
        id: "aud_005",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        actor: "COMPLIANCE_GUARD",
        action: "INTERVENTION_BLOCKED",
        details: "HARD_DECLINE_FAST_EXIT policy enforced. Card expired.",
        complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true, ruleApplied: "HARD_DECLINE_POLICY" }
      }
    ]
  }
];

// Helper to generate 40 additional realistic cases dynamically
export function generateMockBatchCases(count: number = 45): RecoveryCase[] {
  const vectors: RecoveryCase['leakVector'][] = ['SUBSCRIPTION_FAIL', 'CHECKOUT_ABANDON', 'B2B_INVOICE', 'MANDATE_FAIL'];
  const categories: RecoveryCase['failureCategory'][] = ['SOFT_DECLINE', 'INTENT_LOSS', 'TECHNICAL_TIMEOUT', 'HARD_DECLINE'];
  const channels: RecoveryCase['recommendedChannel'][] = ['HINGLISH_VOICE_CALL', 'WHATSAPP_UPI_LINK', 'EMAIL_SMART_INVOICE', 'SMART_MANDATE_RETRY'];

  const extraCases: RecoveryCase[] = [];

  for (let i = 0; i < count; i++) {
    const id = `rc_${200 + i}`;
    const name = IndianNames[i % IndianNames.length];
    const bank = Banks[i % Banks.length];
    const vector = vectors[i % vectors.length];
    const category = categories[i % categories.length];
    const channel = channels[i % channels.length];

    let amount = 999;
    if (vector === 'B2B_INVOICE') amount = Math.floor(Math.random() * 80000) + 15000;
    else if (vector === 'CHECKOUT_ABANDON') amount = Math.floor(Math.random() * 12000) + 1200;
    else amount = Math.floor(Math.random() * 3500) + 499;

    const isHard = category === 'HARD_DECLINE';

    extraCases.push({
      id,
      paymentId: `pay_Gen${80000 + i}`,
      customerName: `${name} ${i > 20 ? 'II' : ''}`,
      customerPhone: `+91 98${Math.floor(10000000 + Math.random() * 89999999)}`,
      customerEmail: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      preferredLanguage: i % 2 === 0 ? "Hinglish" : "English",
      leakVector: vector,
      amountAtRisk: amount,
      currency: "INR",
      failureCode: isHard ? "ACCOUNT_CLOSED" : (category === 'INTENT_LOSS' ? "CART_DROPOUT" : "INSUFFICIENT_FUNDS"),
      failureReason: isHard ? "Account inactive or mandate revoked" : "Soft decline / Payment drop-off",
      issuingBank: bank,
      failureCategory: category,
      createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 72).toISOString(),
      updatedAt: new Date().toISOString(),
      status: "DETECTED",
      salaryDateEstimate: (i % 5 === 0) ? 1 : 30,
      bankDowntimeDetected: category === 'TECHNICAL_TIMEOUT',
      recommendedChannel: channel,
      interventionReasoning: `AI Agent identified ${vector} loss pattern. ${channel} intervention selected.`,
      attemptsCount: 0,
      maxAttemptsAllowed: 3,
      totalAmountRecovered: 0,
      isCustomerDisputed: false,
      isOptedOut: false,
      auditTrail: [
        {
          id: `aud_gen_${i}`,
          timestamp: new Date().toISOString(),
          actor: "RISK_ENGINE",
          action: "REVENUE_AT_RISK_DETECTED",
          details: `Revenue leak of ₹${amount.toLocaleString('en-IN')} tagged for ${vector}`,
          complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true }
        }
      ]
    });
  }

  return extraCases;
}
