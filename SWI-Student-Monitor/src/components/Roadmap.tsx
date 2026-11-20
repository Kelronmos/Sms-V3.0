import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Milestone, CheckCircle2, Circle, 
  ArrowRight, Sparkles, Shield, 
  Users, BrainCircuit, Globe,
  Zap, TrendingUp, Award
} from 'lucide-react';

interface RoadmapItem {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  icon: React.ReactNode;
  details: string[];
  visual: React.ReactNode;
}

export const Roadmap: React.FC = () => {
  const [activeItem, setActiveItem] = useState(1);

  const roadmapItems: RoadmapItem[] = [
    {
      id: 1,
      title: "Phase 1: Foundation & Security",
      description: "Establishing the core infrastructure and SWI Ethics Filter.",
      status: 'completed',
      icon: <Shield className="w-5 h-5" />,
      details: [
        "Multi-role Authentication System",
        "Encrypted Communication Channels",
        "SWI Ethics Filter for all inputs",
        "Regional Data Sovereignty"
      ],
      visual: (
        <div className="relative h-48 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="relative z-10 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex flex-col items-center gap-4"
          >
            <Shield className="w-12 h-12 text-emerald-400" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Secure Core Active</span>
          </motion.div>
        </div>
      )
    },
    {
      id: 2,
      title: "Phase 2: AI-Driven Insights",
      description: "Integrating Gemini for predictive analysis and automated summaries.",
      status: 'current',
      icon: <BrainCircuit className="w-5 h-5" />,
      details: [
        "4D Interactive Summaries",
        "Student Risk Prediction Models",
        "AI-Generated Learning Guidance",
        "Automated Quiz Generation"
      ],
      visual: (
        <div className="h-48 bg-indigo-600 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="flex justify-between items-start">
            <BrainCircuit className="w-10 h-10 text-white" />
            <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black text-white uppercase">Processing...</div>
          </div>
          <div className="space-y-2">
            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="h-full w-1/2 bg-white"
              />
            </div>
            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Analyzing Student Trends</p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Phase 3: Regional Collaboration",
      description: "Connecting schools, districts, and ministries for unified oversight.",
      status: 'upcoming',
      icon: <Globe className="w-5 h-5" />,
      details: [
        "District-Level Performance Maps",
        "Ministry Policy Distribution",
        "Cross-School Resource Sharing",
        "Unified Incident Reporting"
      ],
      visual: (
        <div className="h-48 bg-emerald-500 rounded-2xl p-6 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <motion.div 
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                className="w-8 h-8 rounded-lg bg-white/20 border border-white/40 flex items-center justify-center"
              >
                <Users className="w-4 h-4 text-white" />
              </motion.div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-32 h-32 border-2 border-dashed border-white/20 rounded-full animate-spin-slow" />
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Phase 4: Gamified Learning",
      description: "Implementing the Star Level System and interactive rewards.",
      status: 'upcoming',
      icon: <Award className="w-5 h-5" />,
      details: [
        "Student Star Level Progression",
        "Multiplayer Competitive Quizzes",
        "Achievement Badges & Rewards",
        "Parent Engagement Portal"
      ],
      visual: (
        <div className="h-48 bg-amber-400 rounded-2xl p-8 flex flex-col items-center justify-center gap-4">
          <motion.div 
            animate={{ rotateY: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          >
            <Award className="w-16 h-16 text-white drop-shadow-lg" />
          </motion.div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-white fill-current" />)}
          </div>
          <span className="text-xs font-black text-amber-900 uppercase tracking-widest">Level Up!</span>
        </div>
      )
    },
    {
      id: 5,
      title: "Phase 5: Global Scaling",
      description: "Expanding the SMAI ecosystem to support international standards.",
      status: 'upcoming',
      icon: <TrendingUp className="w-5 h-5" />,
      details: [
        "Multi-language Support",
        "International Curriculum Mapping",
        "Global Safety Benchmarks",
        "Scalable Cloud Architecture"
      ],
      visual: (
        <div className="h-48 bg-slate-100 rounded-2xl p-6 flex flex-col justify-end overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-[repeating-linear-gradient(45deg,_transparent,_transparent_20px,_rgba(0,0,0,0.1)_20px,_rgba(0,0,0,0.1)_40px)]" />
          </div>
          <div className="flex items-end gap-2 h-32">
            {[30, 45, 35, 60, 80, 70, 95].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.1, duration: 1 }}
                className="flex-1 bg-black rounded-t-lg"
              />
            ))}
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Reach</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <Milestone className="w-6 h-6 text-indigo-600" />
            SMAI Roadmap 2026
          </h3>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Our journey to transform education</p>
        </div>
        <div className="flex gap-2">
          {roadmapItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeItem === item.id 
                  ? 'bg-black text-white shadow-lg shadow-black/20 scale-110' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs font-black">{item.id}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeItem}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${
                  roadmapItems[activeItem-1].status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                  roadmapItems[activeItem-1].status === 'current' ? 'bg-indigo-100 text-indigo-600' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {roadmapItems[activeItem-1].icon}
                </div>
                <h4 className="text-xl font-black tracking-tight">{roadmapItems[activeItem-1].title}</h4>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed">
                {roadmapItems[activeItem-1].description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roadmapItems[activeItem-1].details.map((detail, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-black/5">
                  <CheckCircle2 className={`w-4 h-4 ${roadmapItems[activeItem-1].status === 'completed' ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span className="text-xs font-bold text-slate-700">{detail}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button 
                onClick={() => setActiveItem(prev => Math.max(1, prev - 1))}
                disabled={activeItem === 1}
                className="p-4 rounded-2xl border border-black/5 hover:bg-slate-50 transition-colors disabled:opacity-30"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <button 
                onClick={() => setActiveItem(prev => Math.min(5, prev + 1))}
                disabled={activeItem === 5}
                className="flex-1 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                Next Phase
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeItem}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 to-emerald-500/10 blur-3xl rounded-full" />
            <div className="relative bg-white p-4 rounded-[2.5rem] shadow-2xl border border-black/5">
              {roadmapItems[activeItem-1].visual}
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-black/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Live Preview</span>
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: roadmapItems[activeItem-1].status === 'completed' ? '100%' : roadmapItems[activeItem-1].status === 'current' ? '45%' : '0%' }}
                    className={`h-full ${
                      roadmapItems[activeItem-1].status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const Star = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
