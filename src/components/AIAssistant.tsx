import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  MessageSquare, Send, Shield, Brain, Sparkles, 
  Mic, Paperclip, FileText, Calendar, User, 
  Volume2, Play, Pause, X, Check, Search,
  Zap, Heart, AlertCircle, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cekService } from '../services/AdvancedCEK';
import { fetchAIGuidance } from '../services/api';
import { User as UserType, Metric, AIInteraction } from '../types';
import { swiAIEngine, AIMode } from '../services/aiEngine';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type InteractionMode = 'chat' | 'pa' | 'doc_analysis' | 'voice_to_text' | 'image_gen';

interface Message {
  role: 'user' | 'ai';
  text: string;
  type?: 'text' | 'voice' | 'doc';
  attachments?: { name: string; type: string; content?: string }[];
  audioUrl?: string;
}

export const AIAssistant: React.FC<{ 
  role: string, 
  studentId?: string, 
  user: UserType,
  metrics?: Metric[],
  history?: AIInteraction[]
}> = ({ role, studentId, user, metrics = [], history = [] }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: `Hello! I am your SWI AI Assistant. How can I help you with your ${role} dashboard today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<InteractionMode>('chat');
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadGuidance = async () => {
      if (role === 'student' && studentId) {
        try {
          const { guidance } = await fetchAIGuidance(studentId, [], [], [], [], undefined, undefined, user);
          setMessages(prev => [...prev, { role: 'ai', text: guidance }]);
        } catch (error) {
          console.error("Failed to load AI guidance:", error);
        }
      }
    };
    loadGuidance();
  }, [role, studentId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideText?: string, type: 'text' | 'voice' | 'doc' = 'text', attachments?: any[]) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() && !attachments) return;

    const userMsg: Message = { role: 'user', text: textToSend, type, attachments };
    if (!overrideText) setInput('');
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Adaptive Mode Switching
    if (attachments && attachments.length > 0) {
      setMode('doc_analysis');
    } else if (type === 'voice') {
      setMode('voice_to_text');
    }

    try {
      const response = await swiAIEngine.process({
        query: textToSend,
        mode: mode === 'voice_to_text' ? 'chat' : mode as AIMode,
        user,
        context: { metrics, history, studentId },
        isOffline: !navigator.onLine
      });
      const aiText = response.text;
      cekService.evaluate(aiText);
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to SWI AI Core." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    // Simulate voice to text after 2 seconds
    setTimeout(() => {
      setIsRecording(false);
      handleSend("Draft an email to the board about the audit.", 'voice');
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const attachments = Array.from(files).map(f => ({ name: f.name, type: f.type }));
      handleSend(`Analyzing ${attachments.length} document(s)...`, 'doc', attachments);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-[600px] bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-black p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-white block text-sm">SWI AI Assistant</span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {mode.replace('_', ' ')} Mode
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setMode('chat')} className={`p-2 rounded-lg transition-colors ${mode === 'chat' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
            <MessageSquare className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setMode('pa')} className={`p-2 rounded-lg transition-colors ${mode === 'pa' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
            <Calendar className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setMode('doc_analysis')} className={`p-2 rounded-lg transition-colors ${mode === 'doc_analysis' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
            <FileText className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#E5DDD5] bg-opacity-50">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm relative ${
                msg.role === 'user' 
                  ? 'bg-[#DCF8C6] text-slate-800 rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none'
              }`}>
                {msg.type === 'voice' && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-black/5 rounded-lg">
                    <Play className="w-4 h-4 fill-current" />
                    <div className="flex-1 h-1 bg-black/10 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-black/40" />
                    </div>
                    <span className="text-[10px] font-bold">0:04</span>
                  </div>
                )}
                {msg.attachments && msg.attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 mb-2 bg-black/5 rounded-lg border border-black/5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold truncate">{att.name}</p>
                      <p className="text-[8px] text-slate-400 uppercase">OCR Ready</p>
                    </div>
                  </div>
                ))}
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 block text-right">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl shadow-sm animate-pulse">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#F0F2F5] flex items-center gap-3">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-500 hover:text-black transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          onChange={handleFileUpload}
        />
        
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isRecording ? "Listening..." : "Type a message"}
            className="w-full bg-white border-none rounded-full px-5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {input.trim() ? (
          <button
            onClick={() => handleSend()}
            className="bg-emerald-500 text-white p-2.5 rounded-full hover:bg-emerald-600 transition-all shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            className={`p-2.5 rounded-full transition-all shadow-md ${
              isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
