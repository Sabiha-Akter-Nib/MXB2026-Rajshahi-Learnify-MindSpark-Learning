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
}

// Animated counter
const AnimatedCounter = ({ 
  value, 
  suffix = "",
}: { 
  value: number;
  suffix?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 50,
    damping: 20,
  });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <span ref={ref}>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};

// Streak fire animation with particles
const StreakAnimation = ({ streak }: { streak: number }) => {
  const [showBurst, setShowBurst] = useState(false);
  
  useEffect(() => {
    setShowBurst(true);
    const timer = setTimeout(() => setShowBurst(false), 1500);
    return () => clearTimeout(timer);
  }, [streak]);

  return (
    <div className="relative inline-flex items-center">
      <motion.span
        className="inline-block"
        animate={showBurst ? {
          scale: [1, 1.4, 1],
          rotate: [0, -8, 8, 0],
        } : {}}
        transition={{ duration: 0.6 }}
      >
        {streak}
      </motion.span>
      {showBurst && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-accent"
              style={{ fontSize: "0.7em" }}
              initial={{ 
                opacity: 1, 
                scale: 0,
                x: 0,
                y: 0,
              }}
              animate={{ 
                opacity: 0, 
                scale: 1.5,
                x: Math.cos((i / 8) * Math.PI * 2) * 40,
                y: Math.sin((i / 8) * Math.PI * 2) * 40,
              }}
              transition={{ duration: 0.8, delay: i * 0.03 }}
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
}: AnimatedStatsCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const colorConfig = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/30",
      glow: "shadow-primary/30",
      underline: "bg-gradient-to-r from-primary via-primary/80 to-primary",
    },
    accent: {
      bg: "bg-accent/10",
      text: "text-accent",
      border: "border-accent/30",
      glow: "shadow-accent/30",
      underline: "bg-gradient-to-r from-accent via-accent/80 to-accent",
    },
    success: {
      bg: "bg-success/10",
      text: "text-success",
      border: "border-success/30",
      glow: "shadow-success/30",
      underline: "bg-gradient-to-r from-success via-success/80 to-success",
    },
    warning: {
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning/30",
      glow: "shadow-warning/30",
      underline: "bg-gradient-to-r from-warning via-warning/80 to-warning",
    },
  };

  const config = colorConfig[color];
  const isStreak = label === "Day Streak";
  const numericValue = typeof value === "number" ? value : parseInt(value.toString().replace(/[^0-9]/g, "")) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ 
        y: -8,
        scale: 1.03,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 border backdrop-blur-md",
        "bg-card/70 hover:bg-card/90",
        config.border,
        "shadow-xl hover:shadow-2xl transition-shadow duration-500",
        isHovered && `shadow-2xl ${config.glow}`
      )}
      style={{
        boxShadow: isHovered 
          ? `0 20px 60px -15px hsl(var(--${color}) / 0.4), 0 0 40px -10px hsl(var(--${color}) / 0.2)`
          : undefined,
      }}
    >
      {/* Animated gradient overlay */}
      <motion.div 
        className="absolute inset-0 opacity-0"
        animate={{ opacity: isHovered ? 0.1 : 0 }}
        style={{
          background: `radial-gradient(circle at 30% 30%, hsl(var(--${color})), transparent 70%)`,
        }}
      />
      
      {/* Glowing corner orb */}
      <motion.div
        className={cn("absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl", config.bg)}
        animate={{
          scale: [1, 1.3, 1],
          opacity: isHovered ? [0.4, 0.7, 0.4] : [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.3,
        }}
      />

      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{ translateX: isHovered ? "200%" : "-100%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
        }}
      />

      <div className="relative z-10">
        {/* Icon with jump animation and underline */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <motion.div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center relative",
                config.bg,
                config.text
              )}
              animate={isHovered ? {
                y: [0, -12, 0],
                scale: [1, 1.15, 1],
              } : {}}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Icon className="w-7 h-7" />
              
              {/* Glow ring on hover */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                animate={{ 
                  boxShadow: isHovered 
                    ? `0 0 25px 5px hsl(var(--${color}) / 0.4)` 
                    : "0 0 0 0 transparent" 
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
            
            {/* Colored underline that appears on hover */}
            <motion.div
              className={cn("absolute -bottom-2 left-0 h-1 rounded-full", config.underline)}
              initial={{ width: 0 }}
              animate={{ width: isHovered ? "100%" : 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          
        </div>

        <p className="text-muted-foreground text-sm font-medium mb-2">
          {label}
        </p>
        
        <motion.div 
          className={cn("font-heading font-bold text-4xl", config.text)}
          animate={isHovered ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {isStreak ? (
            <StreakAnimation streak={numericValue} />
          ) : isAnimatedNumber && typeof value === "number" ? (
            <AnimatedCounter value={numericValue} suffix={suffix} />
          ) : (
            <span>{value}</span>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnimatedStatsCard;
