export const AnimatedGlow = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Soft Gemini-style glowing radial gradients */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(60px)'
        }}
      ></div>
      
      <div 
        className="absolute top-[30%] right-[-15%] w-[60vw] h-[60vw] rounded-full mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_reverse]"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(80px)'
        }}
      ></div>
      
      <div 
        className="absolute bottom-[-30%] left-[10%] w-[70vw] h-[70vw] rounded-full mix-blend-screen animate-[pulse_12s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(100px)'
        }}
      ></div>

      {/* Deep inner core glow (adds that AI feel) */}
      <div 
        className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, rgba(0,0,0,0) 60%)',
          filter: 'blur(90px)'
        }}
      ></div>
    </div>
  );
};
