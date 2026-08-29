import type { RecoveryCase, ActionChannel, AuditLogEntry, FailureCategory } from '../types/recovery';
import { ComplianceEngine, type ComplianceCheckResult } from './complianceEngine';

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
}
