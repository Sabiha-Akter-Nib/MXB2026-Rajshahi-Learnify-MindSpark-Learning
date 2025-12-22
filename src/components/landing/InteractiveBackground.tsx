import { useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);

  const colors = [
    "rgba(39, 127, 114, 0.6)",  // primary
    "rgba(245, 158, 11, 0.5)",  // accent
    "rgba(56, 161, 105, 0.5)",  // success
    "rgba(73, 177, 156, 0.4)",  // primary-light
  ];

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const numParticles = Math.min(80, Math.floor((width * height) / 15000));
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = initParticles(canvas.width, canvas.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, i) => {
        // Mouse interaction - particles gently move away from cursor
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          const force = (150 - dist) / 150;
          particle.vx -= (dx / dist) * force * 0.02;
          particle.vy -= (dy / dist) * force * 0.02;
        }

        // Apply velocity with damping
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Add slight random movement
        particle.vx += (Math.random() - 0.5) * 0.02;
        particle.vy += (Math.random() - 0.5) * 0.02;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // Draw connections between nearby particles
        particlesRef.current.slice(i + 1).forEach((other) => {
          const dx2 = other.x - particle.x;
          const dy2 = other.y - particle.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (dist2 < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(39, 127, 114, ${0.15 * (1 - dist2 / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}

// Floating gradient orbs that follow mouse with delay
export function MouseFollowOrbs() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 50, damping: 30 };
  const orbX1 = useSpring(mouseX, { ...springConfig, stiffness: 30 });
  const orbY1 = useSpring(mouseY, { ...springConfig, stiffness: 30 });
  const orbX2 = useSpring(mouseX, { ...springConfig, stiffness: 20 });
  const orbY2 = useSpring(mouseY, { ...springConfig, stiffness: 20 });
  const orbX3 = useSpring(mouseX, { ...springConfig, stiffness: 15 });
  const orbY3 = useSpring(mouseY, { ...springConfig, stiffness: 15 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <motion.div
        style={{ x: orbX1, y: orbY1 }}
        className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full bg-gradient-radial from-primary/20 to-transparent blur-3xl"
      />
      <motion.div
        style={{ x: orbX2, y: orbY2 }}
        className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-gradient-radial from-accent/15 to-transparent blur-3xl"
      />
      <motion.div
        style={{ x: orbX3, y: orbY3 }}
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full bg-gradient-radial from-success/10 to-transparent blur-3xl"
      />
    </div>
  );
}

// Animated wave effect at section boundaries
export function WaveTransition({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className={`absolute left-0 right-0 h-32 pointer-events-none overflow-hidden ${inverted ? 'top-0 rotate-180' : 'bottom-0'}`}>
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-0 w-full h-full"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,60 C360,120 720,0 1080,60 C1260,90 1440,60 1440,60 L1440,120 L0,120 Z"
          fill="hsl(var(--background))"
          initial={{ d: "M0,60 C360,120 720,0 1080,60 C1260,90 1440,60 1440,60 L1440,120 L0,120 Z" }}
          animate={{ 
            d: [
              "M0,60 C360,120 720,0 1080,60 C1260,90 1440,60 1440,60 L1440,120 L0,120 Z",
              "M0,80 C360,20 720,100 1080,40 C1260,60 1440,80 1440,80 L1440,120 L0,120 Z",
              "M0,60 C360,120 720,0 1080,60 C1260,90 1440,60 1440,60 L1440,120 L0,120 Z",
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}