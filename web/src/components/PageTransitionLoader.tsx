import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const PageTransitionLoader = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none overflow-hidden bg-transparent">
      <div className="h-full w-full bg-gradient-to-r from-emerald-400 via-teal-300 to-green-500 animate-[pageProgress_0.28s_cubic-bezier(0.16,1,0.3,1)_forwards] shadow-[0_0_14px_rgba(16,185,129,0.9)]" />
    </div>
  );
};
