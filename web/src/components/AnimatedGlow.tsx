export const AnimatedGlow = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Top Left - Vibrant Electric Cyan & Sky Blue Mesh */}
      <div 
        className="absolute -top-[12%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-cyan-500/25 via-sky-500/15 to-transparent blur-[140px] animate-[pulse_8s_ease-in-out_infinite] mix-blend-screen"
      />
      
      {/* Top Right - Cosmic Violet & Radiant Fuchsia Glow */}
      <div 
        className="absolute -top-[10%] -right-[12%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-purple-600/25 via-fuchsia-500/20 to-transparent blur-[140px] animate-[pulse_10s_ease-in-out_infinite_reverse] mix-blend-screen"
      />
      
      {/* Center - Deep High-Tech Indigo & Electric Blue Nebula */}
      <div 
        className="absolute top-[30%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-indigo-600/15 via-blue-500/10 to-transparent blur-[160px] animate-[pulse_12s_ease-in-out_infinite] mix-blend-screen"
      />

      {/* Bottom Left - Mint Emerald / Cyber Green Accent */}
      <div 
        className="absolute -bottom-[20%] left-[5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/15 blur-[150px] animate-[pulse_9s_ease-in-out_infinite_reverse] mix-blend-screen"
      />

      {/* Bottom Right - Warm Amber / Sunset Coral Accent */}
      <div 
        className="absolute -bottom-[15%] right-[5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tl from-amber-500/10 via-rose-500/10 to-transparent blur-[150px] animate-[pulse_11s_ease-in-out_infinite] mix-blend-screen"
      />

      {/* Subtle Cyber Grid Texture */}
      <div className="absolute inset-0 cyber-grid opacity-60" />
    </div>
  );
};
