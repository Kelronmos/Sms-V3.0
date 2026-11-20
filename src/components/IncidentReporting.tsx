import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Shield, Send, Info } from 'lucide-react';
import { submitIncident } from '../services/api';

interface IncidentReportingProps {
  studentId: string;
  reportedBy: string;
  onSuccess: () => void;
}

export const IncidentReporting: React.FC<IncidentReportingProps> = ({ studentId, reportedBy, onSuccess }) => {
  const [category, setCategory] = useState<'bullying' | 'absenteeism' | 'substance_abuse' | 'behavioral' | 'other'>('behavioral');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      await submitIncident({
        student_id: studentId,
        category,
        description,
        reported_by: reportedBy
      });
      setDescription('');
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to submit incident. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: 'behavioral', label: 'Behavioral Escalation', color: 'bg-amber-500' },
    { id: 'bullying', label: 'Bullying / Harassment', color: 'bg-rose-500' },
    { id: 'absenteeism', label: 'Chronic Absenteeism', color: 'bg-indigo-500' },
    { id: 'substance_abuse', label: 'Substance Abuse', color: 'bg-purple-500' },
    { id: 'other', label: 'Other Concern', color: 'bg-slate-500' },
  ];

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-rose-100 p-2 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Log SWI Incident</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SAD-DFU Protocol Active</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id as any)}
              className={`p-3 rounded-xl border text-left transition-all ${
                category === cat.id 
                  ? 'border-black bg-slate-50 shadow-sm' 
                  : 'border-slate-100 hover:border-slate-300'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${cat.color} mb-2`} />
              <span className="text-[10px] font-bold uppercase tracking-tight leading-none block">
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide detailed context for the SWI drift analysis..."
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-black outline-none resize-none"
            required
          />
        </div>

        {error && (
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <p className="text-[10px] text-rose-700 font-bold">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
            This report will trigger an immediate SWI Drift Analysis. High-severity incidents are automatically escalated to the District Level (L6) within 3 minutes.
          </p>
        </div>

        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
        >
          <Shield className="w-4 h-4" />
          {isLoading ? 'Processing SWI Log...' : 'Submit Incident Report'}
        </button>
      </form>
    </div>
  );
};
