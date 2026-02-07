import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
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
  gradient: string;
  glowColor: string;
  borderColor: string;
  accentText: string;
}

const modules: ModuleCard[] = [
  {
    label: "AI Tutor",
    description: "Ask anything",
    href: "/tutor",
    image: aiTutorImg,
    gradient: "from-[hsl(270,60%,65%)] via-[hsl(280,50%,55%)] to-[hsl(260,70%,45%)]",
    glowColor: "rgba(147,112,219,0.5)",
    borderColor: "border-[hsl(270,60%,70%)]/50",
    accentText: "text-[hsl(270,80%,90%)]",
  },
  {
    label: "Assessment",
    description: "Test yourself",
    href: "/assessment",
    image: assessmentImg,
    gradient: "from-[hsl(40,90%,60%)] via-[hsl(35,85%,55%)] to-[hsl(25,80%,50%)]",
    glowColor: "rgba(245,180,60,0.5)",
    borderColor: "border-[hsl(40,90%,70%)]/50",
    accentText: "text-[hsl(40,100%,95%)]",
  },
  {
    label: "Learning Plan",
    description: "Your schedule",
    href: "/learning-plan",
    image: learningPlanImg,
    gradient: "from-[hsl(160,50%,50%)] via-[hsl(170,45%,45%)] to-[hsl(180,55%,40%)]",
    glowColor: "rgba(72,191,166,0.5)",
    borderColor: "border-[hsl(160,50%,60%)]/50",
    accentText: "text-[hsl(160,60%,92%)]",
  },
  {
    label: "Practice",
    description: "Build skills",
    href: "/practice",
    image: practiceImg,
    gradient: "from-[hsl(20,85%,58%)] via-[hsl(15,80%,52%)] to-[hsl(10,75%,45%)]",
    glowColor: "rgba(230,120,55,0.5)",
    borderColor: "border-[hsl(20,85%,65%)]/50",
    accentText: "text-[hsl(25,100%,93%)]",
  },
];

const ModuleCardItem = ({ mod, index }: { mod: ModuleCard; index: number }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link
        to={mod.href}
        className="block group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <motion.div
          className={cn(
            "relative rounded-3xl overflow-hidden cursor-pointer border",
            mod.borderColor
          )}
          whileHover={{ scale: 1.05, y: -6 }}
          whileTap={{ scale: 0.96 }}
          animate={{
            boxShadow: hovered
              ? `0 20px 40px -10px ${mod.glowColor}, 0 0 60px -15px ${mod.glowColor}`
              : `0 8px 25px -8px ${mod.glowColor.replace("0.5", "0.25")}`,
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Gradient background */}
          <div className={cn("absolute inset-0 bg-gradient-to-br", mod.gradient)} />

          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-0 z-10"
            animate={{ x: hovered ? "120%" : "-120%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
            }}
          />

          {/* Floating orb */}
          <motion.div
            className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl"
            animate={{
              scale: hovered ? [1, 1.4, 1.2] : 1,
              opacity: hovered ? [0.3, 0.6, 0.4] : 0.2,
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Content */}
          <div className="relative z-20 flex flex-col items-center px-3 pt-4 pb-3 sm:px-4 sm:pt-5 sm:pb-4">
            {/* Image with bounce */}
            <motion.img
              src={mod.image}
              alt={mod.label}
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain drop-shadow-2xl"
              animate={hovered ? { y: [0, -8, 0], rotate: [0, -3, 3, 0] } : {}}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />

            {/* Label */}
            <h3 className={cn("font-heading font-bold text-sm sm:text-base mt-2 drop-shadow-md", mod.accentText)}>
              {mod.label}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-[11px] sm:text-xs text-white/70">
                {mod.description}
              </p>
              <motion.div
                animate={{ x: hovered ? 3 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-3 h-3 text-white/60" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

const QuickActions = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {modules.map((mod, index) => (
        <ModuleCardItem key={mod.label} mod={mod} index={index} />
      ))}
    </div>
  );
};

export default QuickActions;
