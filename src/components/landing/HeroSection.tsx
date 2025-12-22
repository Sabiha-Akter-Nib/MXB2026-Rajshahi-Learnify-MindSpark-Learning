import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Brain, Sparkles, Star, Zap, Target, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

// Floating 3D card component with tilt effect
function TiltCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    setRotateY(mouseX / rect.width * 20);
    setRotateX(-mouseY / rect.height * 20);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: "preserve-3d",
      }}
      className={`transition-transform duration-200 ease-out ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Tunnel ring component
function TunnelRing({ delay, size }: { delay: number; size: number }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ 
        scale: [0.5, 2.5], 
        opacity: [0.4, 0],
        z: [0, 200]
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "linear"
      }}
      className="absolute rounded-full border-2 border-primary/30"
      style={{
        width: size,
        height: size,
        left: `calc(50% - ${size/2}px)`,
        top: `calc(50% - ${size/2}px)`,
      }}
    />
  );
}

// Glowing orb component
function GlowingOrb({ color, size, position, animationDelay }: { 
  color: 'primary' | 'accent' | 'success'; 
  size: number; 
  position: { x: string; y: string }; 
  animationDelay: number;
}) {
  const colors = {
    primary: "from-primary/40 to-primary-light/20",
    accent: "from-accent/40 to-accent-light/20",
    success: "from-success/40 to-primary-light/20",
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.5, delay: animationDelay, ease: "easeOut" }}
      className={`absolute rounded-full bg-gradient-radial ${colors[color]} blur-3xl animate-orb-float`}
      style={{
        width: size,
        height: size,
        left: position.x,
        top: position.y,
        animationDelay: `${animationDelay}s`,
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
  const y1 = useTransform(smoothProgress, [0, 1], [0, 300]);
  const y2 = useTransform(smoothProgress, [0, 1], [0, 150]);
  const y3 = useTransform(smoothProgress, [0, 1], [0, -100]);
  const opacity = useTransform(smoothProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(smoothProgress, [0, 0.5], [1, 0.9]);
  const rotateX = useTransform(smoothProgress, [0, 1], [0, 15]);

  // Mouse parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { stiffness: 150, damping: 20 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set((clientX - innerWidth / 2) / 50);
      mouseY.set((clientY - innerHeight / 2) / 50);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[120vh] flex items-center justify-center overflow-hidden tunnel-perspective"
    >
      {/* Tunnel effect background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <TunnelRing delay={0} size={200} />
        <TunnelRing delay={1} size={300} />
        <TunnelRing delay={2} size={400} />
        <TunnelRing delay={3} size={500} />
      </div>

      {/* Animated gradient background with parallax */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"
      />
      
      {/* Glowing orbs */}
      <GlowingOrb color="primary" size={600} position={{ x: "-10%", y: "-20%" }} animationDelay={0} />
      <GlowingOrb color="accent" size={500} position={{ x: "70%", y: "60%" }} animationDelay={0.5} />
      <GlowingOrb color="success" size={400} position={{ x: "80%", y: "-10%" }} animationDelay={1} />
      <GlowingOrb color="primary" size={300} position={{ x: "20%", y: "70%" }} animationDelay={1.5} />
      
      {/* Animated mesh gradient */}
      <motion.div
        style={{ y: y2, x: mouseXSpring, rotateX }}
        className="absolute inset-0 overflow-hidden"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-conic from-primary/10 via-accent/5 to-primary/10 blur-3xl animate-spin-slow"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-conic from-accent/10 via-primary/5 to-accent/10 blur-3xl animate-spin-reverse"
        />
      </motion.div>

      {/* Floating glass cards with icons */}
      <div className="absolute inset-0 pointer-events-none">
        <TiltCard className="absolute top-[15%] left-[8%]" delay={0.2}>
          <motion.div
            style={{ x: mouseXSpring, y: mouseYSpring }}
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-5 shadow-glass-lg animate-tilt-left"
          >
            <BookOpen className="w-8 h-8 text-primary" />
          </motion.div>
        </TiltCard>

        <TiltCard className="absolute top-[25%] right-[10%]" delay={0.4}>
          <motion.div
            style={{ x: mouseXSpring, y: mouseYSpring }}
            animate={{ y: [10, -10, 10] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-5 shadow-glass-lg glow-accent animate-tilt-right"
          >
            <Brain className="w-9 h-9 text-accent" />
          </motion.div>
        </TiltCard>

        <TiltCard className="absolute bottom-[30%] left-[12%]" delay={0.6}>
          <motion.div
            style={{ x: mouseXSpring, y: mouseYSpring }}
            animate={{ y: [-5, 15, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-4 shadow-glass animate-drift-left"
          >
            <Star className="w-7 h-7 text-warning" />
          </motion.div>
        </TiltCard>

        <TiltCard className="absolute top-[40%] right-[5%]" delay={0.8}>
          <motion.div
            style={{ x: mouseXSpring, y: mouseYSpring }}
            animate={{ y: [8, -12, 8] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-4 shadow-glass glow-primary animate-drift-right"
          >
            <Zap className="w-6 h-6 text-success" />
          </motion.div>
        </TiltCard>

        <TiltCard className="absolute bottom-[25%] right-[15%]" delay={1}>
          <motion.div
            style={{ x: mouseXSpring, y: mouseYSpring }}
            animate={{ y: [-8, 12, -8] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-5 shadow-glass-lg animate-tilt-left"
          >
            <Target className="w-8 h-8 text-primary-light" />
          </motion.div>
        </TiltCard>

        <TiltCard className="absolute top-[60%] left-[5%]" delay={1.2}>
          <motion.div
            style={{ x: mouseXSpring, y: mouseYSpring }}
            animate={{ y: [5, -10, 5] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-4 shadow-glass glow-accent animate-drift-left"
          >
            <Rocket className="w-6 h-6 text-accent" />
          </motion.div>
        </TiltCard>
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
          MindSpark creates{" "}
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
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <TiltCard delay={0.5}>
            <Button variant="hero" size="xl" asChild className="btn-glow group relative overflow-hidden">
              <Link to="/signup" className="flex items-center gap-2">
                <span className="relative z-10">Start Learning Free</span>
                <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </TiltCard>
          
          <TiltCard delay={0.6}>
            <Button 
              variant="outline" 
              size="xl" 
              asChild 
              className="glass-card border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 animate-border-glow"
            >
              <Link to="/demo">Watch Demo</Link>
            </Button>
          </TiltCard>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
        >
          {[
            { value: "10K+", label: "Active Students", color: "primary" },
            { value: "15+", label: "Subjects", color: "accent" },
            { value: "98%", label: "Success Rate", color: "success" },
          ].map((stat, index) => (
            <TiltCard key={stat.label} delay={0.7 + index * 0.1}>
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="glass-card p-6 text-center cursor-pointer group"
              >
                <p className={`font-heading font-bold text-3xl md:text-5xl bg-gradient-to-r ${
                  stat.color === 'primary' ? 'from-primary to-primary-light' :
                  stat.color === 'accent' ? 'from-accent to-accent-light' :
                  'from-success to-primary-light'
                } bg-clip-text text-transparent group-hover:scale-110 transition-transform`}>
                  {stat.value}
                </p>
                <p className="text-sm md:text-base text-muted-foreground mt-2 font-medium">{stat.label}</p>
              </motion.div>
            </TiltCard>
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
