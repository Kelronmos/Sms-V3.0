/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Top Navigation Bar
 * Follows the strict 3-Zone Top Bar Contract:
 * [Brand Zone] - [4-5 Nav Links] - [1 Primary Action Zone]
 */

import React, { useState } from 'react';
import { Shield, Wifi, WifiOff, User, RefreshCw, Menu, X, Check } from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { api } from '../services/api';

interface NavbarProps {
  currentUser: UserProfile;
  isOnline: boolean;
  queuedCount: number;
  activeView: string;
  onNavigate: (view: string) => void;
  onToggleOnline: () => void;
  onSync: () => void;
  onUserChange: (user: UserProfile) => void;
  onOpenMobileMenu: () => void;
}

const AVAILABLE_ROLES: { role: UserRole; name: string; title: string; origin: 'registered' | 'system' }[] = [
  { role: 'school_admin', name: 'Dr. Evelyn Vance', title: 'Principal & School Admin', origin: 'registered' },
  { role: 'teacher', name: 'Dr. Sarah Jenkins', title: 'AP Science Lead', origin: 'registered' },
  { role: 'student', name: 'Amina Al-Mansoor', title: 'Student (Grade 10)', origin: 'registered' },
  { role: 'parent', name: 'Fatima Al-Mansoor', title: 'Verified Guardian', origin: 'registered' },
  { role: 'counselor', name: 'Marcus Brody, LCSW', title: 'Student Support Counselor', origin: 'registered' },
  { role: 'district', name: 'Arthur Pendelton', title: 'Regional District Officer', origin: 'registered' },
  { role: 'ministry', name: 'Dame Katherine Bell', title: 'Ministry Education Inspector', origin: 'system' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  isOnline,
  queuedCount,
  activeView,
  onNavigate,
  onToggleOnline,
  onSync,
  onUserChange,
  onOpenMobileMenu,
}) => {
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await onSync();
    setIsSyncing(false);
  };

  const handleSelectRole = (item: typeof AVAILABLE_ROLES[0]) => {
    const updated: UserProfile = {
      id: `usr_${item.role}_01`,
      name: item.name,
      email: `${item.name.toLowerCase().replace(/[^a-z]/g, '.')}@swi-edu.org`,
      role: item.role,
      schoolName: 'Metropolitan Academy of Science',
      origin: item.origin,
      verificationStatus: 'VERIFIED',
    };
    onUserChange(updated);
    setRoleModalOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          
          {/* Zone 1: Brand Wordmark (Single text element, no pill badges) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              aria-label="Open mobile navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
                SWI Student Monitor
              </span>
            </button>
          </div>

          {/* Zone 2: 4-5 Navigation Links (Clean single-line typography) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${activeView === 'dashboard' ? 'text-cyan-400 font-semibold' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('students')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${activeView === 'students' ? 'text-cyan-400 font-semibold' : ''}`}
            >
              Students
            </button>
            <button
              onClick={() => onNavigate('wellbeing')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${activeView === 'wellbeing' ? 'text-cyan-400 font-semibold' : ''}`}
            >
              Wellbeing
            </button>
            <button
              onClick={() => onNavigate('workflow')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${activeView === 'workflow' ? 'text-cyan-400 font-semibold' : ''}`}
            >
              Workflow Guard
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${activeView === 'reports' ? 'text-cyan-400 font-semibold' : ''}`}
            >
              Evidence Reports
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action Area */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Online / Offline status toggle */}
            <button
              onClick={onToggleOnline}
              title={isOnline ? 'Online mode active (Click to simulate offline)' : 'Operating offline (Click to restore)'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isOnline
                  ? 'bg-slate-950/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  : 'bg-amber-950/60 border-amber-700/60 text-amber-300 hover:border-amber-600'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Offline</span>
                  {queuedCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono text-[10px]">
                      {queuedCount}
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Sync trigger if mutations queued */}
            {queuedCount > 0 && (
              <button
                onClick={handleSyncClick}
                disabled={isSyncing || !isOnline}
                title="Process pending offline writes"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync ({queuedCount})</span>
              </button>
            )}

            {/* Persona Switcher Button */}
            <button
              onClick={() => setRoleModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-[120px] sm:max-w-[160px]">{currentUser.name}</span>
              <span className="text-[10px] text-slate-400 capitalize hidden md:inline">({currentUser.role.replace('_', ' ')})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Role Switcher Modal */}
      {roleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Institutional Persona Switcher</h3>
                <p className="text-xs text-slate-400 mt-0.5">Switch active user role to verify cross-role access boundaries</p>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {AVAILABLE_ROLES.map(item => {
                const isSelected = currentUser.role === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => handleSelectRole(item)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left border transition-all ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-600/80 text-white shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{item.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.role.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.title}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 text-right">
              <button
                onClick={() => setRoleModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
