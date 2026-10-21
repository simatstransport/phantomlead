export const AnimatedGlow = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* 
        High-Intensity Neon Blue & Electric Cyan Glow Matrix
      */}
      
      {/* Top Left - Vibrant Electric Cyan Glow */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-cyan-400/25 blur-[120px] animate-[pulse_6s_ease-in-out_infinite] mix-blend-screen"
      ></div>
      
      {/* Middle Right - Neon Sky Blue / Azure Glow */}
      <div 
        className="absolute top-[15%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-sky-500/25 blur-[130px] animate-[pulse_8s_ease-in-out_infinite_reverse] mix-blend-screen"
      ></div>
      
      {/* Bottom Left - Electric Blue Glow */}
      <div 
        className="absolute -bottom-[20%] left-[5%] w-[70vw] h-[70vw] rounded-full bg-blue-500/20 blur-[140px] animate-[pulse_10s_ease-in-out_infinite] mix-blend-screen"
      ></div>

      {/* Center - Deep High-Tech Indigo / Cyan Core Glow */}
      <div 
        className="absolute top-[25%] left-[25%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/15 blur-[150px] mix-blend-screen animate-[pulse_12s_ease-in-out_infinite_reverse]"
      ></div>
    </div>
  );
};
