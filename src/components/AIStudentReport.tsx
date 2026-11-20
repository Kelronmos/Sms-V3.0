import React from 'react';
import { motion } from 'motion/react';
import { 
  BrainCircuit, 
  Sparkles, 
  ShieldAlert, 
  BookOpen, 
  Activity,
  Lightbulb,
  ShieldCheck,
  Sun,
  History,
  Search,
  Filter,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from 'lucide-react';

import { AIInteraction, Metric, Student } from '../types';

interface AIReportData {
  wellbeing: {
    status: string;
    drift: string;
  };
  academic: {
    dropout_risk: string;
    bullying_signals: string;
  };
  guidance: {
    study_tip: string;
    security_advice: string;
    wellbeing_action: string;
  };
  history?: AIInteraction[];
}

const defaultReportData: AIReportData = {
  wellbeing: {
    status: "Stable",
    drift: "Slight decrease in late-evening activity. Ensure adequate sleep."
  },
  academic: {
    dropout_risk: "Low",
    bullying_signals: "None Detected"
  },
  guidance: {
    study_tip: "Use 45-min active recall blocks + 10-min tech-free breaks",
    security_advice: "Update portal password; avoid public Wi-Fi",
    wellbeing_action: "15 min sunlight today to regulate circadian rhythm"
  }
};

export const AIStudentReport: React.FC<{ data?: AIReportData; onRate?: (id: string, rating: number, helpful: boolean) => void }> = ({ data = defaultReportData, onRate }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'helpful' | 'unhelpful'>('all');
  const [activeFeedbackId, setActiveFeedbackId] = React.useState<string | null>(null);
  const [feedbackText, setFeedbackText] = React.useState('');

  const filteredHistory = data.history?.filter(item => {
    const matchesSearch = item.user_query.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.ai_response.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'helpful' && item.is_helpful === true) ||
                         (filter === 'unhelpful' && item.is_helpful === false);
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden"
    >
      <div className="bg-indigo-600 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <BrainCircuit className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">SWI AI Assistant</h3>
          <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Student Insight Report</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Wellbeing Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-600">
            <Activity className="w-4 h-4" />
            <h4 className="text-xs font-black uppercase tracking-widest">Wellbeing & Mental Health</h4>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Status</span>
              <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-black">{data.wellbeing.status}</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              <span className="font-bold">Behavioral Drift:</span> {data.wellbeing.drift}
            </p>
          </div>
        </div>

        {/* Academic Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-600">
            <BookOpen className="w-4 h-4" />
            <h4 className="text-xs font-black uppercase tracking-widest">Academic & Risk Assessment</h4>
          </div>
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-700 uppercase">Dropout Risk</span>
              </div>
              <span className="text-xs font-black text-indigo-900">{data.academic.dropout_risk}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-indigo-700 uppercase">Bullying Signals</span>
              </div>
              <span className="text-xs font-black text-emerald-600">{data.academic.bullying_signals}</span>
            </div>
          </div>
        </div>

        {/* Guidance Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-600">
            <Sparkles className="w-4 h-4" />
            <h4 className="text-xs font-black uppercase tracking-widest">Personalized Guidance</h4>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-amber-700 uppercase mb-0.5">Study Tip</p>
                <p className="text-xs text-amber-900">{data.guidance.study_tip}</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-slate-50 rounded-2xl border border-black/5">
              <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase mb-0.5">Security Advice</p>
                <p className="text-xs text-slate-700">{data.guidance.security_advice}</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <Sun className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-emerald-700 uppercase mb-0.5">Wellbeing Action</p>
                <p className="text-xs text-emerald-900">{data.guidance.wellbeing_action}</p>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        {data.history && (
          <div className="space-y-3 pt-4 border-t border-black/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <History className="w-4 h-4" />
                <h4 className="text-xs font-black uppercase tracking-widest">Recent Interactions</h4>
              </div>
              <div className="flex gap-2">
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="text-[10px] font-bold text-slate-400 bg-transparent border-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="helpful">Helpful</option>
                  <option value="unhelpful">Unhelpful</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input 
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 rounded-xl text-[10px] border-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {filteredHistory?.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-black/5 space-y-2">
                  <p className="text-[10px] font-bold text-indigo-600">Q: {item.user_query}</p>
                  <p className="text-[10px] text-slate-600 line-clamp-2">{item.ai_response}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[8px] font-medium text-slate-400">
                      {new Date(item.timestamp?.seconds ? item.timestamp.seconds * 1000 : item.timestamp).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (activeFeedbackId === item.id) {
                            setActiveFeedbackId(null);
                            setFeedbackText('');
                          } else {
                            setActiveFeedbackId(item.id!);
                            setFeedbackText('');
                          }
                        }}
                        className={`p-1 rounded-md transition-colors ${activeFeedbackId === item.id ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 text-slate-400'}`}
                        title="Provide detailed feedback"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => onRate?.(item.id!, 5, true)}
                        className={`p-1 rounded-md transition-colors ${item.is_helpful === true ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-slate-200 text-slate-400'}`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => onRate?.(item.id!, 1, false)}
                        className={`p-1 rounded-md transition-colors ${item.is_helpful === false ? 'bg-rose-100 text-rose-600' : 'hover:bg-slate-200 text-slate-400'}`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {activeFeedbackId === item.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 pt-2 border-t border-black/5"
                    >
                      <textarea 
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="What could be improved?"
                        className="w-full p-2 bg-white border border-black/5 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setActiveFeedbackId(null);
                            setFeedbackText('');
                          }}
                          className="px-2 py-1 text-[8px] font-bold text-slate-400 hover:text-slate-600 uppercase"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => {
                            onRate?.(item.id!, item.is_helpful ? 5 : 1, item.is_helpful || false);
                            console.log(`Feedback for ${item.id}: ${feedbackText}`);
                            setActiveFeedbackId(null);
                            setFeedbackText('');
                          }}
                          className="px-2 py-1 bg-indigo-600 text-white rounded-md text-[8px] font-bold uppercase tracking-widest"
                        >
                          Submit
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
              {filteredHistory?.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center italic py-4">No matching interactions found.</p>
              )}
            </div>
          </div>
        )}

        <div className="pt-2">
          <p className="text-[11px] text-slate-500 italic text-center px-4">
            "Is there a specific area—like your study plan or stress management—you’d like to dive deeper into? I’m here to help."
          </p>
        </div>
      </div>
    </motion.div>
  );
};
