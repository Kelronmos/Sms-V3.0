import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Activity, Star, TrendingUp, Award } from 'lucide-react';
import { Gauge } from './Gauge';

interface SubjectPerformance {
  subject: string;
  score: number;
  grade: string;
  trend: 'up' | 'down' | 'stable';
}

interface AcademicPerformanceProps {
  studentName: string;
  subjects: SubjectPerformance[];
  behaviorScore: number;
  overallPerformance: number;
}

export const AcademicPerformance: React.FC<AcademicPerformanceProps> = ({ 
  studentName, 
  subjects, 
  behaviorScore, 
  overallPerformance 
}) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Overall Performance Gauge */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Overall Performance</h3>
          <Gauge 
            value={overallPerformance} 
            label="Academic Index" 
            size="lg" 
            showSynth={true}
          />
          <div className="mt-6 text-center">
            <p className="text-2xl font-black text-slate-900">{overallPerformance}%</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Composite Score</p>
          </div>
        </div>

        {/* Behavior Score Gauge */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Behavioral Integrity</h3>
          <Gauge 
            value={behaviorScore} 
            label="Behavior Score" 
            size="lg" 
            showSynth={true}
          />
          <div className="mt-6 text-center">
            <p className="text-2xl font-black text-slate-900">{behaviorScore}/100</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conduct Rating</p>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="bg-black text-white p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-center">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">Parental AI Insight</h3>
            </div>
            <p className="text-lg font-bold leading-tight mb-4">
              Hello {studentName}, we've noticed you've been missing some classes or feeling a bit down.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Remember that your teachers and counselors are here to support you. We're monitoring your progress to ensure you have everything you need to succeed.
            </p>
          </div>
          <Award className="absolute -bottom-8 -right-8 w-32 h-32 text-white/5" />
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Subject Performance
          </h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Average</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 bg-slate-50 rounded-2xl border border-black/5 hover:border-black/10 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-slate-900">{subject.subject}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Grade: {subject.grade}</p>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                  subject.score >= 80 ? 'bg-emerald-100 text-emerald-600' : 
                  subject.score >= 60 ? 'bg-amber-100 text-amber-600' : 
                  'bg-rose-100 text-rose-600'
                }`}>
                  {subject.score}%
                </div>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${subject.score}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-full ${
                    subject.score >= 80 ? 'bg-emerald-500' : 
                    subject.score >= 60 ? 'bg-amber-500' : 
                    'bg-rose-500'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
