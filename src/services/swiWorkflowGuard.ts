/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Workflow Guard - Structured Workflow Intelligence Invariant Engine
 * 
 * Guarantees strict non-repudiation and prevents authority confusion:
 * - DATA ≠ EVIDENCE ≠ ADMISSION ≠ AUTHORIZATION ≠ ACTION
 * - OBSERVATION ≠ AUTHORITY
 * - UNKNOWN ≠ FALSE ≠ PERMITTED
 * - STABLE ≠ AUTHORIZED
 * - SIGNATURE ≠ TRUTH ≠ AUTHORITY
 * - TESTED ≠ PROVEN ≠ SEALED ≠ PRODUCTION AUTHORIZED
 * - PASS ≠ PROVEN ≠ AUTHORIZED
 * - HASH ≠ AUTHORITY ≠ TRUTH
 */

import { SWIStage, SWIDecision, UserRole, SpineAction, SpinePermitResult } from '../types';

export interface GuardEvaluationResult {
  allowed: boolean;
  nextStage: SWIStage;
  decision: SWIDecision;
  reasons: string[];
  invariantsPreserved: boolean;
}

/**
 * Computes deterministic SHA-256 string for any payload using standard Web Crypto API.
 */
export async function computeSHA256(payload: unknown): Promise<string> {
  const jsonString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous fallback hash generator for synchronous validation pipelines.
 */
export function computeFastHash(payload: unknown): string {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Evaluates whether a transition between SWI stages is structurally valid.
 * Enforces sequential provenance:
 * OBSERVATION -> TESTED -> PROVEN -> SEALED -> PRODUCTION_AUTHORIZED
 */
export function evaluateStageTransition(
  currentStage: SWIStage,
  targetStage: SWIStage,
  role: UserRole,
  hasEvidenceHash: boolean,
  automatedTestsPassed: boolean,
  isDualVerified: boolean
): GuardEvaluationResult {
  const reasons: string[] = [];

  // STAGE 1: Current state check
  if (currentStage === targetStage) {
    return {
      allowed: true,
      nextStage: currentStage,
      decision: 'ADVICE',
      reasons: ['No stage transition requested.'],
      invariantsPreserved: true,
    };
  }

  // INVARIANT: A green status/test must never independently confer authority
  if (targetStage === 'PRODUCTION_AUTHORIZED') {
    // Only administrators, district officers, or ministry have final authorization power
    const authorizedRoles: UserRole[] = ['school_admin', 'district', 'ministry'];
    if (!authorizedRoles.includes(role)) {
      return {
        allowed: false,
        nextStage: currentStage,
        decision: 'DENY',
        reasons: [
          `Authority violation: Role '${role}' lacks institutional authority for PRODUCTION_AUTHORIZED.`,
          'OBSERVATION ≠ AUTHORITY and TESTED ≠ AUTHORIZED.',
        ],
        invariantsPreserved: true,
      };
    }

    if (currentStage !== 'SEALED') {
      return {
        allowed: false,
        nextStage: currentStage,
        decision: 'HALT',
        reasons: [
          `Workflow bypass prevented: Records must be SEALED before PRODUCTION_AUTHORIZED (currently ${currentStage}).`,
          'TESTED ≠ PROVEN ≠ SEALED ≠ PRODUCTION AUTHORIZED.',
        ],
        invariantsPreserved: true,
      };
    }
  }

  // INVARIANT: Cannot reach SEALED without PROVEN
  if (targetStage === 'SEALED') {
    if (currentStage !== 'PROVEN') {
      return {
        allowed: false,
        nextStage: currentStage,
        decision: 'HALT',
        reasons: [
          `Integrity fault: Cannot seal record that is not yet PROVEN (currently ${currentStage}).`,
        ],
        invariantsPreserved: true,
      };
    }

    if (!hasEvidenceHash) {
      return {
        allowed: false,
        nextStage: currentStage,
        decision: 'DENY',
        reasons: ['Tamper-evident sealing requires verified evidence hash.'],
        invariantsPreserved: true,
      };
    }
  }

  // INVARIANT: Cannot reach PROVEN without passing tests and dual validation
  if (targetStage === 'PROVEN') {
    if (currentStage !== 'TESTED') {
      return {
        allowed: false,
        nextStage: currentStage,
        decision: 'HALT',
        reasons: [`Record must be TESTED before PROVEN (currently ${currentStage}).`],
        invariantsPreserved: true,
      };
    }

    if (!automatedTestsPassed) {
      return {
        allowed: false,
        nextStage: currentStage,
        decision: 'DENY',
        reasons: [
          'Validation failed: Automated rules/tests must be confirmed.',
          'PASS ≠ PROVEN ≠ AUTHORIZED.',
        ],
        invariantsPreserved: true,
      };
    }

    if (!isDualVerified) {
      return {
        allowed: false,
        nextStage: currentStage,
        decision: 'HALT',
        reasons: [
          'Proof gap: Dual-party verification required for PROVEN status. Independent human corroboration missing.',
        ],
        invariantsPreserved: true,
      };
    }
  }

  // INVARIANT: Moving to TESTED from OBSERVED
  if (targetStage === 'TESTED') {
    if (currentStage !== 'OBSERVED') {
      return {
        allowed: false,
        nextStage: currentStage,
        decision: 'HALT',
        reasons: [`Invalid backtrack or skip: Cannot transition ${currentStage} -> TESTED.`],
        invariantsPreserved: true,
      };
    }
  }

  return {
    allowed: true,
    nextStage: targetStage,
    decision: targetStage === 'PRODUCTION_AUTHORIZED' ? 'APPROVAL' : 'PASS',
    reasons: [`Transition from ${currentStage} to ${targetStage} is structurally verified.`],
    invariantsPreserved: true,
  };
}

/**
 * Returns human-readable SWI status pill descriptor.
 * Never silently turns UNKNOWN into success.
 */
export function formatSWIStage(stage: SWIStage): { label: string; badgeColor: string; description: string } {
  switch (stage) {
    case 'OBSERVED':
      return {
        label: 'Observed',
        badgeColor: 'text-amber-400 bg-amber-950/60 border border-amber-800/60',
        description: 'Raw observational data recorded. Not yet validated or proven.',
      };
    case 'TESTED':
      return {
        label: 'Tested',
        badgeColor: 'text-blue-400 bg-blue-950/60 border border-blue-800/60',
        description: 'Automated rules evaluated. Does not confer authorization.',
      };
    case 'PROVEN':
      return {
        label: 'Proven',
        badgeColor: 'text-indigo-400 bg-indigo-950/60 border border-indigo-800/60',
        description: 'Corroborated by independent evidence or dual verification.',
      };
    case 'SEALED':
      return {
        label: 'Sealed',
        badgeColor: 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60',
        description: 'Cryptographically sealed with SHA-256 tamper-evident digest.',
      };
    case 'PRODUCTION_AUTHORIZED':
      return {
        label: 'Production Authorized',
        badgeColor: 'text-cyan-400 bg-cyan-950/60 border border-cyan-700/60',
        description: 'Authorized by designated institutional authority.',
      };
    default:
      return {
        label: 'UNKNOWN',
        badgeColor: 'text-slate-400 bg-slate-900 border border-slate-700',
        description: 'Unknown state. Never assume success or permission.',
      };
  }
}

/**
 * The Unbreakable SWI Spine Axiom:
 * Permit(a) ⟺ ∀L,G,S,H: C(a) ⊆ L∩G∩S∩H ∧ E(a) ≠ ∅
 * 
 * Formulated by Kelronmos (Ronald Mosidila)
 */
export const SWI_SPINE_FORMULA = "Permit(a) ⟺ ∀L,G,S,H: C(a) ⊆ L∩G∩S∩H ∧ E(a) ≠ ∅";

export function evaluateSpinePermit(action: SpineAction): SpinePermitResult {
  const failedDomains: Array<'Legal (L)' | 'Governance (G)' | 'Security (S)' | 'Human (H)' | 'Evidence (E)'> = [];

  // Condition 1: Evidence Non-Empty Guarantee: E(a) ≠ ∅
  const evidencePresent =
    Array.isArray(action.evidence) &&
    action.evidence.length > 0 &&
    action.evidence.some(e => typeof e === 'string' && e.trim().length > 0);

  if (!evidencePresent) {
    failedDomains.push('Evidence (E)');
  }

  // Condition 2: Claims C(a) must be a subset of the intersection L ∩ G ∩ S ∩ H
  if (!action.constraints.L_legal) failedDomains.push('Legal (L)');
  if (!action.constraints.G_governance) failedDomains.push('Governance (G)');
  if (!action.constraints.S_security) failedDomains.push('Security (S)');
  if (!action.constraints.H_human) failedDomains.push('Human (H)');

  const allConstraintsMet =
    action.constraints.L_legal &&
    action.constraints.G_governance &&
    action.constraints.S_security &&
    action.constraints.H_human;

  const permitted = evidencePresent && allConstraintsMet;

  return {
    permitted,
    evidencePresent,
    allConstraintsMet,
    failedDomains,
    axiomStatement: SWI_SPINE_FORMULA,
  };
}

