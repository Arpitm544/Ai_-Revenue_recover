import type { ComplianceSettings, RecoveryCase, AuditLogEntry } from '../types/recovery';

export const DEFAULT_COMPLIANCE_SETTINGS: ComplianceSettings = {
  dndHoursStart: "20:00", // 8 PM IST
  dndHoursEnd: "09:00",   // 9 AM IST
  maxTouchpointsPerWeek: 3,
  autoPauseOnDispute: true,
  hardDeclineFastExit: true,
  requireExplicitConsentForVoice: false,
  salaryCycleWindowDays: 3,
};

export interface ComplianceCheckResult {
  canProceed: boolean;
  reason: string;
  ruleTriggered?: string;
  auditEntry: AuditLogEntry;
}

export class ComplianceEngine {
  private settings: ComplianceSettings;

  constructor(settings: ComplianceSettings = DEFAULT_COMPLIANCE_SETTINGS) {
    this.settings = settings;
  }

  public getSettings(): ComplianceSettings {
    return this.settings;
  }

  public updateSettings(newSettings: Partial<ComplianceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  public isDndTime(currentDate: Date = new Date()): boolean {
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const currentTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const start = this.settings.dndHoursStart;
    const end = this.settings.dndHoursEnd;

    // DND spans over midnight (e.g. 20:00 to 09:00)
    if (start > end) {
      return currentTimeStr >= start || currentTimeStr < end;
    } else {
      return currentTimeStr >= start && currentTimeStr < end;
    }
  }

  public validateIntervention(rcase: RecoveryCase, currentDate: Date = new Date()): ComplianceCheckResult {
    const nowISO = currentDate.toISOString();
    
    // Rule 1: Auto-Pause on Dispute / Opt-Out
    if (this.settings.autoPauseOnDispute && (rcase.isCustomerDisputed || rcase.isOptedOut)) {
      const reason = rcase.isCustomerDisputed 
        ? "STOP RULE TRIGGERED: Customer opened a dispute. All outreach frozen." 
        : "STOP RULE TRIGGERED: Customer requested opt-out / DND.";
      return {
        canProceed: false,
        reason,
        ruleTriggered: "DISPUTE_OR_OPTOUT_FREEZE",
        auditEntry: {
          id: `aud_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: nowISO,
          actor: 'COMPLIANCE_GUARD',
          action: 'INTERVENTION_BLOCKED',
          details: reason,
          complianceCheck: {
            dndCompliant: true,
            maxAttemptsRespected: true,
            disputeCheckPassed: false,
            ruleApplied: "DISPUTE_FREEZE_POLICY"
          }
        }
      };
    }

    // Rule 2: Hard Decline Fast Exit
    if (this.settings.hardDeclineFastExit && rcase.failureCategory === 'HARD_DECLINE') {
      const reason = "STOP RULE TRIGGERED: Hard decline (e.g., account closed/invalid mandate). Automated retry suppressed to avoid bank penalty.";
      return {
        canProceed: false,
        reason,
        ruleTriggered: "HARD_DECLINE_FAST_EXIT",
        auditEntry: {
          id: `aud_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: nowISO,
          actor: 'COMPLIANCE_GUARD',
          action: 'INTERVENTION_BLOCKED',
          details: reason,
          complianceCheck: {
            dndCompliant: true,
            maxAttemptsRespected: true,
            disputeCheckPassed: true,
            ruleApplied: "HARD_DECLINE_POLICY"
          }
        }
      };
    }

    // Rule 3: Max Touchpoints Cap
    if (rcase.attemptsCount >= rcase.maxAttemptsAllowed) {
      const reason = `STOP RULE TRIGGERED: Max touchpoint cap reached (${rcase.attemptsCount}/${rcase.maxAttemptsAllowed}). Case escalated to human team.`;
      return {
        canProceed: false,
        reason,
        ruleTriggered: "MAX_ATTEMPTS_EXCEEDED",
        auditEntry: {
          id: `aud_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: nowISO,
          actor: 'COMPLIANCE_GUARD',
          action: 'INTERVENTION_BLOCKED',
          details: reason,
          complianceCheck: {
            dndCompliant: true,
            maxAttemptsRespected: false,
            disputeCheckPassed: true,
            ruleApplied: "FREQUENCY_CAP_POLICY"
          }
        }
      };
    }

    // Rule 4: DND Window Check
    const inDnd = this.isDndTime(currentDate);
    if (inDnd) {
      const reason = `COMPLIANCE HOLD: Currently in RBI DND Window (${this.settings.dndHoursStart} - ${this.settings.dndHoursEnd} IST). Action postponed.`;
      return {
        canProceed: false,
        reason,
        ruleTriggered: "DND_HOURS_ACTIVE",
        auditEntry: {
          id: `aud_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: nowISO,
          actor: 'COMPLIANCE_GUARD',
          action: 'ACTION_DEFERRED',
          details: reason,
          complianceCheck: {
            dndCompliant: false,
            maxAttemptsRespected: true,
            disputeCheckPassed: true,
            ruleApplied: "RBI_TRAI_DND_POLICY"
          }
        }
      };
    }

    // Rule 5: Active Promise to Pay Hold
    if (rcase.status === 'PROMISED_TO_PAY' && rcase.promiseToPayDate) {
      const promisedTime = new Date(rcase.promiseToPayDate).getTime();
      if (currentDate.getTime() < promisedTime) {
        const reason = `PROMISE-TO-PAY HOLD: Customer committed to pay on ${new Date(rcase.promiseToPayDate).toLocaleDateString('en-IN')}. Dunning paused until promised date.`;
        return {
          canProceed: false,
          reason,
          ruleTriggered: "P2P_HOLD_ACTIVE",
          auditEntry: {
            id: `aud_${Math.random().toString(36).substring(2, 9)}`,
            timestamp: nowISO,
            actor: 'COMPLIANCE_GUARD',
            action: 'ACTION_PAUSED',
            details: reason,
            complianceCheck: {
              dndCompliant: true,
              maxAttemptsRespected: true,
              disputeCheckPassed: true,
              ruleApplied: "P2P_COMMITMENT_POLICY"
            }
          }
        }
      };
    }

    // All compliance checks passed
    return {
      canProceed: true,
      reason: "All compliance and guardrail checks passed successfully.",
      auditEntry: {
        id: `aud_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: nowISO,
        actor: 'COMPLIANCE_GUARD',
        action: 'COMPLIANCE_APPROVED',
        details: "Intervention cleared for execution under RBI/DPDP guidelines.",
        complianceCheck: {
          dndCompliant: true,
          maxAttemptsRespected: true,
          disputeCheckPassed: true,
          ruleApplied: "STANDARD_APPROVAL"
        }
      }
    };
  }
}
