import { useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Rocket, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

// Floating particle component
function FloatingParticle({ delay, duration, x, y }: { delay: number; duration: number; x: string; y: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        y: [0, -100],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
      className="absolute w-2 h-2 bg-primary-foreground/40 rounded-full"
      style={{ left: x, top: y }}
    />
  );
}

// 3D Tilt Button
function TiltButton({ children, className, variant = "primary" }: { 
  children: React.ReactNode; 
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { stiffness: 400, damping: 25 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      {/* Glow effect */}
      <motion.div
        animate={{ 
          opacity: isHovered ? 0.8 : 0,
          scale: isHovered ? 1.2 : 1,
        }}
        transition={{ duration: 0.3 }}
        className={`absolute inset-0 rounded-2xl blur-xl -z-10 ${
          variant === "primary" 
            ? "bg-accent" 
            : "bg-primary-foreground/20"
        }`}
      />
      {children}
    </motion.div>
  );
}

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-32 relative overflow-hidden">
      {/* Animated gradient background */}
      <motion.div 
        animate={{ 
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 25%, hsl(var(--primary)) 50%, hsl(var(--primary-light)) 75%, hsl(var(--primary)) 100%)",
          backgroundSize: "300% 300%",
        }}
      />
      
      {/* Tunnel rings */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.5, opacity: 0.3 }}
            animate={{ 
              scale: [0.5, 2],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 4,
              delay: i * 0.8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute rounded-full border border-primary-foreground/20"
            style={{
              width: 200 + i * 100,
              height: 200 + i * 100,
            }}
          />
        ))}
      </div>

      {/* Floating orbs */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-accent/30 to-transparent rounded-full blur-3xl"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-primary-foreground/10 to-transparent rounded-full blur-3xl"
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <FloatingParticle 
          key={i}
          delay={i * 0.3}
          duration={3 + Math.random() * 2}
          x={`${10 + Math.random() * 80}%`}
          y={`${60 + Math.random() * 30}%`}
        />
      ))}

      {/* Floating icons */}
      <motion.div
        animate={{ 
          y: [-10, 10, -10],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[10%] glass p-4 rounded-2xl text-primary-foreground/80"
      >
        <Rocket className="w-8 h-8" />
      </motion.div>
      
      <motion.div
        animate={{ 
          y: [10, -10, 10],
          rotate: [0, -5, 5, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 right-[15%] glass p-4 rounded-2xl text-primary-foreground/80"
      >
        <Star className="w-7 h-7" />
      </motion.div>
      
      <motion.div
        animate={{ 
          y: [-5, 15, -5],
          rotate: [0, 10, -10, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-32 left-[20%] glass p-3 rounded-xl text-primary-foreground/80"
      >
        <Zap className="w-6 h-6" />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 glass rounded-full mb-10"
          >
            <Sparkles className="w-5 h-5 text-primary-foreground animate-pulse-soft" />
            <span className="text-sm font-semibold text-primary-foreground">
              Start Today - It's Free
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-heading font-bold text-4xl md:text-6xl lg:text-7xl text-primary-foreground mb-8 leading-tight"
          >
            Ready to Transform Your{" "}
            <span className="relative inline-block">
              Learning Journey?
              <motion.span
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-2 left-0 right-0 h-2 bg-accent rounded-full origin-left"
              />
            </span>
          </motion.h2>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl md:text-2xl text-primary-foreground/80 mb-12 leading-relaxed"
          >
            Join thousands of students across Bangladesh who are already 
            learning smarter with OddhaboshAI's AI-powered tutoring.
          </motion.p>

          {/* CTA Button */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center justify-center"
          >
            <TiltButton variant="primary">
              <Button 
                variant="hero" 
                size="xl" 
                asChild
                className="bg-accent text-accent-foreground hover:bg-accent-light shadow-accent-lg btn-glow group"
              >
                <Link to="/signup" className="flex items-center gap-2">
                  <span>Create Free Account</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </TiltButton>
          </motion.div>

          {/* Trust badges */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-primary-foreground/70"
          >
            {[
              { icon: "✓", text: "No credit card required" },
              { icon: "✓", text: "Works on any device" },
              { icon: "✓", text: "Bangla & English" },
            ].map((badge, index) => (
              <motion.div
                key={badge.text}
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium"
              >
                <span className="text-accent">{badge.icon}</span>
                <span>{badge.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
