import { useEffect, useState, useRef } from "react";
import { motion, useInView, useSpring, useMotionValue } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedStatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  suffix?: string;
  color: "primary" | "accent" | "success" | "warning";
  index: number;
  isAnimatedNumber?: boolean;
  previousValue?: number;
}

// Animated counter that counts up
const AnimatedCounter = ({ 
  value, 
  suffix = "",
  shouldAnimate = true 
}: { 
  value: number;
  suffix?: string;
  shouldAnimate?: boolean;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 50,
    damping: 20,
    duration: 2,
  });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView && shouldAnimate) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue, shouldAnimate]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <span ref={ref}>
      {shouldAnimate ? displayValue.toLocaleString() : value.toLocaleString()}
      {suffix}
    </span>
  );
};

// Streak fire animation
const StreakAnimation = ({ streak }: { streak: number }) => {
  const [showBurst, setShowBurst] = useState(false);
  
  useEffect(() => {
    // Show burst animation on mount (simulating streak update)
    setShowBurst(true);
    const timer = setTimeout(() => setShowBurst(false), 1500);
    return () => clearTimeout(timer);
  }, [streak]);

  return (
    <div className="relative">
      <motion.span
        className="inline-block"
        animate={showBurst ? {
          scale: [1, 1.3, 1],
          rotate: [0, -5, 5, 0],
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {streak}
      </motion.span>
      {showBurst && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-accent text-xs"
              initial={{ 
                opacity: 1, 
                scale: 0,
                x: 0,
                y: 0,
              }}
              animate={{ 
                opacity: 0, 
                scale: 1.5,
                x: Math.cos((i / 6) * Math.PI * 2) * 30,
                y: Math.sin((i / 6) * Math.PI * 2) * 30,
              }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
            >
              🔥
            </motion.span>
          ))}
        </>
      )}
    </div>
  );
};

const AnimatedStatsCard = ({
  icon: Icon,
  label,
  value,
  suffix = "",
  color,
  index,
  isAnimatedNumber = true,
  previousValue,
}: AnimatedStatsCardProps) => {
  const colorClasses = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      glow: "shadow-primary/20",
      border: "border-primary/20",
      gradient: "from-primary/5 via-transparent to-transparent",
    },
    accent: {
      bg: "bg-accent/10",
      text: "text-accent",
      glow: "shadow-accent/20",
      border: "border-accent/20",
      gradient: "from-accent/5 via-transparent to-transparent",
    },
    success: {
      bg: "bg-success/10",
      text: "text-success",
      glow: "shadow-success/20",
      border: "border-success/20",
      gradient: "from-success/5 via-transparent to-transparent",
    },
    warning: {
      bg: "bg-warning/10",
      text: "text-warning",
      glow: "shadow-warning/20",
      border: "border-warning/20",
      gradient: "from-warning/5 via-transparent to-transparent",
    },
  };

  const colors = colorClasses[color];
  const isStreak = label === "Day Streak";
  const numericValue = typeof value === "number" ? value : parseInt(value.toString().replace(/[^0-9]/g, "")) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ 
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 border backdrop-blur-sm",
        "bg-card/80 hover:bg-card",
        colors.border,
        "shadow-lg hover:shadow-xl transition-shadow duration-300"
      )}
    >
      {/* Gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50",
        colors.gradient
      )} />
      
      {/* Glowing orb in corner */}
      <motion.div
        className={cn(
          "absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl",
          colors.bg,
          "opacity-50"
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.5,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              colors.bg,
              colors.text
            )}
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.4 }}
          >
            <Icon className="w-6 h-6" />
          </motion.div>
          
          {/* Sparkle indicator */}
          <motion.div
            className={cn("w-2 h-2 rounded-full", colors.bg)}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.3,
            }}
          />
        </div>

        <p className="text-muted-foreground text-sm font-medium mb-1">
          {label}
        </p>
        
        <div className={cn("font-heading font-bold text-3xl", colors.text)}>
          {isStreak ? (
            <StreakAnimation streak={numericValue} />
          ) : isAnimatedNumber && typeof value === "number" ? (
            <AnimatedCounter value={numericValue} suffix={suffix} />
          ) : (
            <span>{value}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedStatsCard;
