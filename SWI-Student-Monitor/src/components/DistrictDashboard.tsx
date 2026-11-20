import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Building2, Users, Shield, 
  TrendingUp, FileText, Globe2,
  Map, BarChart3, Bell, AlertCircle,
  CheckCircle2, Search, Filter, Plus,
  Send, X, Info, Clock
} from 'lucide-react';
import { fetchRegionalInsights, fetchApprovalRequests, submitApprovalRequest, updateApprovalStatus } from '../services/api';
import { User, ApprovalRequest } from '../types';
import { PolicyUpload } from './PolicyUpload';
import { Gauge } from './Gauge';
import { AdminDashboard } from './AdminDashboard';
import { SecurityScanner } from './SecurityScanner';
import { onSnapshot, collection, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

interface DistrictDashboardProps {
  user: User;
}

export const DistrictDashboard: React.FC<DistrictDashboardProps> = ({ user }) => {
  const [regionalData, setRegionalData] = useState<any>(null);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'performance' | 'policy' | 'safety' | 'approvals' | 'schools'>('performance');
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({ type: 'staff_assignment', description: '', targetId: '' });
  const [filterSchool, setFilterSchool] = useState('All Schools');

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Clean up existing Firestore listeners on auth change
      // But NOT the auth listener itself!
      unsubscribes.forEach(unsub => {
        if (unsub !== unsubscribeAuth) unsub();
      });
      // Filter out the closed listeners but keep the auth listener
      unsubscribes.push(unsubscribeAuth);

      if (!fbUser) {
        console.log('No Firebase user, using API fallbacks for DistrictDashboard');
        const loadData = async () => {
          try {
            const [data, approvalData] = await Promise.all([
              fetchRegionalInsights(user.region || 'National'),
              fetchApprovalRequests('district', user.id.toString())
            ]);
            setRegionalData(data);
            setApprovals(approvalData);
          } catch (err) {
            console.error(err);
          }
        };
        loadData();
        return;
      }

      try {
        console.log('Firebase auth ready, setting up Firestore listeners for DistrictDashboard');
        
        // Ensure user doc exists before querying (prevents getUsername() failure in rules)
        const userDocRef = doc(db, 'users', fbUser.uid);
        let userDoc = await getDoc(userDocRef);
        
        // Retry a few times if not found (sync might be in progress)
        let retries = 0;
        while (!userDoc.exists() && retries < 5) {
          await new Promise(resolve => setTimeout(resolve, 500));
          userDoc = await getDoc(userDocRef);
          retries++;
        }

        if (!userDoc.exists()) {
          console.warn('User document not found in Firestore after retries. Permissions might fail.');
        }

        const approvalsQuery = query(
          collection(db, 'approvals'),
          where('requesterRole', '==', 'district'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        
        const unsubApprovals = onSnapshot(approvalsQuery, (snapshot) => {
          const approvalData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as unknown as ApprovalRequest[];
          setApprovals(approvalData);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'approvals');
        });
        unsubscribes.push(unsubApprovals);

        // Regional insights are usually static or updated by ministry, but we can listen if needed
        fetchRegionalInsights(user.region || 'National').then(setRegionalData).catch(console.error);
      } catch (err) {
        console.error('Error setting up DistrictDashboard listeners:', err);
      }
    });

    unsubscribes.push(unsubscribeAuth);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user.region, user.id]);

  const handleRequestSubmit = async () => {
    try {
      await submitApprovalRequest({
        ...requestData,
        requesterId: user.id.toString(),
        requesterRole: 'district',
        status: 'pending',
        timestamp: new Date().toISOString()
      });
      setShowRequestModal(false);
      // Refresh approvals
      const updated = await fetchApprovalRequests('district', user.id.toString());
      setApprovals(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const stats = [
    { label: 'Schools in District', value: regionalData?.total_schools?.toLocaleString() || '7,142', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Students', value: regionalData?.total_students?.toLocaleString() || '23,571', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total Teachers', value: regionalData?.total_teachers?.toLocaleString() || '11,904', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Total Parents', value: regionalData?.total_parents?.toLocaleString() || '17,857', icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">District Oversight</h2>
          <p className="text-slate-500">Monitoring regional performance and policy implementation</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-black/5 rounded-2xl px-4 py-2 shadow-sm">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select 
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="text-sm font-bold bg-transparent outline-none"
            >
              <option>All Schools</option>
              <option>Central High</option>
              <option>West Academy</option>
              <option>North Secondary</option>
            </select>
          </div>
          <button 
            onClick={() => setShowRequestModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Initiate Change
          </button>
          <button className="px-6 py-3 bg-black text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
            <Globe2 className="w-4 h-4" />
            District Map
          </button>
        </div>
      </div>

      {/* Security Oversight */}
      <SecurityScanner />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 hover:shadow-xl transition-shadow"
          >
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-black/5 overflow-x-auto pb-px">
        {[
          { id: 'performance', label: 'Performance', icon: BarChart3 },
          { id: 'schools', label: 'Schools', icon: Building2 },
          { id: 'approvals', label: 'Teacher Approvals', icon: CheckCircle2 },
          { id: 'policy', label: 'Policy Status', icon: FileText },
          { id: 'safety', label: 'Safety Index', icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? 'text-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="district-tab-active"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" 
              />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'schools' && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                  {!selectedSchool ? (
                    <>
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-500" />
                            District Schools
                          </h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage and Drill Down into School Operations</p>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Search schools..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-black/5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {regionalData?.rankings?.filter((s: any) => s.school.toLowerCase().includes(searchQuery.toLowerCase())).map((school: any, idx: number) => (
                          <motion.div 
                            key={idx}
                            onClick={() => setSelectedSchool(school.school)}
                            whileHover={{ y: -5 }}
                            className="p-6 bg-slate-50 rounded-2xl border border-black/5 hover:bg-white hover:shadow-xl transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                {school.school[0]}
                              </div>
                              <span className="text-[8px] font-black px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full uppercase">Rank #{school.rank}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{school.school}</h4>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Performance: {school.performance || 'A'}</p>
                            <div className="mt-4 flex justify-between items-center">
                              <span className="text-[10px] text-slate-400">42 Teachers • 850 Students</span>
                              <span className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">Drill Down →</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setSelectedSchool(null)}
                          className="text-xs font-bold text-slate-400 hover:text-black flex items-center gap-2"
                        >
                          ← Back to Schools
                        </button>
                        <h3 className="text-xl font-bold">{selectedSchool}</h3>
                      </div>
                      <div className="border border-black/5 rounded-3xl p-6 bg-slate-50/50">
                        <AdminDashboard user={{ ...user, role: 'school_admin', full_name: `Admin of ${selectedSchool}` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'policy' && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        District Policy Ingestion
                      </h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Upload regional bylaws and resource allocations</p>
                    </div>
                  </div>
                  <PolicyUpload level="district" />
                </div>
              )}

              {activeTab === 'approvals' && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                        District Change Requests
                      </h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Pending School Admin Approval</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {approvals.length > 0 ? approvals.map((req) => (
                      <motion.div 
                        key={req.id} 
                        whileHover={{ y: -2 }}
                        className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-black/5 gap-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                              req.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              {req.type[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold capitalize">{req.type.replace('_', ' ')}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Request ID: {req.id.slice(0, 8)}</p>
                            </div>
                          </div>
                          <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                            req.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-black/5">{req.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                            <Clock className="w-3 h-3" />
                            {new Date(req.timestamp).toLocaleString()}
                          </div>
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <button className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Cancel</button>
                              <button className="px-3 py-1 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Remind Admin</button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )) : (
                      <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                        <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No active change requests.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          {/* District Health Gauge */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">District Safety Index</h3>
            <Gauge 
              value={96} 
              label="Safety Index" 
              size="lg" 
              showSynth={true}
            />
            <div className="mt-6 text-center">
              <p className="text-lg font-black text-indigo-500 uppercase tracking-tighter">Secure</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">District Compliance Score</p>
            </div>
          </div>

          <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-300" />
              Policy Rollout Status
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <p className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Digital Safety Act</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/10 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[85%]" />
                  </div>
                  <span className="text-[10px] font-black">85%</span>
                </div>
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <p className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Wellbeing Framework</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/10 h-1 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[40%]" />
                  </div>
                  <span className="text-[10px] font-black">40%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-500" />
              District Alerts
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5" />
                <p className="text-[10px] font-bold text-rose-700">2 Schools reporting high stress levels.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-600" />
                  Request Change
                </h2>
                <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <p className="text-slate-500 text-sm">Any change initiated at the district level requires explicit approval from the School Admin.</p>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Change Type</label>
                  <select 
                    value={requestData.type}
                    onChange={(e) => setRequestData({ ...requestData, type: e.target.value })}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="staff_assignment">Staff Assignment</option>
                    <option value="curriculum_update">Curriculum Update</option>
                    <option value="resource_allocation">Resource Allocation</option>
                    <option value="policy_override">Policy Override</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target School/Entity ID</label>
                  <input 
                    type="text"
                    value={requestData.targetId}
                    onChange={(e) => setRequestData({ ...requestData, targetId: e.target.value })}
                    placeholder="e.g. SCHOOL_001"
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Justification</label>
                  <textarea 
                    value={requestData.description}
                    onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                    placeholder="Provide details for the school admin..."
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none h-32 resize-none"
                  />
                </div>
              </div>
              <button 
                onClick={handleRequestSubmit}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Send className="w-4 h-4" />
                SUBMIT FOR APPROVAL
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
