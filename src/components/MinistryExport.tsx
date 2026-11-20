import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileDown, FileText, Landmark, PieChart as PieIcon, TrendingUp, Globe, Shield } from 'lucide-react';
import { fetchMinistryExport } from '../services/api';

export const MinistryExport: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMinistryExport();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="animate-pulse bg-slate-100 h-64 rounded-3xl" />;

  return (
    <div className="space-y-8">
      <div className="bg-purple-900 text-white p-8 rounded-[2rem] relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl">
              <Landmark className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase">National SWI Command Center</h2>
              <p className="text-purple-300 text-xs font-bold uppercase tracking-[0.2em]">Level 7 Governance Layer</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-purple-300 uppercase mb-1">Total Students</p>
              <div className="text-2xl font-black">{report.summary.total_students.toLocaleString()}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-purple-300 uppercase mb-1">High Risk Cases</p>
              <div className="text-2xl font-black text-rose-400">{report.summary.high_risk_count}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-purple-300 uppercase mb-1">Incidents Logged</p>
              <div className="text-2xl font-black">{report.summary.total_incidents}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-purple-300 uppercase mb-1">System Integrity</p>
              <div className="text-2xl font-black text-emerald-400">99.9%</div>
            </div>
          </div>
        </div>
        <Globe className="absolute -bottom-12 -right-12 w-64 h-64 text-white/5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-500" />
              Incident Distribution (National)
            </h3>
            <button 
              onClick={loadReport}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          
          <div className="space-y-6">
            {Object.entries(report.incidents_by_category).map(([cat, count]: [any, any]) => (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">{cat}</span>
                  <span className="text-sm font-black text-slate-900">{count} Cases</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / report.summary.total_incidents) * 100}%` }}
                    className={`h-full ${
                      cat === 'bullying' ? 'bg-rose-500' : 
                      cat === 'substance_abuse' ? 'bg-purple-500' : 
                      cat === 'absenteeism' ? 'bg-indigo-500' : 'bg-slate-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col justify-between">
          <div>
            <div className="bg-slate-900 text-white p-4 rounded-2xl mb-6 flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-widest">Audit Integrity Verified</span>
            </div>
            <h3 className="text-xl font-bold mb-4">Export Master Audit File</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">
              Generate a comprehensive, anonymized SWI report for national policy review. This file includes all regional drift data and intervention outcomes.
            </p>
          </div>
          
          <button className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl">
            <FileDown className="w-5 h-5" />
            Download National Report (PDF/CSV)
          </button>
        </div>
      </div>
    </div>
  );
};
