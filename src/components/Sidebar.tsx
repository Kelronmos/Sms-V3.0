/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Sidebar & Responsive Drawer Navigation
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  GitPullRequest,
  AlertOctagon,
  FileText,
  Cpu,
  CloudOff,
  HelpCircle,
  X,
  ShieldCheck,
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  role: UserRole;
  queuedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  role,
  queuedCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Directory', icon: Users },
    { id: 'wellbeing', label: 'Daily Wellbeing Check-In', icon: HeartPulse },
    { id: 'workflow', label: 'SWI Workflow Guard', icon: GitPullRequest },
    { id: 'incidents', label: 'Incident & Interventions', icon: AlertOctagon },
    { id: 'reports', label: 'Evidence Reports & Audit', icon: FileText },
    { id: 'sensors', label: 'Hardware & Sensor Security', icon: Cpu },
    {
      id: 'offline',
      label: 'Offline Sync Queue',
      icon: CloudOff,
      badge: queuedCount > 0 ? String(queuedCount) : undefined,
    },
    { id: 'assistant', label: 'SWI Policy Assistant', icon: HelpCircle },
  ];

  const content = (
    <div className="h-full flex flex-col justify-between py-5 px-3 bg-slate-900 border-r border-slate-800 text-slate-300">
      <div>
        <div className="px-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Institutional Core
              </span>
              <p className="text-[10px] text-slate-400">Structured Intelligence v2.6</p>
            </div>
          </div>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (mobileOpen) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-600/15 text-cyan-400 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Notice & Security Seal */}
      <div className="px-3 pt-4 border-t border-slate-800/80">
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-300 capitalize">{role.replace('_', ' ')}</span>
            <span className="text-[10px] font-mono text-cyan-400">ACTIVE SCOPE</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Cryptographic signatures enforce non-repudiation across all audit actions.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
        {content}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
