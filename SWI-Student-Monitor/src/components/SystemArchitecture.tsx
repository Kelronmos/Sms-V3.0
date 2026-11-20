import React from 'react';
import { motion } from 'motion/react';
import { Layers, Cpu, Shield, Network, Zap, Activity, ChevronRight, Box } from 'lucide-react';

interface Node {
  NODE_ID: string;
  VECTOR_COORDINATES: string;
  STRUCTURAL_TARGET: number;
}

interface SystemArchitectureProps {
  nodes?: Node[];
  stack?: string[];
  systemStack?: string[];
}

export const SystemArchitecture: React.FC<SystemArchitectureProps> = ({ 
  nodes = [
    { NODE_ID: 'CEK-V2', VECTOR_COORDINATES: 'V={S,T,O,E,Se,U}', STRUCTURAL_TARGET: 0.98 },
    { NODE_ID: 'SWI-V5', VECTOR_COORDINATES: 'V={S,T,O,E,Se,U}', STRUCTURAL_TARGET: 0.95 },
    { NODE_ID: 'SAMH-V1', VECTOR_COORDINATES: 'V={S,T,O,E,Se,U}', STRUCTURAL_TARGET: 0.92 },
    { NODE_ID: 'CORE-X', VECTOR_COORDINATES: 'V={S,T,O,E,Se,U}', STRUCTURAL_TARGET: 0.99 },
    { NODE_ID: 'GATE-W', VECTOR_COORDINATES: 'V={S,T,O,E,Se,U}', STRUCTURAL_TARGET: 0.88 },
    { NODE_ID: 'SYNC-Z', VECTOR_COORDINATES: 'V={S,T,O,E,Se,U}', STRUCTURAL_TARGET: 0.94 },
  ],
  stack = [
    'Ministry of Education (L5)',
    'District Governance (L4)',
    'School Administration (L3)',
    'Teacher Core (L2)',
    'Student Wellbeing Interface (L1)'
  ],
  systemStack = [
    'Frontend Interface',
    'API Gateway',
    'Authentication Service',
    'SAMH Core Engine',
    'SWI Drift Engine',
    'Database Cluster',
    'Analytics Engine',
    'Report Generator'
  ]
}) => {
  return (
    <div className="space-y-12 p-8 bg-slate-50 rounded-[2rem] border border-black/5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            SAMH Platform Architecture
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">System Node Alignment & Governance Stack</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-black/5 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">System Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Primary Layer: Horizontal Node Alignment & Deep Stack */}
        <div className="lg:col-span-2 space-y-12">
          {/* Node Alignment Grid */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Layout Layer (3-Column Grid)</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nodes.map((node, idx) => (
                <motion.div
                  key={node.NODE_ID}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                      <Box className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {Math.round(node.STRUCTURAL_TARGET * 100)}%
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-black tracking-tighter mb-1">{node.NODE_ID}</h4>
                  <p className="text-[9px] font-mono text-slate-400 mb-4">{node.VECTOR_COORDINATES}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                      <span>Structural Target</span>
                      <span>{node.STRUCTURAL_TARGET}</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${node.STRUCTURAL_TARGET * 100}%` }}
                        className="h-full bg-indigo-600"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Deep System Architecture Stack */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deep System Architecture Stack</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {systemStack.map((item, idx) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="bg-indigo-900 text-white p-4 rounded-2xl border border-white/10 shadow-lg text-center"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">{item}</p>
                  <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ x: [-20, 100] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-1/4 h-full bg-emerald-400"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Node Synchronization Status */}
          <div className="p-4 bg-indigo-900 text-white rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Node Synchronization</p>
                <p className="text-[10px] text-indigo-300">All nodes currently aligned with V-Vector targets</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Re-Align Grid
            </button>
          </div>
        </div>

        {/* Secondary Layer: Vertical Governance Stack */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secondary Layer (Hierarchical Stack)</span>
          </div>

          <div className="relative">
            {/* Pyramid Connector Line */}
            <div className="absolute left-6 top-6 bottom-6 w-px bg-slate-200" />
            
            <div className="space-y-4 relative">
              {stack.map((item, idx) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-center gap-4 group cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-black/5 z-10 transition-all ${
                    idx === 0 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 group-hover:text-indigo-600'
                  }`}>
                    <span className="text-xs font-black">{stack.length - idx}</span>
                  </div>
                  
                  <div className="flex-1 bg-white p-4 rounded-2xl border border-black/5 shadow-sm group-hover:border-indigo-200 transition-all">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-black uppercase tracking-widest ${
                        idx === 0 ? 'text-indigo-600' : 'text-slate-600'
                      }`}>{item}</p>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-black/5 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Network className="w-3 h-3" />
              Governance Integrity
            </div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-black tracking-tighter text-indigo-600">99.4%</div>
              <div className="text-[10px] text-slate-400 font-medium leading-tight">
                Institutional compliance across all governance layers.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
