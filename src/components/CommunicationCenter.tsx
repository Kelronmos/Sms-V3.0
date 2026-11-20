import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, ShieldCheck, User as UserIcon, Clock, CheckCircle, XCircle } from 'lucide-react';
import { User, Communication } from '../types';
import { sendCommunication, fetchStudentComms, fetchReviewQueue, approveCommunication } from '../services/api';

const generateInteractiveUI = (studentId: string, alertType: string, resourceId: string) => {
  const sourceRoot = `https://smai.gaborone.edu/governance/${studentId}`;
  
  const uiMap: Record<string, [string, string, string]> = {
    "assignment": ["📝", "ᴀssɪɢɴᴍᴇɴᴛ ᴍᴇᴍᴏ", "E1.1"],
    "attendance": ["🕒", "ᴀᴛᴛᴇɴᴅᴀɴᴄᴇ ʟᴏɢs", "L2.2"],
    "ethics":     ["🛡️", "ᴇᴛʜɪᴄᴀʟ ᴀᴜᴅɪᴛ", "G7.0"],
    "wellbeing":  ["📈", "ᴘʀᴏɢʀᴇss sᴘʜᴇʀᴇ", "H1.2"]
  };
  
  const [emoji, label, module] = uiMap[alertType] || ["🔹", "sʏsᴛᴇᴍ ᴅᴇᴛᴀɪʟ", "O1.1"];
  
  return {
    emoji,
    label,
    module,
    link: `${sourceRoot}/${resourceId}`
  };
};

interface CommunicationCenterProps {
  user: User;
  studentId: string;
}

export const CommunicationCenter: React.FC<CommunicationCenterProps> = ({ user, studentId }) => {
  const [comms, setComms] = useState<Communication[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Communication[]>([]);
  const [message, setMessage] = useState('');
  const [visibility, setVisibility] = useState<'private_note' | 'shared_log' | 'student_direct'>('shared_log');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComms();
    if (user.role === 'counselor') {
      loadReviewQueue();
    }

    // WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_COMMUNICATION' && data.student_id === studentId) {
          setComms(prev => {
            // Avoid duplicates
            if (prev.some(c => c.id === data.communication.id)) return prev;
            return [data.communication, ...prev];
          });
        } else if (data.type === 'COMM_APPROVED') {
          loadComms();
          if (user.role === 'counselor') loadReviewQueue();
        } else if (data.type === 'NEW_REVIEW_PENDING' && user.role === 'counselor') {
          loadReviewQueue();
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    return () => {
      socket.close();
    };
  }, [studentId, user.role]);

  const loadComms = async () => {
    try {
      const data = await fetchStudentComms(studentId, user.role, user.id);
      setComms(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Failed to load comms:", err);
      setError("Failed to load communication history.");
    }
  };

  const loadReviewQueue = async () => {
    try {
      const data = await fetchReviewQueue();
      setReviewQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load review queue:", err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      await sendCommunication({
        student_id: studentId,
        sender_id: user.username,
        receiver_id: visibility === 'student_direct' ? studentId : 'parent',
        visibility,
        content: message
      });
      setMessage('');
      loadComms();
    } catch (err) {
      console.error(err);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (commId: string) => {
    await approveCommunication(commId, user.username);
    loadReviewQueue();
    loadComms();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col h-[600px]"
    >
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          Communication Center
        </h3>
        {user.role === 'counselor' && reviewQueue.length > 0 && (
          <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-full animate-pulse">
            {reviewQueue.length} PENDING REVIEWS
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {error && (
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center gap-2 mb-4">
            <XCircle className="w-4 h-4 text-rose-500" />
            <p className="text-[10px] text-rose-700 font-bold">{error}</p>
          </div>
        )}
        {user.role === 'counselor' && reviewQueue.length > 0 && (
          <div className="mb-8 space-y-4">
            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Review Queue (SME Gate)</h4>
            {reviewQueue.map((c) => (
              <div key={c.id} className="bg-amber-50 border border-amber-100 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-900">{c.sender_id} → {c.receiver_id}</span>
                  </div>
                  <span className="text-[8px] font-bold text-amber-400 uppercase">{new Date(c.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-amber-800 italic">"{c.content}"</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApprove(c.id)}
                    className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                  <button className="flex-1 bg-rose-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            ))}
            <div className="h-px bg-slate-100 my-6" />
          </div>
        )}

        <AnimatePresence initial={false}>
          {comms.map((c) => (
            <motion.div 
              key={c.id} 
              initial={{ opacity: 0, x: c.sender_id === user.username ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex flex-col ${c.sender_id === user.username ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                c.sender_id === user.username 
                  ? 'bg-black text-white rounded-tr-none' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-black uppercase opacity-60">
                    {c.visibility.replace('_', ' ')}
                  </span>
                  {c.visibility === 'shared_log' && (
                    <span className={`text-[8px] font-black uppercase ${c.is_reviewed ? 'text-emerald-400' : 'text-amber-400'}`}>
                      • {c.is_reviewed ? 'Verified' : 'Pending Review'}
                    </span>
                  )}
                </div>
                <p className="text-sm">{c.content}</p>
                
                {/* Artistic Interactive UI for specific message patterns */}
                {c.content.includes('[ALERT:') && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    {(() => {
                      const match = c.content.match(/\[ALERT: (\w+) ID: (\w+)\]/);
                      if (match) {
                        const [, type, id] = match;
                        const ui = generateInteractiveUI(studentId, type.toLowerCase(), id);
                        return (
                          <motion.a 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            href={ui.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/5"
                          >
                            <span className="text-xl">{ui.emoji}</span>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{ui.module}</p>
                              <p className="text-xs font-bold">{ui.label}: {id}</p>
                            </div>
                          </motion.a>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between opacity-40">
                  <span className="text-[8px] font-bold">{c.sender_id}</span>
                  <span className="text-[8px] font-bold">{new Date(c.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSend} className="p-6 border-t border-slate-100 space-y-4">
        <div className="flex gap-2">
          {(['shared_log', 'private_note', 'student_direct'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                visibility === v ? 'bg-black text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
            >
              {v.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};
