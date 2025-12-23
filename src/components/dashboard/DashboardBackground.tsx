import { motion } from "framer-motion";

// Floating gradient orbs with glow
const GlowingOrbs = () => {
  const orbs = [
    { size: 400, color: "primary", x: "10%", y: "20%", delay: 0 },
    { size: 350, color: "accent", x: "80%", y: "60%", delay: 1 },
    { size: 300, color: "success", x: "60%", y: "10%", delay: 2 },
    { size: 250, color: "primary", x: "30%", y: "70%", delay: 1.5 },
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
            background: `radial-gradient(circle, hsl(var(--${orb.color}) / 0.15) 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.1, 0.95, 1],
            opacity: [0.4, 0.6, 0.3, 0.4],
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </>
  );
};

// Animated grid pattern
const AnimatedGrid = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "60px 60px"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/30"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            boxShadow: "0 0 20px hsl(var(--primary) / 0.5)",
          }}
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.5, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}
    </div>
  );
};

const DashboardBackground = () => {
  return (
    <div className="fixed inset-0 z-0 bg-background overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      <AnimatedGrid />
      <GlowingOrbs />
    </div>
  );
};

export default DashboardBackground;
