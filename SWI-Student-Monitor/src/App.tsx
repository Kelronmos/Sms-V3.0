import React, { useState, useEffect } from 'react';
import { User } from './types';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { auth, syncUserWithFirebase } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { preloadOfflineData } from './services/api';
import { LiveCount } from './components/LiveCount';
import { ReportsPanel } from './components/ReportsPanel';
import { StoryGenerator } from './components/StoryGenerator';
import { BookOpen, X, BrainCircuit, Sparkles, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showStoryGenerator, setShowStoryGenerator] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showReports, setShowReports] = useState(false);

  // Check for existing session
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('samh_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        try {
          // Sync with Firebase to ensure request.auth is populated for Firestore
          await syncUserWithFirebase(userData);
          setUser(userData);
          // Preload data for offline use
          preloadOfflineData(userData.role === 'student' ? userData.username : undefined);
        } catch (err) {
          console.error('Failed to sync saved user with Firebase:', err);
          // If sync fails, maybe the session is invalid
          localStorage.removeItem('samh_user');
        }
      }
      setIsAuthReady(true);
    };

    initAuth();
  }, []);

  // Listen for Firebase Auth changes to keep state in sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser && user) {
        // If Firebase session is lost but we have a local user, try to re-sync
        syncUserWithFirebase(user).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('samh_user', JSON.stringify(userData));
    // Preload data for offline use
    preloadOfflineData(userData.role === 'student' ? userData.username : undefined);
    
    // Show welcome modal for demo users
    if (userData.is_demo) {
      setShowWelcome(true);
    }
  };

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem('samh_user');
    await auth.signOut();
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="relative min-h-screen">
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-12 max-w-lg w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
              <div className="bg-emerald-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Sparkles className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-4xl font-black tracking-tight mb-4">Demo Session</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                This session uses <span className="text-emerald-600 font-black">synthetic demonstration data</span>. It is not a real account and does not represent real students or institutions.
              </p>
              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-black/5">
                <div className="flex items-center gap-3 text-left">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Persisted accounts (excludes synthetic &amp; demo)</p>
                    <p className="text-sm font-bold">Live: <LiveCount /></p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowWelcome(false)}
                className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
              >
                Enter Dashboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setShowReports(true)}
        className="fixed bottom-6 left-6 z-50 px-4 py-3 bg-black text-white rounded-full shadow-2xl font-black text-[10px] uppercase tracking-widest"
      >
        Reports
      </button>
      {showReports && <ReportsPanel user={user} onClose={() => setShowReports(false)} />}

      {user.role === 'teacher' && (
        <button
          onClick={() => setShowStoryGenerator(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-500 text-white rounded-full shadow-2xl hover:bg-emerald-600 transition-all hover:scale-110 group flex items-center gap-2"
          title="Generate SWI Story"
        >
          <BookOpen className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-black uppercase text-[10px] tracking-widest">
            Generate SWI Story
          </span>
        </button>
      )}

      {showStoryGenerator && (
        <StoryGenerator
          onStoryGenerated={(story) => {
            setGeneratedStory(story);
            setShowStoryGenerator(false);
          }}
          onClose={() => setShowStoryGenerator(false)}
        />
      )}

      {generatedStory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-black/5 flex flex-col">
            <div className="p-6 border-b border-black/5 flex items-center justify-between bg-emerald-50">
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <BrainCircuit className="w-6 h-6 text-emerald-600" />
                  Generated SWI Narrative
                </h2>
                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">500-word rich narrative</p>
              </div>
              <button onClick={() => setGeneratedStory(null)} className="p-2 hover:bg-emerald-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none">
              <div className="markdown-body">
                <ReactMarkdown>{generatedStory}</ReactMarkdown>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-black/5 flex justify-end gap-4">
              <button
                onClick={() => setGeneratedStory(null)}
                className="px-6 py-2 bg-white border border-black/5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([generatedStory], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'swi-story.txt';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-colors"
              >
                Download Story
              </button>
            </div>
          </div>
        </div>
      )}

      {user.role === 'teacher' ? (
        <TeacherDashboard user={user} onLogout={handleLogout} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}
