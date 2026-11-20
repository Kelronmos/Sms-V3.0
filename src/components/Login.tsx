import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole } from '../types';
import { Lock, User as UserIcon, ShieldCheck, GraduationCap, Users, Building, Landmark, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { registerUser, demoLogin, getSimulatedUserCount } from '../services/api';
import { syncUserWithFirebase, signInWithGoogle, signInWithApple, signInAnonymouslyFunc } from '../firebase';

export const Login: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [groupId, setGroupId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userCount] = useState(getSimulatedUserCount());
  const [showWelcome, setShowWelcome] = useState<{ show: boolean, userNumber: number, role: string }>({ show: false, userNumber: 0, role: '' });
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempUser, setTempUser] = useState<User | null>(null);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const data = await demoLogin(selectedRole);
      if (data.success) {
        // Use anonymous login for demo as requested
        await signInAnonymouslyFunc();
        // We still sync to ensure the user doc exists in Firestore with the right role
        await syncUserWithFirebase(data.user);
        
        const userNumber = parseInt(data.user.username.split('_').pop() || '0');
        setShowWelcome({ show: true, userNumber, role: selectedRole });
        
        // Delay the actual login to show the welcome message
        setTimeout(() => {
          onLogin(data.user);
        }, 3000);
      }
    } catch (err) {
      setError('Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fbUser = await signInWithApple();
      const response = await fetch(`/api/user/by-email?email=${fbUser.email}`);
      if (response.ok) {
        const userData = await response.json();
        await syncUserWithFirebase(userData);
        onLogin(userData);
      } else {
        setError("Apple account not linked to a system profile. Please register first or use Demo access.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fbUser = await signInWithGoogle();
      // For Google login, we might need to find or create a local user
      // For now, we'll try to find a user with this email or create a default one
      const response = await fetch(`/api/user/by-email?email=${fbUser.email}`);
      if (response.ok) {
        const userData = await response.json();
        await syncUserWithFirebase(userData);
        onLogin(userData);
      } else {
        // If user doesn't exist locally, we might need to register them
        // For simplicity in this demo, we'll show an error or auto-create a student profile
        setError("Google account not linked to a system profile. Please register first or use Demo access.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegistering) {
        const data = await registerUser({
          username,
          password,
          role: selectedRole,
          full_name: fullName,
          school_id: groupId,
        });
        if (data.success) {
          // Enforce password change for new users
          if (data.user.must_change_password) {
            setTempUser(data.user);
            setNeedsPasswordChange(true);
          } else {
            await syncUserWithFirebase(data.user);
            onLogin(data.user);
          }
        } else {
          setError(data.message || 'Registration failed');
        }
      } else {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (data.success) {
          // Enforce password change if required
          if (data.user.must_change_password) {
            setTempUser(data.user);
            setNeedsPasswordChange(true);
          } else {
            await syncUserWithFirebase(data.user);
            onLogin(data.user);
          }
        } else {
          setError(data.message || 'Login failed');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Connection error or Firebase sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      if (tempUser) {
        // Call the API to update the password
        const res = await fetch('/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: tempUser.id, newPassword }),
        });
        const data = await res.json();
        if (data.success) {
          await syncUserWithFirebase(tempUser);
          onLogin(tempUser);
        } else {
          setError(data.message || 'Failed to update password');
        }
      }
    } catch (err) {
      setError('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { role: UserRole; icon: any; label: string }[] = [
    { role: 'student', icon: GraduationCap, label: 'Student' },
    { role: 'parent', icon: Users, label: 'Parent' },
    { role: 'teacher', icon: UserIcon, label: 'Teacher' },
    { role: 'school_admin', icon: ShieldCheck, label: 'Admin' },
    { role: 'district', icon: Building, label: 'District' },
    { role: 'ministry', icon: Landmark, label: 'Ministry' },
    { role: 'counselor', icon: ShieldCheck, label: 'Counselor' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      {!navigator.onLine && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full border border-amber-100 shadow-sm animate-pulse">
          <div className="w-2 h-2 bg-amber-500 rounded-full" />
          <span className="text-xs font-bold uppercase tracking-widest">Offline Mode Active</span>
        </div>
      )}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
      >
        {/* Left Side: Branding */}
        <div className="bg-black p-12 text-white md:w-2/5 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-emerald-500 w-8 h-8 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-black" />
              </div>
              <span className="text-2xl font-black tracking-tighter">SAMH SWI</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              {isRegistering ? 'Join the' : 'Student Wellbeing'} <br />
              <span className="text-emerald-400">{isRegistering ? 'Community' : 'Monitoring System'}</span>
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              {isRegistering 
                ? 'Create your account to start tracking wellbeing, accessing AI guidance, and monitoring student progress in real-time.'
                : 'Integrated SWI AI assistant providing personalized guidance, security advice, and real-time insights for students, parents, and educators.'}
            </p>
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === (isRegistering ? 1 : 0) ? 'bg-emerald-400' : 'bg-white/20'}`} />
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Powered by SWI OS & Gemini AI
            </p>
          </div>

          {/* Decorative background element */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="absolute top-12 right-12 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Active Users</p>
            <p className="text-2xl font-black text-emerald-400">{(userCount / 1000000).toFixed(1)}M+</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-12 md:w-3/5 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {needsPasswordChange ? (
              <motion.div 
                key="password-change"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-slate-900">Security Update Required</h2>
                  <p className="text-slate-500 text-sm mt-2">
                    Please set a new secure password for your account to continue.
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password"
                        className="w-full bg-slate-50 border-none rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black outline-none"
                        required
                      />
                    </div>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        className="w-full bg-slate-50 border-none rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black outline-none"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white rounded-xl py-4 font-bold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-black/10"
                  >
                    {isLoading ? 'Updating...' : 'Update Password & Continue'}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="mb-8 flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{isRegistering ? 'Create Account' : 'Sign In'}</h2>
                    <p className="text-slate-500 text-sm">
                      {isRegistering ? 'Fill in your details to get started' : 'Select your portal and enter credentials'}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setError('');
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                  >
                    {isRegistering ? 'Already have an account?' : 'Need an account?'}
                  </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
                    {roles.map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => setSelectedRole(r.role)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all group ${
                          selectedRole === r.role ? 'border-black bg-slate-50' : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <r.icon className={`w-5 h-5 ${selectedRole === r.role ? 'text-black' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span className={`text-[8px] font-bold uppercase ${selectedRole === r.role ? 'text-black' : 'text-slate-400'}`}>
                          {r.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {isRegistering && (
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black outline-none"
                          required
                        />
                      </div>
                    )}
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={isRegistering ? "Choose Username" : "ID / Cell Number / Username"}
                        className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black outline-none"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black outline-none"
                        required
                      />
                    </div>
                    {isRegistering && selectedRole !== 'ministry' && (
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={groupId}
                          onChange={(e) => setGroupId(e.target.value)}
                          placeholder={selectedRole === 'district' ? "District ID" : "School ID"}
                          className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black outline-none"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100"
                    >
                      {error}
                    </motion.p>
                  )}

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-black text-white rounded-xl py-4 font-bold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isLoading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Access Portal')}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                      </button>
                      
                      {!isRegistering && (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={handleDemoLogin}
                            disabled={isLoading}
                            className="flex-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl py-4 font-bold hover:bg-emerald-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Demo: {roles.find(r => r.role === selectedRole)?.label}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const randomRole = roles[Math.floor(Math.random() * roles.length)].role;
                              setSelectedRole(randomRole);
                              // Small delay to show the role change
                              setTimeout(handleDemoLogin, 100);
                            }}
                            disabled={isLoading}
                            className="flex-1 bg-slate-900 text-white rounded-xl py-4 font-bold hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <UserIcon className="w-4 h-4" />
                            Random Demo
                          </button>
                        </div>
                      )}
                    </div>

                    {!isRegistering && (
                      <>
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          disabled={isLoading}
                          className="w-full bg-white text-slate-700 border border-slate-200 rounded-xl py-4 font-bold hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                          Continue with Google
                        </button>

                        <button
                          type="button"
                          onClick={handleAppleLogin}
                          disabled={isLoading}
                          className="w-full bg-black text-white rounded-xl py-4 font-bold hover:bg-slate-900 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
                            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                          </svg>
                          Continue with Apple
                        </button>
                      </>
                    )}
                  </div>

                  {!isRegistering && (
                    <div className="text-center space-y-4">
                      <a href="#" className="text-xs text-slate-400 hover:text-black transition-colors block">
                        Forgot credentials or need SSO help?
                      </a>
                      
                      <div className="pt-4 border-t border-black/5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Demo Credentials</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-slate-50 rounded-lg text-center">
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Username</p>
                            <p className="text-[10px] font-black">Admin</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg text-center">
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Password</p>
                            <p className="text-[10px] font-black">demo123</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showWelcome.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center space-y-8 shadow-2xl"
            >
              <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto">
                <Sparkles className="w-12 h-12 text-emerald-600" />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-tighter text-slate-900">Welcome to the Simulation</h2>
                <p className="text-lg text-slate-500 font-medium">
                  Thank you for being user <span className="text-emerald-600 font-black">#{showWelcome.userNumber.toLocaleString()}</span> on our platform.
                </p>
                <div className="inline-block px-6 py-2 bg-slate-100 rounded-full text-xs font-black uppercase tracking-widest text-slate-600">
                  Role: {showWelcome.role}
                </div>
              </div>

              <div className="pt-8 space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initializing Live Simulation Workspace...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
