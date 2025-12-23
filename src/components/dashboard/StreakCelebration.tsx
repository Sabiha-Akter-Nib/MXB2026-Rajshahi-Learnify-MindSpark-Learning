import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Sparkles, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCelebrationProps {
  show: boolean;
  newStreak: number;
  previousStreak: number;
  onDismiss: () => void;
}

// Animated fire particles
const FireParticle = ({ delay, index }: { delay: number; index: number }) => {
  const angle = (index / 12) * Math.PI * 2;
  const distance = 80 + Math.random() * 60;
  
  return (
    <motion.div
      className="absolute"
      initial={{ 
        x: 0, 
        y: 0, 
        scale: 0, 
        opacity: 1 
      }}
      animate={{ 
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 30,
        scale: [0, 1.5, 0],
        opacity: [1, 0.8, 0],
      }}
      transition={{ 
        duration: 1.2, 
        delay: delay + index * 0.05,
        ease: "easeOut" 
      }}
    >
      <Flame className="w-6 h-6 text-accent" />
    </motion.div>
  );
};

// Sparkle effects
const SparkleEffect = ({ delay, index }: { delay: number; index: number }) => {
  const angle = (index / 8) * Math.PI * 2 + Math.PI / 8;
  const distance = 100 + Math.random() * 80;
  
  return (
    <motion.div
      className="absolute"
      initial={{ 
        x: 0, 
        y: 0, 
        scale: 0, 
        opacity: 1,
        rotate: 0,
      }}
      animate={{ 
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: [0, 1.2, 0],
        opacity: [1, 1, 0],
        rotate: 360,
      }}
      transition={{ 
        duration: 1.5, 
        delay: delay + 0.2 + index * 0.08,
        ease: "easeOut" 
      }}
    >
      <Star className="w-5 h-5 text-warning fill-warning" />
    </motion.div>
  );
};

// Animated number counter
const AnimatedNumber = ({ value, duration = 1.5 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.round(easeOutExpo * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

const StreakCelebration = ({ 
  show, 
  newStreak, 
  previousStreak, 
  onDismiss 
}: StreakCelebrationProps) => {
  const [phase, setPhase] = useState<"entering" | "counting" | "celebrating" | "done">("entering");
  const streakIncreased = newStreak > previousStreak;

  useEffect(() => {
    if (show) {
      setPhase("entering");
      
      const timers = [
        setTimeout(() => setPhase("counting"), 500),
        setTimeout(() => setPhase("celebrating"), 1800),
        setTimeout(() => setPhase("done"), 4000),
      ];

      return () => timers.forEach(clearTimeout);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />

          {/* Main content */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Close button */}
            <motion.button
              className="absolute -top-12 right-0 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              onClick={onDismiss}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </motion.button>

            {/* Glowing background orb */}
            <motion.div
              className="absolute w-64 h-64 rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(var(--accent) / 0.4) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Fire icon container */}
            <motion.div
              className="relative mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
            >
              {/* Fire particles burst */}
              {phase === "celebrating" && (
                <>
                  {[...Array(12)].map((_, i) => (
                    <FireParticle key={`fire-${i}`} delay={0} index={i} />
                  ))}
                  {[...Array(8)].map((_, i) => (
                    <SparkleEffect key={`sparkle-${i}`} delay={0} index={i} />
                  ))}
                </>
              )}

              {/* Main fire icon */}
              <motion.div
                className="relative w-32 h-32 bg-gradient-to-br from-accent via-warning to-accent rounded-full flex items-center justify-center shadow-2xl"
                animate={phase === "celebrating" ? {
                  scale: [1, 1.2, 1.1],
                  rotate: [0, -5, 5, 0],
                } : {}}
                transition={{ duration: 0.6 }}
                style={{
                  boxShadow: "0 0 60px 20px hsl(var(--accent) / 0.5)",
                }}
              >
                <motion.div
                  animate={{
                    y: [0, -5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Flame className="w-16 h-16 text-primary-foreground" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Text content */}
            <motion.div
              className="text-center relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.p
                className="text-lg text-muted-foreground mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {streakIncreased ? "🎉 Amazing! You're on fire!" : "Welcome back!"}
              </motion.p>

              {/* Streak number with animation */}
              <motion.div
                className="flex items-center justify-center gap-3"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
              >
                <motion.span
                  className="font-heading text-7xl font-bold bg-gradient-to-r from-accent via-warning to-accent bg-clip-text text-transparent"
                  animate={phase === "celebrating" ? {
                    scale: [1, 1.15, 1],
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {phase === "counting" || phase === "celebrating" || phase === "done" ? (
                    <AnimatedNumber value={newStreak} duration={1} />
                  ) : (
                    previousStreak
                  )}
                </motion.span>
                <motion.span
                  className="text-2xl text-muted-foreground"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                >
                  Day{newStreak !== 1 ? "s" : ""}
                </motion.span>
              </motion.div>

              <motion.p
                className="text-xl font-semibold mt-2 text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {streakIncreased ? "Streak Extended!" : "Keep it going!"}
              </motion.p>

              {/* Motivational message */}
              <motion.p
                className="text-sm text-muted-foreground mt-4 max-w-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                {newStreak >= 7 
                  ? "You're a learning champion! Keep the momentum going!"
                  : newStreak >= 3 
                  ? "Great consistency! You're building a strong habit!"
                  : "Every day counts! Come back tomorrow to grow your streak!"}
              </motion.p>

              {/* Continue button */}
              <motion.button
                className={cn(
                  "mt-6 px-8 py-3 rounded-xl font-semibold",
                  "bg-gradient-to-r from-accent to-warning text-primary-foreground",
                  "shadow-lg hover:shadow-xl transition-shadow",
                )}
                style={{
                  boxShadow: "0 10px 40px -10px hsl(var(--accent) / 0.5)",
                }}
                onClick={onDismiss}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Continue Learning
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakCelebration;