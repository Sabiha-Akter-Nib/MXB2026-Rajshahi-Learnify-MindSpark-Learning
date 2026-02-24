import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Brain, Sparkles, Star, Zap, Target, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InteractiveBackground, MouseFollowOrbs } from "./InteractiveBackground";

// Animated Counter Component
function AnimatedCounter({ end, suffix = "", duration = 2 }: { end: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Trigger animation when in view
  if (isInView && !hasAnimated) {
    setHasAnimated(true);
    let startTime: number | null = null;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(eased * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue}{suffix}
    </span>
  );
}

// Floating 3D card component with drift effect (moves left/right)
function FloatingCard({ children, className, delay = 0, driftDirection = "left" }: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
  driftDirection?: "left" | "right";
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50, x: driftDirection === "left" ? 20 : -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`transition-all duration-500 ease-out ${className}`}
    >
      <motion.div
        animate={{
          x: isHovered ? (driftDirection === "left" ? -12 : 12) : 0,
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Subtle tunnel ring component (slower animation)
function TunnelRing({ delay, size }: { delay: number; size: number }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ 
        scale: [0.5, 2.5], 
        opacity: [0.2, 0],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: "linear"
      }}
      className="absolute rounded-full border border-primary/20"
      style={{
        width: size,
        height: size,
        left: `calc(50% - ${size/2}px)`,
        top: `calc(50% - ${size/2}px)`,
      }}
    />
  );
}

// Glowing orb component with smooth animation
function GlowingOrb({ color, size, position, animationDelay }: { 
  color: 'primary' | 'accent' | 'success'; 
  size: number; 
  position: { x: string; y: string }; 
  animationDelay: number;
}) {
  const colors = {
    primary: "from-primary/30 to-primary-light/10",
    accent: "from-accent/30 to-accent-light/10",
    success: "from-success/30 to-primary-light/10",
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.6, 0.8, 0.6],
      }}
      transition={{ 
        duration: 8, 
        delay: animationDelay, 
        ease: "easeInOut",
        repeat: Infinity,
      }}
      className={`absolute rounded-full bg-gradient-radial ${colors[color]} blur-3xl`}
      style={{
        width: size,
        height: size,
        left: position.x,
        top: position.y,
      }}
    />
  );
}

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Smooth spring physics for parallax
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  
  // Parallax transforms
  const y1 = useTransform(smoothProgress, [0, 1], [0, 200]);
  const y3 = useTransform(smoothProgress, [0, 1], [0, -80]);
  const opacity = useTransform(smoothProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(smoothProgress, [0, 0.5], [1, 0.95]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[120vh] flex items-center justify-center overflow-hidden"
    >
      {/* Interactive particle background */}
      <InteractiveBackground />
      <MouseFollowOrbs />

      {/* Subtle tunnel effect background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <TunnelRing delay={0} size={200} />
        <TunnelRing delay={1.5} size={300} />
        <TunnelRing delay={3} size={400} />
        <TunnelRing delay={4.5} size={500} />
      </div>

      {/* Animated gradient background with parallax */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"
      />
      
      {/* Glowing orbs - smoother */}
      <GlowingOrb color="primary" size={500} position={{ x: "-5%", y: "-15%" }} animationDelay={0} />
      <GlowingOrb color="accent" size={400} position={{ x: "75%", y: "65%" }} animationDelay={2} />
      <GlowingOrb color="success" size={350} position={{ x: "85%", y: "-5%" }} animationDelay={4} />
      <GlowingOrb color="primary" size={250} position={{ x: "25%", y: "75%" }} animationDelay={6} />

      {/* Floating glass cards with icons - drift left/right on hover */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingCard className="absolute top-[15%] left-[8%]" delay={0.2} driftDirection="left">
          <motion.div
            animate={{ y: [-8, 8, -8] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-5 shadow-glass-lg pointer-events-auto cursor-pointer animate-drift-left"
          >
            <BookOpen className="w-8 h-8 text-primary" />
          </motion.div>
        </FloatingCard>

        <FloatingCard className="absolute top-[25%] right-[10%]" delay={0.4} driftDirection="right">
          <motion.div
            animate={{ y: [8, -8, 8] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-5 shadow-glass-lg glow-accent pointer-events-auto cursor-pointer animate-drift-right"
          >
            <Brain className="w-9 h-9 text-accent" />
          </motion.div>
        </FloatingCard>

        <FloatingCard className="absolute bottom-[30%] left-[12%]" delay={0.6} driftDirection="left">
          <motion.div
            animate={{ y: [-5, 12, -5] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-4 shadow-glass pointer-events-auto cursor-pointer animate-tilt-left"
          >
            <Star className="w-7 h-7 text-warning" />
          </motion.div>
        </FloatingCard>

        <FloatingCard className="absolute top-[40%] right-[5%]" delay={0.8} driftDirection="right">
          <motion.div
            animate={{ y: [6, -10, 6] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-4 shadow-glass glow-primary pointer-events-auto cursor-pointer animate-tilt-right"
          >
            <Zap className="w-6 h-6 text-success" />
          </motion.div>
        </FloatingCard>

        <FloatingCard className="absolute bottom-[25%] right-[15%]" delay={1} driftDirection="right">
          <motion.div
            animate={{ y: [-6, 10, -6] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-5 shadow-glass-lg pointer-events-auto cursor-pointer animate-drift-right"
          >
            <Target className="w-8 h-8 text-primary-light" />
          </motion.div>
        </FloatingCard>

        <FloatingCard className="absolute top-[60%] left-[5%]" delay={1.2} driftDirection="left">
          <motion.div
            animate={{ y: [4, -8, 4] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-4 shadow-glass glow-accent pointer-events-auto cursor-pointer animate-drift-left"
          >
            <Rocket className="w-6 h-6 text-accent" />
          </motion.div>
        </FloatingCard>
      </div>

      {/* Main content */}
      <motion.div
        style={{ opacity, scale, y: y3 }}
        className="relative z-10 container mx-auto px-4 text-center"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 px-5 py-2.5 glass-card text-sm font-medium text-primary mb-8 animate-pulse-glow">
            <Sparkles className="w-4 h-4 animate-pulse-soft" />
            AI-Powered Learning for Bangladesh
            <Sparkles className="w-4 h-4 animate-pulse-soft" />
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading font-bold text-4xl md:text-6xl lg:text-8xl leading-[1.1] mb-6"
        >
          Learn Smarter with{" "}
          <span className="shimmer-text">Personalized</span>
          <br />
          <span className="relative inline-block">
            AI Tutoring
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-primary-light rounded-full origin-left"
            />
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          Experience adaptive learning aligned with the NCTB curriculum. 
          OddhaboshAI creates{" "}
          <span className="text-primary font-medium">personalized study plans</span>,{" "}
          tracks your progress, and helps you{" "}
          <span className="text-accent font-medium">excel in every subject</span>{" "}
          from Grades 1-10.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center"
        >
          <motion.div 
            whileHover={{ scale: 1.02, x: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Button variant="hero" size="xl" asChild className="btn-glow group relative overflow-hidden">
              <Link to="/signup" className="flex items-center gap-2">
                <span className="relative z-10">Start Learning Free</span>
                <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats with Counter Animations */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
        >
          {[
            { value: 10000, suffix: "+", label: "Active Students", color: "primary", drift: -8 },
            { value: 15, suffix: "+", label: "Subjects", color: "accent", drift: 0 },
            { value: 98, suffix: "%", label: "Success Rate", color: "success", drift: 8 },
          ].map((stat, index) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.05, y: -5, x: stat.drift }}
              className="glass-card p-6 text-center cursor-pointer group"
            >
              <p className={`font-heading font-bold text-3xl md:text-5xl bg-gradient-to-r ${
                stat.color === 'primary' ? 'from-primary to-primary-light' :
                stat.color === 'accent' ? 'from-accent to-accent-light' :
                'from-success to-primary-light'
              } bg-clip-text text-transparent group-hover:scale-110 transition-transform`}>
                {stat.value >= 1000 ? (
                  <><AnimatedCounter end={stat.value / 1000} suffix="" duration={2} />K{stat.suffix}</>
                ) : (
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2} />
                )}
              </p>
              <p className="text-sm md:text-base text-muted-foreground mt-2 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="glass-card w-8 h-14 rounded-full flex items-start justify-center p-2"
        >
          <motion.div 
            animate={{ height: [8, 16, 8], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 bg-gradient-to-b from-primary to-accent rounded-full" 
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
