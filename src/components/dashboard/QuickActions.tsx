import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

import aiTutorImg from "@/assets/module-ai-tutor.png";
import assessmentImg from "@/assets/module-assessment.png";
import learningPlanImg from "@/assets/module-learning-plan.png";
import practiceImg from "@/assets/module-practice.png";

interface ModuleCard {
  label: string;
  description: string;
  href: string;
  image: string;
  borderColor: string;
  bgGradient: string;
  shadowColor: string;
}

const modules: ModuleCard[] = [
  {
    label: "AI Tutor",
    description: "Ask any question",
    href: "/tutor",
    image: aiTutorImg,
    borderColor: "border-primary/40",
    bgGradient: "from-primary/15 via-primary/5 to-transparent",
    shadowColor: "hover:shadow-primary/20",
  },
  {
    label: "Assessment",
    description: "Test your knowledge",
    href: "/assessment",
    image: assessmentImg,
    borderColor: "border-warning/40",
    bgGradient: "from-warning/15 via-warning/5 to-transparent",
    shadowColor: "hover:shadow-warning/20",
  },
  {
    label: "Learning Plan",
    description: "Personalized schedule",
    href: "/learning-plan",
    image: learningPlanImg,
    borderColor: "border-success/40",
    bgGradient: "from-success/15 via-success/5 to-transparent",
    shadowColor: "hover:shadow-success/20",
  },
  {
    label: "Practice",
    description: "Topic exercises",
    href: "/practice",
    image: practiceImg,
    borderColor: "border-accent/40",
    bgGradient: "from-accent/15 via-accent/5 to-transparent",
    shadowColor: "hover:shadow-accent/20",
  },
];

const QuickActions = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {modules.map((mod, index) => (
        <motion.div
          key={mod.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.4 }}
        >
          <Link to={mod.href} className="block group">
            <motion.div
              className={cn(
                "relative rounded-2xl border-2 overflow-hidden transition-all duration-300",
                "bg-card/70 backdrop-blur-sm",
                mod.borderColor,
                mod.shadowColor,
                "hover:shadow-xl hover:-translate-y-1"
              )}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Gradient overlay */}
              <div className={cn("absolute inset-0 bg-gradient-to-b opacity-60", mod.bgGradient)} />

              {/* Image */}
              <div className="relative z-10 flex justify-center pt-3 sm:pt-4 px-3">
                <img
                  src={mod.image}
                  alt={mod.label}
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain drop-shadow-lg"
                />
              </div>

              {/* Text */}
              <div className="relative z-10 px-3 pb-3 sm:pb-4 pt-2 text-center">
                <h3 className="font-heading font-bold text-sm sm:text-base">
                  {mod.label}
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  {mod.description}
                </p>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default QuickActions;
