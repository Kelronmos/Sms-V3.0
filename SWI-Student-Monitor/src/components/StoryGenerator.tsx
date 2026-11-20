import React, { useState } from 'react';
import { BookOpen, Zap, BrainCircuit, Heart, ShieldAlert, X, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface StoryGeneratorProps {
  onStoryGenerated: (story: string) => void;
  onClose: () => void;
}

export const StoryGenerator: React.FC<StoryGeneratorProps> = ({ onStoryGenerated, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStory = async (type: 'student' | 'teacher' | 'parent' | 'risk') => {
    setIsGenerating(true);
    setError(null);
    try {
      const prompts = {
        student: "Write a 500-word story about a student in Botswana using the CEK (Community, Ethics, Knowledge) system to overcome a challenge. Focus on their wellbeing and academic growth.",
        teacher: "Write a 500-word story about a teacher in Botswana implementing the SAMH-SWI dashboard to identify and support a struggling student. Focus on the ethical use of AI insights.",
        parent: "Write a 500-word story about a parent in Botswana receiving real-time alerts from the SAMH-SWI system and how it helped them reconnect with their child's education.",
        risk: "Write a 500-word story about a high-risk situation (e.g., bullying or absenteeism) detected by the SAMH-SWI AI, and how the ministry and school collaborated to resolve it safely."
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompts[type] }] }],
        config: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      });

      const story = response.text;
      if (story) {
        onStoryGenerated(story);
      } else {
        throw new Error("No story was generated.");
      }
    } catch (err: any) {
      console.error("Story generation failed:", err);
      setError(err.message || "Failed to generate story.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-black/5">
        <div className="p-6 border-b border-black/5 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-emerald-500" />
              SWI Story Generator
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generate 500-word rich narratives</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
              <ShieldAlert className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => generateStory('student')}
              disabled={isGenerating}
              className="p-6 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-3xl transition-all group text-left"
            >
              <div className="p-3 bg-white rounded-2xl w-fit mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-black text-emerald-900 mb-1">Student Narrative</h3>
              <p className="text-xs text-emerald-700 font-medium">Community & Ethics focused growth story</p>
            </button>

            <button
              onClick={() => generateStory('teacher')}
              disabled={isGenerating}
              className="p-6 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-3xl transition-all group text-left"
            >
              <div className="p-3 bg-white rounded-2xl w-fit mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-black text-indigo-900 mb-1">Teacher Insight</h3>
              <p className="text-xs text-indigo-700 font-medium">AI-driven support & intervention story</p>
            </button>

            <button
              onClick={() => generateStory('parent')}
              disabled={isGenerating}
              className="p-6 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-3xl transition-all group text-left"
            >
              <div className="p-3 bg-white rounded-2xl w-fit mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-black text-rose-900 mb-1">Parental Connection</h3>
              <p className="text-xs text-rose-700 font-medium">Real-time alert & reconnection story</p>
            </button>

            <button
              onClick={() => generateStory('risk')}
              disabled={isGenerating}
              className="p-6 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-3xl transition-all group text-left"
            >
              <div className="p-3 bg-white rounded-2xl w-fit mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-black text-amber-900 mb-1">Risk Mitigation</h3>
              <p className="text-xs text-amber-700 font-medium">Ministry-level safety & resolution story</p>
            </button>
          </div>

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-sm font-black text-slate-500 animate-pulse uppercase tracking-widest">Generating 500-word narrative...</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-black/5 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Powered by SWI Sovereign Intelligence Engine</p>
        </div>
      </div>
    </div>
  );
};
