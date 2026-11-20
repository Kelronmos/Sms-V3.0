import React, { useEffect, useState } from "react";
import { useSWIData } from "../hooks/useSWIData";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Zap, Heart, ShieldCheck, ChevronRight } from "lucide-react";

interface LiveSynthProps {
  classId: string;
}

const CircularProgress = ({ value, size = 80, thickness = 6, color = "primary" }: { value: number, size?: number, thickness?: number, color?: "primary" | "error" | "warning" }) => {
  const radius = (size - thickness) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colorClasses = {
    primary: "text-emerald-500",
    error: "text-rose-500",
    warning: "text-amber-500"
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          fill="transparent"
          className="text-slate-100"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={colorClasses[color]}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xs font-black text-slate-900 leading-none">{Math.round(value)}</span>
        <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">pts</span>
      </div>
    </div>
  );
};

export const LiveSynthWidget: React.FC<LiveSynthProps> = ({ classId }) => {
  const { wellbeingIndex, engagementScore, integrityScore } = useSWIData(classId);
  const [alertMessage, setAlertMessage] = useState<string>("");

  useEffect(() => {
    if (wellbeingIndex < 70) {
      setAlertMessage(`Wellbeing below threshold (${Math.round(wellbeingIndex)}%). Trigger guidance!`);
    } else if (engagementScore < 60) {
      setAlertMessage(`Engagement dip detected (${Math.round(engagementScore)} points). Consider intervention.`);
    } else {
      setAlertMessage("");
    }
  }, [wellbeingIndex, engagementScore]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-xl border border-black/5 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h3 className="text-xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-500" />
            4D LIVE SYNTH
          </h3>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Structural Integrity Monitor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live Stream</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="flex flex-col items-center gap-3">
          <CircularProgress value={wellbeingIndex} color={wellbeingIndex < 70 ? "error" : "primary"} />
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Wellbeing</p>
            <div className="flex items-center justify-center gap-1">
              <Heart className="w-2.5 h-2.5 text-rose-500" />
              <span className="text-[10px] font-black text-slate-900">{Math.round(wellbeingIndex)}%</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <CircularProgress value={engagementScore} color={engagementScore < 60 ? "error" : "primary"} />
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Engagement</p>
            <div className="flex items-center justify-center gap-1">
              <Zap className="w-2.5 h-2.5 text-amber-500" />
              <span className="text-[10px] font-black text-slate-900">{Math.round(engagementScore)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <CircularProgress value={integrityScore} color={integrityScore < 80 ? "warning" : "primary"} />
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Integrity</p>
            <div className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 text-indigo-500" />
              <span className="text-[10px] font-black text-slate-900">{Math.round(integrityScore)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-4">
        <AnimatePresence mode="wait">
          {alertMessage ? (
            <motion.div 
              key="alert"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3"
            >
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Critical Alert</p>
                <p className="text-xs font-bold text-rose-700 leading-tight">
                  {alertMessage}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="safe"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">System Status</p>
                <p className="text-xs font-bold text-emerald-700 leading-tight">
                  Structural integrity verified. All metrics within optimal range.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => console.log("Running SWI Guidance Protocol...")}
          className="w-full bg-black text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-black/10 group"
        >
          <ShieldCheck className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          Trigger Guidance Protocol
          <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
        </button>
      </div>
    </motion.div>
  );
};
