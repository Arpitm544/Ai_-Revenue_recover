
import type { RecoveryCase, ActionChannel, AuditLogEntry, FailureCategory } from './types';
import { ComplianceEngine, type ComplianceCheckResult } from './ComplianceEngine';

export class RevenueRecoveryAgent {
  private complianceEngine: ComplianceEngine;

  constructor(complianceEngine: ComplianceEngine = new ComplianceEngine()) {
    this.complianceEngine = complianceEngine;
  }

  /**
   * Root Cause Diagnosis: Analyzes raw payment failure metadata to categorize risk
   */
  public diagnoseCase(rcase: RecoveryCase): RecoveryCase {
    let failureCategory: FailureCategory = 'SOFT_DECLINE';
    let reasoning = '';
    let recommendedChannel: ActionChannel = 'WHATSAPP_UPI_LINK';

    const code = rcase.failureCode.toUpperCase();
    const bank = rcase.issuingBank;

    if (code.includes('EXPIRED') || code.includes('CLOSED') || code.includes('REVOKED') || code.includes('INVALID_ACCOUNT')) {
      failureCategory = 'HARD_DECLINE';
      reasoning = `Hard decline detected (${rcase.failureReason}). Mandatory customer update needed before retry.`;
      recommendedChannel = 'EMAIL_SMART_INVOICE';
    } else if (code.includes('DOWNTIME') || code.includes('TIMEOUT') || code.includes('GATEWAY_FAIL') || rcase.bankDowntimeDetected) {
      failureCategory = 'TECHNICAL_TIMEOUT';
      reasoning = `${bank} issuing bank server downtime detected. Deferring retry window until bank API health recovers.`;
      recommendedChannel = 'SMART_MANDATE_RETRY';
    } else if (code.includes('CART') || code.includes('IDLE') || code.includes('ABANDON') || code.includes('INTENT')) {
      failureCategory = 'INTENT_LOSS';
      reasoning = `Checkout abandonment with high purchase intent. Dynamic 1-tap UPI nudge with limited-time discount recommended.`;
      recommendedChannel = 'WHATSAPP_UPI_LINK';
    } else {
      failureCategory = 'SOFT_DECLINE';
      if (rcase.leakVector === 'SUBSCRIPTION_FAIL' || rcase.leakVector === 'MANDATE_FAIL') {
        // Check salary date match
        const currentDay = new Date().getDate();
        const salaryDay = rcase.salaryDateEstimate || 1;
        const isNearSalary = Math.abs(currentDay - salaryDay) <= 3 || currentDay >= 28 || currentDay <= 5;
        
        if (isNearSalary) {
          reasoning = `Soft decline (Insufficient Funds). Customer salary date (${salaryDay}th) is approaching. Scheduled salary-aligned retry with Hinglish Voice Nudge.`;
          recommendedChannel = 'HINGLISH_VOICE_CALL';
        } else {
          reasoning = `Soft decline (Low balance). WhatsApp 1-tap payment link with partial Promise-to-Pay option dispatched.`;
          recommendedChannel = 'WHATSAPP_UPI_LINK';
        }
      } else if (rcase.leakVector === 'B2B_INVOICE') {
        reasoning = `Overdue B2B Receivable. Tiered executive reminder via Smart Email Invoice + Voice Follow-up.`;
        recommendedChannel = 'EMAIL_SMART_INVOICE';
      }
    }

    const updatedCase: RecoveryCase = {
      ...rcase,
      failureCategory,
      recommendedChannel,
      interventionReasoning: reasoning,
      status: rcase.status === 'DETECTED' ? 'DIAGNOSED' : rcase.status,
      updatedAt: new Date().toISOString(),
    };

    // Add Audit Log
    const diagAudit: AuditLogEntry = {
      id: `aud_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      actor: 'RISK_ENGINE',
      action: 'CASE_DIAGNOSED',
      details: `Categorized as ${failureCategory}. Reasoning: ${reasoning}`,
      complianceCheck: {
        dndCompliant: true,
        maxAttemptsRespected: true,
        disputeCheckPassed: true,
        ruleApplied: 'AI_DIAGNOSTIC_CLASSIFIER'
      }
    };

    updatedCase.auditTrail = [diagAudit, ...updatedCase.auditTrail];
    return updatedCase;
  }

  /**
   * Evaluates compliance and executes intervention for a single case
   */
  public processIntervention(rcase: RecoveryCase, currentDate: Date = new Date()): { updatedCase: RecoveryCase; complianceResult: ComplianceCheckResult } {
    // Step 1: Run Compliance Engine Check
    const complianceResult = this.complianceEngine.validateIntervention(rcase, currentDate);

    if (!complianceResult.canProceed) {
      let newStatus = rcase.status;
      let stopReason = complianceResult.reason;

      if (complianceResult.ruleTriggered === 'HARD_DECLINE_FAST_EXIT') {
        newStatus = 'STOPPED_COMPLIANT';
      } else if (complianceResult.ruleTriggered === 'DISPUTE_OR_OPTOUT_FREEZE') {
        newStatus = 'STOPPED_COMPLIANT';
      } else if (complianceResult.ruleTriggered === 'MAX_ATTEMPTS_EXCEEDED') {
        newStatus = 'FAILED_UNRECOVERABLE';
      }

      const updated: RecoveryCase = {
        ...rcase,
        status: newStatus,
        stopReason,
        auditTrail: [complianceResult.auditEntry, ...rcase.auditTrail],
        updatedAt: currentDate.toISOString()
      };

      return { updatedCase: updated, complianceResult };
    }

    // Step 2: Clear for Intervention
    const channel = rcase.recommendedChannel;
    let nextStatus: RecoveryCase['status'] = 'INTERVENING';
    let recoveredAmt = 0;
    let attemptActionLog = '';
    const attemptsCount = rcase.attemptsCount + 1;

    // Simulate recovery odds based on failure vector & channel
    const randomSeed = Math.random();
    let isRecovered = false;

    if (rcase.leakVector === 'CHECKOUT_ABANDON') {
      isRecovered = randomSeed > 0.35; // 65% success rate for abandonments with dynamic 1-tap link
    } else if (rcase.leakVector === 'SUBSCRIPTION_FAIL') {
      isRecovered = randomSeed > 0.40; // 60% success rate
    } else if (rcase.leakVector === 'MANDATE_FAIL') {
      isRecovered = randomSeed > 0.45; // 55% success rate
    } else {
      isRecovered = randomSeed > 0.50; // 50% success rate for B2B
    }

    if (isRecovered) {
      nextStatus = 'RECOVERED';
      recoveredAmt = rcase.amountAtRisk * (rcase.discountOfferedPct ? (1 - rcase.discountOfferedPct / 100) : 1);
      attemptActionLog = `Intervention via ${channel} SUCCESSFUL! ₹${recoveredAmt.toLocaleString('en-IN')} recovered into Razorpay Merchant Account.`;
    } else {
      if (attemptsCount >= rcase.maxAttemptsAllowed) {
        nextStatus = 'FAILED_UNRECOVERABLE';
        attemptActionLog = `Intervention via ${channel} attempted (${attemptsCount}/${rcase.maxAttemptsAllowed}). Recovery unsuccessful. Max attempts reached.`;
      } else {
        nextStatus = 'INTERVENING';
        attemptActionLog = `Intervention via ${channel} dispatched (Attempt ${attemptsCount}/${rcase.maxAttemptsAllowed}). Awaiting customer action.`;
      }
    }

    const actionAudit: AuditLogEntry = {
      id: `aud_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: currentDate.toISOString(),
      actor: 'AI_INTERVENTION_AGENT',
      action: isRecovered ? 'RECOVERY_SUCCESSFUL' : 'INTERVENTION_DISPATCHED',
      details: attemptActionLog,
      complianceCheck: complianceResult.auditEntry.complianceCheck
    };

    const updatedCase: RecoveryCase = {
      ...rcase,
      status: nextStatus,
      attemptsCount,
      totalAmountRecovered: recoveredAmt,
      auditTrail: [actionAudit, complianceResult.auditEntry, ...rcase.auditTrail],
      updatedAt: currentDate.toISOString()
    };

    return { updatedCase, complianceResult };
  }

  /**
   * Log a Promise to Pay (P2P) commitment from Hinglish Voice or WhatsApp Bot
   */
  public recordPromiseToPay(rcase: RecoveryCase, promiseDate: string, notes: string): RecoveryCase {
    const p2pAudit: AuditLogEntry = {
      id: `aud_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      actor: 'CUSTOMER',
      action: 'PROMISE_TO_PAY_RECORDED',
      details: `Customer promised payment on ${new Date(promiseDate).toLocaleDateString('en-IN')}. Note: "${notes}". Automated escalations paused.`,
      complianceCheck: {
        dndCompliant: true,
        maxAttemptsRespected: true,
        disputeCheckPassed: true,
        ruleApplied: 'CUSTOMER_P2P_COMMITMENT'
      }
    };

    return {
      ...rcase,
      status: 'PROMISED_TO_PAY',
      promiseToPayDate: promiseDate,
      auditTrail: [p2pAudit, ...rcase.auditTrail],
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate custom Hinglish script for Voice Agent simulator
   */
  public generateHinglishVoiceScript(rcase: RecoveryCase): { text: string; audioPrompt: string } {
    const formattedAmount = `₹${rcase.amountAtRisk.toLocaleString('en-IN')}`;
    const name = rcase.customerName;

    let text = '';
    if (rcase.leakVector === 'SUBSCRIPTION_FAIL' || rcase.leakVector === 'MANDATE_FAIL') {
      text = `Namaste ${name}ji! Main Razorpay Automated Revenue Care se bol raha hoon. Aapka recurring subscription payment of ${formattedAmount} complete nahi ho paya tha due to ${rcase.failureReason}. 
Kya aap abhi UPI 1-tap link se pay karna chahenge, ya phir 5th date ko retry schedule karein jab salary credit ho jaye?`;
    } else if (rcase.leakVector === 'CHECKOUT_ABANDON') {
      text = `Namaste ${name}ji! Aapne abhi shopping cart checkout mein ${formattedAmount} ka payment complete nahi kiya tha. 
Agar aap abhi pay karte hain toh humne 5% instant Razorpay UPI discount apply kar diya hai! Kya main aapko WhatsApp pe pay link bhejoon?`;
    } else {
      text = `Namaste ${name}ji! Main Razorpay Accounts Desk se call kar raha hoon regarding invoice ${rcase.paymentId} for ${formattedAmount}. 
Payment 7 dino se overdue hai. Kya aap isse aaj settle kar sakte hain ya payment promise date confirm karenge?`;
    }

    return {
      text,
      audioPrompt: `Voice Call Script for ${name} (${rcase.leakVector})`
    };
  }

  /**
   * Conversational Speech Intent Engine:
   * Parses natural spoken speech in Hinglish/English and generates dynamic contextual response
   */
  public processConversationalSpeech(rcase: RecoveryCase, userInput: string): SpeechTurnResponse {
    const input = userInput.toLowerCase();
    const name = rcase.customerName;
    const amount = `₹${rcase.amountAtRisk.toLocaleString('en-IN')}`;

    // 1. Intent: Gratitude / Closing / Sign-off (Context-Aware)
    const gratitudeKeywords = ['thank', 'dhanyavaad', 'shukriya', 'welcome', 'bye', 'alvida', 'ok', 'theek', 'thik', 'chalega', 'sure', 'great', 'done', 'accha'];
    if (gratitudeKeywords.some(k => input.includes(k))) {
      if (rcase.status === 'PROMISED_TO_PAY') {
        const promisedDateStr = rcase.promiseToPayDate 
          ? new Date(rcase.promiseToPayDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
          : 'scheduled date';
        return {
          detectedIntent: 'CALL_CLOSING',
          replyText: `Most welcome ${name}ji! Aapka reminder ${promisedDateStr} ke liye safely locked hai. Call disconnect kar raha hoon. Have a wonderful day ahead!`,
          updatedCase: rcase,
          actionTaken: 'Call concluded gracefully under Promise-to-Pay status.'
        };
      } else if (rcase.status === 'RECOVERED') {
        return {
          detectedIntent: 'CALL_CLOSING',
          replyText: `Aapka swagat hai ${name}ji! Payment securely settle ho chuki hai. Razorpay use karne ke liye dhanyavaad, alvida!`,
          updatedCase: rcase,
          actionTaken: 'Call concluded gracefully under Recovered status.'
        };
      } else if (rcase.status === 'STOPPED_COMPLIANT') {
        return {
          detectedIntent: 'CALL_CLOSING',
          replyText: `Dhanyavaad ${name}ji. Humne sabhi updates note kar liye hain. Aapka din shubh rahe!`,
          updatedCase: rcase,
          actionTaken: 'Call concluded gracefully under Compliance Freeze.'
        };
      } else {
        return {
          detectedIntent: 'CALL_CLOSING',
          replyText: `You're welcome ${name}ji! Agar aapko payment complete karne mein koi bhi help chahiye toh humari team available hai. Have a great day!`,
          updatedCase: rcase,
          actionTaken: 'Acknowledged customer feedback.'
        };
      }
    }

    // 2. Intent: Promise to Pay (P2P)
    const p2pKeywords = ['salary', 'tareekh', 'date', 'pay karunga', 'later', 'next week', 'kal', 'baad', 'monday', 'friday', '5th', '1st', 'promise', 'schedule'];
    const hasP2P = p2pKeywords.some(k => input.includes(k)) || /\b(\d{1,2})(st|nd|rd|th|\s*(tareekh|tarikh|date))?\b/.test(input);

    if (hasP2P && !input.includes('cancel') && !input.includes('dispute')) {
      let targetDay = 5;
      const dayMatch = input.match(/\b(\d{1,2})\b/);
      if (dayMatch && parseInt(dayMatch[1]) <= 31) {
        targetDay = parseInt(dayMatch[1]);
      } else if (input.includes('1st') || input.includes('salary')) {
        targetDay = 1;
      }

      const now = new Date();
      let targetDate = new Date(now.getFullYear(), now.getMonth(), targetDay);
      if (targetDate.getTime() <= now.getTime()) {
        targetDate = new Date(now.getFullYear(), now.getMonth() + 1, targetDay);
      }

      const formattedDateStr = targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const updated = this.recordPromiseToPay(
        rcase,
        targetDate.toISOString(),
        `Customer verbally promised via Voice Call: "${userInput}"`
      );

      return {
        detectedIntent: 'PROMISE_TO_PAY',
        replyText: `Shukriya ${name}ji! Maine aapka payment reminder ${formattedDateStr} ke liye note kar liya hai aur tab tak sabhi reminders pause kar diye hain. Aapko salary ke baad safe payment link bhej diya jayega. Have a great day!`,
        updatedCase: updated,
        actionTaken: `Promise-to-Pay locked for ${formattedDateStr}. Escalations paused.`
      };
    }

    // 3. Intent: Pay Now / Send Payment Link
    const payNowKeywords = ['abhi', 'now', 'link', 'whatsapp', 'bhejo', 'send', 'pay', 'upi', 'gpay', 'phonepe', 'karo', 'yes'];
    if (payNowKeywords.some(k => input.includes(k)) && !input.includes('nahi') && !input.includes('not') && !input.includes('cancel')) {
      const recovered: RecoveryCase = {
        ...rcase,
        status: 'RECOVERED',
        totalAmountRecovered: rcase.amountAtRisk,
        auditTrail: [
          {
            id: `aud_vpay_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            actor: 'CUSTOMER',
            action: 'VOICE_INTERACTIVE_PAYMENT_INITIATED',
            details: `Customer verbally confirmed payment during Voice Call: "${userInput}". 1-Tap UPI link dispatched.`,
            complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: true }
          },
          ...rcase.auditTrail
        ]
      };

      return {
        detectedIntent: 'PAY_NOW',
        replyText: `Perfect ${name}ji! Maine aapke WhatsApp number pe direct 1-tap Razorpay UPI link send kar diya hai. Link click karke aap GPay ya PhonePe se payment 10 seconds mein complete kar sakte hain. Dhanyavaad!`,
        updatedCase: recovered,
        actionTaken: `1-Tap UPI link sent to customer. ₹${amount} marked as recovered.`
      };
    }

    // 4. Intent: Dispute / Opt Out
    const disputeKeywords = ['dispute', 'cancel', 'band karo', 'mat karo', 'wrong', 'spam', 'fraud', 'stop calling', 'nahi chahiye', 'nahi karunga'];
    if (disputeKeywords.some(k => input.includes(k))) {
      const disputed: RecoveryCase = {
        ...rcase,
        isCustomerDisputed: true,
        status: 'STOPPED_COMPLIANT',
        stopReason: `STOP RULE TRIGGERED: Customer verbal dispute logged ("${userInput}").`,
        auditTrail: [
          {
            id: `aud_vdisp_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            actor: 'CUSTOMER',
            action: 'VERBAL_DISPUTE_RAISED',
            details: `Customer indicated dispute/opt-out during Voice Call: "${userInput}". Compliance freeze triggered.`,
            complianceCheck: { dndCompliant: true, maxAttemptsRespected: true, disputeCheckPassed: false, ruleApplied: 'CUSTOMER_DISPUTE_FREEZE' }
          },
          ...rcase.auditTrail
        ]
      };

      return {
        detectedIntent: 'DISPUTE_OPT_OUT',
        replyText: `Samajh gaya ${name}ji. Maine aapka feedback note kar liya hai aur humare system mein dispute flag raise kar diya hai. Aapka account compliance freeze pe daal diya gaya hai aur koi automatic call nahi aayegi.`,
        updatedCase: disputed,
        actionTaken: 'Customer dispute logged. All automated outreach frozen.'
      };
    }

    // 5. Intent: Query Amount / Reason
    const queryKeywords = ['kitna', 'amount', 'kyu', 'reason', 'fail', 'why', 'how much', 'what', 'kaha'];
    if (queryKeywords.some(k => input.includes(k))) {
      return {
        detectedIntent: 'QUERY_DETAILS',
        replyText: `${name}ji, aapka pending amount ${amount} hai for ${rcase.leakVector}. Ye ${rcase.issuingBank} se ${rcase.failureReason} ke karan fail hua tha. Kya aap WhatsApp pe UPI link chahte hain ya date schedule karein?`,
        updatedCase: rcase,
        actionTaken: 'Provided transaction breakdown to customer.'
      };
    }

    // 6. Intent: Greetings / Identity ("Hi", "Hello", "Kaun ho")
    const greetingKeywords = ['hi', 'hello', 'hey', 'namaste', 'kaun', 'who', 'sun', 'bolo'];
    if (greetingKeywords.some(k => input.split(' ').includes(k) || input === k)) {
      return {
        detectedIntent: 'GREETING_ACK',
        replyText: `Namaste ${name}ji! Main Razorpay Automated Revenue Care se bol raha hoon regarding aapka pending ${amount} ka payment. Kya main aapko 1-tap UPI link bhejoon ya salary ke baad retry schedule karein?`,
        updatedCase: rcase,
        actionTaken: 'Greeted customer and stated purpose.'
      };
    }

    // 7. Intent: Off-Topic / Unrelated Input (Bounded Workflow Guardrail)
    return {
      detectedIntent: 'OFF_TOPIC_FALLBACK',
      replyText: `Kshama karein ${name}ji, main Razorpay Revenue Care assistant hoon aur sirf aapke pending payment (${amount}) ko resolve karne mein help kar sakta hoon. Aap 'Pay Now', 'Date Reminder' (e.g. 5th), ya 'Dispute' bata sakte hain.`,
      updatedCase: rcase,
      actionTaken: 'Off-topic input detected. Gracefully redirected back to payment workflow.'
    };
  }
}

export interface SpeechTurnResponse {
  replyText: string;
  detectedIntent: 'PROMISE_TO_PAY' | 'PAY_NOW' | 'DISPUTE_OPT_OUT' | 'QUERY_DETAILS' | 'GENERAL_ACK' | 'CALL_CLOSING' | 'GREETING_ACK' | 'OFF_TOPIC_FALLBACK';
  updatedCase: RecoveryCase;
  actionTaken?: string;
}
