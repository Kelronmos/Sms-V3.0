import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Heart, Activity, Calendar, 
  BookOpen, ShieldCheck, Zap, 
  BrainCircuit, TrendingUp, AlertCircle,
  MessageSquare, Award, Star, Clock,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  FileText, ShieldAlert, Landmark, Search,
  History as HistoryIcon
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { Student, Metric, AIInteraction } from '../types';
import { fetchMetrics, fetchAIHistory, fetchAIInsights } from '../services/api';
import { Gauge } from './Gauge';

interface StudentDetailViewProps {
  student: Student;
  onClose: () => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ student, onClose }) => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [aiHistory, setAiHistory] = useState<AIInteraction[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [m, h, i] = await Promise.all([
          fetchMetrics(student.student_id),
          fetchAIHistory(student.student_id),
          fetchAIInsights(student.student_id)
        ]);
        setMetrics(m);
        setAiHistory(h);
        setAiInsights(i);
      } catch (error) {
        console.error("Failed to load student details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [student.student_id]);

  const moodData = metrics.slice(0, 30).reverse().map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { weekday: 'short' }),
    mood: m.mood_score,
    engagement: m.engagement_hours,
    participation: m.participation_score || 0
  }));

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto border-l border-black/5"
    >
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-xl">
              {student.name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter">{student.name}</h2>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{student.class_id} • {student.student_id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-black"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Analyzing Student Data...</p>
          </div>
        ) : (
          <>
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wellbeing Gauge */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col items-center justify-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 self-start">Wellbeing Score</h3>
                <Gauge 
                  value={metrics.length > 0 ? metrics[0].mood_score * 10 : 0} 
                  label="Current Wellbeing" 
                  size="sm"
                  details={{
                    stress: metrics.length > 0 ? metrics[0].stress_score : 0,
                    sleep: metrics.length > 0 ? metrics[0].sleep_hours : 0,
                    engagement: metrics.length > 0 ? metrics[0].engagement_hours : 0
                  }}
                />
              </div>

              {/* Academic Performance */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Academic Performance</h3>
                <div className="space-y-4">
                  {[
                    { subject: 'Mathematics', grade: 'A', progress: 85, color: 'bg-indigo-500' },
                    { subject: 'Science', grade: 'B+', progress: 72, color: 'bg-emerald-500' },
                    { subject: 'English', grade: 'A-', progress: 78, color: 'bg-amber-500' },
                    { subject: 'Setswana', grade: 'A', progress: 92, color: 'bg-rose-500' },
                  ].map((s, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-600">{s.subject}</span>
                        <span className="text-slate-900">{s.grade}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${s.progress}%` }}
                          className={`h-full ${s.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Insights Section */}
            <div className="bg-black text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-amber-400" />
                  AI Wellbeing Insight
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed italic mb-4">
                  "{aiInsights?.summary || `${student.name} shows strong academic potential but has experienced a slight dip in engagement over the last 3 days. Recommendation: Check-in regarding recent Math assignment.`}"
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-amber-400 border border-amber-400/20">
                    High Potential
                  </span>
                  <span className="px-2 py-1 bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-400/20">
                    Strong Attendance
                  </span>
                  <span className="px-2 py-1 bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-rose-400 border border-rose-400/20">
                    Engagement Dip
                  </span>
                </div>
              </div>
              <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5" />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-black/5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic</p>
                <p className="text-lg font-black text-indigo-600">{student.academic_standing}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-black/5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance</p>
                <p className="text-lg font-black text-emerald-600">{student.attendance_rate}%</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-black/5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mood Avg</p>
                <p className="text-lg font-black text-amber-600">{(metrics.reduce((acc, m) => acc + m.mood_score, 0) / metrics.length || 0).toFixed(1)}</p>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                7-Day Wellbeing Trend
              </h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodData}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      domain={[0, 10]}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorMood)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent AI History */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-slate-400" />
                Recent AI Interactions
              </h3>
              <div className="space-y-3">
                {aiHistory.slice(0, 3).map((interaction, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-black/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(interaction.timestamp).toLocaleDateString()}
                      </span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                        interaction.type === 'wellbeing' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {interaction.type}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 line-clamp-2 italic">"{interaction.user_query}"</p>
                  </div>
                ))}
                {aiHistory.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4">No recent AI interactions recorded.</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button className="py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Message Student
              </button>
              <button className="py-4 bg-white text-black border border-black/5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Log Incident
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
