import { motion } from "framer-motion";

// Floating particles - pink and peach
const FloatingParticles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 5,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 5,
    isPink: Math.random() > 0.5,
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
            background: p.isPink 
              ? `rgba(236, 72, 153, ${0.5 + Math.random() * 0.4})`
              : `rgba(239, 185, 149, ${0.4 + Math.random() * 0.4})`,
            boxShadow: p.isPink
              ? `0 0 ${p.size * 3}px ${p.size}px rgba(236, 72, 153, 0.3)`
              : `0 0 ${p.size * 3}px ${p.size}px rgba(239, 185, 149, 0.3)`,
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

// Glowing orbs (pink and purple-blue)
const GlowingOrbs = () => {
  const orbs = [
    { size: 500, x: "-10%", y: "10%", delay: 0, isPink: true },
    { size: 400, x: "80%", y: "20%", delay: 1.5, isPink: false },
    { size: 350, x: "20%", y: "70%", delay: 3, isPink: true },
    { size: 300, x: "70%", y: "80%", delay: 2, isPink: false },
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
            background: orb.isPink
              ? `radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 50%, transparent 70%)`
              : `radial-gradient(circle, rgba(106, 104, 223, 0.12) 0%, rgba(106, 104, 223, 0.04) 50%, transparent 70%)`,
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

// Subtle grid pattern
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
      {/* Pink/magenta to purple gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, 
            hsl(330, 50%, 82%) 0%, 
            hsl(335, 55%, 75%) 25%, 
            hsl(340, 50%, 70%) 50%, 
            hsl(320, 45%, 68%) 75%, 
            hsl(280, 40%, 65%) 100%
          )`,
        }}
      />
      
      {/* Secondary gradient overlay for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, rgba(106, 104, 223, 0.1) 0%, transparent 50%)`,
        }}
      />
      
      <GridPattern />
      <GlowingOrbs />
      <FloatingParticles />
    </div>
  );
};

export default DashboardBackground;