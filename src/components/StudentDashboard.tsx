import React, { useState, useEffect } from 'react';
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
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { 
  Heart, Activity, Calendar, BookOpen, 
  ShieldCheck, Zap, BrainCircuit, History,
  MessageSquare, AlertCircle, TrendingUp,
  Smile, Frown, Meh, AlertTriangle, Lock as LockIcon,
  Clock, CheckCircle, Star, Sparkles, Map as MapIcon, FileDown,
  User as UserIcon, Mail, Phone, MapPin, Award, Info, Globe, Database,
  ThumbsUp, ThumbsDown, RefreshCw, ExternalLink
} from 'lucide-react';
import { getSimulatedUserCount } from '../services/api';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { Metric, Student, User } from '../types';
import { StudentChat } from './StudentChat';
import { DailyCheckIn } from './DailyCheckIn';
import { 
  fetchMetrics, fetchAIInsights, fetchAssignments, fetchTimetable, 
  fetchLearningSummary, fetchRegionalInsights, fetchStudentComms, 
  sendCommunication, fetchQuizzes, fetchCalendarEvents, submitCalendarEvent,
  updateAssignmentPriority,
  getGoogleAuthUrl,
  fetchGoogleCalendarEvents,
  submitGoogleCalendarEvent,
  checkGoogleCalendarConnection,
  fetchAIHistory,
  saveAIInteraction,
  generateSpeech,
  fetchAIGuidance,
  syncOfflineData,
  updateAssignmentStatus,
  rateAIInteraction
} from '../services/api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Mic, Volume2, VolumeX, FileText, Download, X, Settings2, GripVertical, ChevronRight } from 'lucide-react';
import { SafetyScannerWrapper } from './SafetyScannerWrapper';
import { InteractiveSummary } from './InteractiveSummary';
import { Gauge } from './Gauge';
import { AcademicPerformance } from './AcademicPerformance';
import { MonthlyCalendar } from './MonthlyCalendar';
import { GoogleCalendarWidget } from './GoogleCalendarWidget';
import { LiveSimulationReports } from './LiveSimulationReports';

import { AIStudentReport } from './AIStudentReport';
import { SWIAIAssistant } from './SWIAIAssistant';
import { AITutor } from './AITutor';
import { EmptyState } from './EmptyState';
import { WellbeingSummary } from './WellbeingSummary';
import { UpcomingEventsWidget } from './UpcomingEventsWidget';
import { Friendship } from '../types';

interface StudentDashboardProps {
  user: User;
  student: Student | undefined;
  metrics: Metric[];
  onMetricsUpdate: (metrics: Metric[]) => void;
}

const FriendsWidget: React.FC<{ student: Student | undefined }> = ({ student }) => {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    const q = query(
      collection(db, 'friendships'),
      where('user_id', '==', student.student_id),
      where('status', '==', 'accepted')
    );
    return onSnapshot(q, (snapshot) => {
      setFriends(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Friendship)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'friendships');
      setLoading(false);
    });
  }, [student]);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-indigo-500" />
          Friends & Classmates
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{friends.length} Active</span>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-2xl" />)}
          </div>
        ) : friends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friends.map(friend => (
              <div key={friend.id} className="p-3 bg-slate-50 rounded-2xl border border-black/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                  {friend.friend_name.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{friend.friend_name}</p>
                  <p className="text-[10px] text-emerald-500 font-medium">Online</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <UserIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No friends added yet</p>
            <p className="text-[10px] text-slate-400 mt-1">Use the chat button to find classmates!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AIGuidanceWidget: React.FC<{ student: Student, metrics: Metric[] }> = ({ student, metrics }) => {
  const [guidance, setGuidance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getGuidance = async () => {
      setIsLoading(true);
      try {
        const res = await fetchAIGuidance(student.student_id, metrics);
        setGuidance(res.guidance);
      } catch (error) {
        console.error("Failed to fetch AI guidance", error);
      } finally {
        setIsLoading(false);
      }
    };
    getGuidance();
  }, [student.id, metrics]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-indigo-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">AI Personal Guidance</h3>
        </div>
        <div className="px-2 py-1 bg-white/20 rounded-full backdrop-blur-sm">
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Analysis</span>
        </div>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="p-2 bg-white rounded-lg shadow-sm h-fit">
                <BrainCircuit className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-indigo-900 leading-relaxed">
                  {guidance || "I'm analyzing your latest metrics to provide personalized advice. Keep up the great work!"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group">
                <ThumbsUp className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                <span className="text-xs font-bold text-slate-600">Helpful</span>
              </button>
              <button className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group">
                <ThumbsDown className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                <span className="text-xs font-bold text-slate-600">Not Helpful</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OfflineIndicator: React.FC<{ isOnline: boolean, onSync: () => void, isSyncing: boolean }> = ({ isOnline, onSync, isSyncing }) => (
  <AnimatePresence>
    {!isOnline && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-bold">Offline Mode - Using Cached Data</span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <button 
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-2 hover:bg-white/10 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">Sync Now</span>
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

const WellbeingCharts: React.FC<{ metrics: Metric[], timeRange: '7d' | '30d' | '90d', setTimeRange: (range: '7d' | '30d' | '90d') => void }> = ({ metrics, timeRange, setTimeRange }) => {
  const filteredData = React.useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = subDays(new Date(), days);
    return metrics
      .filter(m => new Date(m.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(m => ({
        ...m,
        dateFormatted: format(new Date(m.date), 'MMM dd'),
        moodScore: m.mood_score * 20, // Scale 1-5 to 0-100
        stressScore: (5 - m.stress_score) * 20, // Invert stress (1 is low stress, 5 is high)
        sleepScore: m.sleep_hours * 10
      }));
  }, [metrics, timeRange]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Wellbeing Trends</h3>
            <p className="text-sm text-slate-500">Your mental and physical health over time</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                timeRange === range
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="dateFormatted" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              hide 
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
              }}
            />
            <Area
              type="monotone"
              dataKey="moodScore"
              name="Mood"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorMood)"
            />
            <Area
              type="monotone"
              dataKey="stressScore"
              name="Stress"
              stroke="#ef4444"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorStress)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-xs font-medium text-slate-600">Mood Stability</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs font-medium text-slate-600">Stress Levels</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-slate-600">Sleep Quality</span>
        </div>
      </div>
    </div>
  );
};

const EventDetailSidebar: React.FC<{ event: any, isOpen: boolean, onClose: () => void }> = ({ event, isOpen, onClose }) => {
  if (!event) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900">Event Details</h2>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-indigo-600 uppercase tracking-wider">Upcoming Event</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">{event.title || event.summary}</h1>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Time</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {event.start_time || format(new Date(event.start.dateTime), 'h:mm a')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Location</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {event.location || 'No location set'}
                    </p>
                  </div>
                </div>

                {event.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Description</h3>
                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 bg-slate-50 p-4 rounded-xl">
                      {event.description}
                    </div>
                  </div>
                )}

                {event.hangoutLink && (
                  <a 
                    href={event.hangoutLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5" />
                      <span className="font-semibold">Join Video Call</span>
                    </div>
                    <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}

                {event.attachments && event.attachments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Attachments</h3>
                    <div className="space-y-2">
                      {event.attachments.map((file: any, index: number) => (
                        <a
                          key={index}
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
                        >
                          <FileText className="w-5 h-5 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">{file.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, student, metrics, onMetricsUpdate }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [userCount] = useState(getSimulatedUserCount());
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [learningSummary, setLearningSummary] = useState<any>(null);
  const [regionalInsights, setRegionalInsights] = useState<any>(null);
  const [communications, setCommunications] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'due_date', direction: 'asc' });
  const [isLoading, setIsLoading] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [assignmentFilter, setAssignmentFilter] = useState({ priority: 'all', status: 'pending' });
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Offline Caching
  useEffect(() => {
    if (metrics.length > 0) {
      localStorage.setItem(`cached_metrics_${user.id}`, JSON.stringify(metrics));
    }
    if (assignments.length > 0) {
      localStorage.setItem(`cached_assignments_${user.id}`, JSON.stringify(assignments));
    }
    if (aiHistory.length > 0) {
      localStorage.setItem(`cached_aiHistory_${user.id}`, JSON.stringify(aiHistory));
    }
  }, [metrics, assignments, aiHistory, user.id]);

  // Load Cached Data if Offline
  useEffect(() => {
    if (!isOnline) {
      const cachedMetrics = localStorage.getItem(`cached_metrics_${user.id}`);
      const cachedAssignments = localStorage.getItem(`cached_assignments_${user.id}`);
      const cachedAIHistory = localStorage.getItem(`cached_aiHistory_${user.id}`);

      if (cachedMetrics) onMetricsUpdate(JSON.parse(cachedMetrics));
      if (cachedAssignments) setAssignments(JSON.parse(cachedAssignments));
      if (cachedAIHistory) setAiHistory(JSON.parse(cachedAIHistory));
    }
  }, [isOnline, user.id]);

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
  } = useDashboardLayout(user.id, 'student_dashboard', ['profile', 'wellbeing_summary', 'wellbeing_charts', 'academic', 'friends', 'timetable', 'assignments', 'upcoming_events', 'google-calendar', 'calendar', 'simulation', 'ai_assistant', 'resources'], {
    profile: true,
    wellbeing_summary: true,
    wellbeing_charts: true,
    academic: true,
    friends: true,
    timetable: true,
    assignments: true,
    upcoming_events: true,
    'google-calendar': true,
    calendar: true,
    simulation: true,
    ai_assistant: true,
    resources: true
  });

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleWidgetClick = () => {
    if (isAutoLayout) {
      optimizeLayout(['profile', 'wellbeing_summary', 'wellbeing_charts', 'academic', 'friends', 'timetable', 'assignments', 'upcoming_events', 'google-calendar', 'calendar', 'simulation', 'ai_assistant', 'resources']);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (student) {
      setIsLoading(true);
      
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
          console.log('No Firebase user, using API fallbacks for StudentDashboard');
          return;
        }

        try {
          console.log('Firebase auth ready, setting up Firestore listeners for StudentDashboard');
          
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

          const metricsQuery = query(
            collection(db, 'metrics'),
            where('student_id', '==', student.student_id),
            orderBy('date', 'desc'),
            limit(365)
          );

          const unsubMetrics = onSnapshot(metricsQuery, (snapshot) => {
            const updatedMetrics = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as any[];
            onMetricsUpdate(updatedMetrics as Metric[]);
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'metrics');
          });
          unsubscribes.push(unsubMetrics);

          const assignmentsQuery = query(
            collection(db, 'assignments'),
            where('student_id', '==', student.student_id)
          );

          const unsubAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
            const updatedAssignments = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setAssignments(updatedAssignments);
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'assignments');
          });
          unsubscribes.push(unsubAssignments);

          const commsQuery = query(
            collection(db, 'communications'),
            where('receiver_id', '==', user.username),
            orderBy('timestamp', 'asc')
          );

          const unsubComms = onSnapshot(commsQuery, (snapshot) => {
            const updatedComms = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setCommunications(updatedComms);
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'communications');
          });
          unsubscribes.push(unsubComms);
        } catch (err) {
          console.error('Error setting up StudentDashboard listeners:', err);
        }
      });

      unsubscribes.push(unsubscribeAuth);

      // 2. Initial Fetch for other data (and fallbacks for Firestore data)
      Promise.all([
        fetchAIInsights(student.student_id),
        fetchTimetable(student.class_id || 'Class 10-A'),
        fetchLearningSummary(student.student_id),
        fetchRegionalInsights('Gaborone'),
        fetchQuizzes(student.class_id || 'Class 10-A'),
        fetchCalendarEvents(user.username),
        checkGoogleCalendarConnection(user.username),
        fetchAIHistory(student.student_id),
        // Add fallbacks for Firestore data if not authenticated
        !auth.currentUser ? fetchMetrics(student.student_id) : Promise.resolve(null),
        !auth.currentUser ? fetchAssignments(student.student_id) : Promise.resolve(null),
        !auth.currentUser ? fetchStudentComms(student.student_id, user.role, user.id) : Promise.resolve(null)
      ]).then(([insights, tt, ls, ri, qz, events, googleConn, history, fallbackMetrics, fallbackAssignments, fallbackComms]) => {
        setAiInsights(insights);
        setTimetable(Array.isArray(tt) ? tt : []);
        setLearningSummary(ls);
        setRegionalInsights(ri);
        setQuizzes(Array.isArray(qz) ? qz : []);
        setCalendarEvents(Array.isArray(events) ? events : []);
        setIsGoogleConnected(googleConn.connected);
        setAiHistory(Array.isArray(history) ? history : []);
        
        if (fallbackMetrics) onMetricsUpdate(fallbackMetrics);
        if (fallbackAssignments) setAssignments(fallbackAssignments);
        if (fallbackComms) setCommunications(fallbackComms);

        // Fetch personalized guidance based on metrics and history
        fetchAIGuidance(student.student_id, metrics, history, fallbackAssignments || assignments, qz || quizzes, undefined, undefined, user).then(setAiInsights).catch(console.error);

        if (googleConn.connected) {
          fetchGoogleCalendarEvents(user.username).then(setGoogleEvents).catch(console.error);
        }
      }).catch(console.error).finally(() => setIsLoading(false));

      return () => {
        unsubscribes.forEach(unsub => unsub());
      };
    }
  }, [student, user.username]);

  const handlePriorityChange = async (assignmentId: string, priority: string) => {
    try {
      await updateAssignmentPriority(assignmentId, priority);
      // Local update for immediate feedback
      setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, priority } : a));
    } catch (err) {
      console.error("Failed to update priority", err);
    }
  };

  const handleToggleAssignmentStatus = async (assignmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await updateAssignmentStatus(assignmentId, newStatus as any);
      // Local update for immediate feedback
      setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error("Failed to update assignment status", err);
    }
  };

  const handleAddCalendarEvent = async (title: string, date: string, type: string = 'personal') => {
    try {
      if (isGoogleConnected) {
        await submitGoogleCalendarEvent(user.username, {
          summary: title,
          description: `Reminder for ${title}`,
          start: { dateTime: new Date(date).toISOString() },
          end: { dateTime: new Date(new Date(date).getTime() + 3600000).toISOString() },
        });
        const updated = await fetchGoogleCalendarEvents(user.username);
        setGoogleEvents(updated);
      } else {
        await submitCalendarEvent({
          user_id: user.username,
          title,
          description: `Reminder for ${title}`,
          start_time: date,
          end_time: date,
          type
        });
        const updated = await fetchCalendarEvents(user.username);
        setCalendarEvents(updated);
      }
    } catch (err) {
      console.error("Failed to add calendar event", err);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const { url } = await getGoogleAuthUrl(user.username);
      const authWindow = window.open(url, 'google_auth', 'width=600,height=700');
      
      const checkInterval = setInterval(async () => {
        if (authWindow?.closed) {
          clearInterval(checkInterval);
          const { connected } = await checkGoogleCalendarConnection(user.username);
          if (connected) {
            setIsGoogleConnected(true);
            const events = await fetchGoogleCalendarEvents(user.username);
            setGoogleEvents(events);
          }
        }
      }, 1000);
    } catch (err) {
      console.error("Failed to connect Google Calendar", err);
    }
  };

  const sortedAssignments = [...assignments].sort((a, b) => {
    if (sortConfig.key === 'priority') {
      const priorityMap: any = { high: 3, medium: 2, low: 1 };
      const valA = priorityMap[a.priority] || 0;
      const valB = priorityMap[b.priority] || 0;
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    }
    const valA = new Date(a[sortConfig.key]).getTime();
    const valB = new Date(b[sortConfig.key]).getTime();
    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
  });

  const handleSendMessage = async (content: string) => {
    if (!student) return;
    try {
      await sendCommunication({
        student_id: student.student_id,
        sender_id: user.username,
        receiver_id: 'Teacher-1', // Default for demo
        content,
        type: 'text'
      });
      const updatedComms = await fetchStudentComms(student.student_id, 'student', student.id);
      setCommunications(updatedComms);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // Calculate average mood for the dial
  const avgMood = metrics.length > 0 
    ? metrics.reduce((acc, m) => acc + m.mood_score, 0) / metrics.length 
    : 0;

  const avgStress = metrics.length > 0 
    ? metrics.reduce((acc, m) => acc + m.stress_score, 0) / metrics.length 
    : 0;

  const avgSleep = metrics.length > 0 
    ? metrics.reduce((acc, m) => acc + (m.sleep_hours || 0), 0) / metrics.length 
    : 0;

  const avgEngagement = metrics.length > 0 
    ? metrics.reduce((acc, m) => acc + (m.engagement_hours || 0), 0) / metrics.length 
    : 0;

  const getWellbeingStatus = (score: number) => {
    if (score >= 4) return { label: 'Stable', color: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', level: 'Green' };
    if (score >= 3) return { label: 'Needs attention', color: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500', level: 'Yellow' };
    if (score >= 2) return { label: 'Support recommended', color: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500', level: 'Orange' };
    return { label: 'Immediate support required', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500', level: 'Red' };
  };

  const wellbeingStatus = getWellbeingStatus(avgMood).label;

  const status = getWellbeingStatus(avgMood);

  const generatePDFReport = () => {
    if (!student) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text('SWI Student Performance Report', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
    
    // Student Info
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text('Student Information', 20, 45);
    doc.setFontSize(11);
    doc.text(`Name: ${student.name}`, 20, 55);
    doc.text(`ID: ${student.student_id}`, 20, 62);
    doc.text(`Grade: ${student.class_grade}`, 20, 69);
    doc.text(`Academic Standing: ${student.academic_standing || 'N/A'}`, 20, 76);
    
    // Wellbeing Section
    doc.setFontSize(16);
    doc.text('Wellbeing Metrics (Last 30 Days)', 20, 90);
    const wellbeingData = metrics.slice(0, 30).map(m => [
      new Date(m.date?.seconds ? m.date.seconds * 1000 : m.date).toLocaleDateString(),
      m.mood_score,
      m.stress_score,
      m.attendance === 1 ? 'Present' : 'Absent'
    ]);
    
    (doc as any).autoTable({
      startY: 95,
      head: [['Date', 'Mood', 'Stress', 'Attendance']],
      body: wellbeingData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    // AI Insights
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(16);
    doc.text('AI-Driven Insights', 20, finalY + 15);
    doc.setFontSize(10);
    const splitGuidance = doc.splitTextToSize(aiInsights?.guidance || 'No recent insights available.', 170);
    doc.text(splitGuidance, 20, finalY + 25);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Confidential - SAMH SWI Platform', 20, 285);
    
    doc.save(`${student.student_id}_Report.pdf`);
  };
  const last30Days = [...metrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-30);

  const handleNewInteraction = (interaction: any) => {
    setAiHistory(prev => [interaction, ...prev]);
  };

  const handleRateInteraction = async (id: string, rating: number, helpful: boolean) => {
    try {
      await rateAIInteraction(id, rating, helpful);
      setAiHistory(prev => prev.map(item => 
        item.id === id ? { ...item, rating, is_helpful: helpful } : item
      ));
    } catch (err) {
      console.error("Failed to rate interaction", err);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/50 overflow-x-hidden pb-20">
      <OfflineIndicator 
        isOnline={isOnline} 
        onSync={async () => {
          setIsSyncing(true);
          await syncOfflineData();
          setIsSyncing(false);
          setLastSyncTime(new Date());
        }}
        isSyncing={isSyncing}
      />
      
      <EventDetailSidebar 
        event={selectedEvent} 
        isOpen={showEventDetails} 
        onClose={() => setShowEventDetails(false)} 
      />

      {/* Sliding Student Profile Sidebar */}
      <AnimatePresence>
        {showStudentDetails && student && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-full md:w-[450px] bg-white z-[70] shadow-[20px_0_60px_-15px_rgba(0,0,0,0.1)] overflow-y-auto border-r border-black/5"
          >
            <div className="relative h-48 bg-indigo-600 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_60%)]" />
              <button 
                onClick={() => setShowStudentDetails(false)}
                className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl text-white transition-all z-10 group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              </button>
              <div className="absolute -bottom-16 left-10">
                <div className="w-32 h-32 rounded-[2.5rem] bg-white p-1.5 shadow-2xl">
                  <div className="w-full h-full rounded-[2rem] bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white">
                    {student.photo_url ? (
                      <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-16 h-16 text-slate-300" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-20 px-10 pb-10 space-y-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-black tracking-tighter text-slate-900">{student.name}</h2>
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-slate-500 font-bold text-lg">Student ID: {student.student_id} • {student.class_id}</p>
                <div className="flex gap-2 pt-2">
                  <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Active Status</span>
                  <span className="px-4 py-1.5 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Year 10 Scholar</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-5">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Contact Matrix</h3>
                  <div className="space-y-4">
                    {[
                      { icon: Mail, label: student.email || `${student.student_id.toLowerCase()}@school.edu.bw`, color: 'text-indigo-500 bg-indigo-50' },
                      { icon: Phone, label: '+267 71 234 567', color: 'text-emerald-500 bg-emerald-50' },
                      { icon: MapPin, label: 'Gaborone, Botswana', color: 'text-rose-500 bg-rose-50' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-black/5 hover:border-indigo-200 transition-colors group cursor-pointer">
                        <div className={`p-3 rounded-xl ${item.color} group-hover:scale-110 transition-transform`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-600">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Academic Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-200">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">GPA Score</p>
                      <p className="text-3xl font-black">3.8<span className="text-sm opacity-50 ml-1">/ 4.0</span></p>
                    </div>
                    <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Class Rank</p>
                      <p className="text-3xl font-black">#4<span className="text-sm opacity-50 ml-1">in Class</span></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Distinguished Achievements</h3>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { icon: Award, label: 'Perfect Attendance', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                    { icon: Star, label: 'Mathematics Excellence', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                    { icon: Sparkles, label: 'Senior Peer Mentor', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                  ].map((badge, i) => (
                    <div key={i} className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${badge.color}`}>
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <badge.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black tracking-tight">{badge.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <button 
                  onClick={() => setShowBreakdown(true)}
                  className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Wellbeing Breakdown
                </button>
                <button 
                  onClick={handleConnectGoogle}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl ${
                    isGoogleConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  {isGoogleConnected ? 'Google Calendar Connected' : 'Connect Google Calendar'}
                </button>
                <button 
                  onClick={generatePDFReport}
                  className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-black/10"
                >
                  <FileDown className="w-5 h-5" />
                  Download Full Report
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        animate={{ 
          scale: showStudentDetails ? 0.92 : 1,
          x: showStudentDetails ? (window.innerWidth > 768 ? 480 : 0) : 0,
          opacity: showStudentDetails ? 0.4 : 1,
          borderRadius: showStudentDetails ? '40px' : '0px'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`p-8 min-h-screen ${showStudentDetails ? 'pointer-events-none' : ''}`}
      >
        <div className="max-w-7xl mx-auto space-y-8">

      {/* Header with Layout Controls */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">Student Hub</h2>
          <p className="text-slate-500 text-sm">Your personalized learning and wellbeing overview</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end mr-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Globe className="w-3 h-3 animate-spin-slow" />
              Global Simulation Active
            </div>
            <div className="text-sm font-black text-emerald-600">
              {userCount.toLocaleString()} Users Online
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoLayout(!isAutoLayout)}
            className={`p-2 rounded-xl transition-all flex items-center gap-2 ${isAutoLayout ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 border border-black/5 hover:bg-slate-50'}`}
            title={isAutoLayout ? "Auto-Layout Enabled" : "Manual Layout Mode"}
          >
            <Zap className={`w-4 h-4 ${isAutoLayout ? 'animate-pulse' : ''}`} />
            <span className="text-[8px] font-black uppercase tracking-widest hidden lg:block">Auto</span>
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
        </div>
      </div>
    </div>

      <Reorder.Group axis="y" values={dashboardOrder} onReorder={setDashboardOrder} className="space-y-8">
        {/* Live Simulation Reports Widget - Fixed at top */}
        <LiveSimulationReports />
        
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

            {sectionId === 'profile' && visibleWidgets.profile && (
              <div className="flex flex-wrap gap-8">
                {/* Profile Card */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="governance-card flex-1 min-w-[300px] flex flex-col md:flex-row gap-8 items-center"
                >
                  <div className="relative">
                    <div className="w-32 h-32 rounded-3xl bg-indigo-100 flex items-center justify-center text-4xl font-black text-indigo-600 border-4 border-white shadow-xl">
                      {user.full_name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                      <h2 className="text-3xl font-black tracking-tighter">{user.full_name}</h2>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                          Grade {student?.class_grade || '10-A'}
                        </span>
                        {student?.risk_level && (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            student.risk_level === 'low' ? 'bg-emerald-100 text-emerald-600' :
                            student.risk_level === 'medium' ? 'bg-amber-100 text-amber-600' :
                            'bg-rose-100 text-rose-600'
                          }`}>
                            {student.risk_level} Risk
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-500 font-medium mb-6">ID: {student?.student_id || 'STU-2024-001'} • {student?.program || 'General Program'}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-black/5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${status.bg}`} />
                          <span className="font-bold text-slate-700">{status.level}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-black/5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Star Level</p>
                        <div className="flex items-center gap-2 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-bold text-slate-700">Level 4</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowStudentDetails(true)}
                      className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      View Student Profile
                    </button>
                  </div>
                </motion.div>

                {/* Quick Stats */}
                <div className="flex flex-col gap-4 flex-1 min-w-[200px]">
                  <div className="governance-card bg-emerald-50 border-emerald-100">
                    <div className="flex items-center justify-between w-full mb-2">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Attendance</span>
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-900">96.4%</h3>
                    <p className="text-xs text-emerald-700 mt-1">Excellent consistency!</p>
                  </div>
                  <div className="governance-card bg-indigo-50 border-indigo-100">
                    <div className="flex items-center justify-between w-full mb-2">
                      <BookOpen className="w-6 h-6 text-indigo-500" />
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Tasks</span>
                    </div>
                    <h3 className="text-2xl font-bold text-indigo-900">{assignments.length} Due</h3>
                    <p className="text-xs text-indigo-700 mt-1">Upcoming assignments</p>
                  </div>
                </div>
              </div>
            )}

            {sectionId === 'wellbeing_summary' && visibleWidgets.wellbeing_summary && (
              <WellbeingSummary metrics={metrics} student={student} />
            )}

            {sectionId === 'wellbeing_charts' && visibleWidgets.wellbeing_charts && (
              <WellbeingCharts 
                metrics={metrics} 
                timeRange={timeRange} 
                setTimeRange={setTimeRange} 
              />
            )}

            {sectionId === 'academic' && visibleWidgets.academic && (
              <AcademicPerformance 
                studentName={student?.name || user.full_name || 'Student'}
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

            {sectionId === 'friends' && visibleWidgets.friends && (
              <FriendsWidget student={student} />
            )}

            {sectionId === 'upcoming_events' && visibleWidgets.upcoming_events && (
              <UpcomingEventsWidget 
                events={calendarEvents} 
                onEventClick={handleEventClick}
              />
            )}

            {sectionId === 'google-calendar' && visibleWidgets['google-calendar'] && (
              <GoogleCalendarWidget 
                isConnected={isGoogleConnected}
                events={googleEvents}
                onConnect={handleConnectGoogle}
                onEventClick={handleEventClick}
              />
            )}

            {sectionId === 'calendar' && visibleWidgets.calendar && (
              <div className="governance-card">
                <div className="flex items-center justify-between w-full mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Academic Calendar
                  </h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly View</span>
                </div>
                <div className="w-full h-[600px]">
                  <MonthlyCalendar 
                    events={calendarEvents}
                    onAddEvent={handleAddCalendarEvent}
                  />
                </div>
              </div>
            )}

            {sectionId === 'simulation' && visibleWidgets.simulation && (
              <LiveSimulationReports />
            )}

            {sectionId === 'timetable' && visibleWidgets.timetable && (
              <div className="governance-card">
                <div className="flex items-center justify-between w-full mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Today's Timetable
                  </h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4D Live View</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  {timetable.length > 0 ? timetable.map((slot, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-black/5 w-full"
                    >
                      <div className="text-center w-16">
                        <p className="text-xs font-black text-indigo-600">{slot.start_time}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{slot.end_time}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{slot.subject}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{slot.teacher_id}</p>
                      </div>
                      <div className="bg-white px-3 py-1 rounded-lg border border-black/5 text-[10px] font-bold uppercase">
                        Room {slot.room || '101'}
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-full">
                      <EmptyState 
                        title="No classes scheduled" 
                        description="Your timetable is clear for today. Enjoy your free time or catch up on assignments!"
                        icon={Calendar}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {sectionId === 'assignments' && visibleWidgets.assignments && (
              <div className="governance-card">
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full mb-6 gap-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Assignments
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <select 
                      value={assignmentFilter.status}
                      onChange={(e) => setAssignmentFilter(prev => ({ ...prev, status: e.target.value }))}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border-none cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                    <select 
                      value={assignmentFilter.priority}
                      onChange={(e) => setAssignmentFilter(prev => ({ ...prev, priority: e.target.value }))}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border-none cursor-pointer"
                    >
                      <option value="all">All Priority</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                
                {sortedAssignments.filter(a => {
                  const matchesStatus = assignmentFilter.status === 'all' || a.status === assignmentFilter.status;
                  const matchesPriority = assignmentFilter.priority === 'all' || a.priority === assignmentFilter.priority;
                  return matchesStatus && matchesPriority;
                }).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedAssignments
                      .filter(a => {
                        const matchesStatus = assignmentFilter.status === 'all' || a.status === assignmentFilter.status;
                        const matchesPriority = assignmentFilter.priority === 'all' || a.priority === assignmentFilter.priority;
                        return matchesStatus && matchesPriority;
                      })
                      .map((asgn, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-4 rounded-2xl border border-black/5 flex items-center justify-between transition-all ${asgn.status === 'completed' ? 'bg-slate-50 opacity-60' : 'bg-white shadow-sm hover:shadow-md'}`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <button 
                            onClick={() => handleToggleAssignmentStatus(asgn.id, asgn.status)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              asgn.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-indigo-500'
                            }`}
                          >
                            {asgn.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-bold ${asgn.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{asgn.title}</p>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                                asgn.priority === 'high' ? 'bg-rose-100 text-rose-600' :
                                asgn.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                                'bg-emerald-100 text-emerald-600'
                              }`}>
                                {asgn.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    title="No assignments found" 
                    description="You're all caught up! No assignments match your current filters."
                    icon={Zap}
                  />
                )}
              </div>
            )}

            {sectionId === 'ai_assistant' && visibleWidgets.ai_assistant && (
              <div className="space-y-8">
                {student && (
                  <AIGuidanceWidget student={student} metrics={metrics} />
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    {student && (
                      <SWIAIAssistant 
                        user={user}
                        student={student}
                        metrics={metrics}
                        history={aiHistory}
                        assignments={assignments}
                        quizzes={quizzes}
                        onNewInteraction={handleNewInteraction}
                      />
                    )}
                  </div>
                  <div className="lg:col-span-1 space-y-8">
                    <AIStudentReport 
                      data={{
                        wellbeing: {
                          status: wellbeingStatus,
                          drift: student?.behavioral_drift || "No significant drift detected."
                        },
                        academic: {
                          dropout_risk: student?.risk_level === 'high' ? "Elevated" : "Low",
                          bullying_signals: "None Detected"
                        },
                        guidance: {
                          study_tip: "Focus on active recall for upcoming quizzes.",
                          security_advice: "Ensure your portal password is secure.",
                          wellbeing_action: "Take a 10-minute walk between study sessions."
                        },
                        history: aiHistory
                      }} 
                      onRate={handleRateInteraction}
                    />
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Learning Adaptations
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                          <p className="text-xs font-bold text-amber-700 mb-1">Study Strategy</p>
                          <p className="text-sm text-amber-900">Based on your high stress levels, we recommend 25-minute Pomodoro sessions with 10-minute breaks.</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <p className="text-xs font-bold text-emerald-700 mb-1">Engagement Boost</p>
                          <p className="text-sm text-emerald-900">Your engagement is peak at 4 PM. Schedule your hardest subjects then!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <InteractiveSummary role="student" data={{ metrics, prediction: aiInsights }} />
                  </div>
                  <div className="lg:col-span-1">
                    <AITutor 
                      student={student} 
                      metrics={metrics} 
                      user={user} 
                    />
                  </div>
                </div>
              </div>
            )}

            {sectionId === 'resources' && visibleWidgets.resources && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Daily Learning Summary
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Generated</span>
                  </div>
                  <div className="space-y-4">
                    {learningSummary?.summary.map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">{item.subject}</p>
                        <p className="text-sm font-bold text-slate-900">{item.topic}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <MapIcon className="w-5 h-5 text-emerald-500" />
                      Regional Student Insights
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{regionalInsights?.region}</span>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Top Performing Schools</p>
                      <div className="space-y-2">
                        {regionalInsights?.rankings.map((r: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="font-bold text-slate-700">{i + 1}. {r.school}</span>
                            <span className="font-black text-emerald-600">{r.performance}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Upcoming Opportunities</p>
                      <div className="flex flex-wrap gap-2">
                        {regionalInsights?.opportunities.map((o: any, i: number) => (
                          <div key={i} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
                            {o.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Communication Center */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Student Communication Center
          </h3>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">Classmates</span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold uppercase">Teachers</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-[300px] overflow-y-auto space-y-4 p-4 bg-slate-50 rounded-2xl border border-black/5">
              {communications.length > 0 ? communications.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex ${msg.sender_id === user.username ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.sender_id === user.username ? 'bg-black text-white rounded-tr-none' : 'bg-white border border-black/5 rounded-tl-none'
                  }`}>
                    <p className="text-[10px] font-bold opacity-50 mb-1">{msg.sender_id}</p>
                    <p>{msg.content}</p>
                  </div>
                </motion.div>
              )) : (
                <EmptyState 
                  title="No messages yet" 
                  description="Start a conversation with your classmates or teachers."
                  icon={MessageSquare}
                />
              )}
            </div>
            <SafetyScannerWrapper onSend={handleSendMessage} placeholder="Chat with classmates or teachers..." />
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
              <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4">Parent Notes</h4>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-rose-100 italic text-sm text-slate-600">
                  "Good luck on your math test today!"
                </div>
              </div>
            </div>
            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Teacher Notes</h4>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-indigo-100 text-sm text-slate-600">
                  <p className="font-bold text-indigo-600 mb-1">Reminder</p>
                  Don't forget to submit your Science project by Friday.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Check-In & Safety */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <DailyCheckIn 
          studentId={student?.student_id || 'S1001'} 
          onSuccess={async () => {
            const m = await fetchMetrics(student?.student_id || 'S1001');
            onMetricsUpdate(m);
          }} 
        />

        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Safety Reporting Tool
            </h3>
            <p className="text-slate-400 text-sm mb-6">A private and safe channel to report issues or seek help.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {['Bullying', 'Harassment', 'Mental Distress', 'Unsafe Environment'].map((cat) => (
                <button key={cat} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-left transition-all">
                  <span className="text-xs font-bold">{cat}</span>
                </button>
              ))}
            </div>

            <button className="w-full py-3 bg-emerald-500 text-black rounded-xl font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Submit Private Report
            </button>
          </div>
          <LockIcon className="absolute -bottom-8 -right-8 w-48 h-48 text-white/5 rotate-12" />
        </div>
      </div>
      
      </div>
      
      {/* System Manual Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-black/5 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">SWI System Manual</h2>
                  <p className="text-xs text-slate-500">Version 2.5 • Official Documentation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" 
                  download="SWI_Manual.pdf"
                  className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 font-bold text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
                <button 
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-3 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-200 p-4">
              <iframe 
                src="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" 
                className="w-full h-full rounded-2xl shadow-inner border-none"
                title="System Manual"
              />
            </div>

            <div className="p-4 bg-white border-t border-black/5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              © 2026 SWI Wellbeing Intelligence • Confidential & Proprietary
            </div>
          </motion.div>
        </div>
      )}

      {/* Wellbeing Breakdown Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Wellbeing Breakdown</h2>
              <button onClick={() => setShowBreakdown(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-slate-400 rotate-45" />
              </button>
            </div>
            
            <div className="space-y-6">
              {[
                { label: 'Emotional Health', score: avgMood, color: 'bg-rose-500' },
                { label: 'Stress Management', score: 5 - (metrics.reduce((acc, m) => acc + m.stress_score, 0) / (metrics.length || 1)), color: 'bg-indigo-500' },
                { label: 'Sleep Quality', score: (metrics.reduce((acc, m) => acc + m.sleep_hours, 0) / (metrics.length || 1)) / 2, color: 'bg-emerald-500' },
                { label: 'Engagement', score: (metrics.reduce((acc, m) => acc + m.engagement_hours, 0) / (metrics.length || 1)) / 2, color: 'bg-amber-500' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{item.label}</span>
                    <span>{(item.score * 20).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score * 20}%` }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 italic">
              "This breakdown is generated by the SWI AI Core Engine based on your recent activity and check-ins. Use this to identify areas where you might need more support."
            </div>

            <button 
              onClick={() => setShowBreakdown(false)}
              className="w-full py-3 bg-black text-white rounded-xl font-bold"
            >
              Close Breakdown
            </button>
          </motion.div>
        </div>
      )}

      {/* Student Chat Component */}
      <StudentChat user={user} student={student} />

      </motion.div>
    </div>
  );
};

const Eye = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
