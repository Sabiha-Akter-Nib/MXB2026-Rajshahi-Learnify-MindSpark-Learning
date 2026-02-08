import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import aiTutorImg from "@/assets/module-ai-tutor.png";
import assessmentImg from "@/assets/module-assessment.png";
import learningPlanImg from "@/assets/module-learning-plan.png";
import practiceImg from "@/assets/module-practice.png";

interface ModuleCard {
  label: string;
  labelBn: string;
  href: string;
  image: string;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
}

const modules: ModuleCard[] = [
  {
    label: "AI Tutor",
    labelBn: "এআই টিউটর",
    href: "/tutor",
    image: aiTutorImg,
    gradientFrom: "hsl(270,60%,55%)",
    gradientTo: "hsl(280,70%,70%)",
    textColor: "text-[hsl(270,60%,45%)]",
  },
  {
    label: "Assessment",
    labelBn: "মূল্যায়ন",
    href: "/assessment",
    image: assessmentImg,
    gradientFrom: "hsl(35,90%,55%)",
    gradientTo: "hsl(40,95%,65%)",
    textColor: "text-[hsl(30,85%,45%)]",
  },
  {
    label: "Learning Plan",
    labelBn: "শিক্ষা পরিকল্পনা",
    href: "/learning-plan",
    image: learningPlanImg,
    gradientFrom: "hsl(175,50%,45%)",
    gradientTo: "hsl(165,55%,60%)",
    textColor: "text-[hsl(175,55%,35%)]",
  },
  {
    label: "Practice",
    labelBn: "অনুশীলন",
    href: "/practice",
    image: practiceImg,
    gradientFrom: "hsl(20,85%,55%)",
    gradientTo: "hsl(30,90%,65%)",
    textColor: "text-[hsl(20,80%,45%)]",
  },
];

const ModuleCardItem = ({ mod, index }: { mod: ModuleCard; index: number }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex-1 min-w-0"
    >
      <Link
        to={mod.href}
        className="block group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <motion.div
          className="flex flex-col items-center gap-1.5"
          whileHover={{ scale: 1.08, y: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Icon */}
          <motion.div
            className="relative w-[4.2rem] h-[4.2rem] sm:w-[5.5rem] sm:h-[5.5rem] rounded-2xl overflow-hidden"
            animate={{
              boxShadow: hovered
                ? `0 8px 25px -4px ${mod.gradientFrom}88, 0 0 30px -8px ${mod.gradientTo}44`
                : `0 4px 12px -3px ${mod.gradientFrom}44`,
            }}
            transition={{ duration: 0.25 }}
          >
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none"
              animate={{ x: hovered ? "150%" : "-150%" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{
                background:
                  "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)",
              }}
            />
            <img
              src={mod.image}
              alt={mod.label}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Labels */}
          <div className="text-center">
            <h3
              className={cn(
                "font-heading font-extrabold text-[11px] sm:text-sm tracking-wide leading-tight",
                mod.textColor
              )}
            >
              {mod.labelBn}
            </h3>
            <p className="text-[9px] sm:text-[11px] text-muted-foreground font-semibold leading-tight">
              {mod.label}
            </p>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

const QuickActions = () => {
  return (
    <div
      className="relative rounded-2xl sm:rounded-3xl p-3 sm:p-5 overflow-hidden"
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(20px) saturate(1.3)",
        WebkitBackdropFilter: "blur(20px) saturate(1.3)",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      {/* Subtle top highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
        }}
      />

      <div className="relative z-10 flex flex-row items-start justify-around gap-2 sm:gap-4">
        {modules.map((mod, index) => (
          <ModuleCardItem key={mod.label} mod={mod} index={index} />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
