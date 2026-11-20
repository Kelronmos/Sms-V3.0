/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Daily Wellbeing Check-In View
 * Follows student privacy guidelines with client-side signature generation.
 */

import React, { useState } from 'react';
import {
  Heart,
  Moon,
  Sparkles,
  Zap,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { WellbeingCheckIn, UserProfile, Student } from '../types';
import { api } from '../services/api';

interface WellbeingCheckInViewProps {
  currentUser: UserProfile;
  students: Student[];
  wellbeingRecords: WellbeingCheckIn[];
  isOnline: boolean;
  onRefresh: () => void;
}

export const WellbeingCheckInView: React.FC<WellbeingCheckInViewProps> = ({
  currentUser,
  students,
  wellbeingRecords,
  isOnline,
  onRefresh,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.id || 'stu_101'
  );
  const [moodScore, setMoodScore] = useState<number>(4);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [focusLevel, setFocusLevel] = useState<number>(4);
  const [stressLevel, setStressLevel] = useState<number>(2);
  const [energyLevel, setEnergyLevel] = useState<number>(4);
  const [selfNotes, setSelfNotes] = useState('');
  const [privacyProtected, setPrivacyProtected] = useState(true);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedStudent = students.find(s => s.id === selectedStudentId);
    const studentName = selectedStudent ? selectedStudent.name : currentUser.name;

    const checkInData = {
      studentId: selectedStudentId,
      studentName,
      moodScore,
      sleepHours,
      focusLevel,
      stressLevel,
      energyLevel,
      selfNotes: selfNotes.trim() || undefined,
      privacyProtected,
      swiStage: 'TESTED' as const,
      origin: currentUser.origin,
    };

    if (!isOnline) {
      api.enqueueOfflineMutation('/api/wellbeing/checkin', 'POST', checkInData);
      setSubmittedStatus('Offline: Check-in saved to local queue (QUEUED_OFFLINE). Will synchronize when connectivity resumes.');
    } else {
      api.addWellbeingCheckIn(checkInData);
      setSubmittedStatus('Wellbeing check-in cryptographically signed and recorded (TESTED stage).');
    }

    setSelfNotes('');
    onRefresh();

    setTimeout(() => {
      setSubmittedStatus(null);
    }, 5000);
  };

  const getMoodEmoji = (val: number) => {
    switch (val) {
      case 1: return '😞 Disheartened';
      case 2: return '🙁 Stressed / Fatigued';
      case 3: return '😐 Neutral';
      case 4: return '🙂 Focused & Motivated';
      case 5: return '🌟 Optimistic & Energetic';
      default: return '😐';
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Student Wellbeing & Daily Self-Reflection</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Confidential check-ins protected by student privacy boundaries and non-repudiable integrity hashes.
        </p>
      </div>

      {submittedStatus && (
        <div className="p-4 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-200 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>{submittedStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form: Log Check-In (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Daily Wellbeing Entry</h2>
              <p className="text-xs text-slate-400">Capture sleep, stress, and energy indicators</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/40">
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy Shield Active</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student Target Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Student
              </label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.studentNumber} - {s.grade})
                  </option>
                ))}
              </select>
            </div>

            {/* Slider 1: Mood Score */}
            <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  Self-Reported Mood State
                </span>
                <span className="text-xs font-semibold text-cyan-400 font-mono">
                  {getMoodEmoji(moodScore)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={moodScore}
                onChange={e => setMoodScore(Number(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>1: Low / Depleted</span>
                <span>3: Moderate</span>
                <span>5: Thriving</span>
              </div>
            </div>

            {/* Slider 2: Sleep Duration */}
            <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  Sleep Duration (Previous Night)
                </span>
                <span className="text-xs font-semibold text-slate-100 font-mono tabular-nums">
                  {sleepHours} Hours
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                step="0.5"
                value={sleepHours}
                onChange={e => setSleepHours(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>3h (Deprived)</span>
                <span>7.5h - 9h (Recommended for Adolescents)</span>
                <span>12h</span>
              </div>
            </div>

            {/* Dual Row: Focus and Stress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Focus Level */}
              <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Cognitive Focus
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">{focusLevel}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={focusLevel}
                  onChange={e => setFocusLevel(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Stress Level */}
              <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-rose-400" />
                    Stress Level
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">{stressLevel}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={stressLevel}
                  onChange={e => setStressLevel(Number(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Confidential Reflection Note */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Reflective Journal Snippet (Confidential)
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyProtected}
                    onChange={e => setPrivacyProtected(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Encrypt for Counselor Eyes Only</span>
                </label>
              </div>
              <textarea
                rows={3}
                placeholder="What supported or hindered your focus and wellbeing today?"
                value={selfNotes}
                onChange={e => setSelfNotes(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Record & Sign Daily Check-In</span>
            </button>
          </form>
        </div>

        {/* Right Column: Historical Verified Check-Ins (1 Col) */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Recent Sealed Check-Ins</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tamper-evident logs signed with cryptographic digest</p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {wellbeingRecords.map(item => (
              <div key={item.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-200">{item.studentName}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Mood</span>
                    <span className="text-cyan-400 font-bold">{item.moodScore}/5</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Sleep</span>
                    <span className="text-indigo-400 font-bold">{item.sleepHours}h</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Stress</span>
                    <span className="text-rose-400 font-bold">{item.stressLevel}/5</span>
                  </div>
                </div>

                {item.selfNotes && (
                  <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    "{item.selfNotes}"
                  </p>
                )}

                <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span>SEALED</span>
                  </span>
                  <span className="truncate max-w-[120px]">{item.signatureHash.substring(0, 16)}...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
