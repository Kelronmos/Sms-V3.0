import React, { useState } from 'react';
import { Smile, Meh, Frown, AlertTriangle, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { submitMetrics } from '../services/api';

interface DailyCheckInProps {
  studentId: string;
  onSuccess: () => void;
}

export const DailyCheckIn: React.FC<DailyCheckInProps> = ({ studentId, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [isSafe, setIsSafe] = useState<boolean | null>(null);
  const [wantsToTalk, setWantsToTalk] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Map feeling to mood_score
      const moodMap: Record<string, number> = {
        'very_good': 5,
        'good': 4,
        'neutral': 3,
        'stressed': 2,
        'overwhelmed': 1
      };
      
      await submitMetrics({
        student_id: studentId,
        mood_score: moodMap[feeling || 'neutral'],
        stress_score: feeling === 'stressed' || feeling === 'overwhelmed' ? 4 : 2,
        attendance: 1,
        engagement_hours: 4,
        module_completion: 0.8,
        journal_text: `Daily check-in: Feeling ${feeling}. Safe: ${isSafe}. Wants to talk: ${wantsToTalk}.`,
        sleep_hours: 8,
        extracurricular_participation: 1,
        self_reported_wellbeing: isSafe ? 8 : 4,
        behavior_patterns: 'stable'
      });
      
      setIsDone(true);
      onSuccess();
    } catch (err) {
      console.error("Failed to submit check-in", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col items-center justify-center text-center space-y-4 h-full"
      >
        <div className="bg-emerald-100 p-4 rounded-full">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Check-In Complete!</h3>
        <p className="text-slate-500 text-sm">Thank you for sharing how you feel. Your wellbeing is our priority.</p>
        <button 
          onClick={() => setIsDone(false)}
          className="text-indigo-600 font-bold text-sm hover:underline"
        >
          Do another check-in?
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Smile className="w-5 h-5 text-amber-500" />
          Daily Check-In
        </h3>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className={`w-8 h-1 rounded-full transition-all ${step >= i ? 'bg-indigo-500' : 'bg-slate-100'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 flex-1"
          >
            <p className="text-slate-600 font-medium">How are you feeling today?</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'very_good', label: 'Very good', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { id: 'good', label: 'Good', icon: Smile, color: 'text-blue-500', bg: 'bg-blue-50' },
                { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-slate-500', bg: 'bg-slate-50' },
                { id: 'stressed', label: 'Stressed', icon: Frown, color: 'text-amber-500', bg: 'bg-amber-50' },
                { id: 'overwhelmed', label: 'Overwhelmed', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' },
              ].map((option) => (
                <button 
                  key={option.id} 
                  onClick={() => {
                    setFeeling(option.id);
                    setStep(2);
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:scale-105 ${feeling === option.id ? 'ring-2 ring-indigo-500' : ''} ${option.bg}`}
                >
                  <option.icon className={`w-6 h-6 ${option.color}`} />
                  <span className="text-[8px] font-bold uppercase text-slate-500">{option.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 flex-1"
          >
            <p className="text-slate-600 font-medium">Do you feel safe at school today?</p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setIsSafe(true);
                  setStep(3);
                }}
                className={`flex-1 py-4 rounded-2xl font-bold transition-all ${isSafe === true ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Yes, I feel safe
              </button>
              <button 
                onClick={() => {
                  setIsSafe(false);
                  setStep(3);
                }}
                className={`flex-1 py-4 rounded-2xl font-bold transition-all ${isSafe === false ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                No, I don't
              </button>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 font-bold hover:text-slate-600"
            >
              ← Back
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 flex-1"
          >
            <p className="text-slate-600 font-medium">Would you like to talk to a counselor?</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setWantsToTalk(true)}
                className={`flex-1 py-4 rounded-2xl font-bold transition-all ${wantsToTalk === true ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Yes, please
              </button>
              <button 
                onClick={() => setWantsToTalk(false)}
                className={`flex-1 py-4 rounded-2xl font-bold transition-all ${wantsToTalk === false ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Not right now
              </button>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || wantsToTalk === null}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Complete Check-In
                  </>
                )}
              </button>
            </div>
            <button 
              onClick={() => setStep(2)}
              className="text-xs text-slate-400 font-bold hover:text-slate-600"
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
