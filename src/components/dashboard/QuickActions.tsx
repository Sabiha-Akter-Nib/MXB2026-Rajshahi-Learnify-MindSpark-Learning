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
  textColor: string;
}
const modules: ModuleCard[] = [{
  label: "AI Tutor",
  labelBn: "এআই টিউটর",
  href: "/tutor",
  image: aiTutorImg,
  glowColor: "147,112,219",
  textColor: "text-[hsl(270,60%,65%)]"
}, {
  label: "Assessment",
  labelBn: "মূল্যায়ন",
  href: "/assessment",
  image: assessmentImg,
  glowColor: "245,180,60",
  textColor: "text-[hsl(35,90%,50%)]"
}, {
  label: "Learning Plan",
  labelBn: "শিক্ষা পরিকল্পনা",
  href: "/learning-plan",
  image: learningPlanImg,
  glowColor: "72,191,166",
  textColor: "text-[hsl(165,50%,42%)]"
}, {
  label: "Practice",
  labelBn: "অনুশীলন",
  href: "/practice",
  image: practiceImg,
  glowColor: "230,120,55",
  textColor: "text-[hsl(20,80%,52%)]"
}];
const ModuleCardItem = ({
  mod,
  index
}: {
  mod: ModuleCard;
  index: number;
}) => {
  const [hovered, setHovered] = useState(false);
  return <motion.div initial={{
    opacity: 0,
    y: 25,
    scale: 0.92
  }} animate={{
    opacity: 1,
    y: 0,
    scale: 1
  }} transition={{
    delay: index * 0.1,
    duration: 0.5,
    ease: [0.25, 0.46, 0.45, 0.94]
  }}>
      <Link to={mod.href} className="block group" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <motion.div className="relative flex flex-col items-center" whileHover={{
        scale: 1.06,
        y: -5
      }} whileTap={{
        scale: 0.96
      }}>
          {/* Image card — smaller with max-w constraint */}
          <motion.div className="relative rounded-2xl sm:rounded-[1.4rem] overflow-hidden w-[85%] sm:w-[80%] aspect-square mx-auto" animate={{
          boxShadow: hovered ? `0 14px 35px -6px rgba(${mod.glowColor},0.5), 0 0 45px -10px rgba(${mod.glowColor},0.25)` : `0 5px 18px -5px rgba(${mod.glowColor},0.3)`
        }} transition={{
          duration: 0.3
        }}>
            {/* Shimmer */}
            <motion.div className="absolute inset-0 z-10 pointer-events-none" animate={{
            x: hovered ? "150%" : "-150%"
          }} transition={{
            duration: 0.65,
            ease: "easeInOut"
          }} style={{
            background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.3) 50%, transparent 65%)"
          }} />
            <motion.img src={mod.image} alt={mod.label} className="w-full h-full object-cover" animate={hovered ? {
            scale: 1.05
          } : {
            scale: 1
          }} transition={{
            duration: 0.3
          }} />
          </motion.div>

          {/* Labels */}
          <div className="mt-2 text-center">
            <h3 className={cn("font-heading font-extrabold text-sm tracking-wide sm:text-3xl", mod.textColor)}>
              {mod.labelBn}
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">
              {mod.label}
            </p>
          </div>
        </motion.div>
      </Link>
    </motion.div>;
};
const QuickActions = () => {
  return <div className="relative rounded-3xl p-4 sm:p-6 overflow-hidden" style={{
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(24px) saturate(1.4)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.08)"
  }}>
      {/* Liquid glass highlight streaks */}
      <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none" style={{
      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)"
    }} />
      <div className="absolute -top-20 -left-20 w-52 h-52 rounded-full pointer-events-none opacity-20 blur-3xl" style={{
      background: "radial-gradient(circle, rgba(147,112,219,0.5), transparent 70%)"
    }} />
      <div className="absolute -bottom-16 -right-16 w-44 h-44 rounded-full pointer-events-none opacity-15 blur-3xl" style={{
      background: "radial-gradient(circle, rgba(72,191,166,0.5), transparent 70%)"
    }} />

      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {modules.map((mod, index) => <ModuleCardItem key={mod.label} mod={mod} index={index} />)}
      </div>
    </div>;
};
export default QuickActions;