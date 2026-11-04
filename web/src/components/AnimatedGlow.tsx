export const AnimatedGlow = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* Top Center - Controlled Overhead Keylight (Fincher-style top source) */}
      <div 
        className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[70vw] max-w-[1000px] h-[380px] rounded-[100%] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-[120px] dark:from-emerald-500/10 dark:via-teal-500/5 light:from-emerald-500/5 light:via-teal-500/3 pointer-events-none"
        style={{ transform: 'translate3d(-50%, 0, 0)' }}
      />
      
      {/* Subtle Right Rim Light */}
      <div 
        className="absolute top-[20%] -right-[5%] w-[35vw] max-w-[500px] h-[350px] rounded-full bg-gradient-to-bl from-cyan-600/5 via-indigo-600/3 to-transparent blur-[130px] pointer-events-none"
      />
    </div>
  );
};
