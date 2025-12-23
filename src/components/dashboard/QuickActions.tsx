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
}

const quickActions: QuickAction[] = [
  {
    icon: Brain,
    label: "AI Tutor",
    description: "Ask any question",
    href: "/tutor",
    color: "primary",
  },
  {
    icon: Target,
    label: "Assessment",
    description: "Test your knowledge",
    href: "/assessment",
    color: "success",
  },
  {
    icon: Calendar,
    label: "Learning Plan",
    description: "Personalized schedule",
    href: "/learning-plan",
    color: "accent",
  },
  {
    icon: BarChart3,
    label: "Practice",
    description: "Topic exercises",
    href: "/practice",
    color: "warning",
  },
];

const colorClasses = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    hoverBorder: "hover:border-primary/40",
    gradient: "from-primary/15 via-primary/5 to-transparent",
    glow: "group-hover:shadow-primary/20",
  },
  success: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/20",
    hoverBorder: "hover:border-success/40",
    gradient: "from-success/15 via-success/5 to-transparent",
    glow: "group-hover:shadow-success/20",
  },
  accent: {
    bg: "bg-accent/10",
    text: "text-accent",
    border: "border-accent/20",
    hoverBorder: "hover:border-accent/40",
    gradient: "from-accent/15 via-accent/5 to-transparent",
    glow: "group-hover:shadow-accent/20",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20",
    hoverBorder: "hover:border-warning/40",
    gradient: "from-warning/15 via-warning/5 to-transparent",
    glow: "group-hover:shadow-warning/20",
  },
};

const QuickActions = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        const colors = colorClasses[action.color];

        return (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.08,
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <Link
              to={action.href}
              className={cn(
                "group relative block p-5 rounded-2xl border backdrop-blur-sm overflow-hidden",
                "bg-card/60 hover:bg-card/90",
                colors.border,
                colors.hoverBorder,
                "transition-all duration-300",
                "hover:shadow-xl",
                colors.glow
              )}
            >
              {/* Animated gradient background */}
              <motion.div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  colors.gradient
                )}
              />
              
              {/* Floating sparkle on hover */}
              <motion.div
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100"
                initial={{ scale: 0, rotate: -180 }}
                whileHover={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles className={cn("w-4 h-4", colors.text)} />
              </motion.div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <motion.div 
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                      colors.bg,
                      colors.text
                    )}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <motion.div
                    className="group-hover:translate-x-1 transition-transform duration-200"
                  >
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                  </motion.div>
                </div>
                
                <h3 className="font-semibold text-lg mb-1 group-hover:text-foreground transition-colors">
                  {action.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>

              {/* Bottom glow line */}
              <motion.div
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100",
                  `bg-gradient-to-r from-transparent via-${action.color} to-transparent`
                )}
                style={{
                  background: `linear-gradient(to right, transparent, hsl(var(--${action.color})), transparent)`,
                }}
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};

export default QuickActions;
