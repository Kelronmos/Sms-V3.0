import { useState, useEffect } from 'react';

export function useSWIData(classId: string) {
  const [wellbeingIndex, setWellbeingIndex] = useState(85);
  const [engagementScore, setEngagementScore] = useState(72);
  const [integrityScore, setIntegrityScore] = useState(94);

  useEffect(() => {
    // In a real app, we would query metrics for all students in the class from Firestore
    // For now, we'll simulate real-time updates to demonstrate the "Live Synth" capability
    const interval = setInterval(() => {
      setWellbeingIndex(prev => {
        const next = prev + (Math.random() * 4 - 2);
        return Math.min(100, Math.max(0, next));
      });
      setEngagementScore(prev => {
        const next = prev + (Math.random() * 6 - 3);
        return Math.min(100, Math.max(0, next));
      });
      setIntegrityScore(prev => {
        const next = prev + (Math.random() * 2 - 1);
        return Math.min(100, Math.max(0, next));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [classId]);

  return { wellbeingIndex, engagementScore, integrityScore };
}
