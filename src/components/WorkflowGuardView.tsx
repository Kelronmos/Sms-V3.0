/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Workflow Guard - Structured Workflow Intelligence Invariant Inspector
 * 
 * Strictly preserves:
 * - DATA ≠ EVIDENCE ≠ ADMISSION ≠ AUTHORIZATION ≠ ACTION
 * - OBSERVATION ≠ AUTHORITY
 * - UNKNOWN ≠ FALSE ≠ PERMITTED
 * - STABLE ≠ AUTHORIZED
 * - SIGNATURE ≠ TRUTH ≠ AUTHORITY
 * - TESTED ≠ PROVEN ≠ SEALED ≠ PRODUCTION AUTHORIZED
 * - PASS ≠ PROVEN ≠ AUTHORIZED
 * - HASH ≠ AUTHORITY ≠ TRUTH
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Lock,
  FileCode,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { SWIStage, UserRole, UserProfile } from '../types';
import {
  evaluateStageTransition,
  computeSHA256,
  formatSWIStage,
  GuardEvaluationResult,
} from '../services/swiWorkflowGuard';

interface WorkflowGuardViewProps {
  currentUser: UserProfile;
}

const ALL_STAGES: SWIStage[] = [
  'OBSERVED',
  'TESTED',
  'PROVEN',
  'SEALED',
  'PRODUCTION_AUTHORIZED',
];

export const WorkflowGuardView: React.FC<WorkflowGuardViewProps> = ({ currentUser }) => {
  const [currentStage, setCurrentStage] = useState<SWIStage>('OBSERVED');
  const [targetStage, setTargetStage] = useState<SWIStage>('TESTED');
  const [simulatedRole, setSimulatedRole] = useState<UserRole>(currentUser.role);
  const [hasEvidenceHash, setHasEvidenceHash] = useState(true);
  const [automatedTestsPassed, setAutomatedTestsPassed] = useState(true);
  const [isDualVerified, setIsDualVerified] = useState(true);

  const [evaluation, setEvaluation] = useState<GuardEvaluationResult | null>(null);
  const [generatedHash, setGeneratedHash] = useState<string>('');

  const runEvaluation = async () => {
    const result = evaluateStageTransition(
      currentStage,
      targetStage,
      simulatedRole,
      hasEvidenceHash,
      automatedTestsPassed,
      isDualVerified
    );
    setEvaluation(result);

    const testPayload = {
      transitionFrom: currentStage,
      transitionTo: targetStage,
      role: simulatedRole,
      timestamp: new Date().toISOString(),
      nonce: Math.random(),
    };
    const hash = await computeSHA256(testPayload);
    setGeneratedHash(hash);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">SWI Workflow Guard & Invariant Engine</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Verifies execution integrity boundaries and prevents authority confusion across educational workflows.
        </p>
      </div>

      {/* Main Grid: Interactive Evaluator & Invariant Axiom Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Transition Simulator (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-cyan-400" />
                <span>Transition Integrity Simulator</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate role-based promotion across the sequential verification ladder
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              ACTIVE EVALUATOR
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Stage */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Current Origin Stage
              </label>
              <select
                value={currentStage}
                onChange={e => setCurrentStage(e.target.value as SWIStage)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                {ALL_STAGES.map(s => (
                  <option key={s} value={s}>
                    {s} ({formatSWIStage(s).label})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Stage */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Transition Stage
              </label>
              <select
                value={targetStage}
                onChange={e => setTargetStage(e.target.value as SWIStage)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                {ALL_STAGES.map(s => (
                  <option key={s} value={s}>
                    {s} ({formatSWIStage(s).label})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Authorizing Persona Role (OBSERVATION ≠ AUTHORITY)
            </label>
            <select
              value={simulatedRole}
              onChange={e => setSimulatedRole(e.target.value as UserRole)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="student">Student (Limited to Observation)</option>
              <option value="teacher">Teacher (Can Test & Corroborate)</option>
              <option value="parent">Parent / Guardian (Observation & Advisory)</option>
              <option value="counselor">Counselor (Dual-Verification Peer)</option>
              <option value="school_admin">School Admin (Institutional Authority)</option>
              <option value="district">District Officer (Regional Authority)</option>
              <option value="ministry">Ministry Official (Sovereign Authority)</option>
            </select>
          </div>

          {/* Verification Guard Gates */}
          <div className="space-y-2.5 p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Prerequisite Control Conditions
            </span>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={automatedTestsPassed}
                onChange={e => setAutomatedTestsPassed(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <span>Automated Rules & Constraints Passed (PASS ≠ PROVEN)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isDualVerified}
                onChange={e => setIsDualVerified(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <span>Dual-Party Independent Human Corroboration</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasEvidenceHash}
                onChange={e => setHasEvidenceHash(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <span>Cryptographic Tamper-Evident Evidence Hash Attached</span>
            </label>
          </div>

          <button
            onClick={runEvaluation}
            className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Evaluate Workflow Invariants</span>
          </button>

          {/* Evaluation Result */}
          {evaluation && (
            <div
              className={`p-4 rounded-xl border animate-in fade-in duration-150 ${
                evaluation.allowed
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {evaluation.allowed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span className="font-bold text-sm">
                    {evaluation.allowed ? 'TRANSITION PERMITTED' : 'TRANSITION HALTED / DENIED'}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  Decision: {evaluation.decision}
                </span>
              </div>

              <div className="space-y-1.5 text-xs mt-3">
                {evaluation.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-bold text-slate-400">·</span>
                    <span className="leading-relaxed">{r}</span>
                  </div>
                ))}
              </div>

              {generatedHash && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                  <span>SHA-256 State Fingerprint: </span>
                  <span className="text-slate-300 break-all">{generatedHash}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: SWI Axioms & Sequential Ladder (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sequential Ladder */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict Progression Ladder</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Stages cannot be skipped. Each state requires distinct proof and authority.
            </p>

            <div className="space-y-3">
              {ALL_STAGES.map((s, idx) => {
                const info = formatSWIStage(s);
                const isCurrent = currentStage === s;
                const isTarget = targetStage === s;

                return (
                  <div
                    key={s}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      isTarget
                        ? 'bg-cyan-950/60 border-cyan-500/80 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-slate-800/80 border-slate-600 text-slate-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-semibold text-slate-200">
                        {idx + 1}. {info.label}
                      </span>
                      {isCurrent && <span className="text-[10px] text-amber-400 font-bold">CURRENT</span>}
                      {isTarget && !isCurrent && <span className="text-[10px] text-cyan-400 font-bold">TARGET</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {info.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Axioms Box */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <h3 className="text-sm font-semibold text-slate-100 mb-2">Mandatory Distinctions</h3>
            <div className="space-y-2 font-mono text-[11px] text-slate-400">
              <p className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                DATA ≠ EVIDENCE ≠ ADMISSION ≠ AUTHORIZATION ≠ ACTION
              </p>
              <p className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                OBSERVATION ≠ AUTHORITY
              </p>
              <p className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                UNKNOWN ≠ FALSE ≠ PERMITTED
              </p>
              <p className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                SIGNATURE ≠ TRUTH ≠ AUTHORITY
              </p>
              <p className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                PASS ≠ PROVEN ≠ AUTHORIZED
              </p>
              <p className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                HASH ≠ AUTHORITY ≠ TRUTH
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
