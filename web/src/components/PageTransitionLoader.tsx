import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const PageTransitionLoader = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    setIsTransitioning(true);
    setProgress(0);

    // Rapidly increase the progress bar to 100%
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 5;
      });
    }, 30);

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 800); 

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [location.pathname]);

  if (!isTransitioning) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050b06]/95 backdrop-blur-md flex items-center justify-center font-mono">
      {/* Inline styles for the classic hacker loading stripe animation */}
      <style>{`
        @keyframes scanline {
          from { background-position: 0 0; }
          to { background-position: 28px 0; }
        }
        .hacker-stripes {
          background-image: repeating-linear-gradient(
            -45deg, 
            transparent, 
            transparent 10px, 
            rgba(0,0,0,0.6) 10px, 
            rgba(0,0,0,0.6) 20px
          );
          background-size: 28px 28px;
          animation: scanline 0.5s linear infinite;
        }
      `}</style>

      <div className="flex flex-col items-center w-full max-w-lg px-8">
        
        {/* Hacker Logo with Circular Loader Ring */}
        <div className="relative mb-12">
          <img 
            src="/logo.jpg" 
            alt="Logo" 
            className="w-24 h-24 rounded-full border border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] object-cover relative z-10" 
          />
          {/* Rotating radar ring */}
          <div className="absolute inset-[-12px] rounded-full border-2 border-transparent border-t-green-400 border-l-green-400/30 animate-spin z-0"></div>
          <div className="absolute inset-[-18px] rounded-full border border-green-900/50 animate-[spin_3s_linear_reverse_infinite] z-0"></div>
        </div>

        {/* LOADING TEXT */}
        <div className="text-green-400 text-2xl font-bold tracking-[0.4em] mb-4 shadow-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
          LOADING...
        </div>

        {/* PROGRESS BAR TRACK */}
        <div className="w-full h-5 rounded-full border-2 border-green-500/50 p-[2px] mb-6 relative overflow-hidden bg-black shadow-[0_0_15px_rgba(34,197,94,0.2)]">
          
          {/* PROGRESS BAR FILL WITH STRIPES */}
          <div 
            className="h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,1)] transition-all duration-75 ease-out relative rounded-full overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* The diagonal animated stripes layer */}
            <div className="absolute inset-0 hacker-stripes"></div>
          </div>
        </div>

        {/* CONSOLE OUTPUT LOGS */}
        <div className="text-green-500/80 text-sm text-left w-full space-y-1">
          <div className="flex justify-between">
            <span>&gt; Checking system...</span>
            <span>[OK]</span>
          </div>
          {progress > 25 && (
            <div className="flex justify-between">
              <span>&gt; Loading security modules...</span>
              <span>[OK]</span>
            </div>
          )}
          {progress > 50 && (
            <div className="flex justify-between">
              <span>&gt; Establishing connection...</span>
              <span>[OK]</span>
            </div>
          )}
          {progress > 75 && (
            <div className="flex justify-between text-green-400 animate-pulse">
              <span>&gt; Preparing workspace...</span>
              <span></span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
