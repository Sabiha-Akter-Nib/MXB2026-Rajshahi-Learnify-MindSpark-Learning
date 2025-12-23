import { motion } from "framer-motion";

// Floating particles with teal colors
const FloatingParticles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 5,
  }));

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="fixed rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `hsl(var(--primary) / ${0.3 + Math.random() * 0.4})`,
            boxShadow: `0 0 ${p.size * 3}px ${p.size}px hsl(var(--primary) / 0.2)`,
          }}
          animate={{
            y: [0, -50, 0, 50, 0],
            x: [0, 30, -30, 20, 0],
            opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
            scale: [1, 1.5, 1, 1.3, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
    </>
  );
};

// Glowing orbs with teal gradient
const GlowingOrbs = () => {
  const orbs = [
    { size: 500, x: "-10%", y: "10%", delay: 0 },
    { size: 400, x: "80%", y: "20%", delay: 1.5 },
    { size: 350, x: "20%", y: "70%", delay: 3 },
    { size: 300, x: "70%", y: "80%", delay: 2 },
  ];

  return (
    <>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="fixed rounded-full pointer-events-none"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 50%, transparent 70%)`,
            filter: "blur(40px)",
          }}
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 40, 0],
            scale: [1, 1.2, 0.9, 1],
            opacity: [0.4, 0.6, 0.3, 0.4],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </>
  );
};

// Animated mesh gradient
const MeshGradient = () => {
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{
        background: `
          radial-gradient(at 20% 30%, hsl(var(--primary) / 0.12) 0%, transparent 50%),
          radial-gradient(at 80% 20%, hsl(var(--primary) / 0.08) 0%, transparent 40%),
          radial-gradient(at 50% 80%, hsl(var(--primary) / 0.1) 0%, transparent 45%),
          radial-gradient(at 90% 70%, hsl(var(--primary) / 0.06) 0%, transparent 35%)
        `,
      }}
      animate={{
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// Subtle grid pattern
const GridPattern = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
  );
};

const TutorBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      {/* Secondary teal tint */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/3 via-transparent to-transparent" />
      
      <MeshGradient />
      <GridPattern />
      <GlowingOrbs />
      <FloatingParticles />
    </div>
  );
};

export default TutorBackground;