import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Users, Calendar, FileText, 
  Shield, BarChart3, Settings, Bell,
  TrendingUp, AlertTriangle, CheckCircle2,
  Clock, Search, Filter, Plus, Layers,
  Server, Database, Cpu
} from 'lucide-react';
import { fetchStudents, fetchIncidents } from '../services/api';
import { Student, User, IncidentReport } from '../types';
import { PolicyUpload } from './PolicyUpload';
import { Gauge } from './Gauge';
import { SystemArchitecture } from './SystemArchitecture';
import { SecurityScanner } from './SecurityScanner';
import { onSnapshot, collection, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'scheduling' | 'analytics' | 'reports' | 'teachers' | 'architecture' | 'students' | 'classes' | 'policy'>('overview');
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [filterSchool, setFilterSchool] = useState('All Schools');

  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Clean up existing Firestore listeners on auth change
      // But NOT the auth listener itself!
      unsubscribes.forEach(unsub => {
        if (unsub !== unsubscribeAuth) unsub();
      });
      // Filter out the closed listeners but keep the auth listener
      unsubscribes = [unsubscribeAuth];

      if (!fbUser) {
        console.log('No Firebase user, using API fallbacks for AdminDashboard');
        const loadData = async () => {
          try {
            const [sData, iData] = await Promise.all([
              fetchStudents(),
              fetchIncidents()
            ]);
            setStudents(sData);
            setIncidents(iData);
          } catch (err) {
            console.error(err);
          }
        };
        loadData();
        return;
      }

      try {
        console.log('Firebase auth ready, setting up Firestore listeners for AdminDashboard');
        
        // Ensure user doc exists before querying (prevents getUsername() failure in rules)
        const userDocRef = doc(db, 'users', fbUser.uid);
        let userDoc = await getDoc(userDocRef);
        
        // Retry a few times if not found (sync might be in progress)
        let retries = 0;
        while (!userDoc.exists() && retries < 15) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          userDoc = await getDoc(userDocRef);
          retries++;
        }

        if (!userDoc.exists()) {
          console.warn('[AdminDashboard] User document not found in Firestore after retries. Permissions might fail. Falling back to API.');
          // Fallback to API if Firestore sync is failing
          try {
            const [sData, iData] = await Promise.all([
              fetchStudents(user.id, user.role),
              fetchIncidents()
            ]);
            setStudents(sData);
            setIncidents(iData);
          } catch (apiErr) {
            console.error('[AdminDashboard] API fallback failed:', apiErr);
          }
          return;
        }

        const studentsQuery = query(collection(db, 'students'));
        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
          const sData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as unknown as Student[];
          setStudents(sData);
        }, (error) => {
          console.error('[AdminDashboard] Students onSnapshot error:', error);
          handleFirestoreError(error, OperationType.GET, 'students');
        });
        unsubscribes.push(unsubStudents);

        const incidentsQuery = query(
          collection(db, 'incidents'),
          limit(100)
        );
        const unsubIncidents = onSnapshot(incidentsQuery, (snapshot) => {
          const iData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as IncidentReport[];
          setIncidents(iData);
        }, (error) => {
          console.error('[AdminDashboard] Incidents onSnapshot error:', error);
          handleFirestoreError(error, OperationType.GET, 'incidents');
        });
        unsubscribes.push(unsubIncidents);
      } catch (err) {
        console.error('Error setting up AdminDashboard listeners:', err);
      }
    });

    unsubscribes.push(unsubscribeAuth);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user]);

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/security/scan', { method: 'POST' });
      const result = await response.json();
      alert(`Security Scan Completed!\nViolations: ${result.metrics.permissionViolations}\nAnomalies: ${result.metrics.behaviorAnomalies}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await fetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'safety', filters: {} })
      });
      const result = await response.json();
      alert(`Report Generated: ${result.reportId}\nDownload will begin shortly.`);
    } catch (err) {
      console.error(err);
    }
  };

  const stats = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Active Incidents', value: incidents.filter(i => i.status === 'open').length, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Staff Members', value: 42, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Daily Attendance', value: '94%', icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">School Administration</h2>
          <p className="text-slate-500">Managing operations, safety, and academic excellence</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-black/5 rounded-2xl px-4 py-2 shadow-sm">
            <Building className="w-4 h-4 text-slate-400" />
            <select 
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="text-sm font-bold bg-transparent outline-none"
            >
              <option>All Schools</option>
              <option>Central High</option>
              <option>West Academy</option>
              <option>North Secondary</option>
            </select>
          </div>
          <button 
            onClick={handleGenerateReport}
            className="px-6 py-3 bg-black text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
          <button 
            onClick={handleRunScan}
            disabled={isScanning}
            className={`px-6 py-3 ${isScanning ? 'bg-slate-400' : 'bg-indigo-600'} text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2`}
          >
            <Shield className="w-4 h-4" />
            {isScanning ? 'Scanning...' : 'Run Manual Scan'}
          </button>
        </div>
      </div>

      {/* Security Oversight */}
      <SecurityScanner />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-black/5"
          >
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-black/5 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'classes', label: 'Classes', icon: Layers },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'teachers', label: 'Teachers', icon: Users },
          { id: 'scheduling', label: 'Scheduling', icon: Calendar },
          { id: 'analytics', label: '4D Analytics', icon: TrendingUp },
          { id: 'reports', label: 'Safety Reports', icon: Shield },
          { id: 'policy', label: 'Policy Ingestion', icon: FileText },
          { id: 'architecture', label: 'System Architecture', icon: Layers },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? 'text-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="admin-tab-active"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" 
              />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Scalability Highlight */}
              <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity translate-x-12 -translate-y-12">
                  <Server className="w-64 h-64" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-indigo-500/20 rounded-3xl backdrop-blur-md border border-white/10">
                      <Cpu className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tighter">System Scalability Engine</h3>
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">990K User Dataset Performance Metrics</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Simulated Users</p>
                      <p className="text-5xl font-black tracking-tighter text-emerald-400">990,000</p>
                      <p className="text-[10px] text-white/30 mt-2 font-bold italic">Generated via SWI Data Pipeline</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Mean Query Latency</p>
                      <p className="text-5xl font-black tracking-tighter text-indigo-400">12.4ms</p>
                      <p className="text-[10px] text-white/30 mt-2 font-bold italic">Optimized via Vector Indexing</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Integrity Drift</p>
                      <p className="text-5xl font-black tracking-tighter text-rose-400">0.02%</p>
                      <p className="text-[10px] text-white/30 mt-2 font-bold italic">Real-time consistency check</p>
                    </div>
                  </div>
                  <div className="mt-12 pt-8 border-t border-white/10 flex items-center gap-8">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Database Throughput</span>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">84.2k req/s</span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '72%' }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                      <Database className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">VectorDB Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summarized View Sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Students Summary */}
                <motion.div 
                  onClick={() => setActiveTab('students')}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">View All</span>
                  </div>
                  <h4 className="text-lg font-bold mb-1">Students</h4>
                  <p className="text-xs text-slate-500 mb-4">{students.length} Total • {students.filter(s => s.risk_level === 'high').length} Flagged</p>
                  <div className="space-y-2">
                    {students.slice(0, 3).map(s => (
                      <div key={s.id} className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-600">{s.name}</span>
                        <span className={s.risk_level === 'high' ? 'text-rose-500' : 'text-emerald-500'}>{s.risk_level.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Teachers Summary */}
                <motion.div 
                  onClick={() => setActiveTab('teachers')}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl">
                      <Shield className="w-6 h-6 text-indigo-500" />
                    </div>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">View All</span>
                  </div>
                  <h4 className="text-lg font-bold mb-1">Teachers</h4>
                  <p className="text-xs text-slate-500 mb-4">42 Active • 3 Pending Approval</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-600">Sarah Molefe</span>
                      <span className="text-emerald-500">ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-600">John Dube</span>
                      <span className="text-amber-500">PENDING</span>
                    </div>
                  </div>
                </motion.div>

                {/* Events & Needs Summary */}
                <motion.div 
                  onClick={() => setActiveTab('scheduling')}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-50 rounded-2xl">
                      <Calendar className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Manage</span>
                  </div>
                  <h4 className="text-lg font-bold mb-1">Events & Needs</h4>
                  <p className="text-xs text-slate-500 mb-4">2 Upcoming • 5 Urgent Needs</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-600">PTA Meeting</span>
                      <span className="text-slate-400">MAR 20</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-600">Lab Equipment</span>
                      <span className="text-rose-500">URGENT</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                <h3 className="font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Recent Activity Log
                </h3>
                <div className="space-y-4">
                  {incidents.slice(0, 5).map((incident, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          incident.severity === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{incident.type}</p>
                          <p className="text-[10px] text-slate-500">{incident.description.slice(0, 50)}...</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400">{incident.timestamp}</p>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                          incident.status === 'open' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    Class Management
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Grouped by Grade and Section</p>
                </div>
              </div>
              <div className="space-y-4">
                {['Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 12-C'].map((className) => (
                  <div key={className} className="border border-black/5 rounded-2xl overflow-hidden">
                    <button 
                      onClick={() => setExpandedClass(expandedClass === className ? null : className)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                          {className.split(' ')[1][0]}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold">{className}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Teacher: Sarah Molefe • 35 Students</p>
                        </div>
                      </div>
                      <Plus className={`w-4 h-4 transition-transform ${expandedClass === className ? 'rotate-45' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {expandedClass === className && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-white"
                        >
                          <div className="p-4 space-y-2">
                            {students.filter(s => s.class_grade === className.split('-')[0]).map(student => (
                              <div key={student.id} className="border border-slate-50 rounded-xl overflow-hidden">
                                <button 
                                  onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-[10px] font-bold">
                                      {student.name[0]}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{student.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                                      student.risk_level === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                                    }`}>
                                      {student.risk_level}
                                    </span>
                                    <Plus className={`w-3 h-3 transition-transform ${expandedStudent === student.id ? 'rotate-45' : ''}`} />
                                  </div>
                                </button>
                                <AnimatePresence>
                                  {expandedStudent === student.id && (
                                    <motion.div 
                                      initial={{ height: 0 }}
                                      animate={{ height: 'auto' }}
                                      exit={{ height: 0 }}
                                      className="overflow-hidden bg-slate-50/50 p-4 border-t border-slate-50"
                                    >
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Academic</p>
                                          <p className="text-xs font-bold text-slate-700">GPA: 3.8 • Rank: #5</p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Attendance</p>
                                          <p className="text-xs font-bold text-slate-700">98% (Stable)</p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Behavior</p>
                                          <p className="text-xs font-bold text-emerald-600">Positive</p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Parent</p>
                                          <p className="text-xs font-bold text-slate-700">{student.guardian_name || 'N/A'}</p>
                                        </div>
                                      </div>
                                      <div className="mt-4 flex gap-2">
                                        <button className="px-3 py-1 bg-black text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Edit Profile</button>
                                        <button className="px-3 py-1 bg-white border border-black/5 rounded-lg text-[8px] font-black uppercase tracking-widest">View Full Analytics</button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Student Registry
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Full Academic & Behavioral Drill-Down</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-black/5 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Grade</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Risk Level</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Parent Contact</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(student => (
                      <tr key={student.id} className="border-b border-black/5 hover:bg-slate-50 transition-colors group">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {student.name[0]}
                            </div>
                            <span className="text-sm font-bold">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-xs font-medium text-slate-600">{student.class_grade}</td>
                        <td className="py-4">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                            student.risk_level === 'high' ? 'bg-rose-100 text-rose-600' : 
                            student.risk_level === 'medium' ? 'bg-amber-100 text-amber-600' : 
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                            {student.risk_level}
                          </span>
                        </td>
                        <td className="py-4 text-xs font-medium text-slate-600">
                          {student.guardian_name || 'Unlinked'}
                        </td>
                        <td className="py-4">
                          <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Drill Down
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'scheduling' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <h3 className="font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                School Timetable Manager
              </h3>
              <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Interactive scheduler coming soon.</p>
              </div>
            </div>
          )}

          {activeTab === 'teachers' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    Teacher Management
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Approve and Manage Staff</p>
                </div>
                <button className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Teacher
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Sarah Molefe', subject: 'Mathematics', status: 'approved', id: 'T001' },
                  { name: 'John Dube', subject: 'Science', status: 'pending_district', id: 'T002' },
                  { name: 'Grace Phiri', subject: 'English', status: 'pending_ministry', id: 'T003' },
                ].map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        {teacher.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{teacher.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{teacher.subject} • {teacher.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                        teacher.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                        teacher.status === 'pending_district' ? 'bg-amber-100 text-amber-600' : 
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {teacher.status.replace('_', ' ')}
                      </span>
                      {teacher.status === 'approved' ? (
                        <button className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400">
                          <Settings className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="px-3 py-1 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                          Escalate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="lg:col-span-3">
              <SystemArchitecture />
            </div>
          )}

          {activeTab === 'policy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                <h3 className="text-2xl font-black tracking-tighter mb-2">School Policy Ingestion</h3>
                <p className="text-slate-500 mb-8">Upload school prospectuses and codes of conduct to harden the CEK Sentinel compliance vectors.</p>
                <PolicyUpload level="admin" />
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          {/* School Health Gauge */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">School Integrity Index</h3>
            <Gauge 
              value={92} 
              label="Integrity Index" 
              size="lg" 
              showSynth={true}
            />
            <div className="mt-6 text-center">
              <p className="text-lg font-black text-emerald-500 uppercase tracking-tighter">High Integrity</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Institutional Compliance Score</p>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Safety Compliance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">SWI Scan Coverage</span>
                <span className="text-xs font-bold text-emerald-400">100%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-full" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Ethical Risk Level</span>
                <span className="text-xs font-bold text-emerald-400">Low</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-500" />
              Admin Alerts
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <p className="text-[10px] font-bold text-rose-700">3 High Risk Incidents Pending</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-700">Teacher Attendance Below 90%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
