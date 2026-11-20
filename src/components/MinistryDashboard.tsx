import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Shield, TrendingUp, FileText, 
  BarChart3, Bell, AlertCircle, CheckCircle2,
  Search, Filter, Landmark, Globe2,
  PieChart, Activity, Zap, Map as MapIcon,
  ChevronRight, Info
} from 'lucide-react';
import { fetchRegionalInsights, fetchNationalInsights, fetchDistricts } from '../services/api';
import { User, District } from '../types';
import { PolicyUpload } from './PolicyUpload';
import { NationalMap } from './NationalMap';
import { DistrictDashboard } from './DistrictDashboard';
import { Gauge } from './Gauge';
import { SecurityScanner } from './SecurityScanner';
import { onSnapshot, collection, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, onAuthStateChanged } from '../firebase';

interface MinistryDashboardProps {
  user: User;
}

export const MinistryDashboard: React.FC<MinistryDashboardProps> = ({ user }) => {
  const [nationalData, setNationalData] = useState<any>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [activeTab, setActiveTab] = useState<'governance' | 'monitoring' | 'policy' | 'approvals' | 'students' | 'districts'>('governance');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('All Districts');

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
        console.log('No Firebase user, using API fallbacks for MinistryDashboard');
        const loadData = async () => {
          try {
            const [regData, natData, distData] = await Promise.all([
              fetchRegionalInsights('National'),
              fetchNationalInsights(),
              fetchDistricts()
            ]);
            setNationalData({ ...regData, ...natData });
            setDistricts(distData);
          } catch (err) {
            console.error(err);
          }
        };
        loadData();
        return;
      }

      try {
        console.log('Firebase auth ready, setting up Firestore listeners for MinistryDashboard');
        
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

        const districtsQuery = query(collection(db, 'districts'), orderBy('name', 'asc'));
        const unsubDistricts = onSnapshot(districtsQuery, (snapshot) => {
          const dData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as unknown as District[];
          setDistricts(dData);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'districts');
        });
        unsubscribes.push(unsubDistricts);

        // National data is usually aggregated, we can fetch it once or listen to a summary doc
        fetchNationalInsights().then(setNationalData).catch(console.error);
      } catch (err) {
        console.error('Error setting up MinistryDashboard listeners:', err);
      }
    });

    unsubscribes.push(unsubscribeAuth);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const stats = [
    { label: 'Total Students', value: nationalData?.total_students?.toLocaleString() || '990,000', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Teachers', value: nationalData?.total_teachers?.toLocaleString() || '500,000', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total Schools', value: nationalData?.total_schools?.toLocaleString() || '300,000', icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Total Parents', value: nationalData?.total_parents?.toLocaleString() || '750,000', icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">National Governance</h2>
          <p className="text-slate-500">Monitoring national education trends and policy impact</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-black/5 rounded-2xl px-4 py-2 shadow-sm">
            <Landmark className="w-4 h-4 text-slate-400" />
            <select 
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="text-sm font-bold bg-transparent outline-none"
            >
              <option>All Districts</option>
              {districts.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <button className="px-6 py-3 bg-black text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
            <Globe2 className="w-4 h-4" />
            National Map
          </button>
        </div>
      </div>

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
          { id: 'governance', label: 'Governance', icon: Globe },
          { id: 'districts', label: 'Districts', icon: Landmark },
          { id: 'approvals', label: 'Staff Approvals', icon: CheckCircle2 },
          { id: 'students', label: 'Student Lookup', icon: Search },
          { id: 'monitoring', label: 'Monitoring', icon: Activity },
          { id: 'policy', label: 'Policy Impact', icon: FileText },
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
                layoutId="ministry-tab-active"
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
              {activeTab === 'districts' && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                  {!selectedDistrict ? (
                    <>
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-indigo-500" />
                            National Districts
                          </h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Drill Down into Regional Operations</p>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Search districts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-black/5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {districts.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map((district, idx) => (
                          <motion.div 
                            key={idx}
                            onClick={() => setSelectedDistrict(district.name)}
                            whileHover={{ y: -5 }}
                            className="p-6 bg-slate-50 rounded-2xl border border-black/5 hover:bg-white hover:shadow-xl transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                {district.name[0]}
                              </div>
                              <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase ${
                                district.performance === 'A' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                {district.performance} Status
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{district.name} District</h4>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{district.school_count} Schools • {district.student_count} Students</p>
                            <div className="mt-4 flex justify-between items-center">
                              <span className="text-[10px] text-slate-400">Compliance: {district.compliance}%</span>
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
                          onClick={() => setSelectedDistrict(null)}
                          className="text-xs font-bold text-slate-400 hover:text-black flex items-center gap-2"
                        >
                          ← Back to Districts
                        </button>
                        <h3 className="text-xl font-bold">{selectedDistrict} District</h3>
                      </div>
                      <div className="border border-black/5 rounded-3xl p-6 bg-slate-50/50">
                        <DistrictDashboard user={{ ...user, role: 'district', region: selectedDistrict, full_name: `Director of ${selectedDistrict}` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'governance' && (
                <div className="space-y-8">
                  {/* Security Oversight */}
                  <SecurityScanner />
                  
                  {/* National Trends Chart Placeholder */}
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-indigo-500" />
                        National Performance Distribution
                      </h3>
                      <div className="flex gap-2">
                        <button className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"><Filter className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium italic">National analytics visualization coming soon.</p>
                    </div>
                  </div>

                  {/* Regional Performance List */}
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                    <h3 className="font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-500" />
                      Regional Performance Overview
                    </h3>
                    <div className="space-y-4">
                      {['Northern Region', 'Southern Region', 'Eastern Region', 'Western Region'].map((region, idx) => (
                        <motion.div 
                          key={idx} 
                          whileHover={{ x: 5 }}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/5 cursor-pointer hover:bg-white hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                              <Landmark className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{region}</p>
                              <p className="text-[10px] text-slate-500">Compliance: 98% | Performance: A</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-emerald-500">Stable</p>
                            <p className="text-[8px] text-slate-400 uppercase font-bold">Status</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'students' && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Search className="w-5 h-5 text-indigo-500" />
                        National Student Registry
                      </h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Search and Monitor any student across the nation</p>
                    </div>
                  </div>
                  
                  <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search by Name, ID, or Region..."
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ y: -5 }}
                        className="p-6 bg-slate-50 rounded-2xl border border-black/5 hover:bg-white hover:shadow-xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                            S
                          </div>
                          <div>
                            <p className="text-sm font-bold">Student {i * 12}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-black">Grade 10 • Gaborone</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full uppercase">Low Risk</span>
                          <span className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">Full Profile →</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'approvals' && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-indigo-500" />
                        Ministry Staff Approvals
                      </h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Final Authorization for Educational Staff</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: 'Grace Phiri', school: 'Northside Academy', district: 'Gaborone North', status: 'pending_ministry', id: 'T003' },
                    ].map((teacher) => (
                      <motion.div 
                        key={teacher.id} 
                        whileHover={{ y: -2 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/5 gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                            {teacher.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{teacher.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{teacher.school} • {teacher.district} • {teacher.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <span className="text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest bg-blue-100 text-blue-600">
                            {teacher.status.replace('_', ' ')}
                          </span>
                          <div className="flex gap-2">
                            <button className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-sm">
                              Final Approval
                            </button>
                            <button className="px-3 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-sm">
                              Reject
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'monitoring' && (
                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                      <Shield className="w-5 h-5 text-rose-500" />
                      National Risk Heatmap
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {districts.map(d => (
                        <div key={d.id} className="p-4 rounded-2xl border border-black/5 bg-slate-50">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{d.name}</p>
                          <div className={`h-2 w-full rounded-full ${
                            (d.compliance || 0) < 80 ? 'bg-rose-500' : (d.compliance || 0) < 90 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          <p className="text-xs font-bold mt-2">{d.compliance || 0}% Compliance</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                      <Activity className="w-5 h-5 text-indigo-500" />
                      Live System Telemetry
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/5">
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-bold">AI Inference Load</span>
                        </div>
                        <span className="text-xs font-black text-slate-400">42ms Latency</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'policy' && (
                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      Policy Ingestion Layer
                    </h3>
                    <p className="text-slate-500 mb-8">Upload national laws and educational acts to harden the CEK Sentinel compliance vectors.</p>
                    <PolicyUpload level="ministry" />
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      Policy Impact Tracking
                    </h3>
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-2xl border border-black/5">
                        <h4 className="font-bold text-sm mb-2">Digital Literacy Rollout</h4>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full w-[75%]" />
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-[10px] text-slate-400">75% Implementation</span>
                          <span className="text-[10px] font-bold text-emerald-500">+12% Performance Lift</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          {/* National Health Gauge */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">National Health Index</h3>
            <Gauge 
              value={88} 
              label="National Index" 
              size="lg" 
              showSynth={true}
            />
            <div className="mt-6 text-center">
              <p className="text-lg font-black text-emerald-500 uppercase tracking-tighter">Excellent</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Aggregated National Score</p>
            </div>
          </div>

          {/* AI Policy Insights */}
          <div className="bg-black text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                AI Policy Analysis
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                National trends suggest a 15% increase in STEM engagement following the new digital curriculum rollout. Recommendation: Expand vocational training in Western Region.
              </p>
            </div>
            <Activity className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5" />
          </div>

          {/* National Alerts */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-500" />
              National Alerts
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5" />
                <p className="text-[10px] font-bold text-rose-700">Policy deadline approaching for District 7.</p>
              </div>
            </div>
          </div>
        </div>
        {activeTab === 'policy' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <h3 className="text-2xl font-black tracking-tighter mb-2">Policy Ingestion Layer</h3>
              <p className="text-slate-500 mb-8">Upload national laws and educational acts to harden the CEK Sentinel compliance vectors.</p>
              <PolicyUpload level="ministry" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
