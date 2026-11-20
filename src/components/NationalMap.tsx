import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Activity, Heart, AlertTriangle } from 'lucide-react';

interface Region {
  id: string;
  name: string;
  risk: 'low' | 'medium' | 'high';
  vector: number[]; // [S, T, O, E, Se, U] - 1 for active, 0 for blank
  coordinates: { x: number, y: number };
}

export const NationalMap: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([
    { id: 'north', name: 'Northern Region', risk: 'low', vector: [1, 1, 1, 0, 1, 1], coordinates: { x: 45, y: 25 } },
    { id: 'south', name: 'Southern Region', risk: 'medium', vector: [1, 0, 1, 1, 1, 0], coordinates: { x: 55, y: 75 } },
    { id: 'east', name: 'Eastern Region', risk: 'high', vector: [0, 1, 1, 1, 0, 1], coordinates: { x: 80, y: 50 } },
    { id: 'west', name: 'Western Region', risk: 'low', vector: [1, 1, 0, 1, 1, 1], coordinates: { x: 20, y: 50 } },
    { id: 'central', name: 'Central Region', risk: 'medium', vector: [1, 1, 1, 1, 1, 1], coordinates: { x: 50, y: 50 } },
  ]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRegions(prev => prev.map(r => ({
        ...r,
        vector: r.vector.map(v => Math.random() > 0.8 ? (v === 1 ? 0 : 1) : v)
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-black/5 relative overflow-hidden h-[600px]">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            National Wellbeing Map
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Live V-Vector Synchronization</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-black/5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Live Feed</span>
          </div>
        </div>
      </div>

      {/* Map Background (Simplified SVG of Botswana-like shape) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full max-w-md">
          <path 
            d="M30,10 L70,10 L90,40 L80,90 L20,90 L10,40 Z" 
            fill="currentColor" 
            className="text-slate-900"
          />
        </svg>
      </div>

      {/* Region Markers */}
      <div className="relative w-full h-full">
        {regions.map((region) => (
          <motion.div
            key={region.id}
            className="absolute cursor-pointer group"
            style={{ left: `${region.coordinates.x}%`, top: `${region.coordinates.y}%` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            {/* Heartbeat Animation */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute -inset-4 rounded-full ${
                region.risk === 'high' ? 'bg-rose-500' : 
                region.risk === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />

            <div className={`relative p-4 rounded-2xl border border-black/5 shadow-xl transition-all ${
              region.risk === 'high' ? 'bg-rose-50' : 
              region.risk === 'medium' ? 'bg-amber-50' : 'bg-white'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl ${
                  region.risk === 'high' ? 'bg-rose-500 text-white' : 
                  region.risk === 'medium' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  <Heart className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-black tracking-tight">{region.name}</p>
                  <p className="text-[8px] font-bold uppercase text-slate-400">Risk: {region.risk}</p>
                </div>
              </div>

              {/* 6-Dot Indicator */}
              <div className="flex gap-1 justify-center">
                {region.vector.map((v, i) => (
                  <div 
                    key={i}
                    className={`w-2 h-2 rounded-full border border-black/10 transition-all duration-500 ${
                      v === 1 ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-transparent'
                    }`}
                    title={`Vector Component ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Region Label on Hover */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              <div className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-xl">
                {region.name}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-8 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-black/5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">V-Vector Legend</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full" />
            <span className="text-[8px] font-bold uppercase">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 border border-black/20 rounded-full" />
            <span className="text-[8px] font-bold uppercase">Blank (0)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
