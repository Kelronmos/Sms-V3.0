import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { 
  Users, TrendingUp, AlertCircle, Calendar, BookOpen, 
  Heart, Activity, Map, Filter, FileDown, Bell,
  LayoutGrid, GraduationCap, Building, Landmark, ShieldCheck,
  Search, Lock, User as UserIcon, Sparkles, Eye, X,
  Clock, Zap, BrainCircuit, History, AlertTriangle, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Metric, Student } from '../types';
import { fetchMetrics, fetchSummary, fetchStudents, connectWebSocket, fetchRegionsSummary, changePassword, generateAIImage, fetchPrediction, submitMetrics, fetchNationalInsights, fetchStudentIncidents, sendCommunication } from '../services/api';
import { AIAssistant } from './AIAssistant';
import { SecurityScanner } from './SecurityScanner';
import { CEKMonitor } from './CEKMonitor';
import { StudentDashboard } from './StudentDashboard';
import { DailyCheckIn } from './DailyCheckIn';
import { CommunicationCenter } from './CommunicationCenter';
import { IncidentReporting } from './IncidentReporting';
import { MinistryExport } from './MinistryExport';
import { InteractiveSummary } from './InteractiveSummary';
import { TeacherDashboard } from './TeacherDashboard';
import { ParentDashboard } from './ParentDashboard';
import { AdminDashboard } from './AdminDashboard';
import { DistrictDashboard } from './DistrictDashboard';
import { MinistryDashboard } from './MinistryDashboard';
import { Roadmap } from './Roadmap';
import { PolicyCompliance } from './PolicyCompliance';
import { DemoStats } from './DemoStats';

export const Dashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [activeRole, setActiveRole] = useState<string | null>(user.username === 'Admin' ? null : user.role);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [regionsSummary, setRegionsSummary] = useState<any[]>([]);
  const [nationalInsights, setNationalInsights] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(user.username !== 'Admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(user.must_change_password);
  const [newPassword, setNewPassword] = useState('');
  const [aiBanner, setAiBanner] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [studentAvatars, setStudentAvatars] = useState<Record<string, string>>({});
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [studentIncidents, setStudentIncidents] = useState<any[]>([]);
  const [showMinistryExport, setShowMinistryExport] = useState(false);
  const [showPolicyCompliance, setShowPolicyCompliance] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!activeRole) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [sum, stds, regSum, natIns] = await Promise.all([
          fetchSummary(), 
          fetchStudents(user.id, activeRole || undefined, gradeFilter, programFilter),
          fetchRegionsSummary(),
          activeRole === 'ministry' || user.username === 'Admin' ? fetchNationalInsights() : Promise.resolve(null)
        ]);
        setSummary(sum);
        const studentsArray = Array.isArray(stds) ? stds : [];
        setStudents(studentsArray);
        setRegionsSummary(Array.isArray(regSum) ? regSum : []);
        setNationalInsights(natIns);
        
        if (activeRole === 'student') {
          const studentId = user.username;
          if (selectedStudent !== studentId) {
            setSelectedStudent(studentId);
          }
          const studentMetrics = await fetchMetrics(studentId);
          setMetrics(Array.isArray(studentMetrics) ? studentMetrics : []);
        } else if (studentsArray.length > 0) {
          if (!selectedStudent || !studentsArray.find(s => s.student_id === selectedStudent)) {
            const firstStudentId = studentsArray[0].student_id;
            setSelectedStudent(firstStudentId);
            const studentMetrics = await fetchMetrics(firstStudentId);
            setMetrics(Array.isArray(studentMetrics) ? studentMetrics : []);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const ws = connectWebSocket((data) => {
      if (data.type === 'METRIC_UPDATE' && data.data.student_id === selectedStudent) {
        // Real-time update logic: refresh metrics
        fetchMetrics(selectedStudent).then(m => setMetrics(Array.isArray(m) ? m : []));
      }
      
      if (data.type === 'NEW_INCIDENT' || data.type === 'NEW_REVIEW_PENDING') {
        setNotifications(prev => [{
          id: Date.now(),
          ...data,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 5));
      }
    });

    return () => ws.close();
  }, [activeRole, selectedStudent, gradeFilter, programFilter]);

  const portals = [
    { id: 'student', label: 'Student Portal', icon: GraduationCap, color: 'bg-emerald-500', desc: 'Personal wellbeing & learning tracking' },
    { id: 'parent', label: 'Parent Portal', icon: Users, color: 'bg-indigo-500', desc: 'Child progress & safety monitoring' },
    { id: 'teacher', icon: Users, label: 'Teacher Portal', color: 'bg-amber-500', desc: 'Class analytics & risk detection' },
    { id: 'school_admin', label: 'School Admin', icon: ShieldCheck, color: 'bg-rose-500', desc: 'Institutional oversight & security' },
    { id: 'district', label: 'District Portal', icon: Building, color: 'bg-blue-500', desc: 'Regional trends & resource allocation' },
    { id: 'ministry', label: 'Ministry Portal', icon: Landmark, color: 'bg-purple-500', desc: 'National policy & health insights' },
  ];

  const handleLogout = () => {
    onLogout();
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) return;
    const res = await changePassword(user.id, newPassword);
    if (res.success) {
      setShowChangePassword(false);
      // Update local storage user
      const updatedUser = { ...user, must_change_password: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const filteredStudents = Array.isArray(students) ? students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const handleGenerateBanner = async () => {
    setIsGeneratingImage(true);
    const img = await generateAIImage(`A futuristic, calming educational dashboard banner for ${activeRole} role, high quality, soft colors`);
    if (img) setAiBanner(img);
    setIsGeneratingImage(false);
  };

  const handleStudentClick = async (studentId: string) => {
    setSelectedStudent(studentId);
    const [m, p, inc] = await Promise.all([
      fetchMetrics(studentId),
      fetchPrediction(studentId),
      fetchStudentIncidents(studentId)
    ]);
    setMetrics(m);
    setPrediction(p);
    setStudentIncidents(inc);
    setShowStudentModal(true);

    // Generate AI avatar if not exists
    if (!studentAvatars[studentId]) {
      const avatar = await generateAIImage(`A professional, friendly high-quality 3D avatar profile picture for a student, soft lighting, clean background`);
      if (avatar) {
        setStudentAvatars(prev => ({ ...prev, [studentId]: avatar }));
      }
    }
  };

  if (user.username === 'Admin' && !activeRole) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900">MASTER CONTROL</h1>
              <p className="text-slate-500">Select a portal to manage and monitor</p>
            </div>
            <button onClick={onLogout} className="px-6 py-2 bg-black text-white rounded-xl font-bold">Logout</button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portals.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ y: -5 }}
                onClick={() => setActiveRole(p.id)}
                className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 text-left group hover:shadow-xl transition-all"
              >
                <div className={`${p.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg`}>
                  <p.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{p.label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-black transition-colors">
                  ACCESS PORTAL
                  <TrendingUp className="w-3 h-3" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderStatCard = (title: string, value: string | number, icon: React.ReactNode, color: string) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
  );

  const currentStudent = (Array.isArray(students) ? students : []).find(s => s.student_id === selectedStudent);

  const getWellbeingColor = (score: number) => {
    if (score >= 4) return 'text-emerald-500';
    if (score >= 3) return 'text-amber-500';
    if (score >= 2) return 'text-orange-500';
    return 'text-rose-500';
  };

  const getWellbeingLabel = (score: number) => {
    if (score >= 4) return 'Stable';
    if (score >= 3) return 'Needs Attention';
    if (score >= 2) return 'Support Recommended';
    return 'Immediate Support Required';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading SWI Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Real-time Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="bg-white border-l-4 border-rose-500 p-4 rounded-xl shadow-2xl flex items-start gap-3"
            >
              <div className="bg-rose-100 p-1.5 rounded-lg">
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900">{n.message}</p>
                <p className="text-[10px] text-slate-500 mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))}
                className="text-slate-300 hover:text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* AI Banner */}
      {aiBanner && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-48 rounded-3xl mb-8 overflow-hidden shadow-2xl relative group"
        >
          <img src={aiBanner} alt="AI Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
            <div className="text-white">
              <h2 className="text-3xl font-black tracking-tighter uppercase">AI GENERATED THEME</h2>
              <p className="text-white/70 text-sm">Customized for your {activeRole} dashboard</p>
            </div>
          </div>
          <button 
            onClick={() => setAiBanner(null)}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <AlertCircle className="w-4 h-4 rotate-45" />
          </button>
        </motion.div>
      )}

      {/* Change Password Modal */}
      {/* Change Password Modal */}
      <AnimatePresence>
        {showStudentModal && currentStudent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-4">
                  <img 
                    src={studentAvatars[currentStudent.student_id] || `https://picsum.photos/seed/${currentStudent.student_id}/200/200`} 
                    className="w-12 h-12 rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{currentStudent.name}</h2>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Metrics History & AI Forecast</p>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        currentStudent.risk_level === 'high' ? 'bg-red-500 text-white' : 
                        currentStudent.risk_level === 'medium' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {currentStudent.risk_level} Risk
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowStudentModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* AI Prediction Section */}
                {prediction && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-indigo-900 text-white p-6 rounded-3xl relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <BrainCircuit className="w-5 h-5 text-indigo-300" />
                          <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">SWI AI Predictive Analysis</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{prediction.forecast}</h3>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {Array.isArray(prediction.factors) && prediction.factors.map((f: string, i: number) => (
                            <span key={i} className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
                              {f}
                            </span>
                          ))}
                        </div>

                        {/* AI Recommendations */}
                        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Actionable Recommendations</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {prediction.risk_level === 'high' ? (
                              <>
                                <div className="bg-rose-500/20 p-3 rounded-xl border border-rose-500/30 flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4 text-rose-300" />
                                  <span className="text-[10px] font-bold">Schedule Counselor Meeting</span>
                                </div>
                                <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 flex items-center gap-2">
                                  <Users className="w-4 h-4 text-amber-300" />
                                  <span className="text-[10px] font-bold">Initiate Parent Conference</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-emerald-300" />
                                  <span className="text-[10px] font-bold">Peer Mentorship Program</span>
                                </div>
                                <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-indigo-300" />
                                  <span className="text-[10px] font-bold">Academic Support Track</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Zap className="absolute -bottom-8 -right-8 w-48 h-48 text-white/5 rotate-12" />
                    </div>
                    <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Risk Probability</p>
                        <div className="text-4xl font-black text-emerald-400">{(prediction.risk_score * 100).toFixed(0)}%</div>
                      </div>
                      <div className="mt-4">
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${prediction.risk_score > 0.6 ? 'bg-red-500' : 'bg-emerald-400'}`} 
                            style={{ width: `${prediction.risk_score * 100}%` }} 
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 uppercase font-bold tracking-widest">Trend: {prediction.trend}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Incidents & Comms Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      Incident Logs
                    </h3>
                    <div className="space-y-3">
                      {studentIncidents.length > 0 ? studentIncidents.map((inc: any) => (
                        <div key={inc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
                              inc.category === 'bullying' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {inc.category}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400">{inc.date}</span>
                          </div>
                          <p className="text-sm text-slate-700">{inc.description}</p>
                          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Reported by: {inc.reported_by}</p>
                        </div>
                      )) : (
                        <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                          <p className="text-sm text-slate-400 italic">No incidents recorded for this student.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-indigo-500" />
                      Communication History
                    </h3>
                    <CommunicationCenter user={user} studentId={currentStudent.student_id} />
                  </div>
                </div>

                {/* Metrics Table */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" />
                    Historical Data Logs
                  </h3>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Mood</th>
                          <th className="px-6 py-4">Stress</th>
                          <th className="px-6 py-4">Sleep</th>
                          <th className="px-6 py-4">Wellbeing</th>
                          <th className="px-6 py-4">Behavior</th>
                          <th className="px-6 py-4">Engagement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(Array.isArray(metrics) ? metrics : []).map((m, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-600">{m.date}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-lg font-bold text-[10px] ${m.mood_score > 3 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {m.mood_score}/5
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-lg font-bold text-[10px] ${m.stress_score < 3 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {m.stress_score}/5
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">{m.sleep_hours}h</td>
                            <td className="px-6 py-4 font-bold text-slate-700">{m.self_reported_wellbeing}/10</td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                {m.behavior_patterns}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">{m.engagement_hours}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setShowStudentModal(false)} className="px-6 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-300 transition-colors">
                  Close
                </button>
                <button className="px-6 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
                  Generate Full Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChangePassword && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <Lock className="w-6 h-6" />
                <h2 className="text-xl font-bold">Change Password Required</h2>
              </div>
              <p className="text-slate-500 text-sm">For security reasons, you must change your password before continuing.</p>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">New Password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none"
                  placeholder="Enter new password"
                />
              </div>
              <button 
                onClick={handleChangePassword}
                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                UPDATE PASSWORD
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            {activeRole?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Dashboard
            {user.username === 'Admin' && (
              <span className="bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Master</span>
            )}
          </h1>
          <p className="text-slate-500">Welcome back, {user.full_name}</p>
        </div>
        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 animate-pulse">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Offline Mode</span>
            </div>
          )}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-black/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-black outline-none shadow-sm w-64"
            />
          </div>
          {user.username === 'Admin' && (
            <button 
              onClick={() => setActiveRole(null)}
              className="p-2 bg-white rounded-xl border border-black/5 shadow-sm hover:bg-slate-50"
              title="Back to Master Control"
            >
              <LayoutGrid className="w-5 h-5 text-slate-600" />
            </button>
          )}
          {user.username === 'Admin' && (
            <div className="flex bg-white rounded-xl border border-black/5 p-1 shadow-sm">
              <button 
                onClick={() => {
                  setShowMinistryExport(!showMinistryExport);
                  setShowPolicyCompliance(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                  showMinistryExport ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Landmark className="w-3 h-3" />
                National Command
              </button>
              <div className="w-px h-4 bg-slate-100 self-center mx-1" />
              <button 
                onClick={() => {
                  setShowPolicyCompliance(!showPolicyCompliance);
                  setShowMinistryExport(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                  showPolicyCompliance ? 'bg-rose-600 text-white' : 'text-rose-600 hover:bg-rose-50'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                Compliance
              </button>
              <div className="w-px h-4 bg-slate-100 self-center mx-1" />
              <button 
                onClick={handleGenerateBanner}
                disabled={isGeneratingImage}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 flex items-center gap-1"
              >
                <Sparkles className={`w-3 h-3 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                {isGeneratingImage ? 'Generating...' : 'AI Theme'}
              </button>
              <div className="w-px h-4 bg-slate-100 self-center mx-1" />
              {['student', 'parent', 'teacher', 'school_admin', 'district', 'ministry'].map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    activeRole === r ? 'bg-black text-white' : 'text-slate-400 hover:text-black'
                  }`}
                >
                  {r.split('_')[0]}
                </button>
              ))}
            </div>
          )}
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              {currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="text-sm font-black tracking-tighter text-slate-900">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <button className="p-2 bg-white rounded-xl border border-black/5 shadow-sm hover:bg-slate-50 relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-black text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      {showMinistryExport ? (
        <MinistryExport />
      ) : showPolicyCompliance ? (
        <PolicyCompliance role={activeRole || user.role} />
      ) : (
        <div className="space-y-8">
          {/* 4D Interactive Summary */}
          <InteractiveSummary role={activeRole || ''} data={{ metrics, summary, regionsSummary }} />

          {/* Demo Statistics & Social Proof */}
          <DemoStats />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Stats & Charts */}
          <div className="xl:col-span-2 space-y-8">
            
            {activeRole === 'student' && (
              <StudentDashboard 
                user={user} 
                student={currentStudent} 
                metrics={metrics} 
                onMetricsUpdate={(m) => setMetrics(m)}
              />
            )}

            {activeRole === 'teacher' && <TeacherDashboard user={user} onLogout={onLogout} />}
            {activeRole === 'parent' && <ParentDashboard user={user} />}
            {activeRole === 'school_admin' && <AdminDashboard user={user} />}
            {activeRole === 'district' && <DistrictDashboard user={user} />}
            {activeRole === 'ministry' && <MinistryDashboard user={user} />}

            {activeRole !== 'student' && activeRole !== 'teacher' && activeRole !== 'parent' && activeRole !== 'school_admin' && activeRole !== 'district' && activeRole !== 'ministry' && (
              <>
              {/* Student Profile Header (if applicable) */}
              {currentStudent && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <img 
                  src={studentAvatars[currentStudent.student_id] || `https://picsum.photos/seed/${currentStudent.student_id}/200/200`} 
                  alt={currentStudent.name}
                  className="w-24 h-24 rounded-2xl object-cover shadow-lg border-4 border-white"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  {currentStudent.name}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    currentStudent.risk_level === 'high' ? 'bg-red-500 text-white' : 
                    currentStudent.risk_level === 'medium' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {currentStudent.risk_level} Risk
                  </span>
                </h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    ID: {currentStudent.student_id}
                  </span>
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    {currentStudent.class_grade}
                  </span>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    School: {currentStudent.school_id}
                  </span>
                  <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Program: {currentStudent.program}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-3 bg-slate-100 rounded-2xl text-slate-600 hover:bg-slate-200 transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleStudentClick(currentStudent.student_id)}
                  className="px-6 py-3 bg-black text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Metrics
                </button>
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderStatCard('Avg Mood', summary?.avg_mood?.toFixed(1) || '0.0', <Heart className="w-6 h-6 text-rose-500" />, 'bg-rose-50')}
            {renderStatCard('Avg Stress', summary?.avg_stress?.toFixed(1) || '0.0', <Activity className="w-6 h-6 text-amber-500" />, 'bg-amber-50')}
            {renderStatCard('Attendance', `${(summary?.avg_attendance * 100).toFixed(0)}%`, <Calendar className="w-6 h-6 text-indigo-500" />, 'bg-indigo-50')}
            {renderStatCard('Engagement', `${summary?.avg_engagement?.toFixed(1)}h`, <TrendingUp className="w-6 h-6 text-emerald-500" />, 'bg-emerald-50')}
          </div>

          {/* Charts Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Wellbeing & Engagement Trends
                </h2>
                <div className="flex gap-2">
                  <select 
                    className="text-[10px] font-bold uppercase bg-slate-100 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-black outline-none"
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                  >
                    <option value="">All Grades</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={`Grade ${i + 1}`}>Grade {i + 1}</option>
                    ))}
                  </select>
                  <select 
                    className="text-[10px] font-bold uppercase bg-slate-100 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-black outline-none"
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                  >
                    <option value="">All Programs</option>
                    {['General', 'STEM', 'Arts', 'Sports'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <select 
                  className="text-sm bg-slate-100 border-none rounded-lg px-3 py-1 focus:ring-2 focus:ring-black outline-none"
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  value={selectedStudent || ''}
                >
                  {filteredStudents.map(s => (
                    <option key={s.student_id} value={s.student_id}>
                      [{s.risk_level.toUpperCase()}] {s.name}
                    </option>
                  ))}
                </select>
                <button className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={Array.isArray(metrics) ? metrics : []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="mood_score" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="stress_score" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="engagement_hours" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Security Scanner Section */}
          <SecurityScanner />

          {/* CEK Alignment Monitor for Ministry/Admin */}
          {(activeRole === 'ministry' || user.username === 'Admin') && (
            <CEKMonitor />
          )}

          {/* National Education Insights for Ministry/Admin */}
          {(activeRole === 'ministry' || user.username === 'Admin') && nationalInsights && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Landmark className="w-5 h-5 text-purple-500" />
                National Education Health Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-black/5">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">National Health Index</p>
                  <div className="text-3xl font-black text-emerald-600">{nationalInsights.health_index}%</div>
                  <p className="text-[10px] text-slate-500 mt-2">Aggregated wellbeing score across all districts</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-black/5">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">High Risk Population</p>
                  <div className="text-3xl font-black text-rose-600">{nationalInsights.risk_percentage}%</div>
                  <p className="text-[10px] text-slate-500 mt-2">{nationalInsights.high_risk_students} students require immediate intervention</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-black/5">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Active Safety Alerts</p>
                  <div className="text-3xl font-black text-amber-600">{nationalInsights.bullying_alerts + nationalInsights.dropout_alerts}</div>
                  <p className="text-[10px] text-slate-500 mt-2">Bullying: {nationalInsights.bullying_alerts} | Dropout: {nationalInsights.dropout_alerts}</p>
                </div>
              </div>
            </div>
          )}

          {/* Regional Summary for Ministry/District */}
          {(activeRole === 'ministry' || activeRole === 'district') && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Map className="w-5 h-5 text-emerald-500" />
                Regional Performance Summary
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Array.isArray(regionsSummary) ? regionsSummary : []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="region" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="avg_mood" name="Avg Mood" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avg_stress" name="Avg Stress" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="school_count" name="Schools" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Role Specific Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeRole !== 'student' && (
              <IncidentReporting 
                studentId={selectedStudent || ''} 
                reportedBy={user.username} 
                onSuccess={() => selectedStudent && handleStudentClick(selectedStudent)} 
              />
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Risk Alerts & Insights
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
                  <div className="bg-red-500 p-1.5 rounded-full mt-0.5">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-900">High Risk: Alice Smith</p>
                    <p className="text-xs text-red-700">Stress levels peaked at 4.0 today. Attendance dropped to 0%.</p>
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                  <div className="bg-amber-500 p-1.5 rounded-full mt-0.5">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-900">Medium Risk: John Doe</p>
                    <p className="text-xs text-amber-700">Engagement hours decreased by 15% this week.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FileDown className="w-5 h-5 text-indigo-500" />
                Automated Reports
              </h3>
              <div className="space-y-3">
                {['Weekly Wellbeing Summary', 'Class Engagement Heatmap', 'Risk Assessment Report'].map((report, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium">{report}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">PDF</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Assistant & Sidebar */}
        <div className="space-y-8">
          {activeRole === 'student' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col items-center text-center">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Wellbeing Status</h3>
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={552.92}
                    initial={{ strokeDashoffset: 552.92 }}
                    animate={{ strokeDashoffset: 552.92 - (552.92 * (metrics[0]?.mood_score || 0) / 5) }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className={getWellbeingColor(metrics[0]?.mood_score || 0)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-black ${getWellbeingColor(metrics[0]?.mood_score || 0)}`}>
                    {metrics[0]?.mood_score || 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Score / 5</span>
                </div>
              </div>
              <div className="mt-6">
                <p className={`text-lg font-black uppercase tracking-tighter ${getWellbeingColor(metrics[0]?.mood_score || 0)}`}>
                  {getWellbeingLabel(metrics[0]?.mood_score || 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Based on your last check-in</p>
              </div>
            </div>
          )}

          {activeRole && <AIAssistant role={activeRole} studentId={selectedStudent || undefined} user={user} metrics={metrics} />}
          
          <div className="bg-black text-white p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-emerald-400" />
              Regional Insights
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">District Coverage</span>
                <span className="text-sm font-bold">92%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[92%]" />
              </div>
              <p className="text-xs text-white/50 italic">
                "SWI AI: Policy recommendation - Increase mental health resources in District 002 based on rising stress trends."
              </p>
            </div>
          </div>
        </div>
        </div>
        <Roadmap />
      </div>
    )}
    </div>
  );
};
