/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Boundary & Invariant Banner
 * Preserves Structured Workflow Intelligence principles prominently.
 */

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react';

export const SWIBoundaryBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 uppercase tracking-wider text-[11px]">
                SWI Unbreakable Spine Active
              </span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 font-mono">
                Never Break Spine
              </span>
            </div>
            <p className="text-cyan-300/90 mt-0.5 font-mono text-[11px] font-semibold">
              Permit(a) ⟺ ∀L,G,S,H: C(a) ⊆ L∩G∩S∩H ∧ E(a) ≠ ∅
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium self-start sm:self-auto transition-colors"
        >
          <span>{isExpanded ? 'Hide Spine Matrix' : 'View Spine Invariant Matrix'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-150">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-cyan-800/40">
            <div className="text-[11px] font-bold text-cyan-300 font-mono flex items-center justify-between">
              <span>SPINE AXIOM: Permit(a) ⟺ ∀L,G,S,H: C(a) ⊆ L∩G∩S∩H ∧ E(a) ≠ ∅</span>
              <span className="text-[10px] text-slate-400">Kelronmos Architecture</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Action <span className="font-mono text-slate-200">a</span> is permitted if and only if its consequences <span className="font-mono text-slate-200">C(a)</span> simultaneously satisfy the intersection of Legal (L), Governance (G), Security (S), and Human (H) constraints AND the evidence set <span className="font-mono text-slate-200">E(a)</span> is strictly non-empty.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-mono font-bold text-cyan-400 block mb-0.5">L (Legal)</span>
              <p className="text-[10px] text-slate-400 leading-tight">
                FERPA/COPPA compliance, statutory student privacy, no unlawful surveillance.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-mono font-bold text-blue-400 block mb-0.5">G (Governance)</span>
              <p className="text-[10px] text-slate-400 leading-tight">
                Role authority & dual-verification. Progression ladder non-bypassable.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-mono font-bold text-indigo-400 block mb-0.5">S (Security)</span>
              <p className="text-[10px] text-slate-400 leading-tight">
                Cryptographic SHA-256 seal, tamper-evidence, zero-trust integrity.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-mono font-bold text-emerald-400 block mb-0.5">H (Human)</span>
              <p className="text-[10px] text-slate-400 leading-tight">
                Independent human oversight, guardian consent, student dignity.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-amber-800/60 sm:col-span-2 lg:col-span-1">
              <span className="font-mono font-bold text-amber-400 block mb-0.5">E(a) ≠ ∅</span>
              <p className="text-[10px] text-slate-400 leading-tight">
                Evidence must be non-empty. No unsubstantiated action is permitted.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
