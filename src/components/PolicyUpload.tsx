import React, { useState } from 'react';
import { FileUp, Shield, CheckCircle, AlertCircle, Landmark, Building, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface PolicyUploadProps {
  level: 'ministry' | 'district' | 'admin';
  onUploadSuccess?: () => void;
}

export const PolicyUpload: React.FC<PolicyUploadProps> = ({ level, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) setTitle(e.target.files[0].name.split('.')[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setIsUploading(true);
    setStatus('idle');

    try {
      // In a real app, we'd upload to Firebase Storage and then save the metadata to Firestore.
      // For this demo, we'll simulate the upload and save the metadata.
      const policyData = {
        title,
        description,
        level,
        fileName: file.name,
        fileSize: file.size,
        uploadedBy: auth.currentUser?.uid,
        uploadedAt: serverTimestamp(),
        status: 'active',
        vectorId: `v_${Math.random().toString(36).substr(2, 9)}` // Simulated vector ID for RAG
      };

      await addDoc(collection(db, 'policies'), policyData);
      
      setStatus('success');
      setFile(null);
      setTitle('');
      setDescription('');
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error('Policy upload failed:', error);
      setStatus('error');
      handleFirestoreError(error, OperationType.WRITE, 'policies');
    } finally {
      setIsUploading(false);
    }
  };

  const icons = {
    ministry: Landmark,
    district: Building,
    admin: ShieldCheck
  };

  const Icon = icons[level];

  return (
    <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black tracking-tight capitalize">{level} Policy Ingestion</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sovereign Upload Layer (RAG Enabled)</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Policy Title</label>
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., National Education Act 2026"
            className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description / Scope</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe the legal vectors covered..."
            className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[100px] resize-none"
          />
        </div>

        <div className="relative">
          <input 
            type="file" 
            id="policy-file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
          />
          <label 
            htmlFor="policy-file"
            className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
              file ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            {file ? (
              <>
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                <span className="text-sm font-bold text-emerald-700">{file.name}</span>
                <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mt-1">Ready for Vectorization</span>
              </>
            ) : (
              <>
                <FileUp className="w-10 h-10 text-slate-300 mb-2" />
                <span className="text-sm font-bold text-slate-600">Click to upload policy document</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">PDF, DOCX, or TXT</span>
              </>
            )}
          </label>
        </div>

        <button 
          type="submit"
          disabled={isUploading || !file || !title}
          className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-black/10"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Vectorizing...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Ingest into SWI Engine
            </>
          )}
        </button>

        <AnimatePresence>
          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="text-xs font-bold">Policy successfully ingested and vectorized for compliance monitoring.</span>
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-rose-100 text-rose-700 rounded-2xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5" />
              <span className="text-xs font-bold">Failed to ingest policy. Please try again.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};
