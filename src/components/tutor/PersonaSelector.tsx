import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Heart, Beaker, Zap, ListOrdered, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type PersonaType =
  | "strict"
  | "friendly"
  | "scientist"
  | "revision"
  | "stepbystep";

interface Persona {
  id: PersonaType;
  name: string;
  nameBn: string;
  icon: React.ElementType;
  description: string;
  descriptionBn: string;
  gradientFrom: string;
  gradientTo: string;
  shadow: string;
  textColor: string;
}

// magenta, pink, purple, golden palette
const personas: Persona[] = [
  {
    id: "strict",
    name: "Strict Teacher",
    nameBn: "কঠোর শিক্ষক",
    icon: GraduationCap,
    description: "Formal & rigorous",
    descriptionBn: "আনুষ্ঠানিক এবং কঠোর",
    gradientFrom: "hsl(300, 65%, 52%)",
    gradientTo: "hsl(320, 58%, 60%)",
    shadow: "hsla(300, 65%, 52%, 0.35)",
    textColor: "hsl(300, 65%, 42%)",
  },
  {
    id: "friendly",
    name: "Friendly Mentor",
    nameBn: "বন্ধু মেন্টর",
    icon: Heart,
    description: "Warm & supportive",
    descriptionBn: "উষ্ণ এবং সহায়ক",
    gradientFrom: "hsl(330, 70%, 55%)",
    gradientTo: "hsl(345, 65%, 63%)",
    shadow: "hsla(330, 70%, 55%, 0.35)",
    textColor: "hsl(330, 70%, 42%)",
  },
  {
    id: "scientist",
    name: "Scientist",
    nameBn: "বিজ্ঞানী",
    icon: Beaker,
    description: "Curious & deep",
    descriptionBn: "কৌতূহলী এবং গভীর",
    gradientFrom: "hsl(270, 60%, 55%)",
    gradientTo: "hsl(285, 55%, 63%)",
    shadow: "hsla(270, 60%, 55%, 0.35)",
    textColor: "hsl(270, 60%, 42%)",
  },
  {
    id: "revision",
    name: "Fast Revision",
    nameBn: "দ্রুত রিভিশন",
    icon: Zap,
    description: "Quick key points",
    descriptionBn: "দ্রুত মূল পয়েন্ট",
    gradientFrom: "hsl(42, 85%, 52%)",
    gradientTo: "hsl(35, 80%, 58%)",
    shadow: "hsla(42, 85%, 52%, 0.35)",
    textColor: "hsl(42, 85%, 38%)",
  },
  {
    id: "stepbystep",
    name: "Step-by-Step",
    nameBn: "ধাপে ধাপে",
    icon: ListOrdered,
    description: "Patient & thorough",
    descriptionBn: "ধৈর্যশীল এবং পুঙ্খানুপুঙ্খ",
    gradientFrom: "hsl(280, 55%, 52%)",
    gradientTo: "hsl(300, 50%, 60%)",
    shadow: "hsla(280, 55%, 52%, 0.35)",
    textColor: "hsl(280, 55%, 42%)",
  },
];

interface PersonaSelectorProps {
  selected: PersonaType;
  onSelect: (persona: PersonaType) => void;
  isBangla?: boolean;
  compact?: boolean;
}

export const PersonaSelector = ({
  selected,
  onSelect,
  isBangla = false,
  compact = false,
}: PersonaSelectorProps) => {
  const [hoveredId, setHoveredId] = useState<PersonaType | null>(null);

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
        {personas.map((persona, index) => {
          const Icon = persona.icon;
          const isSelected = selected === persona.id;

          return (
            <motion.button
              key={persona.id}
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05, y: -2 }}
              onClick={() => onSelect(persona.id)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
              style={isSelected ? {
                background: `linear-gradient(135deg, ${persona.gradientFrom}, ${persona.gradientTo})`,
                boxShadow: `0 6px 24px ${persona.shadow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                color: "white",
                border: "1px solid transparent",
              } : {
                background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.68))",
                backdropFilter: "blur(20px) saturate(1.4)",
                border: "1.5px solid rgba(255,255,255,0.55)",
                boxShadow: `0 3px 14px ${persona.shadow.replace('0.35', '0.12')}, inset 0 1px 0 rgba(255,255,255,0.7)`,
                color: persona.textColor,
              }}
            >
              <Icon className={cn("w-4 h-4", isSelected ? "text-white" : "")} />
              <span className="text-xs font-bold font-heading">
                {isBangla ? persona.nameBn : persona.name}
              </span>
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-0.5">
                  <Check className="w-3.5 h-3.5" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  }

  // Full: grid of glass cards
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-1">
      {personas.map((persona, index) => {
        const Icon = persona.icon;
        const isSelected = selected === persona.id;
        const isHovered = hoveredId === persona.id;

        return (
          <motion.button
            key={persona.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05, y: -4 }}
            onHoverStart={() => setHoveredId(persona.id)}
            onHoverEnd={() => setHoveredId(null)}
            onClick={() => onSelect(persona.id)}
            className="relative flex flex-col items-center gap-3 p-5 rounded-3xl transition-all overflow-hidden"
            style={isSelected ? {
              background: `linear-gradient(135deg, ${persona.gradientFrom}, ${persona.gradientTo})`,
              boxShadow: `0 12px 40px ${persona.shadow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
              border: "1.5px solid transparent",
            } : {
              background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
              backdropFilter: "blur(24px) saturate(1.5)",
              border: "1.5px solid rgba(255,255,255,0.55)",
              boxShadow: isHovered
                ? `0 8px 30px ${persona.shadow.replace('0.35', '0.2')}, inset 0 1px 0 rgba(255,255,255,0.8)`
                : `0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7)`,
            }}
          >
            {/* Icon */}
            <motion.div
              className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
              style={isSelected ? {
                background: "rgba(255,255,255,0.2)",
              } : {
                background: `linear-gradient(135deg, ${persona.gradientFrom}, ${persona.gradientTo})`,
                boxShadow: `0 4px 16px ${persona.shadow}`,
              }}
              animate={isSelected || isHovered ? { y: [0, -4, 0], scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-7 h-7 text-white" />
              {isSelected && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <Sparkles className="w-4 h-4 text-white/80" />
                </motion.div>
              )}
            </motion.div>

            {/* Text */}
            <div className="text-center z-10">
              <p className={cn("font-semibold text-sm mb-0.5 font-heading", isSelected ? "text-white" : "")}
                style={!isSelected ? { color: persona.textColor } : undefined}
              >
                {isBangla ? persona.nameBn : persona.name}
              </p>
              <p className={cn("text-xs", isSelected ? "text-white/80" : "text-muted-foreground")}>
                {isBangla ? persona.descriptionBn : persona.description}
              </p>
            </div>

            {/* Check */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-3 right-3 w-6 h-6 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
};

export const getPersonaPrompt = (persona: PersonaType): string => {
  const prompts: Record<PersonaType, string> = {
    strict: `TEACHING PERSONA: STRICT TEACHER
- Be formal and academically rigorous
- Use precise language with proper terminology
- Hold high standards and push for excellence
- Give direct, no-nonsense explanations
- Point out mistakes clearly and constructively
- Maintain professional distance while being helpful`,
    friendly: `TEACHING PERSONA: FRIENDLY MENTOR
- Be warm, encouraging, and supportive
- Use casual, relatable language with emojis
- Celebrate small wins and progress
- Give lots of positive reinforcement
- Make learning feel fun and stress-free
- Use analogies from daily life`,
    scientist: `TEACHING PERSONA: CONCEPT SCIENTIST
- Be curious and experimental in approach
- Ask probing questions to spark thinking
- Explore "why" and "how" deeply
- Connect concepts to real-world phenomena
- Encourage hypothesis and testing
- Make learning feel like discovery`,
    revision: `TEACHING PERSONA: FAST REVISION COACH
- Be quick and efficient
- Focus ONLY on key points and facts
- Use bullet points and short sentences
- Skip lengthy explanations
- Highlight must-remember items
- Perfect for exam preparation`,
    stepbystep: `TEACHING PERSONA: STEP-BY-STEP GUIDE
- Be extremely patient and thorough
- Break everything into small, numbered steps
- Wait for understanding before proceeding
- Repeat and reinforce as needed
- Use lots of examples at each step
- Perfect for complex or new topics`,
  };
  return prompts[persona];
};
