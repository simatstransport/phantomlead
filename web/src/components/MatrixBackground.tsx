export const MatrixBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* High-Tech Precision Grid with Vignette Mask */}
      <div 
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.035] light:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 85%)'
        }}
      />
      {/* Subtle Dot Array Accent */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02] light:opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
    </div>
  );
};
