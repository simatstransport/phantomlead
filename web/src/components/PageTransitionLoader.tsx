import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const PageTransitionLoader = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsTransitioning(true);
    // Adding a slight delay creates that "hacker" scanning/loading feel
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 1000); 

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isTransitioning) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center bg-[#050b06]">
        <img 
          src="/loading.jpg" 
          alt="Initializing Secure Environment..." 
          className="w-full h-full object-cover md:object-contain md:max-w-4xl opacity-90"
        />
        <div className="absolute inset-0 bg-green-500/5 mix-blend-overlay animate-pulse"></div>
      </div>
    </div>
  );
};
