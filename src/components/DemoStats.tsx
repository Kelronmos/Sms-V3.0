import React, { useState, useEffect } from 'react';
import { Users, Star, MessageSquare, TrendingUp, ShieldCheck, Globe, X, Send, Building2, School } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchDemoStats, fetchDemoFeedback, submitDemoFeedback, fetchDemoScale } from '../services/api';

export const DemoStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [scale, setScale] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [newFeedback, setNewFeedback] = useState({ name: '', role: '', rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [s, f, sc] = await Promise.all([fetchDemoStats(), fetchDemoFeedback(), fetchDemoScale()]);
      setStats(s);
      setFeedback(f);
      setScale(sc);
    } catch (err) {
      console.error("Failed to load demo stats", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.name || !newFeedback.comment) return;
    
    setIsSubmitting(true);
    try {
      await submitDemoFeedback(newFeedback);
      setShowFeedbackModal(false);
      setNewFeedback({ name: '', role: '', rating: 5, comment: '' });
      await loadData();
    } catch (err) {
      console.error("Failed to submit feedback", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="space-y-8">
      {/* Social Proof Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 flex items-center gap-4"
        >
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Demo Participants</p>
            <h3 className="text-3xl font-black text-slate-900">{stats?.demo_users?.toLocaleString()}</h3>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">↑ 12% this week</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 flex items-center gap-4"
        >
          <div className="bg-amber-50 p-4 rounded-2xl text-amber-600">
            <Star className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Average Rating</p>
            <h3 className="text-3xl font-black text-slate-900">{stats?.avg_rating}/5.0</h3>
            <div className="flex gap-0.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 flex items-center gap-4"
        >
          <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Feedback</p>
            <h3 className="text-3xl font-black text-slate-900">{stats?.total_comments?.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Verified User Reviews</p>
          </div>
        </motion.div>
      </div>

      {/* Testimonials Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">User Testimonials</h2>
          <button 
            onClick={() => setShowFeedbackModal(true)}
            className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <MessageSquare className="w-3 h-3" />
            Leave Feedback
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedback.map((f, i) => (
            <motion.div 
              key={f.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 relative group hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                  {f.user_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{f.user_name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium uppercase">{f.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[...Array(f.rating)].map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">"{f.comment}"</p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[8px] font-bold text-slate-300 uppercase">{new Date(f.timestamp).toLocaleDateString()}</span>
                <ShieldCheck className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xl font-black text-slate-900 uppercase">Share Your Experience</h3>
                <button onClick={() => setShowFeedbackModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Name</label>
                  <input 
                    type="text"
                    required
                    value={newFeedback.name}
                    onChange={(e) => setNewFeedback({...newFeedback, name: e.target.value})}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Role</label>
                  <input 
                    type="text"
                    required
                    value={newFeedback.role}
                    onChange={(e) => setNewFeedback({...newFeedback, role: e.target.value})}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none"
                    placeholder="e.g. Teacher, Parent, Admin"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button 
                        key={r}
                        type="button"
                        onClick={() => setNewFeedback({...newFeedback, rating: r})}
                        className={`p-2 rounded-lg transition-all ${newFeedback.rating >= r ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-300'}`}
                      >
                        <Star className={`w-6 h-6 ${newFeedback.rating >= r ? 'fill-amber-500' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Comment</label>
                  <textarea 
                    required
                    value={newFeedback.comment}
                    onChange={(e) => setNewFeedback({...newFeedback, comment: e.target.value})}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none min-h-[100px]"
                    placeholder="What do you think about the SWI system?"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scale Visualization */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">
              <Globe className="w-3 h-3" />
              National Scale Infrastructure
            </div>
            <h2 className="text-4xl font-black tracking-tight leading-none uppercase">
              Supporting <span className="text-emerald-400">990,000+</span> Students Nationwide
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              The SWI platform is built to handle massive data streams from every district, providing real-time wellness insights for nearly a million students across 300,000 schools.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <School className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Schools</span>
                </div>
                <div className="text-2xl font-black">300K+</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Building2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Districts</span>
                </div>
                <div className="text-2xl font-black">42</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Regional Distribution</div>
            {scale.map((region, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300 uppercase">{region.region}</span>
                  <span className="text-emerald-400">{region.students.toLocaleString()} Students</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(region.students / 312000) * 100}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                  />
                </div>
                <div className="flex gap-4 text-[9px] text-slate-500 font-bold uppercase">
                  <span>{region.schools.toLocaleString()} Schools</span>
                  <span>{region.districts} Districts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>
    </div>
  );
};
