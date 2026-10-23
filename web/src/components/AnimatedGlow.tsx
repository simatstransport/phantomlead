export const AnimatedGlow = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* Top Center - Clean Electric Sky / Cyan Ambient Spotlight */}
      <div 
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[85vw] max-w-[1200px] h-[480px] rounded-[100%] bg-gradient-to-b from-sky-400/15 via-cyan-500/8 to-transparent blur-[110px] pointer-events-none"
        style={{ transform: 'translate3d(-50%, 0, 0)' }}
      />
      
      {/* Top Right - Sleek Iris / Violet Depth */}
      <div 
        className="absolute -top-[10%] -right-[5%] w-[45vw] max-w-[650px] h-[420px] rounded-full bg-gradient-to-bl from-indigo-500/10 via-purple-600/5 to-transparent blur-[120px] pointer-events-none"
      />

      {/* Bottom Center - Subtle Dark Azure Horizon */}
      <div 
        className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[70vw] max-w-[1000px] h-[350px] rounded-[100%] bg-gradient-to-t from-cyan-600/6 via-indigo-600/4 to-transparent blur-[130px] pointer-events-none"
        style={{ transform: 'translate3d(-50%, 0, 0)' }}
      />
    </div>
  );
};
