import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ShieldCheck, X, Send, FileText } from 'lucide-react';

interface SafetyScannerWrapperProps {
  onSend: (content: string, attachments?: File[]) => void;
  placeholder?: string;
}

export const SafetyScannerWrapper: React.FC<SafetyScannerWrapperProps> = ({ onSend, placeholder }) => {
  const [content, setContent] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ status: 'safe' | 'warning' | 'unsafe'; message: string } | null>(null);
  const [explanation, setExplanation] = useState('');

  const handleScan = async () => {
    if (!content.trim()) return;
    
    setIsScanning(true);
    // Simulate SWI Scan Pipeline
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple heuristic for demo: check for "bad" words or ethical risks
    const lower = content.toLowerCase();
    if (lower.includes('hate') || lower.includes('harm') || lower.includes('kill')) {
      setScanResult({
        status: 'unsafe',
        message: '⚠ SWI Warning: This message may contain unsafe or harmful material.'
      });
    } else if (lower.includes('stupid') || lower.includes('idiot')) {
      setScanResult({
        status: 'warning',
        message: '⚠ Ethical Concern Detected: Your message might be perceived as disrespectful.'
      });
    } else {
      onSend(content);
      setContent('');
    }
    setIsScanning(false);
  };

  const handleConfirmSend = () => {
    onSend(content + (explanation ? `\n\n[Note: ${explanation}]` : ''));
    setContent('');
    setScanResult(null);
    setExplanation('');
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder || "Type a message..."}
          className="w-full p-4 bg-slate-50 rounded-2xl border border-black/5 focus:ring-2 focus:ring-black outline-none min-h-[100px] resize-none text-sm"
        />
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button className="p-2 text-slate-400 hover:text-black transition-colors">
            <FileText className="w-5 h-5" />
          </button>
          <button
            onClick={handleScan}
            disabled={isScanning || !content.trim()}
            className="bg-black text-white p-2 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            {isScanning ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`p-4 rounded-2xl border ${
              scanResult.status === 'unsafe' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 ${scanResult.status === 'unsafe' ? 'text-red-500' : 'text-amber-500'}`} />
              <div className="flex-1">
                <p className={`text-xs font-bold ${scanResult.status === 'unsafe' ? 'text-red-700' : 'text-amber-700'}`}>
                  {scanResult.message}
                </p>
                
                <div className="mt-4 space-y-3">
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Add an explanation (required to proceed)..."
                    className="w-full p-3 bg-white/50 rounded-xl border border-black/5 text-xs outline-none focus:ring-1 focus:ring-black"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmSend}
                      disabled={!explanation.trim()}
                      className="flex-1 py-2 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      Send with Explanation
                    </button>
                    <button
                      onClick={() => setScanResult(null)}
                      className="px-4 py-2 bg-white border border-black/5 rounded-lg text-[10px] font-black uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
