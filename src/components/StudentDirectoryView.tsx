/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Student Directory & Detail View
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  User,
  Phone,
  Mail,
  School,
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Heart,
  BookOpen,
} from 'lucide-react';
import { Student, UserRole } from '../types';
import { formatSWIStage } from '../services/swiWorkflowGuard';

interface StudentDirectoryViewProps {
  students: Student[];
  selectedStudent: Student | null;
  currentUserRole: UserRole;
  onSelectStudent: (student: Student | null) => void;
  onUpdateStudent: (student: Student) => void;
}

export const StudentDirectoryView: React.FC<StudentDirectoryViewProps> = ({
  students,
  selectedStudent,
  currentUserRole,
  onSelectStudent,
  onUpdateStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');

  // Filter students based on query, grade, and risk level
  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.schoolName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade = selectedGrade === 'ALL' || student.grade === selectedGrade;
    const matchesRisk = selectedRisk === 'ALL' || student.riskLevel === selectedRisk;

    return matchesSearch && matchesGrade && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Student Directory & Records</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified student records with attendance, wellbeing telemetry, and SWI stage progression.
          </p>
        </div>
      </div>

      {/* Main Content: If a student is selected, show detailed inspector; otherwise show searchable table */}
      {selectedStudent ? (
        <div className="space-y-6 animate-in fade-in duration-150">
          <button
            onClick={() => onSelectStudent(null)}
            className="flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Full Directory</span>
          </button>

          {/* Student Profile Header Card */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xl overflow-hidden shrink-0">
                <User className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-100">{selectedStudent.name}</h2>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      selectedStudent.origin === 'registered'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {selectedStudent.origin.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {selectedStudent.studentNumber} · {selectedStudent.grade} · Age {selectedStudent.age}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <School className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedStudent.schoolName}</span>
                </div>
              </div>
            </div>

            {/* Stage Pill */}
            <div className="flex flex-col sm:items-end gap-1.5 self-start md:self-auto">
              <span className="text-[11px] text-slate-400">Current SWI Invariant Stage</span>
              <span className={`text-xs px-3 py-1 rounded-md font-mono font-medium ${formatSWIStage(selectedStudent.status).badgeColor}`}>
                {formatSWIStage(selectedStudent.status).label}
              </span>
              <span className="text-[10px] text-slate-500 max-w-xs text-right">
                {formatSWIStage(selectedStudent.status).description}
              </span>
            </div>
          </div>

          {/* Detailed Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Attendance Box */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">30-Day Attendance</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
                {selectedStudent.attendanceRate}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${selectedStudent.attendanceRate}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Verified roll call check-in data</p>
            </div>

            {/* Overall Academic Average */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Academic Average</span>
                <BookOpen className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
                {selectedStudent.overallGrade}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{ width: `${selectedStudent.overallGrade}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Weighted coursework & exam benchmarks</p>
            </div>

            {/* Wellbeing Index */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Wellbeing Score</span>
                <Heart className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
                {selectedStudent.wellbeingScore}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all"
                  style={{ width: `${selectedStudent.wellbeingScore}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Derived from daily self-reflection check-ins</p>
            </div>
          </div>

          {/* Academic & Guardian Details Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Guardian & Privacy Contacts */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 mb-3">Guardian & Emergency Contact</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Authorized Guardian</span>
                  <span className="font-semibold text-slate-200">{selectedStudent.guardianName}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </div>
                  <span className="font-mono text-slate-300">{selectedStudent.guardianEmail}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Telephone</span>
                  </div>
                  <span className="font-mono text-slate-300">{selectedStudent.guardianPhone}</span>
                </div>
              </div>
            </div>

            {/* Educational Notes & Interventions */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 mb-3">Counselor & Faculty Notes</h3>
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed min-h-[100px]">
                {selectedStudent.notes || 'No active faculty intervention flags on record.'}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Last updated: {new Date(selectedStudent.lastUpdated).toLocaleDateString()}</span>
                <span className="font-mono text-[10px]">Dual-Verification Protected</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Student Directory Table */
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by student name, ID or school..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Grade Filter */}
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Grades</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>

            {/* Risk Level Filter */}
            <select
              value={selectedRisk}
              onChange={e => setSelectedRisk(e.target.value)}
              className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="ELEVATED">Elevated Attention</option>
              <option value="CRITICAL">Critical Priority</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">School</th>
                  <th className="py-2.5 px-3 text-right">Attendance</th>
                  <th className="py-2.5 px-3 text-right">Academics</th>
                  <th className="py-2.5 px-3 text-right">Wellbeing</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">SWI Stage</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No student records match the active search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => {
                    const stageInfo = formatSWIStage(student.status);
                    const isCritical = student.riskLevel === 'CRITICAL';
                    const isElevated = student.riskLevel === 'ELEVATED';

                    return (
                      <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-medium text-slate-100">
                          {student.name}
                          <div className="text-[10px] text-slate-500 font-mono">{student.studentNumber}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{student.grade}</td>
                        <td className="py-3 px-3 text-slate-400 truncate max-w-[140px]">
                          {student.schoolName}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <span className={student.attendanceRate < 80 ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
                            {student.attendanceRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200">
                          {student.overallGrade}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200">
                          {student.wellbeingScore}/100
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              isCritical
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                                : isElevated
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {student.riskLevel}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${stageInfo.badgeColor}`}>
                            {stageInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onSelectStudent(student)}
                            className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
