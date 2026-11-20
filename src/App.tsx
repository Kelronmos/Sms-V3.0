/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Student Monitor - Root Application Architecture
 * Rebuilt with Structured Workflow Intelligence invariants:
 * - DATA ≠ EVIDENCE ≠ ADMISSION ≠ AUTHORIZATION ≠ ACTION
 * - OBSERVATION ≠ AUTHORITY | UNKNOWN ≠ FALSE ≠ PERMITTED
 * - TESTED ≠ PROVEN ≠ SEALED ≠ PRODUCTION AUTHORIZED
 * - Permit(a) ⟺ ∀L,G,S,H: C(a) ⊆ L∩G∩S∩H ∧ E(a) ≠ ∅
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Student, IncidentRecord, WellbeingCheckIn, QueuedOfflineMutation } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SWIBoundaryBanner } from './components/SWIBoundaryBanner';
import { DashboardView } from './components/DashboardView';
import { StudentDirectoryView } from './components/StudentDirectoryView';
import { WellbeingCheckInView } from './components/WellbeingCheckInView';
import { WorkflowGuardView } from './components/WorkflowGuardView';
import { IncidentCenterView } from './components/IncidentCenterView';
import { ReportsAndAuditingView } from './components/ReportsAndAuditingView';
import { DeviceSensorsView } from './components/DeviceSensorsView';
import { OfflineQueueView } from './components/OfflineQueueView';
import { AIAssistantView } from './components/AIAssistantView';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const DEFAULT_USER: UserProfile = {
  id: 'usr_admin_01',
  name: 'Dr. Evelyn Vance',
  email: 'e.vance@central-tech.edu',
  role: 'school_admin',
  schoolId: 'sch_central_tech',
  schoolName: 'Central Technical Institute',
  districtId: 'dist_west_02',
  districtName: 'Western Metropolitan District',
  origin: 'registered',
  verificationStatus: 'VERIFIED',
  avatarUrl: '/swi_shield_seal.png',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('swi_current_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_USER;
  });

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Core Data Stores
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [wellbeing, setWellbeing] = useState<WellbeingCheckIn[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<QueuedOfflineMutation[]>([]);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const refreshAllData = useCallback(() => {
    setStudents(api.getStudents());
    setIncidents(api.getIncidents());
    setWellbeing(api.getWellbeingCheckIns());
    setOfflineQueue(api.getOfflineQueue());
  }, []);

  // Initialize and register online/offline listeners
  useEffect(() => {
    refreshAllData();

    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network connection restored. Online mode active.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Network offline. Mutations will be stored in offline queue.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshAllData, showToast]);

  const handleToggleOnline = useCallback(() => {
    setIsOnline(prev => {
      const next = !prev;
      showToast(
        next
          ? 'Network re-established. Automatic sync queue enabled.'
          : 'Simulating offline state. All mutations will be written to local storage.',
        next ? 'success' : 'warning'
      );
      return next;
    });
  }, [showToast]);

  const handleSync = useCallback(async () => {
    const queue = api.getOfflineQueue();
    if (queue.length === 0) {
      showToast('Offline queue is already clean. No pending writes.', 'info');
      return;
    }
    const result = await api.processOfflineQueue();
    refreshAllData();
    showToast(
      `Sync processed: ${result.resolved} mutations synchronized, ${result.failed} failed.`,
      result.failed > 0 ? 'warning' : 'success'
    );
  }, [refreshAllData, showToast]);

  const handleUserChange = useCallback((newUser: UserProfile) => {
    setCurrentUser(newUser);
    try {
      localStorage.setItem('swi_current_profile', JSON.stringify(newUser));
    } catch {}
    showToast(`Active persona switched to ${newUser.name} (${newUser.role})`, 'info');
  }, [showToast]);

  const handleSelectStudent = useCallback((student: Student | null) => {
    setSelectedStudent(student);
    if (student) {
      setActiveView('students');
    }
  }, []);

  const handleUpdateStudent = useCallback((updatedStudent: Student) => {
    api.updateStudent(updatedStudent);
    refreshAllData();
    setSelectedStudent(updatedStudent);
    showToast(`Student record for ${updatedStudent.name} successfully updated.`, 'success');
  }, [refreshAllData, showToast]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        isOnline={isOnline}
        queuedCount={offlineQueue.length}
        activeView={activeView}
        onNavigate={setActiveView}
        onToggleOnline={handleToggleOnline}
        onSync={handleSync}
        onUserChange={handleUserChange}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* SWI Control Boundary & Spine Invariant Banner */}
      <SWIBoundaryBanner />

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md bg-slate-900/95 border-slate-700 text-white">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
          <p className="text-xs font-medium flex-1">{toast.message}</p>
          <button
            onClick={() => setToast(null)}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Body: Responsive Sidebar + Main Application View Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar & Mobile Drawer */}
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          role={currentUser.role}
          queuedCount={offlineQueue.length}
        />

        {/* Dynamic View Panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900/60 focus:outline-none">
          {activeView === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              students={students}
              incidents={incidents}
              wellbeing={wellbeing}
              queuedCount={offlineQueue.length}
              isOnline={isOnline}
              onNavigate={setActiveView}
              onSelectStudent={(student) => handleSelectStudent(student)}
            />
          )}

          {activeView === 'students' && (
            <StudentDirectoryView
              students={students}
              selectedStudent={selectedStudent}
              currentUserRole={currentUser.role}
              onSelectStudent={setSelectedStudent}
              onUpdateStudent={handleUpdateStudent}
            />
          )}

          {activeView === 'wellbeing' && (
            <WellbeingCheckInView
              currentUser={currentUser}
              students={students}
              wellbeingRecords={wellbeing}
              isOnline={isOnline}
              onRefresh={refreshAllData}
            />
          )}

          {activeView === 'workflow' && (
            <WorkflowGuardView currentUser={currentUser} />
          )}

          {activeView === 'incidents' && (
            <IncidentCenterView
              currentUser={currentUser}
              students={students}
              incidents={incidents}
              isOnline={isOnline}
              onRefresh={refreshAllData}
            />
          )}

          {activeView === 'reports' && (
            <ReportsAndAuditingView currentUser={currentUser} />
          )}

          {activeView === 'sensors' && (
            <DeviceSensorsView />
          )}

          {activeView === 'offline' && (
            <OfflineQueueView
              currentUser={currentUser}
              isOnline={isOnline}
              queuedMutations={offlineQueue}
              onToggleOnline={handleToggleOnline}
              onRefresh={refreshAllData}
            />
          )}

          {activeView === 'assistant' && (
            <AIAssistantView currentUser={currentUser} />
          )}
        </main>
      </div>

      {/* Institutional Legal & Provenance Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-3 px-6 text-center text-xs text-slate-300 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>SWI Architecture v2.6.4</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-[11px] text-slate-400">Spine: Permit(a) ⟺ ∀L,G,S,H: C(a) ⊆ L∩G∩S∩H ∧ E(a) ≠ ∅</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Non-repudiable Audit Hash Integrity: Active</span>
          <span className="text-slate-600">•</span>
          <span>Cross-Platform Responsive: Verified</span>
        </div>
      </footer>
    </div>
  );
}
