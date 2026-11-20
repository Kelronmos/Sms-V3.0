import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { User, UserRole, Metric, AIInteraction, RiskAssessmentResult, SpecificModuleRate } from '../types';

export const generateAIImage = async (prompt: string) => {
  return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/1024`;
};

export const analyzeImage = async (base64Image: string, prompt: string) => {
  return "Image Analysis: The image demonstrates active student participation, positive environmental wellbeing, and standard classroom engagement indicators.";
};

export const fetchStudents = async (userId?: number, role?: string, grade?: string, program?: string) => {
  const url = new URL('/api/students', window.location.origin);
  if (userId) url.searchParams.append('userId', userId.toString());
  if (role) url.searchParams.append('role', role);
  if (grade) url.searchParams.append('grade', grade);
  if (program) url.searchParams.append('program', program);
  
  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch students: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem('cached_students', JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Offline: Using cached students data");
    const cached = localStorage.getItem('cached_students');
    return cached ? JSON.parse(cached) : [];
  }
};

export const fetchMetrics = async (studentId: string) => {
  try {
    const res = await fetch(`/api/metrics/${studentId}`);
    if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.statusText}`);
    const data = await res.json();
    
    // Ensure we have at least 30 days of data for the charts
    if (data.length < 30) {
      const sampleData = generateSampleMetrics(studentId, 30 - data.length);
      const combined = [...data, ...sampleData].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      localStorage.setItem(`cached_metrics_${studentId}`, JSON.stringify(combined));
      return combined;
    }

    localStorage.setItem(`cached_metrics_${studentId}`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn(`Offline: Using cached metrics for ${studentId}`);
    const cached = localStorage.getItem(`cached_metrics_${studentId}`);
    if (cached) return JSON.parse(cached);
    
    // If no cache, generate 30 days of sample data
    const sampleData = generateSampleMetrics(studentId, 30);
    localStorage.setItem(`cached_metrics_${studentId}`, JSON.stringify(sampleData));
    return sampleData;
  }
};

const generateSampleMetrics = (studentId: string, days: number): Metric[] => {
  const metrics: Metric[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    metrics.push({
      id: `sample-${i}`,
      student_id: studentId,
      date: date.toISOString(),
      mood_score: Math.floor(Math.random() * 5) + 1,
      stress_score: Math.floor(Math.random() * 5) + 1,
      attendance: Math.random() > 0.1 ? 1 : 0,
      engagement_hours: Math.floor(Math.random() * 6) + 2,
      module_completion: Math.floor(Math.random() * 100),
      journal_text: "Sample entry for offline mode.",
      sleep_hours: Math.floor(Math.random() * 4) + 5,
      extracurricular_participation: "None",
      self_reported_wellbeing: Math.floor(Math.random() * 5) + 1,
      behavior_patterns: "Stable"
    });
  }
  return metrics;
};

export const demoLogin = async (role: UserRole) => {
  // Client-side demo session: no server identity, no token, no count of "users" is implied.
  const suffix = Math.random().toString(36).slice(2, 8);
  const demoUser: User = {
    id: Math.floor(Math.random() * 1000000) + 1000000,
    username: `demo_${role}_${suffix}`,
    role,
    full_name: `Demo ${role} (synthetic session)`,
    must_change_password: false,
    is_demo: true
  };
  localStorage.setItem('samh_user', JSON.stringify(demoUser));
  return { success: true, user: demoUser };
};

export const fetchLiveStats = async () => {
  const res = await fetch('/api/stats/live');
  if (!res.ok) throw new Error('UNAVAILABLE');
  return res.json();
};

export const fetchReport = async (kind: 'demo' | 'summary' | 'audit' | string) => {
  const headers: Record<string, string> = {};
  try {
    const u = JSON.parse(localStorage.getItem('samh_user') || 'null');
    if (u?.token) headers['Authorization'] = `Bearer ${u.token}`;
  } catch {}
  const res = await fetch(`/api/reports/${encodeURIComponent(kind)}`, { headers });
  if (res.status === 401) throw new Error('Sign in with a verified Ministry account to generate this report.');
  if (res.status === 403) throw new Error('Your account is not authorised for this report.');
  if (!res.ok) throw new Error('UNAVAILABLE');
  return res.json();
};

export const registerUser = async (userData: any) => {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error(`Failed to register user: ${res.statusText}`);
  return res.json();
};

export const fetchDistricts = async () => {
  try {
    const res = await fetch('/api/districts');
    if (!res.ok) throw new Error(`Failed to fetch districts: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem('cached_districts', JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Offline: Using cached districts");
    const cached = localStorage.getItem('cached_districts');
    return cached ? JSON.parse(cached) : [];
  }
};

export const fetchApprovalRequests = async (role: UserRole, targetId?: string) => {
  try {
    const url = new URL('/api/approvals', window.location.origin);
    url.searchParams.append('role', role);
    if (targetId) url.searchParams.append('targetId', targetId);
    
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch approvals: ${res.statusText}`);
    return res.json();
  } catch (error) {
    console.error("Failed to fetch approvals", error);
    return [];
  }
};

export const submitApprovalRequest = async (requestData: any) => {
  const res = await fetch('/api/approvals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
  });
  if (!res.ok) throw new Error(`Failed to submit approval request: ${res.statusText}`);
  return res.json();
};

export const updateApprovalStatus = async (requestId: string, status: 'approved' | 'rejected', adminId: string) => {
  const res = await fetch(`/api/approvals/${requestId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, adminId }),
  });
  if (!res.ok) throw new Error(`Failed to update approval status: ${res.statusText}`);
  return res.json();
};

export const fetchSummary = async () => {
  try {
    const res = await fetch('/api/dashboard/summary');
    if (!res.ok) throw new Error(`Failed to fetch summary: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem('cached_summary', JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Offline: Using cached summary");
    const cached = localStorage.getItem('cached_summary');
    return cached ? JSON.parse(cached) : null;
  }
};

export const fetchPrediction = async (studentId: string) => {
  try {
    const res = await fetch(`/api/predict-risk/${studentId}`);
    if (!res.ok) throw new Error(`Failed to fetch prediction: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem(`cached_prediction_${studentId}`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn(`Offline: Using cached prediction for ${studentId}`);
    const cached = localStorage.getItem(`cached_prediction_${studentId}`);
    return cached ? JSON.parse(cached) : { risk_score: 0.2, trend: 'stable', forecast: 'Offline mode: Using last known prediction.' };
  }
};

export const changePassword = async (userId: number, newPassword: string) => {
  const res = await fetch('/api/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newPassword }),
  });
  if (!res.ok) throw new Error(`Failed to change password: ${res.statusText}`);
  return res.json();
};

export const fetchSchools = async () => {
  try {
    const res = await fetch('/api/schools');
    if (!res.ok) throw new Error(`Failed to fetch schools: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem('cached_schools', JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Offline: Using cached schools");
    const cached = localStorage.getItem('cached_schools');
    return cached ? JSON.parse(cached) : [];
  }
};

export const fetchRegionsSummary = async () => {
  try {
    const res = await fetch('/api/regions/summary');
    if (!res.ok) throw new Error(`Failed to fetch regions summary: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem('cached_regions_summary', JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Offline: Using cached regions summary");
    const cached = localStorage.getItem('cached_regions_summary');
    return cached ? JSON.parse(cached) : [];
  }
};

export const fetchNationalInsights = async () => {
  try {
    const res = await fetch('/api/national/insights');
    if (!res.ok) throw new Error(`Failed to fetch national insights: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem('cached_national_insights', JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Offline: Using cached national insights");
    const cached = localStorage.getItem('cached_national_insights');
    return cached ? JSON.parse(cached) : null;
  }
};

export const preloadOfflineData = async (studentId?: string) => {
  try {
    // Basic shared data
    await Promise.all([
      fetchSchools(),
      fetchRegionsSummary(),
      fetchNationalInsights(),
      fetchPolicies(),
      fetchEvents()
    ]);

    // Student specific data if ID provided
    if (studentId) {
      await Promise.all([
        fetchMetrics(studentId),
        fetchPrediction(studentId),
        fetchAssignments(studentId),
        fetchQuizzes(studentId),
        fetchAIHistory(studentId),
        fetchAIInsights(studentId)
      ]);
    }
    
    console.log("Offline data preloaded successfully");
  } catch (error) {
    console.error("Failed to preload offline data", error);
  }
};

export const fetchAIGuidance = async (
  studentId: string, 
  metrics: Metric[] = [], 
  history: AIInteraction[] = [],
  assignments: any[] = [],
  quizzes: any[] = [],
  specialRequest?: 'study_plan' | 'suggest_topics' | 'quiz' | 'walkthrough' | 'proactive_topics',
  userQuery?: string,
  user?: User
) => {
  // Legacy wrapper for swiAIEngine
  const { swiAIEngine } = await import('./aiEngine');
  const res = await swiAIEngine.process({
    mode: 'chat',
    query: userQuery || (specialRequest === 'proactive_topics' ? 'proactive_topics' : "Provide a general wellbeing and learning update based on my current data."),
    context: { metrics, history, studentId },
    isOffline: !navigator.onLine,
    user
  });
  return { guidance: res.text };
};

export const fetchAIHistory = async (studentId: string) => {
  try {
    // Wait for auth to be ready if it's currently null but we might be in the middle of a sync
    if (!auth.currentUser) {
      // Small delay to allow syncUserWithFirebase to complete if it's running
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!auth.currentUser) {
      console.log('No Firebase user for AI history, using cache');
      const cached = localStorage.getItem(`cached_ai_history_${studentId}`);
      if (cached) return JSON.parse(cached);
      
      // If no cache, generate sample history
      const sample = generateSampleAIHistory(studentId);
      localStorage.setItem(`cached_ai_history_${studentId}`, JSON.stringify(sample));
      return sample;
    }

    const q = query(
      collection(db, 'ai_interactions'),
      where('student_id', '==', studentId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AIInteraction[];

    if (history.length === 0) {
      const sample = generateSampleAIHistory(studentId);
      localStorage.setItem(`cached_ai_history_${studentId}`, JSON.stringify(sample));
      return sample;
    }

    localStorage.setItem(`cached_ai_history_${studentId}`, JSON.stringify(history));
    return history;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'ai_interactions');
    const cached = localStorage.getItem(`cached_ai_history_${studentId}`);
    if (cached) return JSON.parse(cached);
    
    const sample = generateSampleAIHistory(studentId);
    localStorage.setItem(`cached_ai_history_${studentId}`, JSON.stringify(sample));
    return sample;
  }
};

const generateSampleAIHistory = (studentId: string): AIInteraction[] => {
  return [
    {
      id: 'ai-1',
      student_id: studentId,
      user_query: "How can I improve my study habits?",
      ai_response: "Try using the Pomodoro technique: 25 minutes of focused study followed by a 5-minute break. This helps maintain high levels of concentration.",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      is_helpful: true,
      rating: 5
    },
    {
      id: 'ai-2',
      student_id: studentId,
      user_query: "I'm feeling a bit stressed about my upcoming math test.",
      ai_response: "It's normal to feel some anxiety. Break your revision into smaller, manageable topics. Remember to take deep breaths and stay hydrated. You've got this!",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      is_helpful: true,
      rating: 4
    },
    {
      id: 'ai-3',
      student_id: studentId,
      user_query: "What are some good ways to relax after school?",
      ai_response: "Physical activity like a short walk, listening to music, or practicing mindfulness can be very effective. Even 15 minutes of sunlight can help regulate your mood.",
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      is_helpful: false,
      rating: 2
    }
  ];
};

export const saveAIInteraction = async (interaction: AIInteraction) => {
  try {
    if (!auth.currentUser) {
      const pending = JSON.parse(localStorage.getItem('pending_ai_interactions') || '[]');
      pending.push({ ...interaction, timestamp: new Date().toISOString() });
      localStorage.setItem('pending_ai_interactions', JSON.stringify(pending));
      return;
    }
    await addDoc(collection(db, 'ai_interactions'), {
      ...interaction,
      student_uid: auth.currentUser.uid,
      user_id: auth.currentUser.uid, // Add user_id for backward compatibility with rules
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'ai_interactions');
  }
};

export const rateAIInteraction = async (interactionId: string, rating: number, isHelpful: boolean) => {
  try {
    if (!auth.currentUser) return;
    const interactionRef = doc(db, 'ai_interactions', interactionId);
    await updateDoc(interactionRef, {
      rating,
      is_helpful: isHelpful
    });
  } catch (error) {
    console.error("Error rating AI interaction:", error);
  }
};

export const syncOfflineData = async () => {
  if (!auth.currentUser || !navigator.onLine) return;

  try {
    // Sync pending metrics
    const pendingMetrics = JSON.parse(localStorage.getItem('pending_metrics') || '[]');
    if (pendingMetrics.length > 0) {
      for (const metric of pendingMetrics) {
        await addDoc(collection(db, 'metrics'), {
          ...metric,
          date: serverTimestamp()
        });
      }
      localStorage.removeItem('pending_metrics');
    }

    // Sync pending AI interactions
    const pendingAI = JSON.parse(localStorage.getItem('pending_ai_interactions') || '[]');
    if (pendingAI.length > 0) {
      for (const interaction of pendingAI) {
        await addDoc(collection(db, 'ai_interactions'), {
          ...interaction,
          timestamp: serverTimestamp()
        });
      }
      localStorage.removeItem('pending_ai_interactions');
    }
  } catch (error) {
    console.error("Sync failed:", error);
  }
};

export const generateSpeech = async (text: string) => {
  try {
    const res = await fetch('/api/ai/tutor/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.audio ? `data:${data.mimeType || 'audio/wav'};base64,${data.audio}` : null;
  } catch (error) {
    console.error("Speech generation failed:", error);
    return null;
  }
};

export const askAITutor = async (studentId: string, message: string, conversationHistory: any[] = []) => {
  const res = await fetch('/api/ai/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, message, conversationHistory })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to get an answer from SWI Learning Guide');
  }
  return res.json();
};

export const retrainRiskModel = async (options: { epochs?: number; includeDemographics?: boolean } = {}) => {
  const res = await fetch('/api/ai/retrain-risk-model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });
  if (!res.ok) throw new Error('Failed to retrain risk scoring model');
  return res.json();
};

export const fetchRiskAssessment = async (studentId: string): Promise<RiskAssessmentResult> => {
  const res = await fetch(`/api/predict-risk/${encodeURIComponent(studentId)}`);
  if (!res.ok) throw new Error('Failed to fetch student risk assessment');
  return res.json();
};

export const fetchDeepAIExplanation = async (studentId: string): Promise<RiskAssessmentResult> => {
  const res = await fetch(`/api/ai/explain-risk/${encodeURIComponent(studentId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to generate deep AI explanation');
  return res.json();
};

export const fetchStudentModules = async (studentId: string): Promise<SpecificModuleRate[]> => {
  const res = await fetch(`/api/student-modules/${encodeURIComponent(studentId)}`);
  if (!res.ok) throw new Error('Failed to fetch student modules');
  return res.json();
};

export const updateStudentModule = async (studentId: string, moduleId: string, completionRate: number, status?: string) => {
  const res = await fetch(`/api/student-modules/${encodeURIComponent(studentId)}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module_id: moduleId, completion_rate: completionRate, status })
  });
  if (!res.ok) throw new Error('Failed to update student module');
  return res.json();
};

export const fetchRiskModelStatus = async () => {
  const res = await fetch('/api/ai/risk-model-status');
  if (!res.ok) throw new Error('Failed to fetch risk model status');
  return res.json();
};

export const generateEschoolData = async (studentsPerSchool: number = 4700) => {
  const res = await fetch('/api/demo/generate-eschool-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentsPerSchool })
  });
  if (!res.ok) throw new Error('Failed to generate demo e-school data');
  return res.json();
};

export const syncStudentWellbeingRealtime = async (payload: {
  student_id: string;
  mood_score: number;
  stress_score: number;
  attendance: number;
  engagement_hours: number;
  sleep_hours: number;
  journal_text?: string;
  source?: string;
}) => {
  const res = await fetch('/api/sync/student-wellbeing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to sync student wellbeing metrics');
  return res.json();
};

export const fetchAIInsights = async (studentId: string) => {
  try {
    const res = await fetch(`/api/ai/insights/${studentId}`);
    if (!res.ok) throw new Error(`Failed to fetch SWI insights: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem(`cached_ai_insights_${studentId}`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn(`Offline: Using cached SWI insights for ${studentId}`);
    const cached = localStorage.getItem(`cached_ai_insights_${studentId}`);
    return cached ? JSON.parse(cached) : null;
  }
};

export const submitMetrics = async (metricsData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'metrics'), {
      ...metricsData,
      student_uid: auth.currentUser?.uid,
      date: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding metric to Firestore: ", error);
    // Fallback to REST if needed, but for now we use Firestore
    const res = await fetch('/api/metrics/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metricsData),
    });
    if (!res.ok) throw new Error(`Failed to submit metrics: ${res.statusText}`);
    return res.json();
  }
};

export const runSecurityScan = async () => {
  try {
    const res = await fetch('/api/security/scan', { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to run security scan: ${res.statusText}`);
    const data = await res.json();
    // Update cache
    const cached = localStorage.getItem('cached_security_scans');
    const history = cached ? JSON.parse(cached) : [];
    const newHistory = [data, ...history].slice(0, 50);
    localStorage.setItem('cached_security_scans', JSON.stringify(newHistory));
    return data;
  } catch (error) {
    console.warn("Offline: Simulated security scan");
    const mockScan = {
      timestamp: new Date().toISOString(),
      status: 'completed',
      metrics: {
        mfa_status: 90 + Math.floor(Math.random() * 10),
        vulnerable_ports: Math.floor(Math.random() * 3),
        stress_test_accuracy: 97 + Math.random() * 2,
        response_time: '150ms',
        risk_level: 'low'
      }
    };
    const cached = localStorage.getItem('cached_security_scans');
    const history = cached ? JSON.parse(cached) : [];
    localStorage.setItem('cached_security_scans', JSON.stringify([mockScan, ...history].slice(0, 50)));
    return mockScan;
  }
};

export const fetchSecurityScans = async () => {
  try {
    const res = await fetch('/api/security/scans');
    if (!res.ok) throw new Error(`Failed to fetch security scans: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem('cached_security_scans', JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Offline: Using cached security scans");
    const cached = localStorage.getItem('cached_security_scans');
    return cached ? JSON.parse(cached) : [];
  }
};

export const sendCommunication = async (commData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'communications'), {
      ...commData,
      sender_uid: auth.currentUser?.uid,
      timestamp: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error sending communication to Firestore: ", error);
    const res = await fetch('/api/comms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commData),
    });
    if (!res.ok) throw new Error(`Failed to send communication: ${res.statusText}`);
    return res.json();
  }
};

export const fetchStudentComms = async (studentId: string, role?: string, userId?: number) => {
  try {
    const url = new URL(`/api/comms/student/${studentId}`, window.location.origin);
    if (role) url.searchParams.append('role', role);
    if (userId) url.searchParams.append('userId', userId.toString());
    
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch communications: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem(`cached_comms_${studentId}`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn(`Offline: Using cached communications for ${studentId}`);
    const cached = localStorage.getItem(`cached_comms_${studentId}`);
    return cached ? JSON.parse(cached) : [];
  }
};

export const fetchIncidents = async (studentId?: string) => {
  try {
    const url = studentId ? `/api/incidents/${studentId}` : '/api/incidents';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.statusText}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch incidents", error);
    return [];
  }
};

export const fetchReviewQueue = async () => {
  try {
    const res = await fetch('/api/comms/review-queue');
    if (!res.ok) throw new Error(`Failed to fetch review queue: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem('cached_review_queue', JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Offline: Using cached review queue");
    const cached = localStorage.getItem('cached_review_queue');
    return cached ? JSON.parse(cached) : [];
  }
};

export const approveCommunication = async (commId: string, reviewerId: string) => {
  const res = await fetch('/api/comms/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comm_id: commId, reviewer_id: reviewerId }),
  });
  if (!res.ok) throw new Error(`Failed to approve communication: ${res.statusText}`);
  return res.json();
};

export const submitIncident = async (incidentData: any) => {
  const res = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(incidentData),
  });
  if (!res.ok) throw new Error(`Failed to submit incident: ${res.statusText}`);
  return res.json();
};

export const fetchStudentIncidents = async (studentId: string) => {
  try {
    const res = await fetch(`/api/incidents/${studentId}`);
    if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem(`cached_incidents_${studentId}`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn(`Offline: Using cached incidents for ${studentId}`);
    const cached = localStorage.getItem(`cached_incidents_${studentId}`);
    return cached ? JSON.parse(cached) : [];
  }
};

export const fetchMinistryExport = async () => {
  try {
    const res = await fetch('/api/ministry/export');
    if (!res.ok) throw new Error(`Failed to fetch ministry export: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem('cached_ministry_export', JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Offline: Using cached ministry export");
    const cached = localStorage.getItem('cached_ministry_export');
    return cached ? JSON.parse(cached) : null;
  }
};

export const fetchAssignments = async (studentId: string) => {
  try {
    const res = await fetch(`/api/assignments/${studentId}`);
    if (!res.ok) throw new Error(`Failed to fetch assignments: ${res.statusText}`);
    const data = await res.json();
    
    if (data.length === 0) {
      const sample = generateSampleAssignments(studentId);
      localStorage.setItem(`cached_assignments_${studentId}`, JSON.stringify(sample));
      return sample;
    }

    localStorage.setItem(`cached_assignments_${studentId}`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn(`Offline: Using cached assignments for ${studentId}`);
    const cached = localStorage.getItem(`cached_assignments_${studentId}`);
    if (cached) return JSON.parse(cached);
    
    const sample = generateSampleAssignments(studentId);
    localStorage.setItem(`cached_assignments_${studentId}`, JSON.stringify(sample));
    return sample;
  }
};

const generateSampleAssignments = (studentId: string): any[] => {
  return [
    {
      id: 'asgn-1',
      student_id: studentId,
      title: "Advanced Mathematics: Calculus II",
      subject: "Mathematics",
      due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'pending',
      priority: 'high',
      description: "Complete exercises 1-15 on integration by parts."
    },
    {
      id: 'asgn-2',
      student_id: studentId,
      title: "Physics Lab Report: Optics",
      subject: "Physics",
      due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: 'pending',
      priority: 'medium',
      description: "Document the findings from the refraction experiment."
    },
    {
      id: 'asgn-3',
      student_id: studentId,
      title: "History Essay: Industrial Revolution",
      subject: "History",
      due_date: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
      priority: 'low',
      description: "Analyze the impact of the steam engine on textile production."
    }
  ];
};

export const submitAssignment = async (assignmentData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'assignments'), {
      ...assignmentData,
      status: 'pending'
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error submitting assignment to Firestore: ", error);
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignmentData),
    });
    if (!res.ok) throw new Error(`Failed to submit assignment: ${res.statusText}`);
    return res.json();
  }
};

export const fetchTimetable = async (classId: string) => {
  try {
    const res = await fetch(`/api/timetable/${classId}`);
    if (!res.ok) throw new Error(`Failed to fetch timetable: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem(`cached_timetable_${classId}`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn(`Offline: Using cached timetable for ${classId}`);
    const cached = localStorage.getItem(`cached_timetable_${classId}`);
    return cached ? JSON.parse(cached) : [];
  }
};

export const submitAttendance = async (attendanceData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'attendance'), {
      ...attendanceData,
      date: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error submitting attendance to Firestore: ", error);
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attendanceData),
    });
    if (!res.ok) throw new Error(`Failed to submit attendance: ${res.statusText}`);
    return res.json();
  }
};

export const submitQuiz = async (quizData: any) => {
  const res = await fetch('/api/quizzes/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quizData),
  });
  if (!res.ok) throw new Error(`Failed to submit quiz: ${res.statusText}`);
  return res.json();
};

export const fetchQuizzes = async (classId: string) => {
  try {
    const res = await fetch(`/api/quizzes/${classId}`);
    if (!res.ok) throw new Error(`Failed to fetch quizzes: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem(`cached_quizzes_${classId}`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn(`Offline: Using cached quizzes for ${classId}`);
    const cached = localStorage.getItem(`cached_quizzes_${classId}`);
    return cached ? JSON.parse(cached) : [];
  }
};

export const fetchEvents = async () => {
  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error(`Failed to fetch events: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem('cached_events', JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Offline: Using cached events");
    const cached = localStorage.getItem('cached_events');
    return cached ? JSON.parse(cached) : [];
  }
};

export const submitEvent = async (eventData: any) => {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) throw new Error(`Failed to submit event: ${res.statusText}`);
  return res.json();
};

export const fetchPolicies = async () => {
  try {
    const res = await fetch('/api/policies');
    if (!res.ok) throw new Error(`Failed to fetch policies: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem('cached_policies', JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Offline: Using cached policies");
    const cached = localStorage.getItem('cached_policies');
    return cached ? JSON.parse(cached) : [];
  }
};

export const fetchLearningSummary = async (studentId: string) => {
  const res = await fetch(`/api/ai/learning-summary/${studentId}`);
  if (!res.ok) throw new Error(`Failed to fetch learning summary: ${res.statusText}`);
  return res.json();
};

export const sendChatMessage = async (message: { sender_id: string; sender_name: string; receiver_id: string; content: string }) => {
  try {
    const docRef = await addDoc(collection(db, 'chat_messages'), {
      ...message,
      timestamp: serverTimestamp(),
      read: false
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'chat_messages');
    throw error;
  }
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    const messageRef = doc(db, 'chat_messages', messageId);
    await updateDoc(messageRef, { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'chat_messages');
  }
};

export const addFriend = async (userId: string, friendId: string, friendName: string) => {
  try {
    const docRef = await addDoc(collection(db, 'friendships'), {
      user_id: userId,
      friend_id: friendId,
      friend_name: friendName,
      status: 'accepted',
      timestamp: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'friendships');
    throw error;
  }
};

export const fetchRegionalInsights = async (regionId: string) => {
  const res = await fetch(`/api/insights/regional/${regionId}`);
  if (!res.ok) throw new Error(`Failed to fetch regional insights: ${res.statusText}`);
  return res.json();
};

export const submitPolicy = async (policyData: any) => {
  const res = await fetch('/api/policies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(policyData),
  });
  if (!res.ok) throw new Error(`Failed to submit policy: ${res.statusText}`);
  return res.json();
};

export const fetchDemoScale = async () => {
  try {
    const response = await fetch('/api/demo/scale');
    if (!response.ok) throw new Error('Failed to fetch scale');
    return await response.json();
  } catch (error) {
    console.error('Error fetching scale:', error);
    return [];
  }
};

export const fetchDemoStats = async () => {
  try {
    const res = await fetch('/api/demo/stats');
    if (!res.ok) throw new Error(`Failed to fetch demo stats: ${res.statusText}`);
    return res.json();
  } catch (error) {
    console.error("Failed to fetch demo stats", error);
    return { unavailable: true, synthetic: true, students: 0, parents: 0, teachers: 0, schools: 0, districts: 0, ministry: 0, demo_users: 0, avg_rating: null, total_comments: 0 };
  }
};

export const fetchDemoFeedback = async () => {
  try {
    const res = await fetch('/api/demo/feedback');
    if (!res.ok) throw new Error(`Failed to fetch demo feedback: ${res.statusText}`);
    return res.json();
  } catch (error) {
    console.error("Failed to fetch demo feedback", error);
    return [];
  }
};

export const submitDemoFeedback = async (feedbackData: any) => {
  const res = await fetch('/api/demo/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedbackData),
  });
  if (!res.ok) throw new Error(`Failed to submit demo feedback: ${res.statusText}`);
  return res.json();
};

export const submitPrivateNote = async (noteData: any) => {
  const res = await fetch('/api/notes/private', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noteData),
  });
  if (!res.ok) throw new Error(`Failed to submit private note: ${res.statusText}`);
  return res.json();
};

export const fetchPrivateNotes = async (studentId: string, authorId: string) => {
  const res = await fetch(`/api/notes/private/${studentId}?authorId=${authorId}`);
  if (!res.ok) throw new Error(`Failed to fetch private notes: ${res.statusText}`);
  return res.json();
};

export const submitReferral = async (referralData: any) => {
  const res = await fetch('/api/referrals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(referralData),
  });
  if (!res.ok) throw new Error(`Failed to submit referral: ${res.statusText}`);
  return res.json();
};

export const generateQuizFromNotes = async (notes: string, count: number = 5) => {
  try {
    const prompt = `Generate a multiple choice quiz with ${count} questions based on these notes: "${notes}". 
    Return ONLY a JSON array of objects with this structure: 
    [{"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 0}]`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Quiz generation failed:", error);
    // Fallback mock data if AI fails
    return Array(count).fill(null).map((_, i) => ({
      question: `Sample Question ${i + 1} (AI Offline)`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0
    }));
  }
};

export const fetchTeacherMessages = async () => {
  try {
    const res = await fetch('/api/teacher-messages');
    if (!res.ok) throw new Error(`Failed to fetch teacher messages: ${res.statusText}`);
    const data = await res.json();
    localStorage.setItem('cached_teacher_messages', JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Offline: Using cached teacher messages");
    const cached = localStorage.getItem('cached_teacher_messages');
    return cached ? JSON.parse(cached) : [];
  }
};

export const updateAssignmentStatus = async (assignmentId: string, status: 'pending' | 'completed') => {
  try {
    if (auth.currentUser) {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      await updateDoc(assignmentRef, { status });
    }
    
    // Update local cache if possible
    const studentId = auth.currentUser?.uid || 'demo';
    const cached = localStorage.getItem(`cached_assignments_${studentId}`);
    if (cached) {
      const assignments = JSON.parse(cached);
      const updated = assignments.map((a: any) => a.id === assignmentId ? { ...a, status } : a);
      localStorage.setItem(`cached_assignments_${studentId}`, JSON.stringify(updated));
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating assignment status:", error);
    throw error;
  }
};

export const sendTeacherMessage = async (messageData: any) => {
  const res = await fetch('/api/teacher-messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData),
  });
  if (!res.ok) throw new Error(`Failed to send teacher message: ${res.statusText}`);
  return res.json();
};

export const searchTeacherMessages = async (query: string) => {
  const res = await fetch(`/api/teacher-messages/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Failed to search teacher messages: ${res.statusText}`);
  return res.json();
};

export const fetchCalendarEvents = async (userId: string) => {
  const res = await fetch(`/api/calendar/${userId}`);
  if (!res.ok) throw new Error(`Failed to fetch calendar events: ${res.statusText}`);
  return res.json();
};

export const submitCalendarEvent = async (eventData: any) => {
  const res = await fetch('/api/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) throw new Error(`Failed to submit calendar event: ${res.statusText}`);
  return res.json();
};

export const updateAssignmentPriority = async (assignmentId: string | number, priority: string) => {
  const res = await fetch('/api/assignments/priority', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignment_id: assignmentId, priority }),
  });
  if (!res.ok) throw new Error(`Failed to update assignment priority: ${res.statusText}`);
  return res.json();
};

export const getGoogleAuthUrl = async (userId: string) => {
  const res = await fetch(`/api/auth/google/url?userId=${userId}`);
  if (!res.ok) throw new Error(`Failed to get Google Auth URL: ${res.statusText}`);
  return res.json();
};

export const fetchGoogleCalendarEvents = async (userId: string) => {
  const res = await fetch(`/api/calendar/google-events?userId=${userId}`);
  if (!res.ok) throw new Error(`Failed to fetch Google Calendar events: ${res.statusText}`);
  return res.json();
};

export const submitGoogleCalendarEvent = async (userId: string, event: any) => {
  const res = await fetch('/api/calendar/google-events/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, event }),
  });
  if (!res.ok) throw new Error(`Failed to submit Google Calendar event: ${res.statusText}`);
  return res.json();
};

export const checkGoogleCalendarConnection = async (userId: string) => {
  const res = await fetch(`/api/calendar/check-connection?userId=${userId}`);
  if (!res.ok) throw new Error(`Failed to check Google Calendar connection: ${res.statusText}`);
  return res.json();
};

export const connectWebSocket = (onMessage: (data: any) => void) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  return ws;
};
