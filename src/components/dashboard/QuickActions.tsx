import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Brain,
  Target,
  Calendar,
  BarChart3,
  Play,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: typeof Brain;
  label: string;
  description: string;
  href: string;
  color: string;
  gradient: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Brain,
    label: "AI Tutor",
    description: "Ask any question",
    href: "/tutor",
    color: "text-primary",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Target,
    label: "Assessment",
    description: "Test your knowledge",
    href: "/assessment",
    color: "text-success",
    gradient: "from-success/20 to-success/5",
  },
  {
    icon: Calendar,
    label: "Learning Plan",
    description: "Personalized schedule",
    href: "/learning-plan",
    color: "text-accent",
    gradient: "from-accent/20 to-accent/5",
  },
  {
    icon: BarChart3,
    label: "Practice",
    description: "Topic exercises",
    href: "/practice",
    color: "text-warning",
    gradient: "from-warning/20 to-warning/5",
  },
];

const QuickActions = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={action.href}
              className={cn(
                "block p-4 rounded-xl border border-border bg-gradient-to-br transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/30",
                action.gradient
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-card shadow-sm", action.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">{action.label}</h3>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};

export default QuickActions;
