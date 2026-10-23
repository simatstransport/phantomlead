export const AnimatedGlow = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* Top Center - Clean Cyber Emerald & Mint Ambient Spotlight */}
      <div 
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[85vw] max-w-[1200px] h-[480px] rounded-[100%] bg-gradient-to-b from-emerald-500/15 via-teal-500/8 to-transparent blur-[110px] pointer-events-none"
        style={{ transform: 'translate3d(-50%, 0, 0)' }}
      />
      
      {/* Top Right - High-Tech Deep Violet Ambient Depth */}
      <div 
        className="absolute -top-[10%] -right-[5%] w-[45vw] max-w-[650px] h-[420px] rounded-full bg-gradient-to-bl from-purple-600/10 via-indigo-600/5 to-transparent blur-[120px] pointer-events-none"
      />

      {/* Bottom Center - Subtle Dark Mint Horizon */}
      <div 
        className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[70vw] max-w-[1000px] h-[350px] rounded-[100%] bg-gradient-to-t from-emerald-600/6 via-teal-700/4 to-transparent blur-[130px] pointer-events-none"
        style={{ transform: 'translate3d(-50%, 0, 0)' }}
      />
    </div>
  );
};
