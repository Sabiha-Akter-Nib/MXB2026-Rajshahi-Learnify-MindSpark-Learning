import { motion } from "framer-motion";

// Floating white particles
const FloatingParticles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 5,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 5,
    isOrange: Math.random() > 0.6, // 40% orange, 60% white
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
            background: p.isOrange 
              ? `rgba(251, 146, 60, ${0.5 + Math.random() * 0.4})`
              : `rgba(255, 255, 255, ${0.4 + Math.random() * 0.4})`,
            boxShadow: p.isOrange
              ? `0 0 ${p.size * 3}px ${p.size}px rgba(251, 146, 60, 0.3)`
              : `0 0 ${p.size * 3}px ${p.size}px rgba(255, 255, 255, 0.3)`,
          }}
          animate={{
            y: [0, -50, 0, 50, 0],
            x: [0, 30, -30, 20, 0],
            opacity: [0.4, 0.8, 0.5, 0.9, 0.4],
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

// Glowing orbs (white and orange)
const GlowingOrbs = () => {
  const orbs = [
    { size: 500, x: "-10%", y: "10%", delay: 0, isOrange: false },
    { size: 400, x: "80%", y: "20%", delay: 1.5, isOrange: true },
    { size: 350, x: "20%", y: "70%", delay: 3, isOrange: false },
    { size: 300, x: "70%", y: "80%", delay: 2, isOrange: true },
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
            background: orb.isOrange
              ? `radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, rgba(251, 146, 60, 0.05) 50%, transparent 70%)`
              : `radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 50%, transparent 70%)`,
            filter: "blur(40px)",
          }}
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 40, 0],
            scale: [1, 1.2, 0.9, 1],
            opacity: [0.3, 0.5, 0.2, 0.3],
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

// Subtle grid pattern (white)
const GridPattern = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.04]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
  );
};

const DashboardBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Eye-soothing light teal gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, 
            hsl(174, 45%, 72%) 0%, 
            hsl(176, 42%, 68%) 25%, 
            hsl(178, 40%, 64%) 50%, 
            hsl(180, 45%, 60%) 75%, 
            hsl(182, 48%, 56%) 100%
          )`,
        }}
      />
      
      {/* Secondary gradient overlay for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, rgba(94, 234, 212, 0.15) 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, rgba(251, 146, 60, 0.1) 0%, transparent 50%)`,
        }}
      />
      
      <GridPattern />
      <GlowingOrbs />
      <FloatingParticles />
    </div>
  );
};

export default DashboardBackground;
