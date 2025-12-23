import { motion } from "framer-motion";

// Floating gradient orbs with glow - more colorful
const GlowingOrbs = () => {
  const orbs = [
    { size: 500, color: "primary", x: "5%", y: "15%", delay: 0 },
    { size: 450, color: "accent", x: "75%", y: "55%", delay: 1 },
    { size: 380, color: "success", x: "55%", y: "5%", delay: 2 },
    { size: 320, color: "warning", x: "25%", y: "65%", delay: 1.5 },
    { size: 280, color: "primary", x: "85%", y: "20%", delay: 0.8 },
    { size: 350, color: "accent", x: "40%", y: "85%", delay: 2.2 },
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
            background: `radial-gradient(circle, hsl(var(--${orb.color}) / 0.2) 0%, hsl(var(--${orb.color}) / 0.08) 40%, transparent 70%)`,
            filter: "blur(50px)",
          }}
          animate={{
            x: [0, 60, -40, 20, 0],
            y: [0, -50, 40, -20, 0],
            scale: [1, 1.15, 0.9, 1.05, 1],
            opacity: [0.5, 0.7, 0.4, 0.6, 0.5],
          }}
          transition={{
            duration: 18 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </>
  );
};

// Animated grid pattern with more visible lines
const AnimatedGrid = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.05) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--accent) / 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "50px 50px"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

// Floating particles with color variety
const FloatingParticles = () => {
  const particles = [
    { color: "primary", x: "10%", y: "30%", size: 6 },
    { color: "accent", x: "20%", y: "60%", size: 4 },
    { color: "success", x: "35%", y: "25%", size: 5 },
    { color: "warning", x: "50%", y: "70%", size: 4 },
    { color: "primary", x: "65%", y: "40%", size: 6 },
    { color: "accent", x: "80%", y: "55%", size: 5 },
    { color: "success", x: "90%", y: "35%", size: 4 },
    { color: "warning", x: "75%", y: "15%", size: 5 },
    { color: "primary", x: "45%", y: "85%", size: 4 },
    { color: "accent", x: "15%", y: "80%", size: 6 },
  ];

  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="fixed rounded-full pointer-events-none"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: `hsl(var(--${p.color}))`,
            boxShadow: `0 0 20px 5px hsl(var(--${p.color}) / 0.4)`,
          }}
          animate={{
            y: [0, -30, 0, 30, 0],
            x: [0, 20, -20, 10, 0],
            opacity: [0.4, 0.8, 0.5, 0.9, 0.4],
            scale: [1, 1.3, 1, 1.5, 1],
          }}
          transition={{
            duration: 8 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </>
  );
};

// Glowing gradient lines
const GlowingLines = () => {
  return (
    <>
      {/* Horizontal line */}
      <motion.div
        className="fixed h-[2px] w-1/3 pointer-events-none"
        style={{
          top: "30%",
          left: "10%",
          background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.4), transparent)",
          boxShadow: "0 0 20px 3px hsl(var(--primary) / 0.3)",
        }}
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scaleX: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Diagonal line */}
      <motion.div
        className="fixed h-[2px] w-1/4 pointer-events-none"
        style={{
          top: "60%",
          right: "15%",
          background: "linear-gradient(90deg, transparent, hsl(var(--success) / 0.4), hsl(var(--warning) / 0.4), transparent)",
          boxShadow: "0 0 20px 3px hsl(var(--success) / 0.3)",
          transform: "rotate(-15deg)",
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scaleX: [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
    </>
  );
};

const DashboardBackground = () => {
  return (
    <div className="fixed inset-0 z-0 bg-background overflow-hidden">
      {/* Base gradient with more color */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute inset-0 bg-gradient-to-tl from-success/3 via-transparent to-warning/3" />
      <AnimatedGrid />
      <GlowingOrbs />
      <FloatingParticles />
      <GlowingLines />
    </div>
  );
};

export default DashboardBackground;