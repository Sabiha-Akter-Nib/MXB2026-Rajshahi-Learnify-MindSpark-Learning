import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Brain,
  Target,
  Calendar,
  BarChart3,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: typeof Brain;
  label: string;
  description: string;
  href: string;
  color: "primary" | "success" | "accent" | "warning";
  gradient: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Brain,
    label: "AI Tutor",
    description: "Ask any question",
    href: "/tutor",
    color: "primary",
    gradient: "from-primary/20 via-primary/10 to-accent/5",
  },
  {
    icon: Target,
    label: "Assessment",
    description: "Test your knowledge",
    href: "/assessment",
    color: "success",
    gradient: "from-success/20 via-success/10 to-primary/5",
  },
  {
    icon: Calendar,
    label: "Learning Plan",
    description: "Personalized schedule",
    href: "/learning-plan",
    color: "accent",
    gradient: "from-accent/20 via-accent/10 to-success/5",
  },
  {
    icon: BarChart3,
    label: "Practice",
    description: "Topic exercises",
    href: "/practice",
    color: "warning",
    gradient: "from-warning/20 via-warning/10 to-accent/5",
  },
];

const colorClasses = {
  primary: {
    bg: "bg-primary/15",
    text: "text-primary",
    border: "border-primary/30",
    hoverBorder: "hover:border-primary/60",
    glow: "shadow-primary/25",
    underline: "bg-gradient-to-r from-primary via-accent to-primary",
  },
  success: {
    bg: "bg-success/15",
    text: "text-success",
    border: "border-success/30",
    hoverBorder: "hover:border-success/60",
    glow: "shadow-success/25",
    underline: "bg-gradient-to-r from-success via-primary to-success",
  },
  accent: {
    bg: "bg-accent/15",
    text: "text-accent",
    border: "border-accent/30",
    hoverBorder: "hover:border-accent/60",
    glow: "shadow-accent/25",
    underline: "bg-gradient-to-r from-accent via-warning to-accent",
  },
  warning: {
    bg: "bg-warning/15",
    text: "text-warning",
    border: "border-warning/30",
    hoverBorder: "hover:border-warning/60",
    glow: "shadow-warning/25",
    underline: "bg-gradient-to-r from-warning via-success to-warning",
  },
};

const QuickActionCard = ({ action, index }: { action: QuickAction; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = action.icon;
  const colors = colorClasses[action.color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="h-full"
    >
      <Link
        to={action.href}
        className="h-full block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className={cn(
            "group relative h-full p-6 rounded-2xl border backdrop-blur-md overflow-hidden",
            "bg-gradient-to-br bg-card/70",
            colors.border,
            "transition-all duration-300"
          )}
          whileHover={{ 
            y: -8,
            scale: 1.02,
          }}
          animate={{
            boxShadow: isHovered 
              ? `0 25px 50px -12px hsl(var(--${action.color}) / 0.35), 0 0 30px -5px hsl(var(--${action.color}) / 0.2)`
              : "0 4px 20px -5px hsl(var(--foreground) / 0.1)",
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated gradient background */}
          <motion.div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0",
              action.gradient
            )}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Colorful corner orb */}
          <motion.div
            className={cn("absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl", colors.bg)}
            animate={{
              scale: isHovered ? [1, 1.4, 1.2] : [1, 1.2, 1],
              opacity: isHovered ? [0.5, 0.8, 0.6] : [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 -translate-x-full"
            animate={{ translateX: isHovered ? "200%" : "-100%" }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            }}
          />
          
          {/* Floating sparkles on hover */}
          <motion.div
            className="absolute top-4 right-4"
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ 
              opacity: isHovered ? 1 : 0, 
              scale: isHovered ? 1 : 0, 
              rotate: isHovered ? 0 : -180 
            }}
            transition={{ duration: 0.4 }}
          >
            <Sparkles className={cn("w-5 h-5", colors.text)} />
          </motion.div>

          <div className="relative z-10 flex flex-col h-full min-h-[140px]">
            <div className="flex items-start justify-between mb-4">
              {/* Icon container with jump animation */}
              <div className="relative">
                <motion.div 
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center",
                    colors.bg,
                    colors.text
                  )}
                  animate={isHovered ? {
                    y: [0, -14, 0],
                    scale: [1, 1.2, 1],
                    rotate: [0, -8, 8, 0],
                  } : {}}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{
                    boxShadow: isHovered 
                      ? `0 10px 25px -5px hsl(var(--${action.color}) / 0.4)` 
                      : "none",
                  }}
                >
                  <Icon className="w-7 h-7" />
                </motion.div>
                
                {/* Glowing underline under icon */}
                <motion.div
                  className={cn("absolute -bottom-2 left-0 h-1 rounded-full", colors.underline)}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ 
                    width: isHovered ? "100%" : 0,
                    opacity: isHovered ? 1 : 0,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{
                    boxShadow: isHovered ? `0 0 10px 2px hsl(var(--${action.color}) / 0.5)` : "none",
                  }}
                />
              </div>
              
              <motion.div
                animate={{ 
                  x: isHovered ? 4 : 0,
                  scale: isHovered ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className={cn(
                  "w-5 h-5 transition-colors duration-300",
                  isHovered ? colors.text : "text-muted-foreground"
                )} />
              </motion.div>
            </div>
            
            <div className="flex-grow">
              <motion.h3 
                className="font-heading font-bold text-lg mb-1"
                animate={{ 
                  color: isHovered ? `hsl(var(--${action.color}))` : "hsl(var(--foreground))",
                }}
                transition={{ duration: 0.3 }}
              >
                {action.label}
              </motion.h3>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </div>

            {/* Bottom glow line */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full"
              style={{
                background: `linear-gradient(to right, transparent, hsl(var(--${action.color})), transparent)`,
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ 
                scaleX: isHovered ? 1 : 0,
                opacity: isHovered ? 1 : 0,
              }}
              transition={{ duration: 0.4 }}
            />
            
            {/* Glow effect under the line */}
            <motion.div
              className="absolute -bottom-2 left-1/4 right-1/4 h-4 blur-md"
              style={{
                background: `hsl(var(--${action.color}) / 0.5)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 0.6 : 0 }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

const QuickActions = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-fr">
      {quickActions.map((action, index) => (
        <QuickActionCard key={action.label} action={action} index={index} />
      ))}
    </div>
  );
};

export default QuickActions;