import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Mic, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  History,
  MessageSquare,
  X,
  Star,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  Calendar,
  BookOpen,
  Lightbulb,
  Image as ImageIcon,
  Upload,
  Zap,
  HelpCircle,
  FileText,
  UserCheck,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIInteraction, Metric, Student, User } from '../types';
import { 
  saveAIInteraction, 
  generateSpeech, 
  rateAIInteraction,
  analyzeImage,
  generateAIImage
} from '../services/api';
import { swiAIEngine, AIMode } from '../services/aiEngine';

interface SWIAIAssistantProps {
  user: User;
  student: Student;
  metrics: Metric[];
  history: AIInteraction[];
  assignments: any[];
  quizzes: any[];
  systemInstruction?: string;
  onNewInteraction: (interaction: AIInteraction) => void;
  quickActions?: { label: string; query: string; icon?: React.ElementType }[];
}

const Greeting: React.FC<{ name: string }> = ({ name }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-black tracking-tighter">Dumela, {name}!</h2>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SWI Universal Intelligence Active</p>
  </div>
);

const StatusBars: React.FC<{ drift: number; integrity: number }> = ({ drift, integrity }) => (
  <div className="grid grid-cols-2 gap-4 mb-6">
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
        <span>Drift Analysis</span>
        <span>{drift}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${drift}%` }}
          className={`h-full ${drift > 70 ? 'bg-rose-500' : drift > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
        />
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
        <span>Integrity Index</span>
        <span>{integrity}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${integrity}%` }}
          className={`h-full ${integrity > 80 ? 'bg-emerald-500' : integrity > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
        />
      </div>
    </div>
  </div>
);

const ActionableInsights: React.FC<{ metrics: Metric[] }> = ({ metrics }) => {
  const latest = metrics[0];
  if (!latest) return null;

  const insights = [
    { label: 'Wellbeing', value: latest.mood_score, status: latest.mood_score > 7 ? 'Optimal' : latest.mood_score > 4 ? 'Stable' : 'Critical' },
    { label: 'Engagement', value: latest.participation_score, status: latest.participation_score > 7 ? 'High' : latest.participation_score > 4 ? 'Moderate' : 'Low' },
    { label: 'Stress', value: latest.stress_score, status: latest.stress_score < 3 ? 'Low' : latest.stress_score < 6 ? 'Normal' : 'High' },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Actionable Insights</h4>
      {insights.map((insight) => (
        <div key={insight.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-black/5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${insight.status === 'Optimal' || insight.status === 'High' || insight.status === 'Low' && insight.label === 'Stress' ? 'bg-emerald-500' : insight.status === 'Critical' || insight.status === 'Low' || insight.status === 'High' && insight.label === 'Stress' ? 'bg-rose-500' : 'bg-amber-500'}`} />
            <span className="text-xs font-bold">{insight.label}</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{insight.status}</span>
        </div>
      ))}
    </div>
  );
};

export const SWIAIAssistant: React.FC<SWIAIAssistantProps> = ({ 
  user,
  student, 
  metrics, 
  history,
  assignments,
  quizzes,
  systemInstruction,
  onNewInteraction,
  quickActions = []
}) => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'helpful' | 'unhelpful'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<string[]>([]);
  const [activeMode, setActiveMode] = useState<AIMode>('chat');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [criticalAlerts, setCriticalAlerts] = useState<{ id: string; message: string; type: 'risk' | 'need' | 'contact' }[]>([]);

  useEffect(() => {
    // Generate dynamic critical alerts based on real-time data
    const alerts: { id: string; message: string; type: 'risk' | 'need' | 'contact' }[] = [];
    
    if (student?.risk_level === 'high') {
      alerts.push({ id: 'risk-1', message: 'High risk detected: Immediate counselor intervention recommended.', type: 'risk' });
    }
    
    // Check for negative trends in metrics
    if (metrics.length >= 2) {
      const latest = metrics[0];
      const previous = metrics[1];
      if (latest.mood_score < previous.mood_score && latest.mood_score <= 2) {
        alerts.push({ id: 'risk-2', message: 'Significant mood drop detected. Consider a wellbeing check-in.', type: 'risk' });
      }
      if (latest.stress_score > previous.stress_score && latest.stress_score >= 4) {
        alerts.push({ id: 'risk-3', message: 'Rising stress levels. Proactive stress management suggested.', type: 'risk' });
      }
    }

    if (user.role === 'school_admin' || user.role === 'ministry') {
      alerts.push({ id: 'need-1', message: 'System Alert: Resource allocation pending for Gaborone district.', type: 'need' });
    }
    
    setCriticalAlerts(alerts);
  }, [student, user.role, metrics]);

  useEffect(() => {
    // Refresh proactive suggestions when metrics change or history is empty
    if (student && !isOffline) {
      generateProactiveSuggestions();
    }
  }, [student?.student_id, metrics.length]);

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const generateProactiveSuggestions = async () => {
    try {
      const res = await swiAIEngine.process({
        mode: 'chat',
        query: 'proactive_topics',
        context: { metrics, history, studentId: student.student_id },
        isOffline,
        user,
        systemInstruction
      });
      const suggestions = res.text.split('\n').filter((s: string) => s.trim().length > 0).slice(0, 3);
      setProactiveSuggestions(suggestions);
    } catch (err) {
      console.error("Failed to generate proactive suggestions", err);
    }
  };
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [guidance, setGuidance] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (guidance === '' && metrics.length > 0) {
      swiAIEngine.process({
        mode: activeMode,
        query: "Provide a general wellbeing and learning update based on my current data.",
        context: { metrics, history, studentId: student.student_id },
        isOffline,
        user,
        systemInstruction
      }).then(res => setGuidance(res.text));
    }
  }, [student.student_id, metrics, history, activeMode, isOffline]);

  // Speech Recognition Setup
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };

    recognition.start();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (customQuery?: string) => {
    const finalQuery = customQuery || query;
    if (!finalQuery.trim() && !selectedImage) return;

    setIsProcessing(true);
    try {
      let aiResponse = '';
      
      if (selectedImage) {
        aiResponse = await analyzeImage(selectedImage, finalQuery || "Analyze this image for me.");
      } else {
        const res = await swiAIEngine.process({
          mode: activeMode,
          query: finalQuery,
          context: { metrics, history, studentId: student.student_id },
          isOffline,
          user,
          systemInstruction
        });
        aiResponse = res.text;
      }
      
      const interaction: AIInteraction = {
        student_id: student.student_id,
        user_query: finalQuery || "Image Analysis",
        ai_response: aiResponse,
        timestamp: new Date()
      };

      await saveAIInteraction(interaction);
      onNewInteraction(interaction);
      setGuidance(aiResponse);
      setQuery('');
      setSelectedImage(null);

      if (!isOffline) {
        const audio = await generateSpeech(aiResponse);
        if (audio) {
          setAudioUrl(audio);
          setIsSpeaking(true);
        }
      }
    } catch (err) {
      console.error("AI Chat failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!query.trim() || isOffline) return;
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateAIImage(query);
      if (imageUrl) {
        const interaction: AIInteraction = {
          student_id: student.student_id,
          user_query: `Generate image: ${query}`,
          ai_response: `I've generated an image based on your prompt: "${query}". ![Generated Image](${imageUrl})`,
          timestamp: new Date()
        };
        await saveAIInteraction(interaction);
        onNewInteraction(interaction);
        setGuidance(`I've generated an image for you!`);
        setQuery('');
      } else {
        setGuidance(`I'm sorry, I couldn't generate the image right now. Please try a different prompt.`);
      }
    } catch (err) {
      console.error("Image generation failed", err);
      setGuidance(`Image generation failed. Please check your connection.`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleRate = async (id: string, rating: number, helpful: boolean) => {
    await rateAIInteraction(id, rating, helpful);
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.user_query.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.ai_response.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'helpful' && item.is_helpful === true) ||
                         (filterType === 'unhelpful' && item.is_helpful === false);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    const dateA = a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.() || new Date(a.timestamp);
    const dateB = b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.() || new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });

  const toggleSpeech = () => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
    } else if (audioUrl) {
      audioRef.current?.play();
      setIsSpeaking(true);
    }
  };

  const modeActions = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'pa', label: 'Assistant', icon: UserCheck, color: 'text-amber-600 bg-amber-50' },
    { id: 'doc_analysis', label: 'Doc Analysis', icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden flex flex-col h-[800px]">
      {/* SWI Universal Engine Header */}
      <div className="p-8 border-b border-black/5 bg-slate-50/50">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div>
              <Greeting name={user.full_name.split(' ')[0]} />
            </div>
          </div>
          <div className="flex gap-2">
            {isOffline ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                <WifiOff className="w-3 h-3" /> Offline Mode
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                <Wifi className="w-3 h-3" /> Engine Online
              </span>
            )}
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-600"
            >
              <History className="w-6 h-6" />
            </button>
          </div>
        </div>

        <StatusBars drift={82} integrity={100} />
        <ActionableInsights metrics={metrics} />
      </div>

      {/* Mode Selector */}
      <div className="px-6 py-4 bg-white border-b border-black/5 flex gap-3 overflow-x-auto no-scrollbar">
        {modeActions.map(mode => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id as AIMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeMode === mode.id 
                ? `${mode.color} border border-indigo-200 shadow-sm` 
                : 'bg-white text-slate-400 border border-black/5 hover:border-slate-300'
            }`}
          >
            <mode.icon className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
          {isProcessing && (
            <div className="flex gap-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <BrainCircuit className="w-4 h-4 text-indigo-600 animate-pulse" />
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-black/5 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Thinking...</span>
              </div>
            </div>
          )}
          {/* Critical Alerts */}
          {criticalAlerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Critical Alerts
              </p>
              {criticalAlerts.map(alert => (
                <motion.div 
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <p className="text-xs font-bold text-rose-700">{alert.message}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Proactive Suggestions */}
          {proactiveSuggestions.length > 0 && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Recommended for you
              </p>
              <div className="flex flex-wrap gap-2">
                {proactiveSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="text-xs font-bold bg-white text-slate-700 px-3 py-2 rounded-xl border border-indigo-100 hover:border-indigo-500 transition-all text-left shadow-sm hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="chat-response-block max-w-[85%]">
              <p className="font-bold text-indigo-600 mb-2">
                {activeMode === 'chat' ? 'Wellbeing Guidance' : activeMode === 'pa' ? 'Assistant Update' : 'Document Insights'}
              </p>
              <div className="prose prose-sm max-w-none">
                {guidance || "Analyzing your recent metrics and history to provide the best support..."}
              </div>
              
              {audioUrl && !isOffline && (
                <div className="mt-4 flex items-center gap-3">
                  <button 
                    onClick={toggleSpeech}
                    className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">Listen to Guidance</span>
                  <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    onEnded={() => setIsSpeaking(false)}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {history.slice().reverse().map((item, i) => (
            <React.Fragment key={i}>
              <div className="flex justify-end gap-4">
                <div className="bg-black text-white p-4 rounded-2xl rounded-tr-none text-sm max-w-[85%]">
                  {item.user_query}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="chat-response-block max-w-[85%]">
                  <div className="prose prose-sm max-w-none">
                    {item.ai_response.includes('![Generated Image]') ? (
                      <div>
                        {item.ai_response.split('![Generated Image]')[0]}
                        <img 
                          src={item.ai_response.match(/\((.*?)\)/)?.[1]} 
                          alt="Generated" 
                          className="mt-2 rounded-xl shadow-lg max-w-full"
                        />
                      </div>
                    ) : item.ai_response}
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-black/5 bg-slate-50 overflow-y-auto p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">History</h4>
                <button onClick={() => setShowHistory(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-black/5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'helpful', 'unhelpful'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                        filterType === type ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-black/5'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredHistory.map((item, i) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-black/5 text-xs">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-900 truncate flex-1 mr-2">{item.user_query}</p>
                      {item.is_helpful !== undefined && (
                        item.is_helpful ? <ThumbsUp className="w-3 h-3 text-emerald-500" /> : <ThumbsDown className="w-3 h-3 text-rose-500" />
                      )}
                    </div>
                    <p className="text-slate-500 line-clamp-2 mb-2">{item.ai_response}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-black/5">
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.timestamp?.seconds ? item.timestamp.seconds * 1000 : item.timestamp).toLocaleDateString()}
                      </span>
                      {!item.is_helpful && (
                        <div className="flex gap-1">
                          <button onClick={() => handleRate(item.id!, 5, true)} className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-emerald-500"><ThumbsUp className="w-3 h-3" /></button>
                          <button onClick={() => handleRate(item.id!, 1, false)} className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-rose-500"><ThumbsDown className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-black/5 bg-slate-50 space-y-4">
        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSend(action.query)}
                disabled={isProcessing}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-black/5 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all whitespace-nowrap shadow-sm"
              >
                {action.icon && <action.icon className="w-3 h-3" />}
                {action.label}
              </button>
            ))}
          </div>
        )}

        {selectedImage && (
          <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-500">
            <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="relative">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              activeMode === 'chat' ? "Ask about study planning, wellbeing..." :
              activeMode === 'pa' ? "Set a reminder or ask for a summary..." :
              "Analyze a document or text snippet..."
            }
            className="w-full pl-6 pr-32 py-4 bg-white rounded-2xl border border-black/5 shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-all"
              title="Upload image to analyze"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button 
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || !query.trim() || isOffline}
              className={`p-2 transition-all ${isGeneratingImage ? 'text-amber-500 animate-spin' : 'text-slate-400 hover:text-amber-500'} ${isOffline ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={isOffline ? "Image generation requires connection" : "Generate image from prompt"}
            >
              <Zap className="w-5 h-5" />
            </button>
            <button 
              onClick={startListening}
              className={`p-2 transition-all ${isListening ? 'text-rose-600 animate-pulse' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleSend()}
              disabled={isProcessing || (!query.trim() && !selectedImage)}
              className="p-2 bg-black text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
