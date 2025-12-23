import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Floating gradient orbs that move smoothly
const FloatingOrb = ({ 
  className, 
  delay = 0,
  duration = 20,
  size = 300,
  color = "primary"
}: { 
  className?: string;
  delay?: number;
  duration?: number;
  size?: number;
  color?: "primary" | "accent" | "success";
}) => {
  const colorMap = {
    primary: "from-primary/20 via-primary/10 to-transparent",
    accent: "from-accent/20 via-accent/10 to-transparent",
    success: "from-success/15 via-success/5 to-transparent",
  };

  return (
    <motion.div
      className={`absolute rounded-full bg-gradient-radial ${colorMap[color]} blur-3xl pointer-events-none ${className}`}
      style={{ width: size, height: size }}
      animate={{
        x: [0, 50, -30, 20, 0],
        y: [0, -40, 30, -20, 0],
        scale: [1, 1.1, 0.95, 1.05, 1],
        opacity: [0.6, 0.8, 0.5, 0.7, 0.6],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// Grid pattern with subtle animation
const AnimatedGrid = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.03]">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.5) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
        animate={{
          backgroundPosition: ["0px 0px", "60px 60px"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};

// Subtle particle dots
const ParticleDots = () => {
  const dots = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 15,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: dot.size,
            height: dot.size,
            left: `${dot.x}%`,
            top: `${dot.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: dot.duration,
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Glowing lines that pulse
const GlowLines = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Horizontal lines */}
      <motion.div
        className="absolute h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        style={{ top: "20%", left: 0, right: 0 }}
        animate={{ opacity: [0.2, 0.5, 0.2], scaleX: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent"
        style={{ top: "60%", left: 0, right: 0 }}
        animate={{ opacity: [0.1, 0.4, 0.1], scaleX: [0.9, 1, 0.9] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute h-[1px] bg-gradient-to-r from-transparent via-success/15 to-transparent"
        style={{ top: "85%", left: 0, right: 0 }}
        animate={{ opacity: [0.15, 0.35, 0.15], scaleX: [0.85, 1, 0.85] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
    </div>
  );
};

// Main dashboard background component
const DashboardBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  const y1 = useTransform(scrollY, [0, 1000], [0, -100]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -50]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0.5]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      {/* Animated grid */}
      <AnimatedGrid />
      
      {/* Floating orbs with parallax */}
      <motion.div style={{ y: y1, opacity }}>
        <FloatingOrb 
          className="-top-20 -left-20" 
          size={400} 
          color="primary" 
          delay={0}
          duration={25}
        />
        <FloatingOrb 
          className="top-1/3 -right-32" 
          size={350} 
          color="accent" 
          delay={5}
          duration={30}
        />
      </motion.div>
      
      <motion.div style={{ y: y2 }}>
        <FloatingOrb 
          className="bottom-20 left-1/4" 
          size={300} 
          color="success" 
          delay={10}
          duration={28}
        />
        <FloatingOrb 
          className="top-1/2 left-1/2" 
          size={250} 
          color="primary" 
          delay={8}
          duration={22}
        />
      </motion.div>
      
      {/* Particle dots */}
      <ParticleDots />
      
      {/* Glow lines */}
      <GlowLines />
      
      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/80 pointer-events-none" />
    </div>
  );
};

export default DashboardBackground;
