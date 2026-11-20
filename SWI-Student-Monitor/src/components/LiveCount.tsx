import React, { useEffect, useState } from 'react';
import { fetchLiveStats } from '../services/api';

/** Shows the persisted registered-account count, or UNAVAILABLE. Never a fabricated number. */
export const LiveCount: React.FC<{ className?: string }> = ({ className }) => {
  const [text, setText] = useState('…');
  useEffect(() => {
    let alive = true;
    fetchLiveStats()
      .then(s => alive && setText(`${s.registered.accounts.toLocaleString()} registered accounts`))
      .catch(() => alive && setText('UNAVAILABLE'));
    return () => { alive = false; };
  }, []);
  return <span className={className}>{text}</span>;
};

/** Count of generated (synthetic) records straight from the database. */
export const SynthCount: React.FC<{ field?: 'students' | 'schools' | 'demo_users'; className?: string }> = ({ field = 'students', className }) => {
  const [text, setText] = useState('…');
  useEffect(() => {
    let alive = true;
    fetch('/api/demo/stats')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(s => alive && setText(Number(s[field] ?? 0).toLocaleString()))
      .catch(() => alive && setText('UNAVAILABLE'));
    return () => { alive = false; };
  }, [field]);
  return <span className={className}>{text}</span>;
};
