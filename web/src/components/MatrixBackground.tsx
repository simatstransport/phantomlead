import { useEffect, useRef } from 'react';

export const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    const fontSize = 14;
    let columns = 0;
    let drops: number[] = [];

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~';
    const charArray = chars.split('');

    const setupCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      columns = Math.floor(width / fontSize);
      drops = [];
      for (let x = 0; x < columns; x++) {
        drops[x] = Math.floor(Math.random() * -50);
      }
    };

    setupCanvas();

    let lastTime = 0;
    const fpsInterval = 1000 / 30; // 30 FPS for smooth, battery-friendly mobile rendering

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);

      const elapsed = time - lastTime;
      if (elapsed < fpsInterval) return;
      lastTime = time - (elapsed % fpsInterval);

      ctx.fillStyle = 'rgba(3, 8, 5, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#00ff41'; // Matrix neon green
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (y > 0) {
          ctx.fillText(text, x, y);
        }

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    const handleResize = () => {
      setupCanvas();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none opacity-[0.05] sm:opacity-[0.06] z-0 block w-full h-full"
    />
  );
};
