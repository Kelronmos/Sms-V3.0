/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Evidence Reports & Institutional Audit Log
 * Matches official report structures, watermarking, and SHA-256 verification.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Code,
  Lock,
} from 'lucide-react';
import { SWIReport, UserProfile } from '../types';
import { api } from '../services/api';

interface ReportsAndAuditingViewProps {
  currentUser: UserProfile;
}

export const ReportsAndAuditingView: React.FC<ReportsAndAuditingViewProps> = ({ currentUser }) => {
  const [reportKind, setReportKind] = useState<SWIReport['kind']>('system_summary');
  const [currentReport, setCurrentReport] = useState<SWIReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const fetchReport = async (kind: SWIReport['kind']) => {
    setIsLoading(true);
    const report = await api.generateReport(kind, currentUser);
    setCurrentReport(report);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReport(reportKind);
  }, [reportKind, currentUser]);

  const handleCopyHash = () => {
    if (currentReport?.sha256) {
      navigator.clipboard.writeText(currentReport.sha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!currentReport) return;
    const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentReport.reportId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Institutional Evidence & Audit Reports</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tamper-evident system summaries, audit events, and compliance reports with non-repudiable SHA-256 seals.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs (No pills, clean segmented buttons) */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg no-print overflow-x-auto">
        <button
          onClick={() => setReportKind('system_summary')}
          className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            reportKind === 'system_summary'
              ? 'bg-slate-800 text-slate-100 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          System Summary
        </button>
        <button
          onClick={() => setReportKind('demo_summary')}
          className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            reportKind === 'demo_summary'
              ? 'bg-slate-800 text-slate-100 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Demonstration Summary
        </button>
        <button
          onClick={() => setReportKind('audit_log')}
          className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            reportKind === 'audit_log'
              ? 'bg-slate-800 text-slate-100 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit Log Events
        </button>
        <button
          onClick={() => setReportKind('student_wellbeing')}
          className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            reportKind === 'student_wellbeing'
              ? 'bg-slate-800 text-slate-100 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Wellbeing Telemetry
        </button>
      </div>

      {/* Rendered Document Sheet */}
      {currentReport && (
        <div className="p-8 sm:p-10 rounded-xl bg-white text-slate-900 shadow-xl border border-slate-300 font-sans print:shadow-none print:border-none print:p-0">
          
          {/* Header Bar */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  SAMH SWI Student Monitor — {currentReport.kind.replace('_', ' ')}
                </h2>
                <div className="text-xs text-slate-600 space-y-0.5 mt-2 font-mono">
                  <div>Report ID: <span className="font-semibold text-slate-900">{currentReport.reportId}</span></div>
                  <div>Generated: {currentReport.generatedAt}</div>
                  <div>Scope: {currentReport.scope}</div>
                  <div>Environment: {currentReport.environment}</div>
                </div>
              </div>
            </div>

            {/* Official Marking Banner */}
            <div
              className={`mt-4 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-center rounded ${
                currentReport.synthetic
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              {currentReport.marking}
            </div>
          </div>

          {/* Watermark for Demo Reports */}
          {currentReport.synthetic && (
            <div className="p-3 mb-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                NOTICE: This report covers synthetic fixtures generated for system validation. It contains no personally identifiable student records.
              </span>
            </div>
          )}

          {/* Data Payload Display */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
                Report Dataset Body
              </h3>

              {currentReport.kind === 'audit_log' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                      <tr>
                        <th className="py-2 px-3">Event ID</th>
                        <th className="py-2 px-3">Action</th>
                        <th className="py-2 px-3">Actor ID</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {currentReport.data.events?.map((ev: any) => (
                        <tr key={ev.id}>
                          <td className="py-2 px-3 text-slate-600 truncate max-w-[120px]">{ev.id}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{ev.action}</td>
                          <td className="py-2 px-3 text-slate-700">{ev.userId}</td>
                          <td className="py-2 px-3 text-slate-600">{ev.category}</td>
                          <td className="py-2 px-3 text-slate-600">{ev.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(currentReport.data).map(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                      return (
                        <div key={key} className="p-3 bg-slate-50 border border-slate-200 rounded-lg col-span-1 sm:col-span-2">
                          <span className="text-xs font-semibold text-slate-700 capitalize block mb-1">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <pre className="text-[11px] font-mono text-slate-800 overflow-x-auto">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cryptographic Proof Seal */}
            <div className="pt-6 border-t-2 border-slate-900 text-xs text-slate-700 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">
                  SHA-256 of report body (verification reference):
                </span>
                <button
                  onClick={handleCopyHash}
                  className="flex items-center gap-1.5 text-cyan-700 hover:text-cyan-900 font-mono text-[11px] no-print"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedHash ? 'Copied!' : 'Copy Hash'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-slate-100 rounded border border-slate-300 font-mono text-[11px] text-slate-900 break-all select-all">
                {currentReport.sha256}
              </div>
              <p className="text-[10px] text-slate-500 italic">
                CONFIDENTIAL — Counts derived from persisted records. No official verification is implied.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
