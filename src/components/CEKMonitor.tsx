import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Activity, AlertTriangle, CheckCircle, Settings, Terminal, Info, BarChart3 } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { cekService, CEKEntry } from '../services/AdvancedCEK';
import { unlockGuardian } from '../services/Guardian';

export const CEKMonitor: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [lastEntry, setLastEntry] = useState<CEKEntry | null>(null);
  const [analytics, setAnalytics] = useState(cekService.getAnalytics());
  const [guardianNotice, setGuardianNotice] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState(cekService.getConfig().thresholds);

  const handleEvaluate = () => {
    if (!inputText.trim()) return;

    // Check for Guardian unlock
    const notice = unlockGuardian(inputText.trim());
    if (notice) {
      setGuardianNotice(notice);
      setInputText('');
      return;
    }

    const entry = cekService.evaluate(inputText);
    setLastEntry(entry);
    setAnalytics(cekService.getAnalytics());
    setInputText('');
    setGuardianNotice(null);
  };

  const handleThresholdChange = (key: 'green' | 'yellow', val: string) => {
    const num = parseFloat(val);
    const newThresholds = { ...thresholds, [key]: num };
    setThresholds(newThresholds);
    cekService.updateThresholds(newThresholds.green, newThresholds.yellow);
    setAnalytics(cekService.getAnalytics());
  };

  const chartData = analytics.history.map((e, i) => ({
    index: i,
    drift: e.drift,
    timestamp: new Date(e.timestamp).toLocaleTimeString(),
  }));

  return (
    <div className="bg-[#0a0a0a] text-[#00ff41] font-mono p-6 rounded-2xl border border-[#00ff41]/20 space-y-8 shadow-[0_0_30px_rgba(0,255,65,0.1)]">
      <div className="flex items-center justify-between border-b border-[#00ff41]/20 pb-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6" />
          <h2 className="text-xl font-black tracking-tighter uppercase">CEK Alignment Monitor v2.0</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] opacity-50 uppercase">Health:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              analytics.currentHealth === 'Green' ? 'bg-emerald-500/20 text-emerald-400' :
              analytics.currentHealth === 'Yellow' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {analytics.currentHealth}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] opacity-50 uppercase">Drift:</span>
            <span className="text-xs font-bold">{analytics.rollingDrift}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input & Config */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase opacity-50">Input Evaluation Terminal</label>
            <div className="flex gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter AI response for alignment check..."
                className="flex-1 bg-black border border-[#00ff41]/30 rounded-xl p-4 text-sm focus:ring-1 focus:ring-[#00ff41] outline-none min-h-[100px] resize-none placeholder:text-[#00ff41]/20"
              />
            </div>
            <button
              onClick={handleEvaluate}
              className="w-full bg-[#00ff41] text-black font-bold py-3 rounded-xl hover:bg-[#00ff41]/80 transition-all active:scale-[0.98]"
            >
              RUN EVALUATION
            </button>
          </div>

          <div className="bg-black/40 p-4 rounded-xl border border-[#00ff41]/10 space-y-4">
            <div className="flex items-center gap-2 text-[10px] uppercase opacity-50">
              <Settings className="w-3 h-3" />
              System Configuration
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px]">Green Threshold</label>
                  <span className="text-[10px] font-bold">{thresholds.green}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.3"
                  step="0.01"
                  value={thresholds.green}
                  onChange={(e) => handleThresholdChange('green', e.target.value)}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px]">Yellow Threshold</label>
                  <span className="text-[10px] font-bold">{thresholds.yellow}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.01"
                  value={thresholds.yellow}
                  onChange={(e) => handleThresholdChange('yellow', e.target.value)}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
            <p className="text-[9px] opacity-40 italic">
              * Thresholds are dynamically visualized on the Drift History chart below.
            </p>
          </div>
        </div>

        {/* Results & Analytics */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {guardianNotice ? (
              <motion.div
                key="guardian"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl text-red-400 text-xs leading-relaxed whitespace-pre-wrap"
              >
                <div className="flex items-center gap-2 mb-4 text-red-500 font-black uppercase tracking-widest">
                  <Shield className="w-5 h-5" />
                  SWI-CEK Guardian Notice
                </div>
                {guardianNotice}
              </motion.div>
            ) : lastEntry ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 border border-[#00ff41]/20 p-6 rounded-2xl space-y-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase opacity-50">Evaluation Result</span>
                  <div className={`flex items-center gap-2 text-xs font-bold ${
                    lastEntry.status === 'Green' ? 'text-emerald-400' :
                    lastEntry.status === 'Yellow' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {lastEntry.status === 'Green' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {lastEntry.status.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {['Safety', 'Truth', 'Quality', 'Ethics'].map((dim, i) => (
                    <div key={dim} className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>{dim}</span>
                        <span>{Math.round(lastEntry.vector[i] * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${lastEntry.vector[i] * 100}%` }}
                          className="h-full bg-[#00ff41]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#00ff41]/10 flex justify-between items-center">
                  <span className="text-[10px] opacity-50">Cosine Drift:</span>
                  <span className="text-xl font-black">{lastEntry.drift}</span>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#00ff41]/20 border border-dashed border-[#00ff41]/10 rounded-2xl p-12">
                <Activity className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-xs text-center">Awaiting evaluation input...</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Drift History Chart */}
      <div className="bg-black/40 p-6 rounded-2xl border border-[#00ff41]/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] uppercase opacity-50">
            <BarChart3 className="w-3 h-3" />
            Drift History Analytics
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-[8px] uppercase opacity-50">Green Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="text-[8px] uppercase opacity-50">Yellow Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-[8px] uppercase opacity-50">Red Zone</span>
            </div>
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorDrift" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
              <XAxis dataKey="timestamp" hide />
              <YAxis domain={[0, 1]} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #00ff4130', borderRadius: '8px', fontSize: '10px' }}
                itemStyle={{ color: '#00ff41' }}
              />
              <ReferenceLine y={thresholds.green} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'GREEN', position: 'right', fill: '#10b981', fontSize: 8 }} />
              <ReferenceLine y={thresholds.yellow} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'YELLOW', position: 'right', fill: '#f59e0b', fontSize: 8 }} />
              <Area type="monotone" dataKey="drift" stroke="#00ff41" fillOpacity={1} fill="url(#colorDrift)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History Log */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase opacity-50">Evaluation History Log</label>
        <div className="bg-black/60 rounded-xl border border-[#00ff41]/10 overflow-hidden">
          <div className="max-h-[200px] overflow-y-auto">
            <table className="w-full text-[10px] text-left">
              <thead className="bg-white/5 sticky top-0">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Snippet</th>
                  <th className="p-3">Drift</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00ff41]/5">
                {analytics.history.slice().reverse().map((e, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 opacity-50">{new Date(e.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 truncate max-w-[200px]">{e.text}</td>
                    <td className="p-3 font-bold">{e.drift}</td>
                    <td className="p-3 text-right">
                      <span className={
                        e.status === 'Green' ? 'text-emerald-400' :
                        e.status === 'Yellow' ? 'text-amber-400' :
                        'text-red-400'
                      }>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

