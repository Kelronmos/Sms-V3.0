import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Upload, FileText, AlertTriangle, 
  CheckCircle, Globe, Landmark, School,
  Search, Filter, Download, Info
} from 'lucide-react';

interface Policy {
  id: string;
  title: string;
  level: 'Ministry' | 'District' | 'Admin';
  type: string;
  status: 'Active' | 'Draft' | 'Archived';
  date: string;
  complianceScore: number;
}

interface PolicyComplianceProps {
  role: string;
  institutionId?: string;
}

export const PolicyCompliance: React.FC<PolicyComplianceProps> = ({ role, institutionId }) => {
  const [policies, setPolicies] = useState<Policy[]>([
    { id: '1', title: 'National Education Act 2024', level: 'Ministry', type: 'Law', status: 'Active', date: '2024-01-15', complianceScore: 98 },
    { id: '2', title: 'Gaborone Regional Resource Allocation', level: 'District', type: 'Bylaw', status: 'Active', date: '2024-02-10', complianceScore: 92 },
    { id: '3', title: 'Lobatse Secondary Prospectus', level: 'Admin', type: 'Prospectus', status: 'Active', date: '2024-03-01', complianceScore: 85 },
  ]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadLevel, setUploadLevel] = useState<'Ministry' | 'District' | 'Admin'>(
    role === 'ministry' ? 'Ministry' : role === 'district' ? 'District' : 'Admin'
  );

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
      alert('Policy uploaded and vectorized successfully. CEK Sentinel updated.');
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">Policy Compliance</h2>
          <p className="text-slate-500">Sovereign Ingestion & Legal Vector Monitoring</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Sentinel Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Policy List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Active Policies & Laws</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search policies..." 
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-black/5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {policies.map((policy) => (
                <motion.div 
                  layout
                  key={policy.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-black/5 hover:border-black/10 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        policy.level === 'Ministry' ? 'bg-indigo-100 text-indigo-600' :
                        policy.level === 'District' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {policy.level === 'Ministry' ? <Globe className="w-6 h-6" /> :
                         policy.level === 'District' ? <Landmark className="w-6 h-6" /> :
                         <School className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black">{policy.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{policy.level} Level</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">•</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{policy.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <div className={`w-2 h-2 rounded-full ${policy.complianceScore > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-sm font-black">{policy.complianceScore}% Compliance</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vector Match Score</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Policy Heatmap (Ministry Only) */}
          {role === 'ministry' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">National Compliance Heatmap</h3>
              <div className="grid grid-cols-4 gap-4">
                {['Gaborone', 'Francistown', 'Maun', 'Lobatse', 'Molepolole', 'Serowe', 'Kanye', 'Selibe-Phikwe'].map(region => (
                  <div key={region} className="p-4 bg-slate-50 rounded-2xl border border-black/5 text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2">{region}</div>
                    <div className="text-xl font-black text-emerald-500">{(85 + Math.random() * 15).toFixed(1)}%</div>
                    <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '92%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Upload & Stats */}
        <div className="space-y-6">
          {/* Sovereign Upload Layer */}
          <div className="bg-black text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                Policy Ingestion
              </h3>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Policy Level</label>
                  <select 
                    value={uploadLevel}
                    onChange={(e) => setUploadLevel(e.target.value as any)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Ministry">Ministry (National Laws)</option>
                    <option value="District">District (Regional Bylaws)</option>
                    <option value="Admin">Admin (School Prospectus)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Document Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Education Act 2024"
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-emerald-500/50 transition-all cursor-pointer">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Drag & Drop PDF/DOCX</p>
                </div>
                <button 
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Vectorizing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Ingest Policy
                    </>
                  )}
                </button>
              </form>
            </div>
            <Globe className="absolute -bottom-8 -right-8 w-32 h-32 text-white/5" />
          </div>

          {/* Compliance Sentinel Stats */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Compliance Alerts
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 bg-rose-200 text-rose-700 rounded text-[8px] font-black uppercase">Critical</span>
                  <span className="text-[8px] font-bold text-slate-400">2h ago</span>
                </div>
                <p className="text-xs font-bold text-rose-900">Policy Drift Detected</p>
                <p className="text-[10px] text-rose-700/70 mt-1">Lobatse Secondary prospectus deviates from National Safety Vector Vp_22.</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-700 rounded text-[8px] font-black uppercase">Warning</span>
                  <span className="text-[8px] font-bold text-slate-400">5h ago</span>
                </div>
                <p className="text-xs font-bold text-amber-900">Resource Allocation Gap</p>
                <p className="text-[10px] text-amber-700/70 mt-1">District allocation for STEM labs is below the 2024 Bylaw requirement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
