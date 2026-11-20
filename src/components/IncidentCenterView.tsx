/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Incident & Intervention Center
 * Manages institutional observations, automated test stages, and authorized interventions.
 * Includes modern multi-select severity filtering (Low, Medium, High, Critical).
 */

import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Plus,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ChevronRight,
  Filter,
  Check,
  RotateCcw,
  Search,
} from 'lucide-react';
import { IncidentRecord, Student, UserProfile } from '../types';
import { api } from '../services/api';
import { formatSWIStage } from '../services/swiWorkflowGuard';
import { ConfirmationModal } from './ConfirmationModal';

interface IncidentCenterViewProps {
  currentUser: UserProfile;
  students: Student[];
  incidents: IncidentRecord[];
  isOnline: boolean;
  onRefresh: () => void;
}

const SEVERITY_CONFIG: Array<{
  level: IncidentRecord['severity'];
  label: string;
  badgeClass: string;
  activeBg: string;
  activeBorder: string;
  textClass: string;
  dotClass: string;
}> = [
  {
    level: 'LOW',
    label: 'Low',
    badgeClass: 'bg-emerald-950 text-emerald-300 border border-emerald-800/60',
    activeBg: 'bg-emerald-950/70',
    activeBorder: 'border-emerald-500/80',
    textClass: 'text-emerald-300',
    dotClass: 'bg-emerald-400',
  },
  {
    level: 'MEDIUM',
    label: 'Medium',
    badgeClass: 'bg-sky-950 text-sky-300 border border-sky-800/60',
    activeBg: 'bg-sky-950/70',
    activeBorder: 'border-sky-500/80',
    textClass: 'text-sky-300',
    dotClass: 'bg-sky-400',
  },
  {
    level: 'HIGH',
    label: 'High',
    badgeClass: 'bg-amber-950 text-amber-300 border border-amber-800/60',
    activeBg: 'bg-amber-950/70',
    activeBorder: 'border-amber-500/80',
    textClass: 'text-amber-300',
    dotClass: 'bg-amber-400',
  },
  {
    level: 'CRITICAL',
    label: 'Critical',
    badgeClass: 'bg-rose-950 text-rose-300 border border-rose-800/60',
    activeBg: 'bg-rose-950/70',
    activeBorder: 'border-rose-500/80',
    textClass: 'text-rose-300',
    dotClass: 'bg-rose-400',
  },
];

export const IncidentCenterView: React.FC<IncidentCenterViewProps> = ({
  currentUser,
  students,
  incidents,
  isOnline,
  onRefresh,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || 'stu_101');
  const [category, setCategory] = useState<IncidentRecord['category']>('ATTENDANCE');
  const [severity, setSeverity] = useState<IncidentRecord['severity']>('MEDIUM');
  const [description, setDescription] = useState('');

  // Multi-select severity state
  const [selectedSeverities, setSelectedSeverities] = useState<Set<IncidentRecord['severity']>>(
    new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation modal state for consequential action
  const [confirmTarget, setConfirmTarget] = useState<{
    incidentId: string;
    newStage: IncidentRecord['swiStage'];
    newDecision: IncidentRecord['swiDecision'];
    actionTitle: string;
  } | null>(null);

  // Pre-calculate count of incidents for each severity level
  const severityCounts = useMemo(() => {
    const counts: Record<IncidentRecord['severity'], number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    incidents.forEach(inc => {
      if (counts[inc.severity] !== undefined) {
        counts[inc.severity]++;
      }
    });
    return counts;
  }, [incidents]);

  const toggleSeverity = (level: IncidentRecord['severity']) => {
    setSelectedSeverities(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const selectAllSeverities = () => {
    setSelectedSeverities(new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']));
  };

  const clearSeverityFilter = () => {
    setSelectedSeverities(new Set());
  };

  // Filtered incidents based on active multi-select severities and optional search
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesSeverity = selectedSeverities.has(incident.severity);
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        incident.studentName.toLowerCase().includes(q) ||
        incident.description.toLowerCase().includes(q) ||
        incident.category.toLowerCase().includes(q) ||
        incident.id.toLowerCase().includes(q);
      return matchesSeverity && matchesSearch;
    });
  }, [incidents, selectedSeverities, searchQuery]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === selectedStudentId);
    if (!student || !description.trim()) return;

    const payload = {
      studentId: student.id,
      studentName: student.name,
      category,
      severity,
      description: description.trim(),
      reportedBy: currentUser.name,
      reportedRole: currentUser.role,
      swiStage: 'OBSERVED' as const,
      swiDecision: 'ADVICE' as const,
    };

    if (!isOnline) {
      api.enqueueOfflineMutation('/api/incidents', 'POST', payload);
    } else {
      api.addIncident(payload);
    }

    setDescription('');
    setIsCreating(false);
    onRefresh();
  };

  const handleExecuteTransition = () => {
    if (!confirmTarget) return;

    api.updateIncidentStage(
      confirmTarget.incidentId,
      confirmTarget.newStage,
      confirmTarget.newDecision,
      currentUser.name,
      `Status updated by ${currentUser.name} (${currentUser.role}).`
    );

    setConfirmTarget(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Incident & Intervention Governance</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured Workflow Intelligence tracking from raw observation to institutional production authorization.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Cancel Entry' : 'Log New Incident'}</span>
        </button>
      </div>

      {/* Creation Drawer */}
      {isCreating && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 animate-in fade-in duration-150">
          <h2 className="text-sm font-semibold text-slate-100 mb-1">Record Institutional Observation</h2>
          <p className="text-xs text-slate-400 mb-4">
            Initial records enter as OBSERVED. Authority is required to progress through testing and sealing.
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Student</label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as IncidentRecord['category'])}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ATTENDANCE">Attendance Deficit</option>
                  <option value="WELLBEING">Wellbeing / Emotional Distress</option>
                  <option value="ACADEMIC">Academic Intervention</option>
                  <option value="SAFETY">Campus Safety</option>
                  <option value="EQUIPMENT">Equipment / Device Damage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value as IncidentRecord['severity'])}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="LOW">Low (Informational)</option>
                  <option value="MEDIUM">Medium (Advisory Check)</option>
                  <option value="HIGH">High (Counselor Outreach)</option>
                  <option value="CRITICAL">Critical (Immediate Escalation)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Factual Descriptive Narrative (Objective details only)
              </label>
              <textarea
                rows={3}
                placeholder="State clear, observable facts without subjective speculation..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
              >
                Submit Observation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modern Multi-Select Severity Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Multi-Select Buttons Container */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Severity Filter:</span>
            </div>

            {SEVERITY_CONFIG.map(cfg => {
              const isSelected = selectedSeverities.has(cfg.level);
              const count = severityCounts[cfg.level];

              return (
                <button
                  key={cfg.level}
                  type="button"
                  onClick={() => toggleSeverity(cfg.level)}
                  aria-pressed={isSelected}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? `${cfg.activeBg} ${cfg.activeBorder} ${cfg.textClass} shadow-xs ring-1 ring-white/10`
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                      isSelected
                        ? `${cfg.dotClass} border-transparent text-slate-950`
                        : 'border-slate-600 bg-slate-900'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                  <span>{cfg.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                      isSelected
                        ? 'bg-slate-900/80 text-white'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 ml-1 border-l border-slate-800 pl-2">
              <button
                type="button"
                onClick={selectAllSeverities}
                className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-slate-800/60 transition-colors"
                title="Select all severity levels"
              >
                All
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={clearSeverityFilter}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800/60 transition-colors"
                title="Deselect all severity levels"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search incidents or students..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Counter & Status Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
          <div className="flex items-center gap-2">
            <span>Showing {filteredIncidents.length} of {incidents.length} incidents</span>
            {selectedSeverities.size < 4 && (
              <span className="text-cyan-400">
                ({selectedSeverities.size} of 4 severity levels selected)
              </span>
            )}
          </div>
          <span className="text-slate-500 hidden sm:inline">
            SWI GOVERNANCE: OBSERVATION ≠ AUTHORITY
          </span>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <AlertOctagon className="w-10 h-10 mx-auto text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-300">No Incidents Match Selected Filters</p>
              <p className="text-xs text-slate-500 mt-1">
                {selectedSeverities.size === 0
                  ? 'No severity levels are currently active. Click below to view all incidents.'
                  : 'Try selecting additional severity levels or clearing your search term.'}
              </p>
            </div>
            <button
              onClick={selectAllSeverities}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Severity Filters</span>
            </button>
          </div>
        ) : (
          filteredIncidents.map(incident => {
            const stageInfo = formatSWIStage(incident.swiStage);
            const isCritical = incident.severity === 'CRITICAL';
            const isHigh = incident.severity === 'HIGH';
            const isMedium = incident.severity === 'MEDIUM';

            const canPromoteToTested = incident.swiStage === 'OBSERVED';
            const canPromoteToProven = incident.swiStage === 'TESTED';
            const canPromoteToSealed = incident.swiStage === 'PROVEN';
            const canAuthorizeProduction =
              incident.swiStage === 'SEALED' &&
              ['school_admin', 'district', 'ministry'].includes(currentUser.role);

            return (
              <div
                key={incident.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isCritical
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                          : isHigh
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                          : isMedium
                          ? 'bg-sky-950/80 text-sky-400 border border-sky-800/60'
                          : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                      }`}
                    >
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-100">{incident.studentName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {incident.category}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            isCritical
                              ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                              : isHigh
                              ? 'bg-amber-950 text-amber-300 border-amber-800/60'
                              : isMedium
                              ? 'bg-sky-950 text-sky-300 border-sky-800/60'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                          }`}
                        >
                          {incident.severity} SEVERITY
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Reported by {incident.reportedBy} ({incident.reportedRole}) on{' '}
                        {new Date(incident.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* SWI Stage and Decision */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`text-xs px-2.5 py-1 rounded font-mono ${stageInfo.badgeColor}`}>
                      {stageInfo.label}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      Decision: {incident.swiDecision}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  {incident.description}
                </p>

                {/* Invariant & Hash Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-3 font-mono text-[11px] flex-wrap">
                    <span>Evidence Hash: {incident.evidenceHash.substring(0, 12)}...</span>
                    {incident.authorizedBy && (
                      <span className="text-cyan-400">Authorized by: {incident.authorizedBy}</span>
                    )}
                  </div>

                  {/* Actions per SWI Stage */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {canPromoteToTested && (
                      <button
                        onClick={() =>
                          setConfirmTarget({
                            incidentId: incident.id,
                            newStage: 'TESTED',
                            newDecision: 'PASS',
                            actionTitle: 'Verify & Progress to TESTED',
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-medium border border-blue-700/60 cursor-pointer"
                      >
                        Run Automated Tests
                      </button>
                    )}

                    {canPromoteToProven && (
                      <button
                        onClick={() =>
                          setConfirmTarget({
                            incidentId: incident.id,
                            newStage: 'PROVEN',
                            newDecision: 'PASS',
                            actionTitle: 'Dual-Corroborate Evidence to PROVEN',
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-xs font-medium border border-indigo-700/60 cursor-pointer"
                      >
                        Dual-Corroborate
                      </button>
                    )}

                    {canPromoteToSealed && (
                      <button
                        onClick={() =>
                          setConfirmTarget({
                            incidentId: incident.id,
                            newStage: 'SEALED',
                            newDecision: 'PASS',
                            actionTitle: 'Cryptographically SEAL Incident',
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-medium border border-emerald-700/60 cursor-pointer"
                      >
                        Seal with SHA-256
                      </button>
                    )}

                    {canAuthorizeProduction && (
                      <button
                        onClick={() =>
                          setConfirmTarget({
                            incidentId: incident.id,
                            newStage: 'PRODUCTION_AUTHORIZED',
                            newDecision: 'APPROVAL',
                            actionTitle: 'Authorize for Institutional Production',
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
                      >
                        Institutional Sign-Off
                      </button>
                    )}

                    {incident.swiStage === 'PRODUCTION_AUTHORIZED' && (
                      <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Production Authorized</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmTarget && (
        <ConfirmationModal
          isOpen={true}
          title={confirmTarget.actionTitle}
          message={`Are you sure you want to transition incident to '${confirmTarget.newStage}' with decision '${confirmTarget.newDecision}'? This consequential action will be cryptographically logged to the audit log.`}
          confirmLabel="Authorize Transition"
          cancelLabel="Cancel"
          variant={confirmTarget.newStage === 'PRODUCTION_AUTHORIZED' ? 'primary' : 'warning'}
          onConfirm={handleExecuteTransition}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
};
