import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Activity, Zap, AlertCircle, 
  CheckCircle2, RefreshCw, Lock, Server,
  Cpu, Network, Database
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

interface Heartbeat {
  module: string;
  timestamp: number;
  latency_ms: number;
}

const MODULES = [
  "security_engine",
  "data_pipeline",
  "auth_service",
  "incident_manager",
  "api_gateway"
];

const HEALTHY_THRESHOLD = 40;
const STABLE_THRESHOLD = 80;

export const SecurityScanner: React.FC = () => {
  const [history, setHistory] = useState<Heartbeat[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastAlert, setLastAlert] = useState<string | null>(null);

  // Simulate real-time heartbeats
  useEffect(() => {
    const interval = setInterval(() => {
      const newHb: Heartbeat = {
        module: MODULES[Math.floor(Math.random() * MODULES.length)],
        timestamp: Date.now(),
        latency_ms: Math.round(Math.random() * 110 + 10)
      };

      setHistory(prev => {
        const next = [...prev, newHb];
        if (next.length > 50) return next.slice(1);
        return next;
      });

      // Drift detection logic from user request
      if (history.length >= 5) {
        const recent = history.slice(-5);
        const avgRecent = recent.reduce((sum, h) => sum + h.latency_ms, 0) / 5;
        if (avgRecent > 90) {
          setLastAlert("⚠️ High latency spike detected in SWI Core");
        } else if (lastAlert) {
          setLastAlert(null);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [history, lastAlert]);

  const avgLatency = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.round(history.reduce((sum, h) => sum + h.latency_ms, 0) / history.length);
  }, [history]);

  const status = useMemo(() => {
    if (avgLatency < HEALTHY_THRESHOLD) return "HEALTHY";
    if (avgLatency < STABLE_THRESHOLD) return "STABLE";
    return "WARNING";
  }, [avgLatency]);

  const statusColor = {
    HEALTHY: "text-emerald-500",
    STABLE: "text-amber-500",
    WARNING: "text-rose-500"
  }[status];

  const runIntegrityCheck = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-black/5 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest">SWI Core Oversight</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">System Integrity & Latency Monitor</p>
          </div>
        </div>
        <button 
          onClick={runIntegrityCheck}
          disabled={isScanning}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isScanning ? 'bg-slate-100 text-slate-400' : 'bg-black text-white hover:bg-slate-800'
          }`}
        >
          {isScanning ? 'Scanning...' : 'Run Integrity Check'}
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metrics Card */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-black/5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Latency</p>
              <Activity className="w-3 h-3 text-slate-300" />
            </div>
            <p className="text-2xl font-black tracking-tighter">{avgLatency} <span className="text-xs font-normal text-slate-400">ms</span></p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-black/5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
              <Zap className={`w-3 h-3 ${statusColor}`} />
            </div>
            <p className={`text-xl font-black tracking-tighter ${statusColor}`}>{status}</p>
          </div>

          <AnimatePresence>
            {lastAlert && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5" />
                <p className="text-[10px] font-bold text-rose-700 leading-tight">{lastAlert}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Graph Card */}
        <div className="lg:col-span-2 bg-slate-50 rounded-2xl border border-black/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency Trend (Real-time)</p>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            </div>
          </div>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="timestamp" hide />
                <YAxis hide domain={[0, 150]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 rounded-lg shadow-xl border border-black/5 text-[10px] font-bold">
                          {payload[0].value} ms
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="latency_ms" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorLatency)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Integrity Check Progress */}
      {isScanning && (
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scanning Modules...</p>
            </div>
            <p className="text-[10px] font-black text-indigo-600">{scanProgress}%</p>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              className="bg-indigo-500 h-full"
              initial={{ width: 0 }}
              animate={{ width: `${scanProgress}%` }}
            />
          </div>
          <div className="grid grid-cols-5 gap-2 mt-4">
            {MODULES.map((m, i) => (
              <div key={m} className={`h-1 rounded-full ${scanProgress > (i + 1) * 20 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Module Status Grid */}
      <div className="px-6 pb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <Lock className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Auth: Secure</span>
        </div>
        <div className="flex items-center gap-2">
          <Server className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Nodes: 12/12</span>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Sync: Active</span>
        </div>
        <div className="flex items-center gap-2">
          <Network className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">TLS: 1.3</span>
        </div>
      </div>
    </div>
  );
};
