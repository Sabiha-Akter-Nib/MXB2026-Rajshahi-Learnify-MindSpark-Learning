import { motion } from "framer-motion";

// Floating dreamy particles - light blue and white
const FloatingParticles = () => {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 6,
    duration: 12 + Math.random() * 18,
    delay: Math.random() * 5,
    isBlue: Math.random() > 0.4,
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
            background: p.isBlue 
              ? `rgba(135, 206, 250, ${0.6 + Math.random() * 0.3})`
              : `rgba(255, 255, 255, ${0.7 + Math.random() * 0.3})`,
            boxShadow: p.isBlue
              ? `0 0 ${p.size * 4}px ${p.size * 1.5}px rgba(135, 206, 250, 0.4)`
              : `0 0 ${p.size * 4}px ${p.size * 1.5}px rgba(255, 255, 255, 0.5)`,
          }}
          animate={{
            y: [0, -60, 0, 60, 0],
            x: [0, 40, -40, 30, 0],
            opacity: [0.5, 0.9, 0.6, 1, 0.5],
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

// Glowing orbs (dreamy light blue)
const GlowingOrbs = () => {
  const orbs = [
    { size: 600, x: "-15%", y: "5%", delay: 0 },
    { size: 500, x: "75%", y: "15%", delay: 1.5 },
    { size: 450, x: "15%", y: "65%", delay: 3 },
    { size: 400, x: "65%", y: "75%", delay: 2 },
    { size: 350, x: "40%", y: "35%", delay: 1 },
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
            background: `radial-gradient(circle, 
              rgba(173, 216, 230, 0.25) 0%, 
              rgba(135, 206, 250, 0.15) 30%,
              rgba(100, 149, 237, 0.08) 60%,
              transparent 80%)`,
            filter: "blur(50px)",
          }}
          animate={{
            x: [0, 50, -40, 30, 0],
            y: [0, -40, 50, -30, 0],
            scale: [1, 1.25, 0.9, 1.15, 1],
            opacity: [0.4, 0.6, 0.3, 0.5, 0.4],
          }}
          transition={{
            duration: 18 + i * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </>
  );
};

// Soft grid pattern
const GridPattern = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.04]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(135, 206, 250, 0.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(135, 206, 250, 0.8) 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
      }}
    />
  );
};

// Floating bubbles
const FloatingBubbles = () => {
  const bubbles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    size: 20 + Math.random() * 60,
    duration: 20 + Math.random() * 15,
    delay: Math.random() * 10,
  }));

  return (
    <>
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="fixed rounded-full pointer-events-none"
          style={{
            left: `${bubble.x}%`,
            bottom: "-10%",
            width: bubble.size,
            height: bubble.size,
            background: `radial-gradient(circle at 30% 30%, 
              rgba(255, 255, 255, 0.4) 0%, 
              rgba(173, 216, 230, 0.2) 50%,
              rgba(135, 206, 250, 0.1) 100%)`,
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
          animate={{
            y: [0, -window.innerHeight - 100],
            x: [0, (Math.random() - 0.5) * 100],
            rotate: [0, 360],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: bubble.duration,
            repeat: Infinity,
            ease: "linear",
            delay: bubble.delay,
          }}
        />
      ))}
    </>
  );
};

// Sparkle effect
const Sparkles = () => {
  const sparkles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 5,
  }));

  return (
    <>
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="fixed pointer-events-none"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: sparkle.size,
            height: sparkle.size,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: sparkle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: sparkle.delay,
          }}
        >
          <div 
            className="w-full h-full"
            style={{
              background: "white",
              clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            }}
          />
        </motion.div>
      ))}
    </>
  );
};

const AssessmentBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Dreamy light blue gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, 
            hsl(200, 70%, 75%) 0%, 
            hsl(195, 75%, 70%) 20%,
            hsl(190, 80%, 65%) 40%, 
            hsl(200, 75%, 70%) 60%,
            hsl(210, 70%, 75%) 80%, 
            hsl(220, 65%, 78%) 100%
          )`,
        }}
      />
      
      {/* Secondary overlay for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(255, 255, 255, 0.35) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(173, 216, 230, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(135, 206, 250, 0.2) 0%, transparent 60%)
          `,
        }}
      />
      
      {/* Soft vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, rgba(100, 149, 237, 0.1) 100%)`,
        }}
      />
      
      <GridPattern />
      <GlowingOrbs />
      <FloatingParticles />
      <FloatingBubbles />
      <Sparkles />
    </div>
  );
};

export default AssessmentBackground;
