export const AnimatedGlow = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* 
        Intense Gemini-style glowing radial gradients.
        Using much higher opacities and Tailwind's native utilities for vibrant, visible glows.
      */}
      
      {/* Top Left - Vibrant Green Glow */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-green-500/30 blur-[100px] animate-[pulse_6s_ease-in-out_infinite] mix-blend-screen"
      ></div>
      
      {/* Middle Right - Emerald / Cyan Glow */}
      <div 
        className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/20 blur-[120px] animate-[pulse_8s_ease-in-out_infinite_reverse] mix-blend-screen"
      ></div>
      
      {/* Bottom Left - Teal Glow */}
      <div 
        className="absolute -bottom-[20%] left-[10%] w-[70vw] h-[70vw] rounded-full bg-teal-500/20 blur-[130px] animate-[pulse_10s_ease-in-out_infinite] mix-blend-screen"
      ></div>

      {/* Center - Deep Indigo AI Core Glow */}
      <div 
        className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/20 blur-[140px] mix-blend-screen animate-[pulse_12s_ease-in-out_infinite_reverse]"
      ></div>
    </div>
  );
};
