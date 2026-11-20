import { Timestamp } from 'firebase/firestore';
import { auth } from '../firebase';
import { Metric, AIInteraction, User, UserRole, StudentUpdate } from '../types';

export type AIMode = 'chat' | 'pa' | 'doc_analysis' | 'image_gen' | 'image_analysis';
export type UserLevel = 'admin' | 'manager' | 'standard' | 'demo';

const roleToLevel: Record<UserRole, UserLevel> = {
  'ministry': 'admin',
  'district': 'admin',
  'school_admin': 'admin',
  'counselor': 'manager',
  'teacher': 'manager',
  'student': 'standard',
  'parent': 'standard'
};

interface EngineRequest {
  mode: AIMode;
  query: string;
  user?: User & { isAnonymous?: boolean };
  systemInstruction?: string;
  context?: {
    metrics?: Metric[];
    history?: AIInteraction[];
    documentText?: string;
    studentId?: string;
  };
  isOffline?: boolean;
}

interface EngineResponse {
  text: string;
  mode: AIMode;
  timestamp: string;
  isOfflineResponse: boolean;
  accessDenied?: boolean;
}

/**
 * SWI Level-10 Intelligence Modules
 * Translated from Ronald Mosidila Architecture
 */

export type GranularRiskStatus = 'Low' | 'Low-Medium' | 'Medium' | 'Medium-High' | 'High';

class PredictiveEngine {
  predictRisk(
    academic: number, 
    behavior: number, 
    stress: number,
    options: {
      historicalTrend?: number; // e.g. -1 to 1 (negative is declining)
      checkInConsistency?: number; // 0 to 1
      moduleCompletion?: number; // 0 to 1
    } = {}
  ) {
    const historicalTrendRisk = options.historicalTrend !== undefined 
      ? Math.max(0, Math.min(1, 0.5 - (options.historicalTrend * 0.5)))
      : 0.2;
    const checkInDeficitRisk = options.checkInConsistency !== undefined
      ? Math.max(0, Math.min(1, 1 - options.checkInConsistency))
      : 0.15;
    const moduleGapRisk = options.moduleCompletion !== undefined
      ? Math.max(0, Math.min(1, 1 - options.moduleCompletion))
      : 0.25;

    // Multi-factor formula
    const risk = (
      (historicalTrendRisk * 0.22) +
      (checkInDeficitRisk * 0.20) +
      (moduleGapRisk * 0.18) +
      ((1 - academic) * 0.16) +
      (stress * 0.12) +
      (behavior * 0.08) +
      0.04
    );

    const clampedRisk = Math.min(0.98, Math.max(0.04, Math.round(risk * 1000) / 1000));
    let status: GranularRiskStatus = 'Low';
    
    if (clampedRisk >= 0.78) status = 'High';
    else if (clampedRisk >= 0.62) status = 'Medium-High';
    else if (clampedRisk >= 0.42) status = 'Medium';
    else if (clampedRisk >= 0.22) status = 'Low-Medium';
    else status = 'Low';

    const contributingFactors: string[] = [];
    if (historicalTrendRisk > 0.4) contributingFactors.push('Downward historical academic performance trend');
    if (checkInDeficitRisk > 0.4) contributingFactors.push('Irregular check-in cadence / non-reporting gap');
    if (moduleGapRisk > 0.4) contributingFactors.push('Specific module completion delay');
    if (stress > 0.6) contributingFactors.push('Elevated stress escalation index');
    if (contributingFactors.length === 0) contributingFactors.push('Consistent engagement and positive self-regulation');

    return { 
      score: clampedRisk, 
      status, 
      contributingFactors,
      historicalTrendRisk,
      checkInDeficitRisk,
      moduleGapRisk
    };
  }
}

class DriftEngine {
  compute(baseline: number[], current: number[]) {
    if (baseline.length !== current.length) return 0;
    // Euclidean distance for drift
    const sumSq = baseline.reduce((sum, val, i) => sum + Math.pow(val - current[i], 2), 0);
    return Math.round(Math.sqrt(sumSq) * 10000) / 10000;
  }
}

class InterventionEngine {
  recommend(riskLevel: string, category: 'academic' | 'behavior' | 'stress' = 'academic') {
    const normalized = riskLevel.toLowerCase();
    const recommendations: Record<string, string[]> = {
      'high': [
        "Immediate multidisciplinary case conference with student and guardian.",
        "Rapid academic support triage and intensive peer-tutoring intervention.",
        "Daily counselor touchpoint and check-in stabilization protocol.",
        "Review module completion obstacles with course instructor."
      ],
      'medium-high': [
        "Targeted counselor check-in within 48 hours to assess check-in drop-off.",
        "Structured study-hall schedule for lagging course modules.",
        "Academic trend remediation session in declining subjects.",
        "Parent wellbeing progress update."
      ],
      'medium': [
        "Teacher review of recent submission patterns and module progress.",
        "Encouragement prompt to maintain daily mood and stress check-ins.",
        "Study group or peer mentor assignment for STEM/core modules.",
        "Bi-weekly wellness counselor touchpoint."
      ],
      'low-medium': [
        "Gentle reminder notifications for missed check-in days.",
        "Ongoing positive reinforcement for steady module completion.",
        "Light academic check-in on upcoming assessment deadlines."
      ],
      'low': [
        "Maintain current self-monitoring rhythm and routine dashboard access.",
        "Commend student on strong consistency, attendance, and coursework pacing.",
        "Encourage peer leadership or extracurricular mentorship participation."
      ]
    };
    return recommendations[normalized] || recommendations['low'];
  }
}

class PolicyEngine {
  async checkCompliance(interaction: string, policies: any[]) {
    // In a real RAG system, this would vectorize the interaction 
    // and compare it against policy vectors.
    // Here we simulate a compliance check.
    
    const violations = [];
    const lowerInteraction = interaction.toLowerCase();

    for (const policy of policies) {
      const keywords = policy.description.toLowerCase().split(' ');
      const matches = keywords.filter((k: string) => k.length > 4 && lowerInteraction.includes(k));
      
      if (matches.length > 2) {
        violations.push({
          policyId: policy.id,
          title: policy.title,
          level: policy.level,
          confidence: 0.7 + (matches.length * 0.05)
        });
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * SWI Universal AI Engine
 * Handles all AI processing, input formatting, and output generation.
 * Supports offline fallback and local knowledge modules.
 * Implements Governance and Personalization layers.
 */
class SWIAIEngine {
  private localCache: Map<string, string> = new Map();
  private predictor = new PredictiveEngine();
  private driftDetector = new DriftEngine();
  private intervention = new InterventionEngine();
  private policy = new PolicyEngine();
  private alerts: any[] = [];
  
  private standardResponses: Record<string, string> = {
    'hello': 'Hey! I\'m Joe, your SWI companion. I\'m here to help you keep things running smoothly and make sure everyone\'s doing okay. What\'s on your mind?',
    'help': 'I can dive into the class data, help you draft some messages, or just chat about how things are going. Just let me know what you need!',
    'offline': 'Hey, we\'re offline right now, but I\'ve still got access to the local data. I can give you some basic updates until we\'re back on the grid.',
    'default': 'Got it. Looking at the current trends, I\'d say we should keep an eye on the engagement levels. Want me to dig deeper into any specific area?'
  };

  constructor() {
    this.loadLocalKnowledge();
  }

  /**
   * Process teacher input and generate real-time alerts.
   */
  processTeacherUpdate(update: StudentUpdate) {
    const newAlerts: any[] = [];
    if (update.wellbeing < 4) {
      newAlerts.push({
        id: `alert_${Date.now()}`,
        type: "HIGH_RISK",
        message: `Student wellbeing critically low: ${update.note || 'No notes provided.'}`,
        student_id: update.student_id,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }
    this.alerts = [...this.alerts, ...newAlerts];
    return newAlerts;
  }

  getAlerts() {
    return this.alerts;
  }

  /**
   * SWI Layer Logic: Check if internal data is sufficient to answer directly
   */
  private checkInternalData(query: string, context?: any): string | null {
    if (!context || !context.metrics || context.metrics.length === 0) return null;

    const q = query.toLowerCase();
    const latest = context.metrics[0];

    // Simple pattern matching for direct data lookups
    if (q.includes('mood') && (q.includes('current') || q.includes('latest') || q.includes('how is'))) {
      return `The latest mood score I have is ${latest.mood_score}/5. It looks like things are ${latest.mood_score >= 4 ? 'great' : latest.mood_score >= 3 ? 'steady' : 'a bit low'} right now.`;
    }
    if (q.includes('stress') && (q.includes('current') || q.includes('latest'))) {
      return `Current stress levels are sitting at ${latest.stress_score}/5. ${latest.stress_score >= 4 ? 'It\'s a bit high, might be worth a check-in.' : 'Everything seems manageable on that front.'}`;
    }
    if (q.includes('engagement') && (q.includes('current') || q.includes('latest'))) {
      return `Class engagement is at ${latest.engagement_score}/5. ${latest.engagement_score >= 4 ? 'The energy is high!' : 'We might need to spice things up a bit.'}`;
    }

    return null;
  }

  private loadLocalKnowledge() {
    const saved = localStorage.getItem('swi_local_knowledge');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.assign(this.standardResponses, parsed);
      } catch (e) {
        console.error("Failed to load local knowledge", e);
      }
    }
  }

  /**
   * Get User Level based on role and anonymity
   */
  private getUserLevel(user: User & { isAnonymous?: boolean }): UserLevel {
    if (user.isAnonymous || auth.currentUser?.isAnonymous) return 'demo';
    return roleToLevel[user.role] || 'standard';
  }

  /**
   * Check if user has access to the requested mode
   */
  private hasAccess(level: UserLevel, mode: AIMode): boolean {
    if (level === 'admin') return true;
    if (level === 'manager') return true; // Managers can access all modes but maybe limited data
    if (level === 'standard') return mode === 'chat' || mode === 'pa';
    if (level === 'demo') return mode === 'chat'; // Demo only gets basic chat
    return false;
  }

  /**
   * Process user input through the core engine
   */
  async process(request: EngineRequest): Promise<EngineResponse> {
    const { mode, query, context, isOffline } = request;
    const user = request.user || { 
      full_name: 'User', 
      role: 'student' as UserRole, 
      id: 0,
      username: 'user',
      must_change_password: false
    };
    const level = this.getUserLevel(user as any);

    // 1. Governance: Access Control
    if (!this.hasAccess(level, mode)) {
      return {
        text: `${user.full_name.split(' ')[0]}, I'm sorry, but your current access level doesn't allow for ${mode.replace('_', ' ')} mode. Please contact an administrator if you believe this is an error.`,
        mode,
        timestamp: new Date().toISOString(),
        isOfflineResponse: true,
        accessDenied: true
      };
    }

    // 2. Check for offline mode or forced demo mode
    if (isOffline || !navigator.onLine || level === 'demo') {
      const response = this.processOffline(request);
      // Personalize offline response
      response.text = `${user.full_name.split(' ')[0]}, ${response.text}`;
      return response;
    }

    // 2.5 SWI Layer: Check Internal Data before going to Gemini
    const internalResponse = this.checkInternalData(query, context);
    if (internalResponse) {
      const firstName = user.full_name.split(' ')[0];
      return {
        text: `${firstName}, ${internalResponse}`,
        mode,
        timestamp: new Date().toISOString(),
        isOfflineResponse: true
      };
    }

    // 2.6 SWI Level-10: Predictive Analysis
    if (query.includes('predict') || query.includes('risk') || query.includes('analysis')) {
      const analysis = this.performSWIAnalysis(context);
      if (analysis) {
        const firstName = user.full_name.split(' ')[0];
        return {
          text: `${firstName}, I've completed the Level-10 SWI analysis. ${analysis}`,
          mode,
          timestamp: new Date().toISOString(),
          isOfflineResponse: true
        };
      }
    }

    // 2.7 Policy Compliance Check (CEK Sentinel)
    if (context?.documentText || query.length > 50) {
      // In a real app, we'd fetch policies from Firestore here
      // For now, we simulate with some mock policies if none provided
      const mockPolicies = [
        { id: '1', title: 'National Education Act', description: 'Rules regarding student safety and academic standards in Botswana.', level: 'ministry' },
        { id: '2', title: 'School Code of Conduct', description: 'Expected behavior and ethics for students and staff.', level: 'admin' }
      ];
      
      const compliance = await this.policy.checkCompliance(context?.documentText || query, mockPolicies);
      if (!compliance.isCompliant) {
        const firstName = user.full_name.split(' ')[0];
        const violationTitles = compliance.violations.map(v => v.title).join(', ');
        return {
          text: `${firstName}, I've detected potential compliance issues with the following policies: ${violationTitles}. Please review the content to ensure it aligns with our legal and ethical standards.`,
          mode,
          timestamp: new Date().toISOString(),
          isOfflineResponse: true
        };
      }
    }

    try {
      // 3. Governance: Data flow & personalization
      const systemInstruction = request.systemInstruction || this.getSystemInstruction(mode, user, query, context);

      // 4. Call Gemini AI Layer
      let text = '';
      
      if (mode === 'image_gen') {
        // This would normally call generateAIImage from api.ts
        // But we handle it in the component for now or add it here if we want full centralization
        text = `I've initiated the image generation for: "${query}".`;
      } else {
        const res = await fetch(`/api/ai/guidance/${context?.studentId || '123'}?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          text = data.guidance || this.getFallbackResponse(query);
        } else {
          text = this.getFallbackResponse(query);
        }
      }

      // 5. Personalization: Ensure name prefix if Gemini missed it
      const firstName = user.full_name.split(' ')[0];
      if (!text.startsWith(firstName)) {
        text = `${firstName}, ${text}`;
      }

      // 6. Cache response for future offline use
      this.cacheResponse(query, text);

      return {
        text,
        mode,
        timestamp: new Date().toISOString(),
        isOfflineResponse: false
      };
    } catch (error) {
      console.error("AI Engine Online Error:", error);
      const offlineRes = this.processOffline(request);
      offlineRes.text = `${user.full_name.split(' ')[0]}, ${offlineRes.text}`;
      return offlineRes;
    }
  }

  private processOffline(request: EngineRequest): EngineResponse {
    const { mode, query, context } = request;
    
    // Check cache first
    const cached = this.localCache.get(query.toLowerCase());
    if (cached) {
      return { text: cached, mode, timestamp: new Date().toISOString(), isOfflineResponse: true };
    }

    // Proactive topics offline
    if (query === 'proactive_topics') {
      return {
        text: "How are you feeling today?\nWould you like to review your recent study hours?\nShall we check your upcoming assignments?",
        mode,
        timestamp: new Date().toISOString(),
        isOfflineResponse: true
      };
    }

    // Use context to provide better offline responses
    if (context?.metrics && context.metrics.length > 0) {
      const lastMetric = context.metrics[0];
      if (query.toLowerCase().includes('mood') || query.toLowerCase().includes('wellbeing')) {
        return {
          text: `Based on your last check-in, your mood score was ${lastMetric.mood_score}/5. I recommend focusing on some light reading or a hobby to keep your spirits up while we're offline.`,
          mode,
          timestamp: new Date().toISOString(),
          isOfflineResponse: true
        };
      }
      if (query.toLowerCase().includes('stress')) {
        return {
          text: `Your last reported stress level was ${lastMetric.stress_score}/5. Since we're offline, try some deep breathing exercises or a short walk.`,
          mode,
          timestamp: new Date().toISOString(),
          isOfflineResponse: true
        };
      }
    }

    // Use standard responses
    let text = this.standardResponses['default'];
    for (const [key, val] of Object.entries(this.standardResponses)) {
      if (query.toLowerCase().includes(key)) {
        text = val;
        break;
      }
    }

    // Mode-specific offline logic
    if (mode === 'doc_analysis') {
      text = "I've scanned the document locally. It appears to be a study resource. I can help you summarize it once we're back online, or provide general tips now.";
    } else if (mode === 'pa') {
      text = "I've noted your request. I'll sync this with your dashboard as soon as a connection is available.";
    }

    return {
      text,
      mode,
      timestamp: new Date().toISOString(),
      isOfflineResponse: true
    };
  }

  private getSystemInstruction(mode: AIMode, user: User, query: string, context?: any): string {
    const firstName = user.full_name.split(' ')[0];
    let base = `You are Joe, the SWI companion. You are assisting ${user.full_name} (Role: ${user.role}). 
    CRITICAL: Always address the user by their first name, ${firstName}, at the start of every response.
    Example: "${firstName}, here is your update..."
    
    PERSONALITY: You are Joe. You are human-like, engaging, and supportive. You don't sound like a generic AI. You sound like a helpful colleague or a friendly mentor. Use casual but professional language. Instead of "I have analyzed the data", say "I've been looking over the numbers...". 
    
    UI BEHAVIOR: Always provide summarized insights first. Use bullet points for key takeaways. 
    If the user asks for more detail, provide the full raw data or expanded analysis.
    
    Governance Layer: You are governed by SWI protocols. Focus on data security and user-specific filtering.
    
    DATA PRIORITIZATION: Always prioritize internal data (metrics, history, assignments) over general knowledge. 
    DETAILED EXPLANATIONS: If the user questions any score, percentage, or metric, explain in detail how it was derived from the available data.
    `;
    
    if (mode === 'chat') {
      base += "Focus on supportive, conversational interaction. ";
    } else if (mode === 'pa') {
      base += "Act as a Personal Assistant. Focus on scheduling, reminders, alerts, and data analysis. ";
    } else if (mode === 'doc_analysis') {
      base += "Act as a Document Analyst. Focus on intelligent parsing, summarization, and insights extraction. ";
    }

    if (query === 'proactive_topics') {
      base += `
      PROACTIVE MODE: Generate 3 short, engaging questions or topics based on the user's current data.
      Format: Each suggestion on a new line. No numbering.
      Example:
      How was your sleep last night?
      Shall we review your math assignment?
      You seem stressed, want to talk about it?
      `;
    }

    if (user.role === 'teacher') {
      base += `
      TEACHER CONTEXT: You are assisting a teacher. 
      - Help with class-wide announcements and assignment reminders.
      - Analyze class-wide trends (average mood, attendance, risk levels).
      - Suggest specific interventions for 'high risk' students based on their metrics.
      - Help draft professional communications to parents or other staff.
      - Assist in generating quiz questions or lesson plan ideas.
      `;
    }

    if (context?.metrics) {
      base += `Contextual Data (Wellbeing Metrics): ${JSON.stringify(context.metrics.slice(0, 5))}. `;
    }

    return base + "Keep responses concise, actionable, and highly personalized.";
  }

  private performSWIAnalysis(context?: any): string | null {
    if (!context || !context.metrics || context.metrics.length < 2) return "I need more historical data to perform a reliable drift and risk analysis.";

    const latest = context.metrics[0];
    const history = context.metrics.slice(1);
    
    // Normalize values to 0-1 for the engine
    const academic = latest.attendance / 1.0; // Assuming attendance is 0-1
    const behavior = 1 - (latest.engagement_hours / 10); // Inverse of engagement as risk
    const stress = latest.stress_score / 5;

    const { score, status } = this.predictor.predictRisk(academic, behavior, stress);
    
    // Compute drift from baseline (average of history)
    const baseline = [
      history.reduce((s: number, m: any) => s + m.attendance, 0) / history.length,
      1 - (history.reduce((s: number, m: any) => s + m.engagement_hours, 0) / (history.length * 10)),
      history.reduce((s: number, m: any) => s + m.stress_score, 0) / (history.length * 5)
    ];
    const current = [academic, behavior, stress];
    const drift = this.driftDetector.compute(baseline, current);

    const recommendations = this.intervention.recommend(status, 'academic');

    let journalInsight = "";
    if (latest.journal_text) {
      journalInsight = `\n      JOURNAL ANALYSIS: The latest entry suggests ${latest.journal_text.length > 100 ? 'detailed reflection' : 'brief reporting'}.`;
    }

    return `
      RISK ASSESSMENT: ${status.toUpperCase()} (Score: ${score})
      BEHAVIORAL DRIFT: ${drift > 0.1 ? 'Significant' : 'Stable'} (Index: ${drift})
      ${journalInsight}
      
      INSIGHTS:
      - Academic stability is at ${Math.round(academic * 100)}%.
      - Stress levels have ${current[2] > baseline[2] ? 'increased' : 'decreased'} compared to the baseline.
      
      RECOMMENDED ACTIONS:
      ${recommendations.map(r => `• ${r}`).join('\n')}
    `;
  }

  private cacheResponse(query: string, response: string) {
    this.localCache.set(query.toLowerCase(), response);
    // Limit cache size
    if (this.localCache.size > 100) {
      const firstKey = this.localCache.keys().next().value;
      if (firstKey) this.localCache.delete(firstKey);
    }
  }

  private getFallbackResponse(query: string): string {
    return this.standardResponses['default'];
  }
}

export const swiAIEngine = new SWIAIEngine();
