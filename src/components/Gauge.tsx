import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Moon, Zap, Info } from 'lucide-react';

interface GaugeProps {
  value: number;
  label: string;
  size?: number | 'sm' | 'md' | 'lg';
  showSynth?: boolean;
  details?: {
    stress: number;
    sleep: number;
    engagement: number;
  };
}

export const Gauge: React.FC<GaugeProps> = ({ value, label, size = 240, showSynth = false, details }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const sizeMap = {
    sm: 160,
    md: 240,
    lg: 320
  };
  
  const actualSize = typeof size === 'string' ? sizeMap[size] : size;
  const percentage = Math.min(Math.max(value, 0), 100) / 100;
  const radius = 90;
  const centerX = 120;
  const centerY = 130;
  
  // Calculate needle rotation (from -180 to 0 degrees for a semi-circle)
  const needleRotation = (percentage * 180) - 180;

  return (
    <div 
      className="gauge-container cursor-pointer group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered(!isHovered)}
    >
      <svg viewBox="0 0 240 160" className="gauge-svg drop-shadow-2xl transition-transform duration-500 group-hover:scale-105">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background Arc */}
        <path
          d="M 30 130 A 90 90 0 0 1 210 130"
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="16"
          strokeLinecap="round"
        />
        
        {/* Progress Arc */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: percentage }}
          transition={{ duration: 1.5, ease: "circOut" }}
          d="M 30 130 A 90 90 0 0 1 210 130"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="16"
          strokeLinecap="round"
          filter="url(#gaugeGlow)"
        />

        {/* Ticks */}
        {[...Array(11)].map((_, i) => {
          const angle = (i * 18 - 180) * (Math.PI / 180);
          const r1 = 95;
          const r2 = 105;
          const x1 = centerX + r1 * Math.cos(angle);
          const y1 = centerY + r1 * Math.sin(angle);
          const x2 = centerX + r2 * Math.cos(angle);
          const y2 = centerY + r2 * Math.sin(angle);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="2" />
          );
        })}

        {/* Needle */}
        <motion.g
          initial={{ rotate: -180 }}
          animate={{ rotate: needleRotation }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          style={{ originX: "120px", originY: "130px" }}
        >
          <line 
            x1="120" y1="130" x2="120" y2="50" 
            stroke="#1e293b" strokeWidth="4" strokeLinecap="round" 
          />
          <circle cx="120" cy="130" r="8" fill="#1e293b" />
          <circle cx="120" cy="130" r="4" fill="#64748b" />
        </motion.g>
      </svg>
      
      {showSynth && (
        <div className="absolute top-0 right-0">
          <div className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-emerald-500/20">
            LIVE SYNTH
          </div>
        </div>
      )}

      <div className="absolute bottom-4 flex flex-col items-center">
        <motion.span 
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-black tracking-tighter text-slate-900"
        >
          {Math.round(value)}%
        </motion.span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>

      {/* Interactive Details Overlay */}
      <AnimatePresence>
        {isHovered && details && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute -top-24 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-black/5 z-50 min-w-[200px]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-rose-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Stress Level</span>
                </div>
                <span className="text-xs font-black text-slate-900">{details.stress}/10</span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${details.stress * 10}%` }}
                  className="h-full bg-rose-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-3 h-3 text-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Sleep</span>
                </div>
                <span className="text-xs font-black text-slate-900">{details.sleep}h</span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(details.sleep / 12) * 100}%` }}
                  className="h-full bg-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Engagement</span>
                </div>
                <span className="text-xs font-black text-slate-900">{details.engagement}h</span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(details.engagement / 8) * 100}%` }}
                  className="h-full bg-amber-500"
                />
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-black/5 flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase">
              <Info className="w-2 h-2" />
              Click to keep open
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
