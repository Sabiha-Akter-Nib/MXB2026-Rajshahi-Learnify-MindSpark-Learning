import { motion } from "framer-motion";

// Floating white & purple particles with glow
const FloatingParticles = () => {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 6,
    duration: 18 + Math.random() * 25,
    delay: Math.random() * 8,
    isPurple: Math.random() > 0.55,
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
            background: p.isPurple
              ? `rgba(147, 112, 219, ${0.5 + Math.random() * 0.4})`
              : `rgba(255, 255, 255, ${0.5 + Math.random() * 0.4})`,
            boxShadow: p.isPurple
              ? `0 0 ${p.size * 4}px ${p.size * 1.5}px rgba(147, 112, 219, 0.25)`
              : `0 0 ${p.size * 4}px ${p.size * 1.5}px rgba(255, 255, 255, 0.25)`,
          }}
          animate={{
            y: [0, -60, 0, 60, 0],
            x: [0, 35, -35, 25, 0],
            opacity: [0.3, 0.8, 0.4, 0.9, 0.3],
            scale: [1, 1.6, 1, 1.4, 1],
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

// Glowing orbs with richer gradients
const GlowingOrbs = () => {
  const orbs = [
    { size: 550, x: "-10%", y: "5%", delay: 0, color: "rgba(180, 140, 255, 0.12)" },
    { size: 450, x: "75%", y: "15%", delay: 1.5, color: "rgba(100, 149, 237, 0.1)" },
    { size: 400, x: "15%", y: "65%", delay: 3, color: "rgba(255, 255, 255, 0.08)" },
    { size: 350, x: "65%", y: "75%", delay: 2, color: "rgba(147, 112, 219, 0.1)" },
    { size: 300, x: "50%", y: "40%", delay: 4, color: "rgba(100, 200, 255, 0.06)" },
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
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(50px)",
          }}
          animate={{
            x: [0, 50, -40, 0],
            y: [0, -40, 50, 0],
            scale: [1, 1.25, 0.85, 1],
            opacity: [0.25, 0.5, 0.2, 0.25],
          }}
          transition={{
            duration: 22 + i * 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </>
  );
};

// Subtle glass grid pattern
const GridPattern = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.6) 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
      }}
    />
  );
};

// Noise texture overlay for premium feel
const NoiseOverlay = () => (
  <div
    className="fixed inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    }}
  />
);

const DashboardBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Rich lavender-to-deep-purple gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, 
            hsl(270, 42%, 88%) 0%, 
            hsl(262, 48%, 82%) 20%, 
            hsl(255, 52%, 77%) 40%, 
            hsl(248, 55%, 72%) 60%, 
            hsl(238, 58%, 68%) 80%, 
            hsl(228, 60%, 64%) 100%
          )`,
        }}
      />

      {/* Radial depth overlays */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 10%, rgba(180, 140, 255, 0.2) 0%, transparent 45%),
            radial-gradient(ellipse at 80% 85%, rgba(100, 149, 237, 0.15) 0%, transparent 45%),
            radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 60%)
          `,
        }}
      />

      <GridPattern />
      <NoiseOverlay />
      <GlowingOrbs />
      <FloatingParticles />
    </div>
  );
};

export default DashboardBackground;
