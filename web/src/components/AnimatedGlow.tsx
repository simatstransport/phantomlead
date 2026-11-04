export const AnimatedGlow = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* Top Center Overhead Cinema Ember Spotlight */}
      <div 
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[85vw] max-w-[1200px] h-[450px] rounded-[100%] bg-gradient-to-b from-[#de1b1c]/15 via-[#ff2a2b]/5 to-transparent blur-[140px] pointer-events-none"
        style={{ transform: 'translate3d(-50%, 0, 0)' }}
      />
      
      {/* Subtle Bottom Ambient Floor Glow */}
      <div 
        className="absolute -bottom-[20%] right-[10%] w-[45vw] max-w-[650px] h-[400px] rounded-full bg-gradient-to-tl from-[#de1b1c]/8 via-[#e5a93b]/4 to-transparent blur-[160px] pointer-events-none"
      />

      {/* Cinematic Vignette Overlay */}
      <div className="cinema-vignette" />
    </div>
  );
};
