/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Policy & Institutional Protocol Assistant
 * Grounded in Structured Workflow Intelligence axioms and student privacy covenants.
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  ShieldCheck,
  Send,
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { UserProfile } from '../types';

interface AIAssistantViewProps {
  currentUser: UserProfile;
}

interface QAItem {
  question: string;
  answer: string;
  category: string;
  citation: string;
}

const PRESET_TOPICS: QAItem[] = [
  {
    question: 'What is the operational distinction between TESTED and PROVEN?',
    answer:
      'In SWI, PASS ≠ PROVEN ≠ AUTHORIZED. The TESTED stage indicates that automated software checks, data format validations, or rule thresholds have passed successfully. However, a passing test does not establish empirical truth. The PROVEN stage requires independent human corroboration or dual-party corroboration verifying that the underlying real-world event occurred as reported.',
    category: 'SWI Control Invariants',
    citation: 'SWI Governance Standard §4.2 — Provenance Hierarchy',
  },
  {
    question: 'How does SWI prevent false claims of offline synchronization?',
    answer:
      'Under Cross-Platform Rule #8, a queued write is NEVER represented as a successfully synchronized write. Writes generated while offline are assigned idempotent nonces, stored in local encrypted partition, and clearly marked with status QUEUED_OFFLINE. Synchronization only transitions to RESOLVED following a confirmed cryptographic handshake with the server, with role authorizations revalidated upon sync.',
    category: 'Cross-Platform Architecture',
    citation: 'SWI Cross-Platform Standard §8.1 — Offline Queue Integrity',
  },
  {
    question: 'What are the strict rules governing student device sensors (camera, mic, GPS)?',
    answer:
      'Per Student Privacy Covenant #7, sensor interfaces are strictly dormant upon application launch. Hardware permissions may only be prompted when a user explicitly initiates an authorized feature (such as examination proctoring or verified campus check-in). The interface must prominently display a live active indicator, handle denials gracefully without crashing, and immediately terminate all media tracks when the feature is closed.',
    category: 'Student Privacy & Hardware',
    citation: 'Student Privacy Covenant §7.3 — Sensor Dormancy & Lifecycle',
  },
  {
    question: 'Who possesses authority to transition an incident to PRODUCTION_AUTHORIZED?',
    answer:
      'OBSERVATION ≠ AUTHORITY. While teachers, counselors, and students may log observations, run tests, and corroborate evidence, only institutional executive roles (School Admin, District Officer, or Ministry Inspector) possess legal and institutional standing to grant PRODUCTION_AUTHORIZED status. Furthermore, records cannot skip steps; they must be cryptographically SEALED before final authorization.',
    category: 'Institutional Authority',
    citation: 'SWI Role-Based Access Control Specification §3.7',
  },
];

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ currentUser }) => {
  const [activeItem, setActiveItem] = useState<QAItem>(PRESET_TOPICS[0]);
  const [customQuery, setCustomQuery] = useState('');
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    // Grounded deterministic response aligned with SWI principles
    const query = customQuery.toLowerCase();
    let response = '';

    if (query.includes('1.2m') || query.includes('user count') || query.includes('fake')) {
      response =
        'Data Provenance Notice: Under SWI honesty rules, all artificial counter inflations (such as historical 1.2M simulation figures) have been excised. Only verifiable rows in the local database or explicitly marked synthetic demonstration fixtures are displayed.';
    } else if (query.includes('privacy') || query.includes('camera') || query.includes('sensor')) {
      response =
        'Sensor Privacy Policy: Device sensors (camera, mic, location) are never polled automatically. They require on-demand explicit consent, feature rationale disclosure, and immediate media track teardown upon completion.';
    } else if (query.includes('hash') || query.includes('sha-256') || query.includes('signature')) {
      response =
        'Cryptographic Invariant: HASH ≠ AUTHORITY ≠ TRUTH. SHA-256 digests prove non-repudiation and tamper-evidence, but do not independently confer authority or establish that an underlying statement is true.';
    } else {
      response = `SWI Protocol Guidance: For queries regarding "${customQuery.trim()}", all operations are governed by the core distinction: DATA ≠ EVIDENCE ≠ ADMISSION ≠ AUTHORIZATION ≠ ACTION. Please consult your institutional administrator (${currentUser.schoolName || 'Metropolitan Academy'}) for formal policy determinations.`;
    }

    setCustomAnswer(response);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">SWI Policy & Governance Assistant</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Grounded institutional guidance on Structured Workflow Intelligence rules, student privacy, and authority boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Preset Inquiries & Interactive Console (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Core Institutional Policy Inquiries</span>
            </h2>

            <div className="space-y-2">
              {PRESET_TOPICS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveItem(item);
                    setCustomAnswer(null);
                  }}
                  className={`w-full p-3 rounded-lg text-left text-xs transition-all border ${
                    activeItem.question === item.question && !customAnswer
                      ? 'bg-cyan-950/60 border-cyan-500/80 text-white font-medium shadow-sm'
                      : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{item.question}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Category: {item.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Ask Custom Question Box */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">Query SWI Governance Knowledgebase</h2>
            <form onSubmit={handleAsk} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask about workflow guard stages, evidence seals, or sensor privacy..."
                  value={customQuery}
                  onChange={e => setCustomQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Inquire</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Grounded Policy Response (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Verified Policy Citation
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">GROUNDED</span>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-100">
              {customAnswer ? customQuery : activeItem.question}
            </h3>

            <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
              {customAnswer ? customAnswer : activeItem.answer}
            </div>

            <div className="pt-2 text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/80">
              <span>Citation Reference:</span>
              <span className="text-slate-300 font-semibold truncate max-w-[200px]">
                {customAnswer ? 'SWI Governance Rule #1' : activeItem.citation}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
