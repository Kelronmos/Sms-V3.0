/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Offline Synchronization Queue & Cache Manager
 * Satisfies Cross-Platform Rule #8:
 * Never represents a queued write as successfully synchronized.
 * Explicitly displays 'Last Synced' timestamp for verified data provenance.
 */

import React, { useState, useEffect } from 'react';
import {
  CloudOff,
  Wifi,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Database,
  Calendar,
} from 'lucide-react';
import { QueuedOfflineMutation, UserProfile } from '../types';
import { api } from '../services/api';
import { ConfirmationModal } from './ConfirmationModal';

interface OfflineQueueViewProps {
  currentUser: UserProfile;
  isOnline: boolean;
  queuedMutations: QueuedOfflineMutation[];
  onToggleOnline: () => void;
  onRefresh: () => void;
}

export const OfflineQueueView: React.FC<OfflineQueueViewProps> = ({
  currentUser,
  isOnline,
  queuedMutations,
  onToggleOnline,
  onRefresh,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    setLastSyncTime(api.getLastSyncTime());
  }, []);

  const formatLastSync = (isoString: string | null): { dateStr: string; timeStr: string; fullStr: string } => {
    if (!isoString) {
      return { dateStr: 'Not Synced', timeStr: 'Initial Session', fullStr: 'Never Synced (Awaiting Handshake)' };
    }
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { dateStr: 'Invalid Date', timeStr: '--', fullStr: 'Corrupt Sync Record' };
    }
    return {
      dateStr: d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
      timeStr: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      fullStr: `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`,
    };
  };

  const getRelativeTime = (isoString: string | null): string => {
    if (!isoString) return 'Awaiting initial server handshake';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Unknown sync state';
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleProcessSync = async () => {
    if (!isOnline) {
      setSyncFeedback('Cannot synchronize while offline. Restore connection first.');
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);
    const result = await api.processOfflineQueue();
    const updatedSyncTime = api.getLastSyncTime();
    setLastSyncTime(updatedSyncTime);
    setIsSyncing(false);
    onRefresh();

    if (result.failed > 0) {
      setSyncFeedback(`Sync partially completed: ${result.resolved} resolved, ${result.failed} failed.`);
    } else {
      setSyncFeedback(`Sync complete: ${result.resolved} queued mutations validated and committed at ${formatLastSync(updatedSyncTime).timeStr}.`);
    }
  };

  const handleClearQueue = () => {
    api.clearOfflineQueue();
    setClearConfirmOpen(false);
    onRefresh();
    setSyncFeedback('Offline mutation queue cleared.');
  };

  const syncFormatted = formatLastSync(lastSyncTime);
  const relativeTime = getRelativeTime(lastSyncTime);
  const hasPending = queuedMutations.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Offline Synchronization & Mutation Queue</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict verification: Queued writes remain uncommitted until verified by server handshake.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={onToggleOnline}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              isOnline
                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                : 'bg-amber-950/80 border-amber-700 text-amber-300'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulate Offline Disconnect</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Restore Online Connectivity</span>
              </>
            )}
          </button>

          {hasPending && (
            <>
              <button
                onClick={() => setClearConfirmOpen(true)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 transition-colors"
                title="Discard pending queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleProcessSync}
                disabled={isSyncing || !isOnline}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Process Sync ({queuedMutations.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Prominent Visual Provenance & Last Synced Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/90 border border-cyan-800/60 text-cyan-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-200">Data Provenance: Cache Verification Seal</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                  hasPending
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800/50'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasPending ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                {hasPending ? 'CACHE AWAITING FLUSH' : 'CACHE PROVENANCE VERIFIED'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-slate-400 font-medium">Last Synced:</span>
              <span className="font-mono text-cyan-300 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {syncFormatted.fullStr}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 text-[11px] font-medium">{relativeTime}</span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-slate-500 font-mono">Status: {isOnline ? 'Gateway Connected' : 'Local Offline Buffer'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={handleProcessSync}
            disabled={isSyncing || !isOnline}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-cyan-700/60 text-cyan-300 hover:bg-cyan-950/50 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            title="Verify server handshake and synchronize cache"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Verify Handshake</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Network & Invariant Status Cards with explicit Last Synced Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Last Synced Provenance Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>Last Synced</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-base font-bold font-mono text-cyan-300 tabular-nums">
              {syncFormatted.timeStr}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              {syncFormatted.dateStr}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Provenance age</span>
            <span className="text-slate-400 font-mono">{relativeTime}</span>
          </div>
        </div>

        {/* Card 2: Network Gateway */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>Network Gateway</span>
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <CloudOff className="w-4 h-4 text-amber-400" />}
            </div>
            <div className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            {isOnline ? 'Mutations stream to verified store' : 'Writes queued with idempotent nonces'}
          </div>
        </div>

        {/* Card 3: Pending Offline Writes */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>Pending Offline Writes</span>
              <Database className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-base font-bold font-mono text-slate-100 tabular-nums">
              {queuedMutations.length} {queuedMutations.length === 1 ? 'mutation' : 'mutations'}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            Queued ≠ Synced (Strict invariant)
          </div>
        </div>

        {/* Card 4: Conflict Resolution */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>Conflict Protocol</span>
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-base font-bold font-mono text-cyan-400">
              Server Revalidation
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            Authorizations re-verified upon sync
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100">Pending Mutation Register</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {queuedMutations.length} pending
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span className="hidden sm:inline">DATA PROVENANCE: CACHE ENFORCED</span>
            <span className="text-slate-600">•</span>
            <span>IDEMPOTENT NONCE</span>
          </div>
        </div>

        {queuedMutations.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" />
            <p className="font-medium text-slate-400">Queue is empty</p>
            <p className="text-[11px] mt-0.5 text-slate-500">
              All transactions have been committed or synced. Last synchronized at {syncFormatted.fullStr}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queuedMutations.map((mutation) => (
              <div
                key={mutation.id}
                className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-2 font-mono"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400">{mutation.method}</span>
                    <span className="text-slate-300">{mutation.endpoint}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 font-sans font-semibold">
                    QUEUED_OFFLINE
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 truncate">
                  Payload: {JSON.stringify(mutation.payload)}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span>ID: {mutation.id}</span>
                  <span>Queued: {new Date(mutation.timestamp).toLocaleTimeString()}</span>
                  <span>Retry Count: {mutation.retryCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {clearConfirmOpen && (
        <ConfirmationModal
          isOpen={true}
          title="Discard Pending Offline Writes"
          message="Are you sure you want to discard all queued offline mutations? Any changes made while offline will be permanently deleted and cannot be recovered."
          confirmLabel="Discard All Writes"
          cancelLabel="Keep Queue"
          variant="danger"
          onConfirm={handleClearQueue}
          onCancel={() => setClearConfirmOpen(false)}
        />
      )}
    </div>
  );
};
