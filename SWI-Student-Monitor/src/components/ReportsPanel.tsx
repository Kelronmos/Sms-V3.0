import React, { useState } from 'react';
import { X, FileDown, Printer, Braces, Eye } from 'lucide-react';
import { fetchReport } from '../services/api';
import { ReportJson, downloadPdf, printPdf, downloadJson } from '../services/reportPdf';
import { User } from '../types';

const KINDS_AUTH = [
  { id: 'summary', label: 'System summary (live counts)' },
  { id: 'audit', label: 'Audit log (recent events)' },
];

export const ReportsPanel: React.FC<{ user: User | null; onClose: () => void }> = ({ user, onClose }) => {
  const isMinistry = !!user && !user.is_demo && user.role === 'ministry';
  const [kind, setKind] = useState(isMinistry ? 'summary' : 'demo');
  const [report, setReport] = useState<ReportJson | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true); setError(''); setReport(null);
    try { setReport(await fetchReport(kind)); }
    catch (e: any) { setError(e.message || 'UNAVAILABLE'); }
    finally { setLoading(false); }
  };

  const btn = 'px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2';
  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black">Reports</h2>
          <button onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        {!isMinistry && (
          <p className="text-xs text-slate-500">
            Only a verified Ministry account can generate system reports. You can generate a report on the <b>synthetic demo dataset</b>; every page is marked as demonstration data.
          </p>
        )}
        <select value={kind} onChange={e => setKind(e.target.value)} className="w-full border rounded-xl p-2 text-sm">
          {isMinistry ? KINDS_AUTH.map(k => <option key={k.id} value={k.id}>{k.label}</option>) : <option value="demo">Demo dataset summary (synthetic)</option>}
        </select>
        <button onClick={generate} disabled={loading} className={`${btn} bg-black text-white`}>
          <Eye className="w-4 h-4" /> {loading ? 'Generating…' : 'Generate report'}
        </button>
        {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
        {report && (
          <div className="space-y-3">
            <div className={`p-3 rounded-xl text-[11px] font-bold ${report.synthetic ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{report.marking}</div>
            <div className="text-[11px] text-slate-500 break-all">ID {report.report_id} · {report.generated_at} · sha256 {report.sha256.slice(0, 16)}…</div>
            <pre className="bg-slate-50 rounded-xl p-3 text-[10px] max-h-64 overflow-auto">{JSON.stringify(report.data, null, 2)}</pre>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => downloadPdf(report)} className={`${btn} bg-emerald-500 text-white`}><FileDown className="w-4 h-4" /> Download PDF</button>
              <button onClick={() => printPdf(report)} className={`${btn} bg-slate-800 text-white`}><Printer className="w-4 h-4" /> Print</button>
              <button onClick={() => downloadJson(report)} className={`${btn} bg-white border`}><Braces className="w-4 h-4" /> Download JSON</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
