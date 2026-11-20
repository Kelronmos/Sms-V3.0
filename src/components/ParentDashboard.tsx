import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Activity, Calendar, BookOpen, 
  ShieldCheck, Zap, MessageSquare, 
  AlertCircle, TrendingUp, Shield,
  FileText, Search, Bell, Globe,
  Award, BarChart3, Clock, UserCheck, Users
} from 'lucide-react';
import { fetchStudents, fetchMetrics, fetchAssignments, fetchAIInsights, fetchRegionalInsights } from '../services/api';
import { Student, User, Metric } from '../types';
import { CommunicationCenter } from './CommunicationCenter';
import { InteractiveSummary } from './InteractiveSummary';
import { AcademicPerformance } from './AcademicPerformance';
import { onSnapshot, collection, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { ShieldAlert, X } from 'lucide-react';

interface ParentDashboardProps {
  user: User;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ user }) => {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [regionalInsights, setRegionalInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'communication' | 'regional'>('overview');
  const [alerts, setAlerts] = useState<{ id: string; type: 'risk' | 'safety' | 'urgent'; message: string; studentId?: string; acknowledged: boolean }[]>([]);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Clean up existing Firestore listeners on auth change
      // But NOT the auth listener itself!
      unsubscribes.forEach(unsub => {
        if (unsub !== unsubscribeAuth) unsub();
      });
      // Filter out the closed listeners but keep the auth listener
      unsubscribes.push(unsubscribeAuth);

      if (!fbUser) {
        console.log('No Firebase user, using API fallbacks for ParentDashboard');
        fetchStudents(user.id, 'parent').then(setChildren).catch(console.error);
        return;
      }

      try {
        console.log('Firebase auth ready, setting up ParentDashboard children listener');
        
        // Ensure user doc exists before querying (prevents getUsername() failure in rules)
        const userDocRef = doc(db, 'users', fbUser.uid);
        let userDoc = await getDoc(userDocRef);
        
        // Retry a few times if not found (sync might be in progress)
        let retries = 0;
        while (!userDoc.exists() && retries < 5) {
          await new Promise(resolve => setTimeout(resolve, 500));
          userDoc = await getDoc(userDocRef);
          retries++;
        }

        if (!userDoc.exists()) {
          console.warn('User document not found in Firestore after retries. Permissions might fail.');
        }

        const childrenQuery = query(
          collection(db, 'students'),
          where('guardian_id', '==', user.id)
        );
        
        const unsubChildren = onSnapshot(childrenQuery, (snapshot) => {
          const childrenArray = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as unknown as Student[];
          setChildren(childrenArray);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'students');
        });
        unsubscribes.push(unsubChildren);
      } catch (err) {
        console.error('Error setting up ParentDashboard children listener:', err);
      }
    });

    unsubscribes.push(unsubscribeAuth);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user.id]);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Clean up existing Firestore listeners on auth change
      unsubscribes.forEach(unsub => {
        if (unsub !== unsubscribeAuth) unsub();
      });
      unsubscribes.push(unsubscribeAuth);

      if (selectedChild && fbUser) {
        try {
          console.log('Firebase auth ready, setting up ParentDashboard metrics listener for child:', selectedChild.student_id);
          
          // Ensure user doc exists
          const userDocRef = doc(db, 'users', fbUser.uid);
          let userDoc = await getDoc(userDocRef);
          
          let retries = 0;
          while (!userDoc.exists() && retries < 5) {
            await new Promise(resolve => setTimeout(resolve, 500));
            userDoc = await getDoc(userDocRef);
            retries++;
          }

          const metricsQuery = query(
            collection(db, 'metrics'),
            where('student_id', '==', selectedChild.student_id),
            orderBy('date', 'desc'),
            limit(50)
          );
          
          const unsubMetrics = onSnapshot(metricsQuery, (snapshot) => {
            const updatedMetrics = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Metric[];
            setMetrics(updatedMetrics);
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'metrics');
          });
          unsubscribes.push(unsubMetrics);
        } catch (err) {
          console.error('Error setting up ParentDashboard metrics listener:', err);
        }
      } else if (selectedChild && !fbUser) {
        // Fallback for metrics if no Firebase user
        fetchMetrics(selectedChild.student_id).then(setMetrics).catch(console.error);
      }
    });

    unsubscribes.push(unsubscribeAuth);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [selectedChild]);

  useEffect(() => {
    if (selectedChild) {
      setIsLoading(true);
      Promise.all([
        fetchAssignments(selectedChild.student_id),
        fetchAIInsights(selectedChild.student_id),
        fetchRegionalInsights(selectedChild.region || 'National')
      ]).then(([a, i, r]) => {
        setAssignments(Array.isArray(a) ? a : []);
        setAiInsights(i);
        setRegionalInsights(r);
      }).catch(console.error).finally(() => setIsLoading(false));
    }
  }, [selectedChild]);

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const avgMood = metrics.length > 0 
    ? metrics.reduce((acc, m) => acc + m.mood_score, 0) / metrics.length 
    : 0;

  const attendanceRate = 98; // Mocked for now
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const pendingAssignments = assignments.filter(a => a.status !== 'completed').length;

  return (
    <div className="space-y-8">
      {/* Alert System */}
      <AnimatePresence>
        {alerts.filter(a => !a.acknowledged).length > 0 && (
          <div className="space-y-2">
            {alerts.filter(a => !a.acknowledged).map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${
                  alert.type === 'safety' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                  alert.type === 'risk' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                  'bg-indigo-50 border-indigo-100 text-indigo-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {alert.type === 'safety' ? <ShieldAlert className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <div>
                    <p className="text-sm font-bold">{alert.message}</p>
                    {alert.studentId && (
                      <button 
                        onClick={() => setSelectedChild(children.find(s => s.student_id === alert.studentId) || null)}
                        className="text-[10px] font-black uppercase tracking-widest underline mt-1"
                      >
                        View Child Profile
                      </button>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">Parental Oversight</h2>
          <p className="text-slate-500">Monitoring wellbeing and progress for your children</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedChild(null)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              selectedChild === null 
                ? 'bg-black text-white shadow-lg' 
                : 'bg-white border border-black/5 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            All Students
          </motion.button>
          {children.map(child => (
            <motion.button
              key={child.student_id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedChild(child)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                selectedChild?.student_id === child.student_id 
                  ? 'bg-black text-white shadow-lg' 
                  : 'bg-white border border-black/5 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {child.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation Tabs - Only show if a child is selected or if we want a global overview */}
      <div className="flex gap-4 border-b border-black/5 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: selectedChild ? 'Overview' : 'Family Summary', icon: BarChart3 },
          { id: 'academics', label: 'Academics', icon: BookOpen },
          { id: 'communication', label: 'Communication', icon: MessageSquare },
          { id: 'regional', label: 'Regional Insights', icon: Globe },
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
                layoutId="parent-tab-active"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" 
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedChild ? selectedChild.student_id : `all-${activeTab}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedChild ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {activeTab === 'overview' && (
                  <>
                    {/* 4D Parent Summary */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-500" />
                          4D Progress Sphere: {selectedChild.name}
                        </h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Real-time Analysis</span>
                      </div>
                      <div className="h-[300px] bg-slate-50 rounded-2xl overflow-hidden border border-black/5 relative">
                        <InteractiveSummary role="parent" data={{ metrics, studentId: selectedChild.student_id }} />
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-2">
                          <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-black/5 text-[10px] font-bold">
                            Grades: <span className="text-emerald-500">A-</span>
                          </div>
                          <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-black/5 text-[10px] font-bold">
                            Attendance: <span className="text-blue-500">98%</span>
                          </div>
                          <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-black/5 text-[10px] font-bold">
                            Mood: <span className="text-amber-500">Stable</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wellbeing & Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 flex items-center gap-6">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="48" cy="48" r="42" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                            <circle
                              cx="48" cy="48" r="42" fill="none" stroke="#10b981" strokeWidth="6"
                              strokeDasharray={263.89}
                              strokeDashoffset={263.89 - (263.89 * (avgMood / 5))}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-emerald-500">{avgMood.toFixed(1)}</span>
                            <span className="text-[6px] font-bold text-slate-400 uppercase">Mood</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm mb-1">Wellbeing Status</h4>
                          <p className="text-xs text-slate-500">{selectedChild.name} is currently stable and engaged.</p>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-black/5">
                          <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Attendance</p>
                          <p className="text-lg font-black text-blue-600">{attendanceRate}%</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-black/5">
                          <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Assignments</p>
                          <p className="text-lg font-black text-amber-600">{pendingAssignments}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'academics' && (
                  <AcademicPerformance 
                    studentName={selectedChild.name}
                    subjects={[
                      { subject: 'Mathematics', score: 85, grade: 'A', trend: 'up' },
                      { subject: 'Science', score: 78, grade: 'B+', trend: 'stable' },
                      { subject: 'English', score: 92, grade: 'A+', trend: 'up' },
                      { subject: 'Setswana', score: 88, grade: 'A', trend: 'stable' },
                      { subject: 'Social Studies', score: 72, grade: 'B', trend: 'down' },
                      { subject: 'Art', score: 95, grade: 'A+', trend: 'up' },
                    ]}
                    behaviorScore={94}
                    overallPerformance={86}
                  />
                )}

                {activeTab === 'communication' && (
                  <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
                    <div className="p-6 border-b border-black/5 flex items-center justify-between">
                      <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        Secure Communication: {selectedChild.name}
                      </h3>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">SWI Scanned</span>
                    </div>
                    <CommunicationCenter user={user} studentId={selectedChild.student_id} />
                  </div>
                )}

                {activeTab === 'regional' && (
                  <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                      <h3 className="font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-500" />
                        Regional Insights: {selectedChild.region || 'National'}
                      </h3>
                      {regionalInsights ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <h4 className="text-xs font-black text-emerald-700 uppercase mb-4">School Rankings</h4>
                            <div className="space-y-3">
                              {regionalInsights.rankings?.map((r: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-xs">
                                  <span className="text-emerald-800 font-bold">{r.school}</span>
                                  <span className="bg-emerald-200 px-2 py-0.5 rounded-full text-emerald-900 font-black">#{r.rank}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                            <h4 className="text-xs font-black text-blue-700 uppercase mb-4">Scholarship Opportunities</h4>
                            <div className="space-y-3">
                              {regionalInsights.scholarships?.map((s: any, i: number) => (
                                <div key={i} className="text-xs">
                                  <p className="text-blue-900 font-bold">{s.title}</p>
                                  <p className="text-blue-600/70 text-[10px]">{s.deadline}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-400 italic text-sm">
                          Loading regional data...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* AI Insights */}
                {aiInsights && (
                  <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-indigo-300" />
                        AI Insight: {selectedChild.name}
                      </h3>
                      <p className="text-xs text-indigo-200 leading-relaxed">
                        {aiInsights.guidance}
                      </p>
                    </div>
                    <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5" />
                  </div>
                )}

                {/* Quick Alerts */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-rose-500" />
                    Recent Alerts
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-rose-700">New Assignment Posted</p>
                        <p className="text-[8px] text-rose-600/70">Mathematics - Due in 2 days</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-emerald-700">Attendance Confirmed</p>
                        <p className="text-[8px] text-emerald-600/70">Today at 08:30 AM</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teacher Notes */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    Teacher Notes
                  </h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">From: Mr. Smith</p>
                      <p className="text-xs italic text-slate-300">"{selectedChild.name} showed great improvement in today's lab session."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {activeTab === 'overview' && (
                <>
                  {/* All Children Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {children.map((child, idx) => (
                      <motion.div
                        key={child.student_id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -5 }}
                        onClick={() => setSelectedChild(child)}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 cursor-pointer hover:shadow-xl transition-all group"
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-white transition-colors">
                            <UserCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{child.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{child.class_grade}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Wellbeing</span>
                            <span className={`text-xs font-black ${
                              child.risk_level === 'low' ? 'text-emerald-500' : child.risk_level === 'medium' ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                              {child.risk_level.toUpperCase()}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: child.risk_level === 'low' ? '90%' : child.risk_level === 'medium' ? '60%' : '30%' }}
                              className={`h-full ${
                                child.risk_level === 'low' ? 'bg-emerald-500' : child.risk_level === 'medium' ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-500">Attendance: 98%</span>
                            <span className="text-indigo-500">View Details →</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Family Overview Stats */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        Family Wellbeing Overview
                      </h3>
                      <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-400 italic">Aggregated family analytics visualization coming soon.</p>
                      </div>
                    </div>
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-amber-400" />
                        Family Alerts
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-xs font-bold text-amber-400 uppercase mb-1">Upcoming Deadline</p>
                          <p className="text-sm">3 children have assignments due this Friday.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Achievement</p>
                          <p className="text-sm">Student 3 has reached Star Level 5!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'academics' && (
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-black/5 text-center">
                  <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Family Academic Comparison</h3>
                  <p className="text-slate-500">Select a child to view their specific grades, or view the comparative chart below.</p>
                  <div className="mt-8 h-64 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
                    <p className="text-slate-400 italic">Comparative academic performance chart coming soon.</p>
                  </div>
                </div>
              )}

              {activeTab === 'communication' && (
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-black/5 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Family Communication Hub</h3>
                  <p className="text-slate-500">Select a child to view specific messages with their teachers.</p>
                </div>
              )}

              {activeTab === 'regional' && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                  <h3 className="font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    National & Regional Trends
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-black/5">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">National Avg Performance</p>
                      <p className="text-2xl font-black text-indigo-600">74.2%</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-black/5">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Regional Participation</p>
                      <p className="text-2xl font-black text-emerald-600">92%</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-black/5">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Active Scholarships</p>
                      <p className="text-2xl font-black text-amber-600">124</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
