import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollAnimatedBackgroundProps {
  variant?: "features" | "subjects";
}

export function ScrollAnimatedBackground({ variant = "features" }: ScrollAnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Transform values based on scroll
  const orbOneX = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const orbOneY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const orbOneScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.2, 0.9]);
  const orbOneOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 0.6, 0.5, 0.2]);

  const orbTwoX = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const orbTwoY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const orbTwoScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.7, 1.3]);
  const orbTwoOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.2, 0.5, 0.6, 0.3]);

  const orbThreeX = useTransform(scrollYProgress, [0, 1], [50, -100]);
  const orbThreeY = useTransform(scrollYProgress, [0, 1], [-50, 120]);
  const orbThreeScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.4, 0.8]);

  const lineOneY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const lineTwoY = useTransform(scrollYProgress, [0, 1], ["100%", "0%"]);
  const lineThreeX = useTransform(scrollYProgress, [0, 1], ["-50%", "50%"]);

  const gradientRotate = useTransform(scrollYProgress, [0, 1], [0, 180]);

  const isFeatures = variant === "features";

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient that shifts with scroll */}
      <motion.div
        style={{ rotate: gradientRotate }}
        className="absolute inset-0 bg-gradient-to-br from-background via-secondary/20 to-background"
      />

      {/* Primary orb */}
      <motion.div
        style={{
          x: orbOneX,
          y: orbOneY,
          scale: orbOneScale,
          opacity: orbOneOpacity,
        }}
        className={`absolute ${isFeatures ? 'top-10 left-[10%]' : 'top-20 right-[15%]'} w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full blur-[100px]`}
      >
        <div className={`w-full h-full rounded-full ${isFeatures ? 'bg-gradient-radial from-primary/30 to-transparent' : 'bg-gradient-radial from-accent/25 to-transparent'}`} />
      </motion.div>

      {/* Secondary orb */}
      <motion.div
        style={{
          x: orbTwoX,
          y: orbTwoY,
          scale: orbTwoScale,
          opacity: orbTwoOpacity,
        }}
        className={`absolute ${isFeatures ? 'bottom-10 right-[5%]' : 'bottom-20 left-[10%]'} w-[350px] h-[350px] md:w-[500px] md:h-[500px] rounded-full blur-[80px]`}
      >
        <div className={`w-full h-full rounded-full ${isFeatures ? 'bg-gradient-radial from-accent/25 to-transparent' : 'bg-gradient-radial from-primary/30 to-transparent'}`} />
      </motion.div>

      {/* Tertiary orb - center */}
      <motion.div
        style={{
          x: orbThreeX,
          y: orbThreeY,
          scale: orbThreeScale,
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full blur-[60px] opacity-20"
      >
        <div className="w-full h-full rounded-full bg-gradient-radial from-success/30 to-transparent" />
      </motion.div>

      {/* Animated vertical lines */}
      <motion.div
        style={{ y: lineOneY }}
        className="absolute left-[20%] top-0 w-px h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent"
      />
      <motion.div
        style={{ y: lineTwoY }}
        className="absolute right-[25%] top-0 w-px h-full bg-gradient-to-b from-transparent via-accent/10 to-transparent"
      />

      {/* Horizontal line */}
      <motion.div
        style={{ x: lineThreeX }}
        className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/5 to-transparent"
      />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(var(--primary-rgb), 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--primary-rgb), 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating particles */}
      <FloatingParticles scrollYProgress={scrollYProgress} />
    </div>
  );
}

function FloatingParticles({ scrollYProgress }: { scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const particles = [
    { top: "15%", left: "10%", multiplierY: 0.3, multiplierX: 0.2, isPrimary: true },
    { top: "30%", left: "25%", multiplierY: 0.6, multiplierX: 0.4, isPrimary: false },
    { top: "45%", left: "40%", multiplierY: 0.9, multiplierX: 0.6, isPrimary: true },
    { top: "60%", left: "55%", multiplierY: 1.2, multiplierX: 0.8, isPrimary: false },
    { top: "75%", left: "70%", multiplierY: 1.5, multiplierX: 1.0, isPrimary: true },
    { top: "90%", left: "85%", multiplierY: 1.8, multiplierX: 1.2, isPrimary: false },
  ];

  return (
    <>
      {particles.map((particle, i) => {
        const yMove = useTransform(scrollYProgress, [0, 1], [0, (i % 2 === 0 ? -1 : 1) * 150 * particle.multiplierY]);
        const xMove = useTransform(scrollYProgress, [0, 1], [0, (i % 2 === 0 ? 1 : -1) * 80 * particle.multiplierX]);
        const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.1, 0.4, 0.1]);

        return (
          <motion.div
            key={i}
            style={{
              y: yMove,
              x: xMove,
              opacity,
              top: particle.top,
              left: particle.left,
            }}
            className={`absolute w-2 h-2 rounded-full ${particle.isPrimary ? 'bg-primary/30' : 'bg-accent/30'}`}
          />
        );
      })}
    </>
  );
}
interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export function AnimatedCounter({ end, suffix = "", prefix = "", duration = 2 }: AnimatedCounterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const count = useTransform(scrollYProgress, [0, 0.5], [0, end]);

  return (
    <motion.span ref={containerRef} className="tabular-nums">
      <motion.span>
        {prefix}
      </motion.span>
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Counter value={count} />
      </motion.span>
      <motion.span>
        {suffix}
      </motion.span>
    </motion.span>
  );
}

function Counter({ value }: { value: ReturnType<typeof useTransform<number, number>> }) {
  const rounded = useTransform(value, (latest) => Math.round(latest));
  
  return <motion.span>{rounded}</motion.span>;
}
