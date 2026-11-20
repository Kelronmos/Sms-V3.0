import React from 'react';
import { motion } from 'motion/react';
import { Clock, TrendingUp, Heart, Zap, Award, UserCheck, Activity, Shield, BarChart3, Gauge as GaugeIcon } from 'lucide-react';
import { Gauge } from './Gauge';

interface InteractiveSummaryProps {
  role: string;
  data: {
    metrics?: any[];
    summary?: any;
    prediction?: any;
    studentId?: string;
    regionsSummary?: any[];
  };
}

export const InteractiveSummary: React.FC<InteractiveSummaryProps> = ({ role, data }) => {
  const { metrics = [], summary, prediction, regionsSummary } = data;
  const latest = metrics[0] || {};
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Define dimensions based on role
  let dimensions = [
    { label: 'Time', icon: Clock, value: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Performance', icon: TrendingUp, value: `${latest.mood_score || 0}/5`, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Behaviour', icon: Heart, value: prediction?.trend || 'Stable', color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Engagement', icon: Zap, value: `${latest.engagement_hours || 0}h`, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  if (role === 'student') {
    dimensions = [
      { label: 'Grades', icon: Award, value: 'A-', color: 'text-blue-500', bg: 'bg-blue-50' },
      { label: 'Assignments', icon: TrendingUp, value: '92%', color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { label: 'Attendance', icon: UserCheck, value: '98%', color: 'text-rose-500', bg: 'bg-rose-50' },
      { label: 'Participation', icon: Zap, value: 'High', color: 'text-amber-500', bg: 'bg-amber-50' },
    ];
  } else if (role === 'parent') {
    dimensions = [
      { label: 'Academic', icon: Award, value: 'B+', color: 'text-blue-500', bg: 'bg-blue-50' },
      { label: 'Behavior', icon: Heart, value: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { label: 'Attendance', icon: UserCheck, value: '96%', color: 'text-rose-500', bg: 'bg-rose-50' },
      { label: 'Wellbeing', icon: Activity, value: 'Stable', color: 'text-amber-500', bg: 'bg-amber-50' },
    ];
  } else if (role === 'teacher') {
    dimensions = [
      { label: 'Progress', icon: TrendingUp, value: '+12%', color: 'text-blue-500', bg: 'bg-blue-50' },
      { label: 'Class Trends', icon: BarChart3, value: 'Positive', color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { label: 'Attendance', icon: UserCheck, value: '94%', color: 'text-rose-500', bg: 'bg-rose-50' },
      { label: 'Engagement', icon: Zap, value: '8.4/10', color: 'text-amber-500', bg: 'bg-amber-50' },
    ];
  }

  return (
    <div className="governance-card w-full mb-8">
      <div className="flex items-center justify-between w-full mb-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">4D {role.replace('_', ' ')} Summary</h3>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Analysis</span>
        </div>
      </div>

      <div className="dashboard-grid w-full">
        {/* Speedometer Gauge */}
        <Gauge value={88} label="Overall Index" showSynth />

        {/* Dimension Cards */}
        <div className="grid grid-cols-2 gap-3 flex-1 min-w-[250px]">
          {dimensions.map((d) => (
            <div key={d.label} className={`${d.bg} p-3 rounded-xl border border-black/5 flex flex-col items-center justify-center`}>
              <div className="flex items-center gap-2 mb-1">
                <d.icon className={`w-3 h-3 ${d.color}`} />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{d.label}</span>
              </div>
              <div className="text-sm font-black tracking-tighter">{d.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

