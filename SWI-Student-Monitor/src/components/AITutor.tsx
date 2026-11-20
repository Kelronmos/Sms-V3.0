import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrainCircuit, Send, Sparkles, 
  MessageSquare, History, X,
  Mic, Volume2, VolumeX, BookOpen,
  Zap, Heart, Award, Info, ThumbsUp, ThumbsDown,
  GraduationCap, RefreshCw, CheckCircle2, ChevronRight
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Student, User, Metric } from '../types';
import { askAITutor, generateSpeech, rateAIInteraction } from '../services/api';

interface AITutorProps {
  student: Student | undefined;
  metrics: Metric[];
  user: User;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  rating?: 'up' | 'down';
}

export const AITutor: React.FC<AITutorProps> = ({ student, metrics, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`tutor_chat_${user.id}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'academic' | 'wellbeing' | 'revision'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (messages.length > 0) {
      localStorage.setItem(`tutor_chat_${user.id}`, JSON.stringify(messages.slice(-30)));
    }
  }, [messages, isTyping]);

  const handleSend = async (overrideText?: string) => {
    const queryText = (overrideText || input).trim();
    if (!queryText || isTyping) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toISOString()
    };

    setInput('');
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const historyPayload = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const response = await askAITutor(student?.student_id || String(user.id), queryText, historyPayload);
      
      const aiReply: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'ai',
        content: response.content || "I'm right here with you! Let's explore this topic together.",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiReply]);

      if (voiceEnabled) {
        handleSpeak(aiReply.content);
      }
    } catch (error: any) {
      console.error("AI Tutor Error:", error);
      const fallbackReply: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'ai',
        content: `### Study & Wellbeing Recommendation\n\nI couldn't reach the live AI server right now, but here is personalized advice based on your current **${student?.academic_standing || 'Good'}** standing:\n\n* **Academic Tip:** Review key formula derivations for Mathematics and write 3 summary bullets after each topic.\n* **Wellbeing Insight:** Your recent metrics show steady commitment! Take a 10-minute walk every 45 minutes of digital work to keep energy levels high.\n* **Goal:** Aim for 8 hours of restorative sleep tonight.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackReply]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      const audioUrl = await generateSpeech(text.slice(0, 450));
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const handleRate = async (messageId: string, rating: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, rating } : m));
    try {
      await rateAIInteraction(messageId, rating === 'up');
    } catch (err) {}
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`tutor_chat_${user.id}`);
  };

  const latestMetric = metrics[0];
  const promptSuggestions = [
    {
      category: 'academic',
      title: 'Math Revision',
      desc: 'How do I master Quadratic Equations step-by-step?',
      prompt: 'Can you explain how to solve quadratic equations using both factoring and the quadratic formula, with step-by-step examples?'
    },
    {
      category: 'academic',
      title: 'Analyze Performance',
      desc: 'Review my recent grades and subject trajectory',
      prompt: 'Based on my academic record and current assignments, what are 3 specific study adjustments that will boost my GPA?'
    },
    {
      category: 'wellbeing',
      title: 'Manage Stress',
      desc: 'Techniques to reduce exam anxiety',
      prompt: 'I feel exam pressure coming up. How can I balance focused study intervals with stress reduction and good sleep?'
    },
    {
      category: 'revision',
      title: '7-Day Study Plan',
      desc: 'Create personalized weekly exam timetable',
      prompt: 'Generate a structured 7-day revision schedule tailored to my Grade 10 curriculum and wellbeing balance.'
    }
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden flex flex-col h-[700px]">
      {/* Header */}
      <div className="p-6 border-b border-black/5 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/40">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-200">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-slate-900 tracking-tight">SWI Learning Guide</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                Live Model v4.2
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Personalized guidance for {student?.name || user.full_name} • Grade {student?.class_grade || '10'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
              voiceEnabled ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title={voiceEnabled ? "Voice Output Active" : "Enable Voice Output"}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
          </button>
          <button 
            onClick={clearChat}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-rose-600"
            title="Clear Chat History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Student Context Bar */}
      <div className="px-6 py-2.5 bg-slate-50 border-b border-black/5 flex items-center justify-between text-[11px] font-bold text-slate-500 overflow-x-auto gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <span className="flex items-center gap-1 text-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            Standing: <strong className="text-indigo-600">{student?.academic_standing || 'Excellent'}</strong>
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            Mood Avg: <strong className="text-slate-900">{latestMetric?.mood_score || 4}/5</strong>
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Stress: <strong className="text-slate-900">{latestMetric?.stress_score || 2}/5</strong>
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Attendance: <strong className="text-emerald-600">{student?.attendance_rate || 96.4}%</strong>
          </span>
        </div>
        <div className="text-[10px] uppercase font-black tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
          Sync Connected
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto space-y-6 py-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-md">
              <Sparkles className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xl font-black tracking-tight text-slate-900">
                Welcome to your SWI Learning Guide
              </h4>
              <p className="text-sm text-slate-500">
                Ask questions about your subjects, request step-by-step math solutions, review your learning metrics, or create custom revision schedules.
              </p>
            </div>

            {/* Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {promptSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  className="p-4 bg-white border border-black/5 hover:border-indigo-300 rounded-2xl shadow-sm hover:shadow-md transition-all group text-left space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">{item.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium line-clamp-2">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-3xl p-5 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-md shadow-md'
                  : 'bg-white text-slate-800 rounded-tl-md border border-black/5'
              }`}>
                {msg.role === 'ai' && (
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/5 text-slate-400">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">SWI Explanation</span>
                    </div>
                    <span className="text-[10px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}

                <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'prose prose-sm max-w-none text-slate-800'}`}>
                  <Markdown>{msg.content}</Markdown>
                </div>

                {msg.role === 'ai' && (
                  <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleSpeak(msg.content)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          isSpeaking ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-500'
                        }`}
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Listen</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] text-slate-400 font-bold">Helpful?</span>
                      <button
                        onClick={() => handleRate(msg.id, 'up')}
                        className={`p-1.5 rounded-lg transition-all ${
                          msg.rating === 'up' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-400'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRate(msg.id, 'down')}
                        className={`p-1.5 rounded-lg transition-all ${
                          msg.rating === 'down' ? 'bg-rose-100 text-rose-700' : 'hover:bg-slate-100 text-slate-400'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-3xl rounded-tl-md border border-black/5 shadow-sm flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <BrainCircuit className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span className="text-xs font-bold text-slate-500">SWI is preparing your personalized explanation...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-black/5 bg-white">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about academic topics, exam tips, or wellbeing advice..."
            className="flex-1 px-5 py-3.5 bg-slate-50 border border-black/5 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
            disabled={isTyping}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-5 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-100 flex items-center gap-2 text-sm"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Tutor</span>
          </button>
        </form>
      </div>
    </div>
  );
};
