import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RefreshCw, 
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

interface DailyReport {
  date: string;
  tasks_completed: number;
  total_tasks: number;
  wellbeing_score: number;
  engagement_score: number;
  summary: string;
  highlights: string[];
  status: 'excellent' | 'good' | 'average' | 'needs_attention';
}

export const LiveSimulationReports: React.FC = () => {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(2000); // 2 seconds per day

  // Generate 30 days of mock data
  const reports: DailyReport[] = useMemo(() => {
    const data: DailyReport[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const mood = 3 + Math.random() * 2;
      const tasks = 5 + Math.floor(Math.random() * 8);
      const completed = Math.floor(tasks * (0.6 + Math.random() * 0.4));
      
      let status: DailyReport['status'] = 'good';
      if (mood > 4.5 && completed / tasks > 0.8) status = 'excellent';
      else if (mood < 3.5) status = 'needs_attention';
      else if (completed / tasks < 0.6) status = 'average';

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        tasks_completed: completed,
        total_tasks: tasks,
        wellbeing_score: Number(mood.toFixed(1)),
        engagement_score: Number((70 + Math.random() * 30).toFixed(1)),
        summary: `Day ${30-i} of the simulation. ${status === 'excellent' ? 'Exceptional' : 'Steady'} progress observed across all key learning modules.`,
        highlights: [
          `Completed ${completed} tasks`,
          `Maintained ${mood.toFixed(1)} wellbeing score`,
          `${Math.floor(Math.random() * 5 + 1)} AI interactions logged`
        ],
        status
      });
    }
    return data;
  }, []);

  useEffect(() => {
    let interval: any;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentDayIndex((prev) => (prev + 1) % reports.length);
      }, simulationSpeed);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, simulationSpeed, reports.length]);

  const currentReport = reports[currentDayIndex];

  const getStatusColor = (status: DailyReport['status']) => {
    switch (status) {
      case 'excellent': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'good': return 'text-indigo-500 bg-indigo-50 border-indigo-100';
      case 'average': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'needs_attention': return 'text-rose-500 bg-rose-50 border-rose-100';
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-black/5 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-black rounded-2xl">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Live Simulation</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Work Reports</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-black/5">
          <button 
            onClick={() => setCurrentDayIndex(prev => Math.max(0, prev - 1))}
            className="p-2 hover:bg-white rounded-xl transition-all"
            disabled={currentDayIndex === 0}
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          
          <button 
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="px-4 py-2 bg-white rounded-xl shadow-sm flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all"
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAutoPlaying ? 'Pause' : 'Auto Play'}
          </button>

          <button 
            onClick={() => setCurrentDayIndex(prev => Math.min(reports.length - 1, prev + 1))}
            className="p-2 hover:bg-white rounded-xl transition-all"
            disabled={currentDayIndex === reports.length - 1}
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentDayIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Date and Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <span className="text-lg font-black text-slate-900">{currentReport.date}</span>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(currentReport.status)}`}>
                {currentReport.status.replace('_', ' ')}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-3xl border border-black/5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks</span>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {currentReport.tasks_completed} <span className="text-sm text-slate-400">/ {currentReport.total_tasks}</span>
                </p>
                <div className="mt-3 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-500" 
                    style={{ width: `${(currentReport.tasks_completed / currentReport.total_tasks) * 100}%` }} 
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-black/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engagement</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{currentReport.engagement_score}%</p>
                <p className="text-[10px] font-bold text-emerald-500 mt-1">Optimal Range</p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 opacity-70" />
                <h4 className="text-xs font-black uppercase tracking-widest opacity-70">Daily Summary</h4>
              </div>
              <p className="text-sm font-medium leading-relaxed italic">
                "{currentReport.summary}"
              </p>
            </div>

            {/* Highlights */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Highlights</h4>
              <div className="grid grid-cols-1 gap-2">
                {currentReport.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-black/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-xs font-bold text-slate-600">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-[10px] font-bold text-slate-400">Collaborative View Active</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-300" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {currentDayIndex + 1} / {reports.length} Days
          </span>
        </div>
      </div>
    </div>
  );
};
