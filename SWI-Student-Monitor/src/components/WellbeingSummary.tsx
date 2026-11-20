import React from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  Activity, 
  Moon, 
  TrendingUp, 
  Smile, 
  Meh, 
  Frown,
  Award,
  BookOpen,
  Zap
} from 'lucide-react';
import { Metric, Student } from '../types';

interface WellbeingSummaryProps {
  metrics: Metric[];
  student: Student | undefined;
}

export const WellbeingSummary: React.FC<WellbeingSummaryProps> = ({ metrics, student }) => {
  const latest = metrics[0];
  
  const getMoodIcon = (score: number) => {
    if (score >= 4) return <Smile className="w-6 h-6 text-emerald-500" />;
    if (score >= 2) return <Meh className="w-6 h-6 text-amber-500" />;
    return <Frown className="w-6 h-6 text-rose-500" />;
  };

  const metrics_data = [
    { 
      label: 'Mood', 
      value: latest?.mood_score || 0, 
      max: 5, 
      icon: getMoodIcon(latest?.mood_score || 0),
      color: 'bg-indigo-500',
      description: 'Emotional state'
    },
    { 
      label: 'Stress', 
      value: latest?.stress_score || 0, 
      max: 5, 
      icon: <Activity className="w-6 h-6 text-rose-500" />,
      color: 'bg-rose-500',
      description: 'Pressure level'
    },
    { 
      label: 'Sleep', 
      value: latest?.sleep_hours || 0, 
      max: 12, 
      icon: <Moon className="w-6 h-6 text-indigo-400" />,
      color: 'bg-indigo-400',
      description: 'Rest quality'
    },
    { 
      label: 'Academic', 
      value: student?.academic_standing === 'Excellent' ? 100 : student?.academic_standing === 'Good' ? 75 : 50, 
      max: 100, 
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      color: 'bg-emerald-500',
      description: 'Overall standing'
    }
  ];

  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5 h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            Wellbeing & Academic Summary
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time performance snapshot</p>
        </div>
        <div className="px-3 py-1 bg-slate-50 rounded-full border border-black/5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Live Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics_data.map((m, i) => (
          <motion.div 
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 bg-slate-50 rounded-2xl border border-black/5 hover:bg-white hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                {m.icon}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <p className="text-2xl font-black tracking-tighter">
                  {m.label === 'Academic' ? (student?.academic_standing || 'N/A') : m.value}
                  {m.label !== 'Academic' && <span className="text-xs text-slate-400 font-bold ml-1">/{m.max}</span>}
                </p>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(m.value / m.max) * 100}%` }}
                  className={`h-full ${m.color}`}
                />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{m.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-indigo-600 rounded-2xl text-white relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Current Standing</p>
              <p className="text-sm font-black tracking-tight">{student?.academic_standing || 'Good Standing'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Attendance</p>
            <p className="text-sm font-black tracking-tight">{student?.attendance_rate || 85}%</p>
          </div>
        </div>
        <Zap className="absolute -bottom-4 -right-4 w-16 h-16 text-white/10 group-hover:scale-110 transition-transform" />
      </div>
    </div>
  );
};
