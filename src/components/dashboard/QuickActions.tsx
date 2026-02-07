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
  glowColor: string;
}

const modules: ModuleCard[] = [
  {
    label: "AI Tutor",
    labelBn: "এআই টিউটর",
    href: "/tutor",
    image: aiTutorImg,
    glowColor: "147,112,219",
  },
  {
    label: "Assessment",
    labelBn: "মূল্যায়ন",
    href: "/assessment",
    image: assessmentImg,
    glowColor: "245,180,60",
  },
  {
    label: "Learning Plan",
    labelBn: "শিক্ষা পরিকল্পনা",
    href: "/learning-plan",
    image: learningPlanImg,
    glowColor: "72,191,166",
  },
  {
    label: "Practice",
    labelBn: "অনুশীলন",
    href: "/practice",
    image: practiceImg,
    glowColor: "230,120,55",
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
          className="relative flex flex-col items-center"
          whileHover={{ scale: 1.06, y: -6 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Image — the image itself IS the card. Clip white corners with rounded + overflow-hidden */}
          <motion.div
            className="relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden w-full aspect-square"
            animate={{
              boxShadow: hovered
                ? `0 16px 40px -8px rgba(${mod.glowColor},0.55), 0 0 50px -10px rgba(${mod.glowColor},0.3)`
                : `0 6px 20px -6px rgba(${mod.glowColor},0.3)`,
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Shimmer sweep on hover */}
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none"
              animate={{ x: hovered ? "150%" : "-150%" }}
              transition={{ duration: 0.65, ease: "easeInOut" }}
              style={{
                background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)",
              }}
            />

            <motion.img
              src={mod.image}
              alt={mod.label}
              className="w-full h-full object-cover"
              animate={hovered ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          {/* Label below the image */}
          <div className="mt-2 sm:mt-3 text-center">
            <h3
              className="font-heading font-extrabold text-sm sm:text-base tracking-wide drop-shadow-sm"
              style={{ fontStyle: "italic" }}
            >
              {mod.labelBn}
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
      {modules.map((mod, index) => (
        <ModuleCardItem key={mod.label} mod={mod} index={index} />
      ))}
    </div>
  );
};

export default QuickActions;
