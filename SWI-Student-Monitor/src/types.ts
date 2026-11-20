export type UserRole = 'student' | 'parent' | 'teacher' | 'school_admin' | 'district' | 'ministry' | 'counselor';

export interface School {
  id: string;
  name: string;
  district_id: string;
  admin_id: string;
  student_count: number;
  teacher_count: number;
  performance_index: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface District {
  id: string;
  name: string;
  school_count: number;
  student_count: number;
  performance_avg: number;
  performance?: 'A' | 'B' | 'C' | 'D' | 'F';
  compliance?: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface ApprovalRequest {
  id: string;
  requester_id: string;
  requester_role: UserRole;
  target_id: string; // e.g. student_id or school_id
  target_type: 'student' | 'school' | 'teacher';
  type?: string;
  description?: string;
  change_data: any;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  timestamp?: string;
  approved_at?: string;
  approved_by?: string;
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  full_name: string;
  must_change_password: boolean;
  region?: string;
  token?: string;
  is_demo?: boolean;
}

export type GranularRiskLevel = 'Low' | 'Low-Medium' | 'Medium' | 'Medium-High' | 'High';
export type RiskLevel = 'low' | 'low-medium' | 'medium' | 'medium-high' | 'high' | GranularRiskLevel;

export interface Student {
  id: number;
  student_id: string;
  name: string;
  class_grade: string;
  class_id?: string;
  school_id: string;
  district_id: string;
  risk_level: RiskLevel;
  program: string;
  region?: string;
  email?: string;
  photo_url?: string;
  phone?: string;
  academic_standing?: 'Excellent' | 'Good' | 'Fair' | 'At Risk';
  achievements?: string[];
  guardian_name?: string;
  guardian_contact?: string;
  behavioral_drift?: string;
  attendance_rate?: number;
}

export interface ContributingFactor {
  id: string;
  factor_name: string;
  category: 'academic_trend' | 'check_in_frequency' | 'module_completion' | 'wellbeing' | 'attendance' | 'environment';
  impact: 'critical_risk' | 'moderate_risk' | 'minor_concern' | 'protective_factor';
  weight_percentage: number;
  score: number;
  headline: string;
  detail: string;
}

export interface HistoricalPerformanceTrend {
  trajectory: 'declining' | 'improving' | 'stable' | 'volatile';
  recent_grade_avg: number;
  baseline_grade_avg: number;
  delta_pct: number;
  failing_subjects_count: number;
  recent_subjects: Array<{ subject: string; score: number; trend: 'up' | 'down' | 'stable' }>;
  historical_points: Array<{ date: string; avg_score: number }>;
}

export interface CheckInFrequencyData {
  total_check_ins_30d: number;
  expected_check_ins_30d: number;
  check_in_consistency_pct: number;
  weekly_frequency: number;
  days_since_last_check_in: number;
  streak_days: number;
  frequency_status: 'Regular (Daily)' | 'Consistent' | 'Sporadic' | 'Critically Inactive';
  weekly_distribution: Array<{ week: string; count: number }>;
}

export interface SpecificModuleRate {
  module_id: string;
  name: string;
  category: string;
  completion_rate: number;
  status: 'completed' | 'in_progress' | 'lagging' | 'not_started';
  last_activity?: string;
}

export interface ModuleCompletionData {
  overall_completion_avg: number;
  lagging_modules_count: number;
  completed_modules_count: number;
  in_progress_count: number;
  modules: SpecificModuleRate[];
}

export interface RiskAssessmentResult {
  student_id: string;
  student_name: string;
  risk_score: number;
  risk_level: GranularRiskLevel;
  confidence: number;
  trend: 'improving' | 'stable' | 'warning' | 'declining';
  explanation: string;
  clinical_summary: string;
  forecast: string;
  key_contributing_factors: ContributingFactor[];
  data_points: {
    historical_performance: HistoricalPerformanceTrend;
    check_in_frequency: CheckInFrequencyData;
    module_completion_rates: ModuleCompletionData;
    wellbeing_metrics: {
      attendance_rate: number;
      avg_mood: number;
      avg_stress: number;
      avg_sleep: number;
      avg_engagement_hours: number;
      mood_volatility: number;
    };
  };
  recommended_interventions: string[];
  learning_environment?: string;
  evaluated_at: string;
  ai_synthesis?: string;
}

export interface AIInteraction {
  id?: string;
  student_id: string;
  user_query: string;
  ai_response: string;
  timestamp: any;
  context_summary?: string;
  rating?: number; // 1-5
  is_helpful?: boolean;
  type?: string;
}

export interface IncidentReport {
  id: string;
  student_id: string;
  category: 'bullying' | 'absenteeism' | 'substance_abuse' | 'behavioral' | 'other';
  description: string;
  reported_by: string;
  timestamp: string;
  status: 'open' | 'closed' | 'escalated';
  type: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Metric {
  id: string | number;
  student_id: string;
  date: any; // Can be string or Firestore Timestamp
  mood_score: number;
  stress_score: number;
  attendance: number;
  engagement_hours: number;
  module_completion: number;
  journal_text: string;
  sleep_hours: number;
  extracurricular_participation: string;
  self_reported_wellbeing: number;
  behavior_patterns: string;
  participation_score?: number;
}

export interface SecurityScan {
  timestamp: string;
  status: string;
  metrics: {
    mfa_status: number;
    vulnerable_ports: number;
    stress_test_accuracy: number;
    response_time: string;
    risk_level: string;
  };
}

export interface Communication {
  id: string;
  student_id: string;
  sender_id: string;
  receiver_id: string;
  visibility: 'private_note' | 'shared_log' | 'student_direct';
  content: string;
  is_reviewed: number;
  reviewed_by?: string;
  timestamp: string;
}

export interface Incident {
  id: string;
  student_id: string;
  category: 'bullying' | 'absenteeism' | 'substance_abuse' | 'behavioral' | 'other';
  description: string;
  reported_by: string;
  date: string;
  status: string;
}

export interface StudentUpdate {
  id?: string;
  student_id: string;
  attendance: string;
  wellbeing: number;
  note: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  content: string;
  timestamp: any;
  read: boolean;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  friend_name: string;
  status: 'pending' | 'accepted';
  timestamp: any;
}
