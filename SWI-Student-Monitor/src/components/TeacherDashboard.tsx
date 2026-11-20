import React, { useState, useEffect } from 'react';
import { LiveSimulationReports } from './LiveSimulationReports';
import { 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy,
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  Users, BookOpen, CheckCircle, Clock, 
  Plus, Send, Star, MessageSquare, 
  FileText, Shield, AlertCircle, TrendingUp,
  BrainCircuit, Zap, Heart, Search,
  Filter, Award, ShieldAlert, X,
  Paperclip, Lock, Share2, ChevronLeft, ChevronRight,
  StickyNote, Trash2, Calendar as CalendarIcon, FileDown,
  Settings2, GripVertical, ChevronDown, ChevronUp, Landmark,
  LayoutDashboard, History, Globe, Database, Activity
} from 'lucide-react';
import { LiveCount } from './LiveCount';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { 
  fetchStudents, submitAttendance, submitAssignment, 
  submitQuiz, sendCommunication, submitReferral,
  fetchMetrics, fetchTeacherMessages, sendTeacherMessage, searchTeacherMessages,
  connectWebSocket
} from '../services/api';
import { Student, User, AIInteraction, StudentUpdate } from '../types';
import { submitTeacherInput } from '../firebase';
import { swiAIEngine } from '../services/aiEngine';
import { SafetyScannerWrapper } from './SafetyScannerWrapper';
import { InteractiveSummary } from './InteractiveSummary';
import { QuizGenerator } from './QuizGenerator';
import { Gauge } from './Gauge';
import { SWIAIAssistant } from './SWIAIAssistant';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { LiveSynthWidget } from './LiveSynthWidget';
import { EmptyState } from './EmptyState';
import { StudentDetailView } from './StudentDetailView';

interface TeacherDashboardProps {
  user: User;
  onLogout?: () => void;
}

const TeacherInputPanel: React.FC<{ 
  students: Student[]; 
  onUpdate: (data: Omit<StudentUpdate, 'id'>) => Promise<void>;
  isSubmitting: boolean;
}> = ({ students, onUpdate, isSubmitting }) => {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [attendance, setAttendance] = useState("Present");
  const [wellbeing, setWellbeing] = useState(5);
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    await onUpdate({
      student_id: selectedStudentId,
      attendance,
      wellbeing: Number(wellbeing),
      note,
      timestamp: new Date().toISOString()
    });
    
    // Reset form
    setNote("");
  };

  return (
    <div className="p-6 bg-white rounded-3xl shadow-sm border border-black/5 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight">Teacher Input Panel</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time student observation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Student</label>
          <select 
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-black/5 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            required
          >
            <option value="">Choose a student...</option>
            {students.map(s => (
              <option key={s.student_id} value={s.student_id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance</label>
            <select 
              value={attendance}
              onChange={(e) => setAttendance(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-black/5 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option>Present</option>
              <option>Absent</option>
              <option>Late</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wellbeing (1-10)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="10"
                value={wellbeing}
                onChange={(e) => setWellbeing(Number(e.target.value))}
                className="flex-1 accent-indigo-600"
              />
              <span className="text-sm font-black w-4">{wellbeing}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observation Notes</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What have you noticed today?"
            className="w-full p-3 bg-slate-50 border border-black/5 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[100px] resize-none"
          />
        </div>

        <button 
          type="submit"
          disabled={isSubmitting || !selectedStudentId}
          className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          Save Observation
        </button>
      </form>
    </div>
  );
};

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onLogout }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('Class 10-A');
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentPriority, setAssignmentPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralData, setReferralData] = useState({ student_id: '', category: 'Bullying', description: '', involve_parent: true });
  const [activeTab, setActiveTab] = useState<'attendance' | 'assignments' | 'quizzes' | 'network' | 'progress' | 'student_dashboard'>('attendance');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reminders, setReminders] = useState<{ id: string; text: string; completed: boolean }[]>([
    { id: '1', text: 'Grade Math Quizzes', completed: false },
    { id: '2', text: 'Prepare for Science Lab', completed: true },
    { id: '3', text: 'Parent-Teacher Meeting at 3 PM', completed: false },
  ]);
  const [newReminder, setNewReminder] = useState('');
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [selectedQuickStudent, setSelectedQuickStudent] = useState<Student | null>(null);
  const [studentUpdates, setStudentUpdates] = useState<StudentUpdate[]>([]);
  const [dashboardStudent, setDashboardStudent] = useState<Student | null>(null);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            handleAttendance();
            break;
          case 'n':
            e.preventDefault();
            setActiveTab('assignments');
            // Focus on assignment title if possible
            document.querySelector<HTMLInputElement>('input[placeholder="Assignment Title"]')?.focus();
            break;
          case 'o':
            e.preventDefault();
            setShowQuickAccess(prev => !prev);
            break;
          case 'a':
            e.preventDefault();
            setActiveTab('attendance');
            break;
          case 'i':
            e.preventDefault();
            setShowReferralModal(true);
            break;
        }
      }
      if (e.key === '?') {
        setShowShortcutHelp(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [students, attendance, selectedClass]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addReminder = () => {
    if (newReminder.trim()) {
      setReminders([...reminders, { id: Date.now().toString(), text: newReminder, completed: false }]);
      setNewReminder('');
    }
  };

  const toggleReminder = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isAttendanceExpanded, setIsAttendanceExpanded] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const {
    order: dashboardOrder,
    setOrder: setDashboardOrder,
    visibleWidgets,
    setVisibleWidgets,
    isAutoLayout,
    setIsAutoLayout,
    isRearranging,
    setIsRearranging,
    optimizeLayout
  } = useDashboardLayout(user.id, 'teacher_dashboard', ['class_analytics', 'student_progress', 'ai_assistant', 'tabbed_interface', 'referral', 'grouping', 'stars', 'schedule', 'health'], {
    class_analytics: true,
    student_progress: true,
    ai_assistant: true,
    tabbed_interface: true,
    referral: true,
    grouping: true,
    stars: true,
    schedule: true,
    attendance: true,
    assignments: true,
    quizzes: true,
    network: true,
    progress: true,
    health: true
  });

  const [metrics, setMetrics] = useState<any[]>([]);
  const [networkMessages, setNetworkMessages] = useState<any[]>([]);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [studentListViewMode, setStudentListViewMode] = useState<'cards' | 'table'>('cards');

  // Trigger optimization on interactions if auto-layout is on
  const handleWidgetClick = () => {
    if (isAutoLayout) {
      optimizeLayout(['summary', 'ai_assistant', 'main_content', 'sidebar']);
    }
  };

  const handleTeacherUpdate = async (data: Omit<StudentUpdate, 'id'>) => {
    setIsSubmittingUpdate(true);
    try {
      await submitTeacherInput(data);
      setMessage('Observation saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save observation:', error);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };
  const [aiHistory, setAiHistory] = useState<AIInteraction[]>([]);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const [alerts, setAlerts] = useState<{ id: string; type: 'risk' | 'safety' | 'urgent'; message: string; studentId?: string; acknowledged: boolean }[]>([]);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [communications, setCommunications] = useState<any[]>([]);
  const [filterGroup, setFilterGroup] = useState<string>('All');
  const [filterProgram, setFilterProgram] = useState<string>('All');
  const [isExporting, setIsExporting] = useState(false);

  const mockProgressData = [
    { date: '2024-03-01', avgScore: 72 },
    { date: '2024-03-02', avgScore: 75 },
    { date: '2024-03-03', avgScore: 74 },
    { date: '2024-03-04', avgScore: 78 },
    { date: '2024-03-05', avgScore: 82 },
    { date: '2024-03-06', avgScore: 80 },
    { date: '2024-03-07', avgScore: 85 },
  ];

  useEffect(() => {
    // 1. Real-time Firestore Listeners
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
        console.log('No Firebase user, using API fallbacks for TeacherDashboard');
        fetchStudents(user.id, user.role).then(setStudents).catch(console.error);
        fetchTeacherMessages().then(setNetworkMessages).catch(console.error);
        return;
      }

      try {
        console.log('Firebase auth ready, setting up Firestore listeners for TeacherDashboard');
        
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
          console.warn('[TeacherDashboard] User document not found in Firestore after retries. Permissions might fail. Falling back to API.');
          try {
            const sData = await fetchStudents(user.id, user.role);
            setStudents(sData);
          } catch (apiErr) {
            console.error('[TeacherDashboard] API fallback failed:', apiErr);
          }
          return;
        }

        const studentsQuery = query(collection(db, 'students'));
        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
          const updatedStudents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any[];
          setStudents(updatedStudents as Student[]);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'students');
        });
        unsubscribes.push(unsubStudents);

        const metricsQuery = query(
          collection(db, 'metrics'),
          orderBy('date', 'desc'),
          limit(100)
        );
        const unsubMetrics = onSnapshot(metricsQuery, (snapshot) => {
          const updatedMetrics = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMetrics(updatedMetrics);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'metrics');
        });
        unsubscribes.push(unsubMetrics);

        const commsQuery = query(
          collection(db, 'communications'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        const unsubComms = onSnapshot(commsQuery, (snapshot) => {
          const updatedComms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setNetworkMessages(updatedComms);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'communications');
        });
        unsubscribes.push(unsubComms);

        const updatesQuery = query(
          collection(db, 'student_updates'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        const unsubUpdates = onSnapshot(updatesQuery, (snapshot) => {
          const updatedUpdates = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as StudentUpdate[];
          setStudentUpdates(updatedUpdates);
          
          // Process updates with AI Engine for real-time alerts
          updatedUpdates.forEach(update => {
            const newAlerts = swiAIEngine.processTeacherUpdate(update);
            if (newAlerts.length > 0) {
              setAlerts(prev => {
                const existingIds = new Set(prev.map(a => a.id));
                const filteredNew = newAlerts.filter(a => !existingIds.has(a.id));
                return [...prev, ...filteredNew.map(a => ({
                  id: a.id,
                  type: 'risk' as const,
                  message: a.message,
                  studentId: a.student_id,
                  acknowledged: false
                }))];
              });
            }
          });
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'student_updates');
        });
        unsubscribes.push(unsubUpdates);
      } catch (err) {
        console.error('Error setting up Firestore listeners:', err);
      }
    });

    unsubscribes.push(unsubscribeAuth);

    // 2. WebSocket for real-time updates (especially for demo mode)
    const ws = connectWebSocket((data) => {
      if (data.type === 'NEW_COMMUNICATION') {
        setNetworkMessages(prev => {
          const exists = prev.some(m => m.id === data.data.id || (m.timestamp === data.data.timestamp && m.content === data.data.content));
          if (exists) return prev;
          return [data.data, ...prev];
        });
      }
      if (data.type === 'METRIC_UPDATE') {
        fetchStudents(user.id, user.role).then(setStudents).catch(console.error);
      }
      if (data.type === 'CRITICAL_ALERT') {
        setAlerts(prev => [{
          id: Date.now().toString(),
          type: data.data.type || 'urgent',
          message: data.data.message,
          studentId: data.data.studentId,
          acknowledged: false
        }, ...prev]);
      }
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
      ws.close();
    };
  }, [user.id, user.role]);

  const handleSearchMessages = async (query: string) => {
    setMessageSearchQuery(query);
    if (!query.trim()) {
      const msgs = await fetchTeacherMessages();
      setNetworkMessages(msgs);
      return;
    }
    setIsSearchingMessages(true);
    try {
      const results = await searchTeacherMessages(query);
      setNetworkMessages(results);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearchingMessages(false);
    }
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const filteredStudents = students.filter(s => 
        (filterGroup === 'All' || s.class_grade === filterGroup) &&
        (filterProgram === 'All' || s.program === filterProgram)
      );

      const headers = ['Student ID', 'Name', 'Grade', 'Program', 'Risk Level', 'Academic Standing'];
      const rows = filteredStudents.map(s => [
        s.student_id,
        s.name,
        s.class_grade,
        s.program,
        s.risk_level,
        s.academic_standing || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `student_data_${selectedClass.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    (filterGroup === 'All' || s.class_grade === filterGroup) &&
    (filterProgram === 'All' || s.program === filterProgram) &&
    (searchQuery === '' || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.student_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groups = ['All', ...Array.from(new Set(students.map(s => s.class_grade)))];
  const programs = ['All', ...Array.from(new Set(students.map(s => s.program)))];

  const handleReferral = async () => {
    if (!referralData.student_id || !referralData.description) return;
    setIsSubmitting(true);
    try {
      await submitReferral({
        ...referralData,
        teacher_id: user.username
      });
      setShowReferralModal(false);
      setReferralData({ student_id: '', category: 'Bullying', description: '', involve_parent: true });
      alert('Referral submitted successfully!');
    } catch (err) {
      alert('Failed to submit referral');
    } finally {
      setIsSubmitting(false);
    }
  };

  const starLevels = [
    'Beginner', 'Explorer', 'Achiever', 'Scholar', 'Leader', 'Mentor', 'Champion'
  ];

  const handleAttendance = async () => {
    setIsSubmitting(true);
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        class_id: selectedClass,
        status: attendance[s.student_id] ? 'present' : 'absent',
        date: new Date().toISOString().split('T')[0]
      }));
      await Promise.all(records.map(r => submitAttendance(r)));
      alert('Attendance submitted successfully!');
    } catch (err) {
      alert('Failed to submit attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAssignment = async () => {
    if (!assignmentTitle || !assignmentDesc) return;
    setIsSubmitting(true);
    try {
      await submitAssignment({
        title: assignmentTitle,
        description: assignmentDesc,
        class_id: selectedClass,
        teacher_id: user.username,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      setAssignmentTitle('');
      setAssignmentDesc('');
      alert('Assignment sent to all students and parents!');
    } catch (err) {
      alert('Failed to send assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNetworkMessage = async (content: string, type: 'text' | 'resource' = 'text', attachment?: string) => {
    try {
      await sendTeacherMessage({
        sender_id: user.username,
        receiver_id: 'all',
        content: type === 'resource' ? `${content} [Resource: ${attachment}]` : content
      });
      const updated = await fetchTeacherMessages();
      setNetworkMessages(updated);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const getGroupCounts = () => {
    const high = students.filter(s => s.risk_level === 'low').length;
    const support = students.filter(s => s.risk_level === 'high').length;
    const stem = students.filter(s => s.program === 'STEM').length;
    return { high, support, stem };
  };

  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [systemDrift, setSystemDrift] = useState(5.5); // Initial drift

  const handleRecalibrate = () => {
    setIsRecalibrating(true);
    setTimeout(() => {
      setSystemDrift(0);
      setIsRecalibrating(false);
      // Drift slowly returns over time in a real app, but here we just reset it
      setTimeout(() => setSystemDrift(5.5), 3000);
    }, 1000);
  };

  const getStudentStarLevel = (student: Student) => {
    // Mock logic: higher level for lower risk
    if (student.risk_level === 'low') return 5 + (student.id % 2); // Level 6-7
    if (student.risk_level === 'high') return 1 + (student.id % 2); // Level 2-3
    return 3 + (student.id % 2); // Level 4-5
  };

  const getStudentProgress = (student: Student) => {
    // Mock progress percentage
    const base = student.risk_level === 'low' ? 80 : student.risk_level === 'high' ? 40 : 65;
    return Math.min(100, base + (student.id % 15));
  };

  const groupCounts = getGroupCounts();

  const pieData = [
    { name: 'High Performers', value: groupCounts.high, color: '#10b981' },
    { name: 'Needs Support', value: groupCounts.support, color: '#f43f5e' },
    { name: 'STEM Program', value: groupCounts.stem, color: '#6366f1' },
    { name: 'Others', value: Math.max(0, students.length - (groupCounts.high + groupCounts.support)), color: '#94a3b8' }
  ].filter(d => d.value > 0);

  const getAverageStarLevel = () => {
    if (students.length === 0) return 3; // Default to Level 4 (index 3)
    const total = groupCounts.high * 5 + (students.length - groupCounts.high - groupCounts.support) * 3 + groupCounts.support * 1;
    const avg = total / students.length;
    return Math.min(Math.floor(avg), 6);
  };

  const avgStarLevel = getAverageStarLevel();

  return (
    <div className="space-y-6">
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
                        onClick={() => setSelectedQuickStudent(students.find(s => s.student_id === alert.studentId) || null)}
                        className="text-[10px] font-black uppercase tracking-widest underline mt-1"
                      >
                        View Student Profile
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
          <h2 className="text-3xl font-black tracking-tighter">Teacher Hub</h2>
          <div className="flex items-center gap-4">
            <p className="text-slate-500 text-sm">Real-time oversight of student wellbeing and engagement</p>
            {!isOnline && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Offline Mode
              </span>
            )}
          </div>
        </div>
        
        {/* Filter Controls & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white border border-black/5 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-48"
            />
          </div>
          <button 
            onClick={() => setShowShortcutHelp(true)}
            className="p-2 bg-white border border-black/5 rounded-xl hover:bg-slate-50 transition-all"
            title="Keyboard Shortcuts (?)"
          >
            <span className="text-[10px] font-black text-slate-400">?</span>
          </button>
          <div className="flex items-center gap-2 bg-white border border-black/5 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="text-[10px] font-bold bg-transparent outline-none"
            >
              {groups.map(g => <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white border border-black/5 rounded-xl px-3 py-1.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="text-[10px] font-bold bg-transparent outline-none"
            >
              {programs.map(p => <option key={p} value={p}>{p === 'All' ? 'All Programs' : p}</option>)}
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 bg-white border border-black/5 rounded-xl px-3 py-1.5 hover:bg-slate-50 transition-all"
          >
            <FileDown className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end mr-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Globe className="w-3 h-3 animate-spin-slow" />
              Demo Environment
            </div>
            <div className="text-sm font-black text-emerald-600">
              <LiveCount />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher Session</p>
              <p className="text-xs font-bold text-slate-900">{user.full_name}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black">
              {user.full_name.charAt(0)}
            </div>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="px-4 py-2 bg-black text-white rounded-xl font-bold text-[10px] hover:bg-slate-800 transition-all uppercase tracking-widest"
            >
              Logout
            </button>
          )}
          <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block" />
          <div className="flex gap-2">
            <button
              onClick={() => setIsAutoLayout(!isAutoLayout)}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 ${isAutoLayout ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 border border-black/5 hover:bg-slate-50'}`}
              title={isAutoLayout ? "Auto-Layout Enabled" : "Manual Layout Mode"}
            >
              <Zap className={`w-4 h-4 ${isAutoLayout ? 'animate-pulse' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-widest hidden lg:block">Auto</span>
            </button>
            <button
              onClick={() => setShowWidgetSettings(!showWidgetSettings)}
              className={`p-2 rounded-xl transition-all ${showWidgetSettings ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400 border border-black/5 hover:bg-slate-50'}`}
              title="Widget Settings"
            >
              <Settings2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowQuickAccess(!showQuickAccess)}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 ${showQuickAccess ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400 border border-black/5 hover:bg-slate-50'}`}
              title="Toggle Quick Access Student Panel (Ctrl+O)"
            >
              <Users className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase tracking-widest hidden lg:block">Students</span>
            </button>
            <button
              onClick={() => {
                // The hook auto-saves, but we can show a confirmation
                setMessage('Layout configuration saved successfully!');
                setTimeout(() => setMessage(''), 3000);
              }}
              className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center gap-2"
              title="Save Current Layout"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase tracking-widest hidden lg:block">Save Layout</span>
            </button>
            <button
              onClick={() => setIsRearranging(!isRearranging)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              isRearranging ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-black/5 hover:bg-slate-50'
            }`}
          >
            <GripVertical className="w-4 h-4" />
            {isRearranging ? 'Finish' : 'Rearrange'}
          </button>
          {['attendance', 'assignments', 'quizzes', 'network', 'progress', 'student_dashboard'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-black text-white' : 'bg-white text-slate-400 border border-black/5'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-white border border-black/5 rounded-xl px-4 py-2 text-sm font-bold"
          >
            <optgroup label="Primary">
              <option>Class 1-A</option>
              <option>Class 2-B</option>
              <option>Class 3-C</option>
            </optgroup>
            <optgroup label="Junior Secondary">
              <option>Class 7-A</option>
              <option>Class 8-B</option>
              <option>Class 9-C</option>
            </optgroup>
            <optgroup label="Senior Secondary">
              <option>Class 10-A</option>
              <option>Class 11-B</option>
              <option>Class 12-C</option>
            </optgroup>
          </select>
        </div>
      </div>
    </div>

      <AnimatePresence>
        {showWidgetSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 right-8 z-50 bg-white p-6 rounded-3xl shadow-2xl border border-black/5 w-64"
          >
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Dashboard Widgets</h4>
            <div className="space-y-3">
              {Object.entries(visibleWidgets).map(([id, visible]) => (
                <label key={id} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-bold text-slate-600 group-hover:text-black transition-colors">
                    {id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                  <div 
                    onClick={() => setVisibleWidgets(prev => ({ ...prev, [id]: !visible }))}
                    className={`w-10 h-5 rounded-full transition-all relative ${visible ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${visible ? 'left-6' : 'left-1'}`} />
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drill-down Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 px-2">
        <span className="hover:text-black cursor-pointer transition-colors">Ministry</span>
        <ChevronRight className="w-3 h-3" />
        <span className="hover:text-black cursor-pointer transition-colors">Gaborone District</span>
        <ChevronRight className="w-3 h-3" />
        <span className="hover:text-black cursor-pointer transition-colors">Central High School</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-indigo-600">Class 10-A</span>
      </div>

      <Reorder.Group axis="y" values={dashboardOrder} onReorder={setDashboardOrder} className="space-y-8">
        {dashboardOrder.map((sectionId) => (
          <Reorder.Item 
            key={sectionId} 
            value={sectionId} 
            dragListener={isRearranging}
            onClick={handleWidgetClick}
            className={`relative transition-all ${isRearranging ? 'border-2 border-dashed border-indigo-200 rounded-3xl p-4 bg-slate-50/50' : ''}`}
          >
            {isRearranging && (
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-2 bg-white rounded-lg shadow-sm border border-black/5 z-10">
                <GripVertical className="w-4 h-4 text-slate-400" />
              </div>
            )}

            {sectionId === 'class_analytics' && visibleWidgets.class_analytics && (
              <div className="space-y-8">
                {/* Botswana Hierarchy Header */}
                <div className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-3xl shadow-xl overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent opacity-50" />
                  <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                      <Landmark className="w-8 h-8 text-indigo-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Ministry of Education</span>
                        <ChevronRight className="w-3 h-3 text-white/30" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Gaborone District</span>
                      </div>
                      <h2 className="text-3xl font-black tracking-tighter">Central High School</h2>
                      <p className="text-sm font-medium text-white/60">Class 10A • Academic Year 2026</p>
                    </div>
                  </div>
                  <div className="relative z-10 text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Live Integrity Index</div>
                    <div className="text-4xl font-black tracking-tighter text-emerald-400">98.4%</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Main Analytics Grid */}
                  <div className="lg:col-span-3 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Average Score */}
                      <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+4.2%</span>
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Student Score</h4>
                        <div className="text-3xl font-black tracking-tighter">78.5%</div>
                        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '78.5%' }} className="h-full bg-indigo-600" />
                        </div>
                      </div>

                      {/* Attendance Rate */}
                      <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Users className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Optimal</span>
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance Rate</h4>
                        <div className="text-3xl font-black tracking-tighter">94.2%</div>
                        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '94.2%' }} className="h-full bg-emerald-500" />
                        </div>
                      </div>

                      {/* Wellbeing Index */}
                      <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                            <Heart className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Stable</span>
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Wellbeing Index</h4>
                        <div className="text-3xl font-black tracking-tighter">8.4/10</div>
                        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '84%' }} className="h-full bg-rose-500" />
                        </div>
                      </div>
                    </div>

                    {/* Detailed Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                        <h3 className="text-lg font-black tracking-tight mb-6">Academic Performance Trend</h3>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                              { month: 'Jan', score: 65 },
                              { month: 'Feb', score: 72 },
                              { month: 'Mar', score: 78 },
                              { month: 'Apr', score: 75 },
                              { month: 'May', score: 82 },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                              />
                              <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                        <h3 className="text-lg font-black tracking-tight mb-6">Wellbeing Distribution</h3>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { category: 'Optimal', count: 12 },
                              { category: 'Stable', count: 18 },
                              { category: 'At Risk', count: 4 },
                              { category: 'Critical', count: 1 },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                              <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              />
                              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                {[
                                  { fill: '#10b981' },
                                  { fill: '#6366f1' },
                                  { fill: '#f59e0b' },
                                  { fill: '#ef4444' },
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar: SWI Assistant & Input Panel */}
                  <div className="lg:col-span-1 space-y-8">
                    <SWIAIAssistant 
                      user={user}
                      student={{ student_id: 'class-10a', name: 'Class 10A', risk_level: 'low' } as any}
                      metrics={metrics}
                      history={aiHistory}
                      assignments={[]}
                      quizzes={[]}
                      onNewInteraction={(interaction) => setAiHistory([interaction, ...aiHistory])}
                      systemInstruction="You are the SWI Universal Engine for Class 10A at Central High School, Gaborone. Provide tactical engagement insights for the teacher."
                    />
                    <TeacherInputPanel 
                      students={students} 
                      onUpdate={handleTeacherUpdate} 
                      isSubmitting={isSubmittingUpdate} 
                    />
                  </div>
                </div>
              </div>
            )}

            {sectionId === 'student_progress' && visibleWidgets.student_progress && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-500" />
                      Student Performance Trends
                      <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Class Average Over Time</p>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockProgressData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgScore" 
                        stroke="#6366f1" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {sectionId === 'ai_assistant' && visibleWidgets.ai_assistant && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-500" />
                    Class Support
                  </h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher Context Enabled</span>
                </div>
                <div className="h-[500px] border border-slate-100 rounded-2xl overflow-hidden">
                  <SWIAIAssistant 
                    user={user}
                    student={students[0] || { id: 0, student_id: 'CLASS_001', name: 'Class 10-A', class_grade: '10-A', risk_level: 'low', program: 'General', school_id: 'S001', district_id: 'D001' }}
                    metrics={metrics}
                    history={aiHistory}
                    assignments={[]}
                    quizzes={[]}
                    onNewInteraction={(interaction) => setAiHistory(prev => [interaction, ...prev])}
                    quickActions={[
                      { label: 'Analyze Trends', query: 'Analyze class-wide wellbeing and performance trends for the past week.', icon: TrendingUp },
                      { label: 'Draft Announcement', query: 'Draft a professional and encouraging announcement for my class about upcoming activities.', icon: MessageSquare },
                      { label: 'Summarize Progress', query: 'Summarize the overall progress and key risk areas for my current students.', icon: FileText }
                    ]}
                    systemInstruction={`You are Joe, the SWI Teacher's Companion. You are warm, engaging, and highly professional. 
                    Your goal is to make the teacher's life easier by providing deep insights and creative support.
                    
                    CRITICAL: 
                    1. Always prioritize internal data (metrics, student profiles, history) over general knowledge.
                    2. Be human and conversational. Use phrases like "I've noticed...", "It looks like...", "Would you like me to help with...".
                    3. When analyzing trends, be specific about numbers and percentages found in the metrics.
                    4. When drafting announcements, ensure they are encouraging and clear.
                    5. If you see a 'high risk' student, proactively suggest a supportive intervention.
                    
                    Example: "Hey! I've been looking at the class data, and I noticed a 15% increase in overall engagement this week. That's fantastic progress!"`}
                  />
                </div>
              </div>
            )}

            {sectionId === 'tabbed_interface' && visibleWidgets.tabbed_interface && (
              <div className="space-y-8">
                {(visibleWidgets.attendance || visibleWidgets.assignments || visibleWidgets.quizzes || visibleWidgets.network || visibleWidgets.progress) && (
                  <div className="space-y-8">
                    {activeTab === 'attendance' && visibleWidgets.attendance && (
                      <div className="space-y-8">
                        <LiveSimulationReports />
                        <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setStudentListViewMode('cards')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${studentListViewMode === 'cards' ? 'bg-black text-white' : 'bg-white text-slate-400 border border-black/5 hover:bg-slate-50'}`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Cards
                  </button>
                  <button 
                    onClick={() => setStudentListViewMode('table')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${studentListViewMode === 'table' ? 'bg-black text-white' : 'bg-white text-slate-400 border border-black/5 hover:bg-slate-50'}`}
                  >
                    <History className="w-3.5 h-3.5" />
                    Table
                  </button>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Showing {filteredStudents.length} Students
                </div>
              </div>
              {Object.entries(
                filteredStudents.reduce((acc, student) => {
                  const group = student.class_grade || 'Unassigned';
                  if (!acc[group]) acc[group] = [];
                  acc[group].push(student);
                  return acc;
                }, {} as Record<string, Student[]>)
              ).map(([className, classStudents]) => (
                <div key={className} className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
                  <div 
                    className="p-6 border-b border-black/5 flex items-center justify-between cursor-pointer" 
                    onClick={() => setExpandedClasses(prev => ({ ...prev, [className]: !prev[className] }))}
                  >
                    <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {className} - Student Cards
                      <span className="text-[10px] text-slate-400 font-normal ml-2">
                        {expandedClasses[className] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </span>
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-black/5">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const newAttendance = { ...attendance };
                            classStudents.forEach(s => newAttendance[s.student_id] = true);
                            setAttendance(newAttendance);
                          }}
                          className="px-3 py-1.5 text-[8px] font-black uppercase text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          All Present
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const newAttendance = { ...attendance };
                            classStudents.forEach(s => newAttendance[s.student_id] = false);
                            setAttendance(newAttendance);
                          }}
                          className="px-3 py-1.5 text-[8px] font-black uppercase text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          All Absent
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const newAttendance = { ...attendance };
                            classStudents.forEach(s => delete newAttendance[s.student_id]);
                            setAttendance(newAttendance);
                          }}
                          className="px-3 py-1.5 text-[8px] font-black uppercase text-slate-400 hover:bg-white rounded-lg transition-all"
                        >
                          Clear
                        </button>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {classStudents.length} Students
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAttendance(); }}
                        disabled={isSubmitting}
                        className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-black/10"
                      >
                        {isSubmitting ? 'Saving...' : 'Submit Register'}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedClasses[className] && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={studentListViewMode === 'cards' ? "p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "p-6"}
                      >
                        {studentListViewMode === 'cards' ? (
                          classStudents.map((student) => {
                            const levelIdx = getStudentStarLevel(student);
                            const progress = getStudentProgress(student);
                            const studentAlerts = alerts.filter(a => a.studentId === student.student_id && !a.acknowledged);
                            
                            return (
                              <motion.div
                                key={student.student_id}
                                drag="x"
                                dragConstraints={{ left: -100, right: 100 }}
                                onDragEnd={(_, info) => {
                                  if (info.offset.x < -50) {
                                    setSelectedQuickStudent(student);
                                    setShowQuickAccess(true);
                                  } else if (info.offset.x > 50) {
                                    setMessage(`Marked AI suggestions for ${student.name} as helpful.`);
                                    setTimeout(() => setMessage(''), 3000);
                                  }
                                }}
                                className="relative bg-slate-50 rounded-2xl p-4 border border-black/5 group cursor-grab active:cursor-grabbing"
                              >
                                {/* Swipe Indicators */}
                                <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-2xl" />
                                <div className="absolute inset-y-0 right-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-2xl" />
                                
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-600 font-bold">
                                      {student.name[0]}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold">{student.name}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase">{student.student_id}</p>
                                    </div>
                                  </div>
                                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                    student.risk_level === 'high' ? 'bg-rose-100 text-rose-600' : 
                                    student.risk_level === 'medium' ? 'bg-amber-100 text-amber-600' : 
                                    'bg-emerald-100 text-emerald-600'
                                  }`}>
                                    {student.risk_level} Risk
                                  </div>
                                </div>

                                {/* Active Alerts */}
                                {studentAlerts.length > 0 && (
                                  <div className="mb-4 p-2 bg-rose-50 border border-rose-100 rounded-xl space-y-1">
                                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">
                                      <AlertCircle className="w-2.5 h-2.5" />
                                      Active Alerts
                                    </p>
                                    {studentAlerts.map(alert => (
                                      <p key={alert.id} className="text-[9px] font-bold text-rose-700 leading-tight">
                                        • {alert.message}
                                      </p>
                                    ))}
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Star Level</p>
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-amber-500 fill-current" />
                                      <span className="text-xs font-bold">{starLevels[levelIdx]}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Growth</p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full ${progress > 80 ? 'bg-emerald-500' : progress > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold">{progress}%</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-black/5">
                                  <button 
                                    onClick={() => setAttendance(prev => ({ ...prev, [student.student_id]: !prev[student.student_id] }))}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                      attendance[student.student_id] 
                                        ? 'bg-emerald-100 text-emerald-600' 
                                        : 'bg-rose-100 text-rose-600'
                                    }`}
                                  >
                                    {attendance[student.student_id] ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                    {attendance[student.student_id] ? 'Present' : 'Absent'}
                                  </button>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => { setSelectedQuickStudent(student); setShowQuickAccess(true); }}
                                      className="p-2 bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                                      title="View Profile"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                    <button 
                                      className="p-2 bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                                      title="Send Message"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Swipe Hint */}
                                <div className="mt-3 flex justify-center">
                                  <div className="flex items-center gap-1 text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                                    <ChevronLeft className="w-2 h-2" />
                                    Swipe for Actions
                                    <ChevronRight className="w-2 h-2" />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-black/5">
                                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student ID</th>
                                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Level</th>
                                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Alerts</th>
                                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth</th>
                                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-black/5">
                                {classStudents.map((student) => {
                                  const progress = getStudentProgress(student);
                                  const studentAlerts = alerts.filter(a => a.studentId === student.student_id && !a.acknowledged);
                                  
                                  return (
                                    <tr key={student.student_id} className="group hover:bg-slate-50 transition-colors">
                                      <td className="py-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                                            {student.name[0]}
                                          </div>
                                          <span className="text-sm font-bold">{student.name}</span>
                                        </div>
                                      </td>
                                      <td className="py-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{student.student_id}</span>
                                      </td>
                                      <td className="py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                          student.risk_level === 'high' ? 'bg-rose-100 text-rose-600' : 
                                          student.risk_level === 'medium' ? 'bg-amber-100 text-amber-600' : 
                                          'bg-emerald-100 text-emerald-600'
                                        }`}>
                                          {student.risk_level} Risk
                                        </span>
                                      </td>
                                      <td className="py-4">
                                        {studentAlerts.length > 0 ? (
                                          <div className="flex items-center gap-1.5 text-rose-600">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold">{studentAlerts.length} Active</span>
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-slate-300 font-bold">None</span>
                                        )}
                                      </td>
                                      <td className="py-4">
                                        <div className="flex items-center gap-2 w-24">
                                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full ${progress > 80 ? 'bg-emerald-500' : progress > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                              style={{ width: `${progress}%` }}
                                            />
                                          </div>
                                          <span className="text-[10px] font-bold">{progress}%</span>
                                        </div>
                                      </td>
                                      <td className="py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <button 
                                            onClick={() => setAttendance(prev => ({ ...prev, [student.student_id]: !prev[student.student_id] }))}
                                            className={`p-2 rounded-xl transition-all ${
                                              attendance[student.student_id] 
                                                ? 'bg-emerald-50 text-emerald-600' 
                                                : 'bg-rose-50 text-rose-600'
                                            }`}
                                            title={attendance[student.student_id] ? 'Mark Absent' : 'Mark Present'}
                                          >
                                            {attendance[student.student_id] ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                          </button>
                                          <button 
                                            onClick={() => { setSelectedQuickStudent(student); setShowQuickAccess(true); }}
                                            className="p-2 bg-white border border-black/5 rounded-xl hover:bg-slate-50 transition-all"
                                            title="View Profile"
                                          >
                                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}

                    {activeTab === 'progress' && visibleWidgets.progress && !dashboardOrder.includes('student_progress') && (
                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-indigo-500" />
                              Student Performance Trends
                            </h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Class Average Over Time</p>
                          </div>
                        </div>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockProgressData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                                dy={10}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                                domain={[0, 100]}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '16px', 
                                  border: 'none', 
                                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }} 
                              />
                              <Line 
                                type="monotone" 
                                dataKey="avgScore" 
                                stroke="#6366f1" 
                                strokeWidth={4} 
                                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {activeTab === 'student_dashboard' && (
                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 min-h-[600px]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                          <div>
                            <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                              <LayoutDashboard className="w-7 h-7 text-indigo-600" />
                              Individual Student Dashboard
                            </h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Deep-dive into student performance & wellbeing</p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <select 
                                value={dashboardStudent?.student_id || ''}
                                onChange={(e) => {
                                  const student = students.find(s => s.student_id === e.target.value);
                                  setDashboardStudent(student || null);
                                }}
                                className="pl-10 pr-10 py-3 bg-slate-50 border border-black/5 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none min-w-[240px]"
                              >
                                <option value="">Select a student...</option>
                                {students.map(s => (
                                  <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {dashboardStudent ? (
                          <div className="space-y-10">
                            {/* Dashboard Header */}
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-black/5">
                              <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[28px] bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-xl">
                                  {dashboardStudent.name[0]}
                                </div>
                                <div>
                                  <h2 className="text-3xl font-black tracking-tighter">{dashboardStudent.name}</h2>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dashboardStudent.class_id}</span>
                                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dashboardStudent.student_id}</span>
                                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                      dashboardStudent.risk_level === 'low' ? 'bg-emerald-100 text-emerald-600' :
                                      dashboardStudent.risk_level === 'medium' ? 'bg-amber-100 text-amber-600' :
                                      'bg-rose-100 text-rose-600'
                                    }`}>
                                      {dashboardStudent.risk_level} Risk
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <button className="p-3 bg-white rounded-2xl border border-black/5 hover:bg-slate-50 transition-all shadow-sm">
                                  <MessageSquare className="w-5 h-5 text-slate-600" />
                                </button>
                                <button className="p-3 bg-white rounded-2xl border border-black/5 hover:bg-slate-50 transition-all shadow-sm">
                                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                                </button>
                                <button className="px-6 py-3 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg">
                                  Generate Report
                                </button>
                              </div>
                            </div>

                            {/* Dashboard Content - Reusing StudentDetailView logic but inline */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Left Column: Metrics & AI */}
                              <div className="lg:col-span-2 space-y-8">
                                {/* Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 self-start">Wellbeing Index</h4>
                                    <Gauge 
                                      value={dashboardStudent.attendance_rate || 85} 
                                      label="Overall Wellbeing" 
                                      size="md"
                                      details={{
                                        stress: 3,
                                        sleep: 7.5,
                                        engagement: 6.2
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Academic Performance</h4>
                                    <div className="space-y-6">
                                      {[
                                        { subject: 'Mathematics', grade: 'A', progress: 85, color: 'bg-indigo-500' },
                                        { subject: 'Science', grade: 'B+', progress: 72, color: 'bg-emerald-500' },
                                        { subject: 'English', grade: 'A-', progress: 78, color: 'bg-amber-500' },
                                        { subject: 'Setswana', grade: 'A', progress: 92, color: 'bg-rose-500' },
                                      ].map((s, i) => (
                                        <div key={i} className="space-y-2">
                                          <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-600">{s.subject}</span>
                                            <span className="text-slate-900">{s.grade}</span>
                                          </div>
                                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${s.progress}%` }}
                                              className={`h-full ${s.color}`}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* AI Insights */}
                                <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
                                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent opacity-50" />
                                  <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                        <BrainCircuit className="w-5 h-5 text-amber-400" />
                                        AI Behavioral Insights
                                      </h3>
                                      <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10">
                                        Last Updated: 2m ago
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed italic mb-8">
                                      "Analysis of {dashboardStudent.name}'s recent activity suggests a high level of academic engagement but a subtle increase in late-night AI interactions. This pattern often correlates with upcoming assessment anxiety. Recommendation: Provide additional practice materials for the 'Algebra II' module to boost confidence."
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Focus Area</p>
                                        <p className="text-xs font-bold text-amber-400">Time Management</p>
                                      </div>
                                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Strength</p>
                                        <p className="text-xs font-bold text-emerald-400">Peer Collaboration</p>
                                      </div>
                                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Risk Factor</p>
                                        <p className="text-xs font-bold text-rose-400">Sleep Hygiene</p>
                                      </div>
                                    </div>
                                  </div>
                                  <Zap className="absolute -bottom-8 -right-8 w-40 h-40 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                                </div>
                              </div>

                              {/* Right Column: History & Trends */}
                              <div className="space-y-8">
                                {/* Wellbeing Trend */}
                                <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                                  <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                                    7-Day Trend
                                  </h3>
                                  <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={[
                                        { day: 'Mon', score: 7 },
                                        { day: 'Tue', score: 8 },
                                        { day: 'Wed', score: 6 },
                                        { day: 'Thu', score: 9 },
                                        { day: 'Fri', score: 8 },
                                        { day: 'Sat', score: 7 },
                                        { day: 'Sun', score: 8 },
                                      ]}>
                                        <defs>
                                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} domain={[0, 10]} />
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                                  <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <History className="w-4 h-4 text-slate-400" />
                                    Recent Activity
                                  </h3>
                                  <div className="space-y-4">
                                    {[
                                      { type: 'assignment', title: 'Math Quiz Submitted', time: '2h ago', status: 'Graded' },
                                      { type: 'wellbeing', title: 'Mood Update: Positive', time: '5h ago', status: 'Normal' },
                                      { type: 'ai', title: 'SWI Learning Session', time: '1d ago', status: 'Helpful' },
                                    ].map((activity, i) => (
                                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-black/5 group hover:bg-white hover:shadow-md transition-all">
                                        <div className={`p-2 rounded-xl ${
                                          activity.type === 'assignment' ? 'bg-indigo-100 text-indigo-600' :
                                          activity.type === 'wellbeing' ? 'bg-emerald-100 text-emerald-600' :
                                          'bg-amber-100 text-amber-600'
                                        }`}>
                                          {activity.type === 'assignment' ? <BookOpen className="w-4 h-4" /> :
                                           activity.type === 'wellbeing' ? <Heart className="w-4 h-4" /> :
                                           <BrainCircuit className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-xs font-bold text-slate-900">{activity.title}</p>
                                          <p className="text-[10px] text-slate-400 font-bold">{activity.time}</p>
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{activity.status}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-6 border border-black/5">
                              <Users className="w-10 h-10 text-slate-200" />
                            </div>
                            <h4 className="text-xl font-black tracking-tighter text-slate-900">No Student Selected</h4>
                            <p className="text-sm text-slate-400 font-bold max-w-xs mt-2">Choose a student from the dropdown above to view their personalized dashboard.</p>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === 'assignments' && visibleWidgets.assignments && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  Assignment Manager
                </h3>
                <button className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold">View Submissions</button>
              </div>
              {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('attendance')}
          className="p-4 bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Action</p>
            <p className="text-sm font-black tracking-tight">Mark Attendance</p>
          </div>
          <kbd className="ml-auto px-2 py-1 bg-slate-100 rounded text-[8px] font-black text-slate-400 uppercase tracking-widest">Ctrl+A</kbd>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('assignments')}
          className="p-4 bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Send className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Action</p>
            <p className="text-sm font-black tracking-tight">Send Assignment</p>
          </div>
          <kbd className="ml-auto px-2 py-1 bg-slate-100 rounded text-[8px] font-black text-slate-400 uppercase tracking-widest">Ctrl+N</kbd>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowReferralModal(true)}
          className="p-4 bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Action</p>
            <p className="text-sm font-black tracking-tight">Log Incident</p>
          </div>
          <kbd className="ml-auto px-2 py-1 bg-slate-100 rounded text-[8px] font-black text-slate-400 uppercase tracking-widest">Ctrl+I</kbd>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Active Assignments</h4>
                  {assignments.length === 0 ? (
                    <EmptyState 
                      icon={BookOpen}
                      title="No Assignments Yet"
                      description="You haven't sent any assignments to this class. Start by creating your first one on the right."
                      actionLabel="Create Assignment"
                      onAction={() => document.querySelector<HTMLInputElement>('input[placeholder="Assignment Title"]')?.focus()}
                    />
                  ) : (
                    [
                      { title: 'Algebra Worksheet', dueDate: '2024-03-20', submissions: 18, total: 24, status: 'active', priority: 'high' },
                      { title: 'History Essay', dueDate: '2024-03-22', submissions: 5, total: 24, status: 'active', priority: 'medium' },
                      { title: 'Science Lab Report', dueDate: '2024-03-15', submissions: 24, total: 24, status: 'completed', priority: 'low' },
                    ].map((a) => (
                      <div key={a.title} className="p-6 bg-slate-50 rounded-2xl border border-black/5 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-12 rounded-full ${
                            a.priority === 'high' ? 'bg-red-500' : 
                            a.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          <div>
                            <h4 className="font-bold mb-1">{a.title}</h4>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Due: {a.dueDate}</p>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                a.priority === 'high' ? 'bg-red-100 text-red-600' : 
                                a.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {a.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(a.submissions / a.total) * 100}%` }}
                                className={`h-full ${a.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                              />
                            </div>
                            <span className="text-[10px] font-black text-slate-600">{a.submissions}/{a.total}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            a.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                          }`}>
                            {a.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-black/5 h-fit">
                  <h4 className="text-sm font-bold mb-4">Create New Assignment</h4>
                  <div className="space-y-4">
                    <input 
                      type="text"
                      placeholder="Assignment Title"
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                      className="w-full bg-white border border-black/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                    />
                    <textarea 
                      placeholder="Description & Instructions"
                      rows={3}
                      value={assignmentDesc}
                      onChange={(e) => setAssignmentDesc(e.target.value)}
                      className="w-full bg-white border border-black/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400">Priority:</span>
                      {(['low', 'medium', 'high'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setAssignmentPriority(p)}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            assignmentPriority === p 
                              ? p === 'high' ? 'bg-red-500 text-white' : p === 'medium' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                              : 'bg-white border border-black/5 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={handleSendAssignment}
                      disabled={isSubmitting}
                      className="w-full bg-black text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Broadcast
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

                    {activeTab === 'quizzes' && visibleWidgets.quizzes && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Quiz System
                </h3>
                <button className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold">View History</button>
              </div>
              
              <QuizGenerator classId={selectedClass} teacherId={user.username} />

              {quizzes.length === 0 ? (
                <EmptyState 
                  icon={Zap}
                  title="No Quizzes Found"
                  description="Generate a quiz using AI or create one manually to assess student progress."
                  actionLabel="Generate Quiz"
                  onAction={() => {}}
                />
              ) : (
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <h4 className="md:col-span-2 text-xs font-black uppercase text-slate-400 tracking-widest">Recent Quizzes</h4>
                  {[
                    { title: 'Math Basics', students: 24, avg: '82%', stars: 120 },
                    { title: 'Science Intro', students: 22, avg: '75%', stars: 95 },
                  ].map((q) => (
                    <div key={q.title} className="p-6 bg-slate-50 rounded-2xl border border-black/5">
                      <h4 className="font-bold mb-2">{q.title}</h4>
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                        <span>{q.students} Students</span>
                        <span className="text-emerald-600">{q.avg} Avg</span>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-xs font-bold">{q.stars} Stars Awarded</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

                    {activeTab === 'network' && visibleWidgets.network && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-black/5"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Teacher Communication Network</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Real-time Messaging</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search messages..."
                      value={messageSearchQuery}
                      onChange={(e) => handleSearchMessages(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-black/5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Secure
                  </span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-[400px] bg-slate-50 rounded-2xl border border-black/5 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                  {networkMessages.length > 0 ? networkMessages.map((msg, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: msg.sender_id === user.username ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex flex-col ${msg.sender_id === user.username ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                        msg.sender_id === user.username ? 'bg-black text-white' : 'bg-white border border-black/5'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[8px] font-black uppercase opacity-50">{msg.sender_id}</span>
                          <span className="text-[8px] opacity-50">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </motion.div>
                  )) : (
                    <EmptyState 
                      icon={MessageSquare}
                      title="No Communication History"
                      description="Start a conversation with parents or other staff members to coordinate student support."
                      actionLabel="New Message"
                      onAction={() => {}}
                    />
                  )}
                </div>
                <div className="relative">
                  <SafetyScannerWrapper 
                    onSend={(content) => handleSendNetworkMessage(content)} 
                    placeholder="Type a secure message to the teacher network..."
                  />
                  <div className="absolute right-16 top-1/2 -translate-y-1/2 flex gap-2">
                    <button 
                      onClick={() => handleSendNetworkMessage('Shared a new lesson plan', 'resource', 'Lesson_Plan_Math.pdf')}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-500"
                      title="Attach Resource"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
                  </div>
                )}
              </div>
            )}

            {sectionId === 'referral' && visibleWidgets.referral && (
              <div className="bg-rose-500 text-white p-6 rounded-3xl shadow-xl">
                <h3 className="font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Counseling Referral
                </h3>
                <p className="text-rose-100 text-xs mb-6">Request professional support for a student in need.</p>
                <button 
                  onClick={() => setShowReferralModal(true)}
                  className="w-full py-3 bg-white text-rose-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 transition-colors"
                >
                  Initiate Referral
                </button>
              </div>
            )}

            {sectionId === 'grouping' && visibleWidgets.grouping && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
                <h3 className="font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-500" />
                  Student Grouping
                </h3>
                
                <div className="h-48 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'High Performers', count: groupCounts.high, color: 'bg-emerald-100 text-emerald-600' },
                    { label: 'Needs Support', count: groupCounts.support, color: 'bg-rose-100 text-rose-600' },
                    { label: 'STEM Program', count: groupCounts.stem, color: 'bg-indigo-100 text-indigo-600' },
                  ].map((g) => (
                    <div 
                      key={g.label} 
                      className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${selectedGroup === g.label ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50 border border-transparent hover:bg-slate-100'}`}
                      onClick={() => setSelectedGroup(selectedGroup === g.label ? null : g.label)}
                    >
                      <span className="text-xs font-bold">{g.label}</span>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${g.color}`}>{g.count}</span>
                    </div>
                  ))}
                </div>

                {selectedGroup && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-slate-100 space-y-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students in {selectedGroup}</p>
                      <button onClick={() => setSelectedGroup(null)} className="text-slate-400 hover:text-black">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                      {students.filter(s => {
                        if (selectedGroup === 'High Performers') return s.risk_level === 'low';
                        if (selectedGroup === 'Needs Support') return s.risk_level === 'high';
                        if (selectedGroup === 'STEM Program') return s.program === 'STEM';
                        return false;
                      }).map(s => (
                        <div key={s.student_id} className="flex items-center justify-between text-[10px] p-2 bg-slate-50 rounded-lg group hover:bg-white hover:shadow-sm transition-all">
                          <span className="font-bold">{s.name}</span>
                          <span className="text-slate-400">{s.student_id}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {sectionId === 'stars' && visibleWidgets.stars && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
                <h3 className="font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Star Level System
                </h3>
                <div className="space-y-4">
                  {starLevels.map((level, i) => (
                    <div key={level} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i <= avgStarLevel ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Star className={`w-4 h-4 ${i <= avgStarLevel ? 'fill-current' : ''}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-bold ${i <= avgStarLevel ? 'text-slate-900' : 'text-slate-400'}`}>Level {i + 1}: {level}</span>
                          {i === avgStarLevel && <span className="text-[10px] font-black text-amber-600 uppercase">Current Avg</span>}
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full mt-1">
                          <div className={`h-full rounded-full ${i <= avgStarLevel ? 'bg-amber-500' : 'bg-slate-200'}`} style={{ width: i === avgStarLevel ? '60%' : i < avgStarLevel ? '100%' : '0%' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sectionId === 'schedule' && visibleWidgets.schedule && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Schedule & Notes</h3>
                  <div className="text-[10px] font-bold text-slate-400">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-black/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-black">{currentTime.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-slate-200 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                      <button className="p-1 hover:bg-slate-200 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <span key={`${day}-${idx}`} className="text-[8px] font-black text-slate-400">{day}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {[...Array(31)].map((_, i) => {
                      const day = i + 1;
                      const isToday = day === currentTime.getDate();
                      return (
                        <div 
                          key={i} 
                          className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                            isToday ? 'bg-black text-white shadow-lg' : 'hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <StickyNote className="w-3 h-3" />
                      Reminders
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-500">{reminders.filter(r => !r.completed).length} Pending</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newReminder}
                      onChange={(e) => setNewReminder(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addReminder()}
                      placeholder="Add a note..."
                      className="flex-1 bg-slate-50 border border-black/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                    <button 
                      onClick={addReminder}
                      className="p-2 bg-black text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {reminders.map(reminder => (
                      <motion.div 
                        layout
                        key={reminder.id}
                        className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                          reminder.completed ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-black/5 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleReminder(reminder.id)}
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              reminder.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-black'
                            }`}
                          >
                            {reminder.completed && <CheckCircle className="w-3 h-3 text-white" />}
                          </button>
                          <span className={`text-xs font-bold ${reminder.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {reminder.text}
                          </span>
                        </div>
                        <button 
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {sectionId === 'health' && visibleWidgets.health && (
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="font-bold uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2 text-slate-400">
                    <BrainCircuit className="w-4 h-4 text-emerald-400" />
                    SWI v5.0 System Health
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                        <span className="text-slate-400">Gaborone Baseline</span>
                        <span className="text-emerald-400">72.5 B_c</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '72.5%' }}
                            className="h-full bg-emerald-400"
                          />
                        </div>
                        <span className="text-xs font-bold">72.5</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                        <span className="text-slate-400">Class Drift (Δ)</span>
                        <span className={systemDrift > 14.2 ? 'text-rose-400' : 'text-amber-400'}>
                          {systemDrift.toFixed(1)} / 14.2 C_a
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(systemDrift / 14.2) * 100}%` }}
                            className={`h-full ${systemDrift > 14.2 ? 'bg-rose-400' : 'bg-amber-400'}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isRecalibrating ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {isRecalibrating ? 'Inverting...' : 'Reflex Lag: 0.000003ms'}
                        </span>
                      </div>
                      <button 
                        onClick={handleRecalibrate}
                        disabled={isRecalibrating}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        {isRecalibrating ? 'Syncing...' : 'Recalibrate'}
                      </button>
                    </div>
                  </div>
                </div>
                <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
              </div>
            )}

      </Reorder.Item>
    ))}
  </Reorder.Group>

      {/* Quick Access Student Panel */}
      <AnimatePresence>
        {showQuickAccess && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-[60] border-l border-black/5 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black tracking-tighter">Quick Access</h3>
              <button onClick={() => setShowQuickAccess(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Students in {selectedClass}</label>
                <div className="space-y-2">
                  {students.map(student => (
                    <button
                      key={student.student_id}
                      onClick={() => setSelectedQuickStudent(student)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                        selectedQuickStudent?.student_id === student.student_id ? 'bg-black text-white' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          selectedQuickStudent?.student_id === student.student_id ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'
                        }`}>
                          {student.name[0]}
                        </div>
                        <span className="text-sm font-bold">{student.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedQuickStudent?.student_id === student.student_id ? 'translate-x-1' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {selectedQuickStudent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm uppercase tracking-tight">Mini Profile</h4>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                      selectedQuickStudent.risk_level === 'low' ? 'bg-emerald-100 text-emerald-600' : 
                      selectedQuickStudent.risk_level === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {selectedQuickStudent.risk_level} Risk
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 p-3 rounded-2xl">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Academic</p>
                      <p className="text-lg font-black">{getStudentProgress(selectedQuickStudent)}%</p>
                    </div>
                    <div className="bg-white/50 p-3 rounded-2xl">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Wellbeing</p>
                      <p className="text-lg font-black">7.8</p>
                    </div>
                  </div>

                  {selectedQuickStudent.risk_level === 'high' && (
                    <div className="flex items-center gap-2 p-3 bg-rose-100 text-rose-700 rounded-2xl">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase">Active Alert: High Risk</span>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      // Logic to navigate to full profile or open more details
                      alert(`Opening full profile for ${selectedQuickStudent.name}`);
                    }}
                    className="w-full py-3 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-colors"
                  >
                    View Full Profile
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold">{message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcut Help Modal */}
      <AnimatePresence>
        {showShortcutHelp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-black/5"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black tracking-tighter">Keyboard Shortcuts</h3>
                <button onClick={() => setShowShortcutHelp(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="space-y-6">
                {[
                  { key: 'Ctrl + A', desc: 'Go to Attendance Tab' },
                  { key: 'Ctrl + N', desc: 'Go to Assignments Tab' },
                  { key: 'Ctrl + I', desc: 'Go to Network Tab' },
                  { key: 'Ctrl + O', desc: 'Open Quick Access Menu' },
                  { key: '?', desc: 'Show this help' }
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600">{s.desc}</span>
                    <kbd className="px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-900 border-b-2 border-slate-300">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowShortcutHelp(false)}
                className="w-full mt-10 py-4 bg-black text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                Got it!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Detail View Modal */}
      <AnimatePresence>
        {selectedStudentDetail && (
          <StudentDetailView 
            student={selectedStudentDetail} 
            onClose={() => setSelectedStudentDetail(null)} 
          />
        )}
      </AnimatePresence>

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Counseling Referral</h2>
              <button onClick={() => setShowReferralModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Student</label>
                <select 
                  value={referralData.student_id}
                  onChange={(e) => setReferralData(prev => ({ ...prev, student_id: e.target.value }))}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-black/5 outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Choose a student...</option>
                  {students.map(s => <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                <select 
                  value={referralData.category}
                  onChange={(e) => setReferralData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-black/5 outline-none focus:ring-2 focus:ring-black"
                >
                  <option>Bullying</option>
                  <option>Harassment</option>
                  <option>Mental Distress</option>
                  <option>Unsafe Environment</option>
                  <option>Family Issues</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                <textarea 
                  value={referralData.description}
                  onChange={(e) => setReferralData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide details about the situation..."
                  rows={4}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-black/5 outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <input 
                  type="checkbox"
                  checked={referralData.involve_parent}
                  onChange={(e) => setReferralData(prev => ({ ...prev, involve_parent: e.target.checked }))}
                  className="w-4 h-4 accent-black"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-900">Involve Parent</p>
                  <p className="text-[10px] text-amber-700">Uncheck if parent is involved in harm (Scenario 2)</p>
                </div>
              </div>

              <button 
                onClick={handleReferral}
                disabled={isSubmitting || !referralData.student_id || !referralData.description}
                className="w-full py-4 bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Referral'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
