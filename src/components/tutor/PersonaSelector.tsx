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
  gradient: string;
  shadowColor: string;
  accentColor: string;
}

const personas: Persona[] = [
  {
    id: "strict",
    name: "Strict Teacher",
    nameBn: "কঠোর শিক্ষক",
    icon: GraduationCap,
    description: "Formal & rigorous",
    descriptionBn: "আনুষ্ঠানিক এবং কঠোর",
    gradient: "from-destructive to-destructive/80",
    shadowColor: "shadow-destructive/30",
    accentColor: "destructive",
  },
  {
    id: "friendly",
    name: "Friendly Mentor",
    nameBn: "বন্ধু মেন্টর",
    icon: Heart,
    description: "Warm & supportive",
    descriptionBn: "উষ্ণ এবং সহায়ক",
    gradient: "from-primary to-primary-dark",
    shadowColor: "shadow-primary/30",
    accentColor: "primary",
  },
  {
    id: "scientist",
    name: "Concept Scientist",
    nameBn: "বিজ্ঞানী",
    icon: Beaker,
    description: "Curious & deep",
    descriptionBn: "কৌতূহলী এবং গভীর",
    gradient: "from-accent to-accent-light",
    shadowColor: "shadow-accent/30",
    accentColor: "accent",
  },
  {
    id: "revision",
    name: "Fast Revision",
    nameBn: "দ্রুত রিভিশন",
    icon: Zap,
    description: "Quick key points",
    descriptionBn: "দ্রুত মূল পয়েন্ট",
    gradient: "from-warning to-warning/80",
    shadowColor: "shadow-warning/30",
    accentColor: "warning",
  },
  {
    id: "stepbystep",
    name: "Step-by-Step",
    nameBn: "ধাপে ধাপে",
    icon: ListOrdered,
    description: "Patient & thorough",
    descriptionBn: "ধৈর্যশীল এবং পুঙ্খানুপুঙ্খ",
    gradient: "from-primary-light to-primary",
    shadowColor: "shadow-primary-light/30",
    accentColor: "primary-light",
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
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
        {personas.map((persona, index) => {
          const Icon = persona.icon;
          const isSelected = selected === persona.id;
          const isHovered = hoveredId === persona.id;
          
          return (
            <motion.button
              key={persona.id}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => setHoveredId(persona.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => onSelect(persona.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all whitespace-nowrap",
                "border backdrop-blur-sm",
                isSelected
                  ? `bg-gradient-to-r ${persona.gradient} text-white border-transparent shadow-lg ${persona.shadowColor}`
                  : "bg-card/80 text-foreground border-border/50 hover:border-primary/30 hover:bg-card"
              )}
            >
              {/* Glow effect on hover */}
              {(isHovered || isSelected) && (
                <motion.div
                  layoutId="persona-glow"
                  className={cn(
                    "absolute inset-0 rounded-2xl -z-10",
                    isSelected ? "opacity-0" : "opacity-100"
                  )}
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--primary) / 0.1), transparent)`,
                    boxShadow: isHovered && !isSelected ? "0 0 20px hsl(var(--primary) / 0.2)" : "none",
                  }}
                  initial={false}
                  transition={{ duration: 0.2 }}
                />
              )}
              
              <motion.div
                animate={isSelected ? { 
                  rotate: [0, -10, 10, 0],
                  scale: [1, 1.2, 1],
                } : {}}
                transition={{ duration: 0.4 }}
              >
                <Icon className={cn("w-4 h-4", isSelected ? "text-white" : "")} />
              </motion.div>
              
              <span>{isBangla ? persona.nameBn : persona.name}</span>
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-1"
                >
                  <Check className="w-3.5 h-3.5" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  }

  // Full persona selector - iOS style cards
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
            transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setHoveredId(persona.id)}
            onHoverEnd={() => setHoveredId(null)}
            onClick={() => onSelect(persona.id)}
            className={cn(
              "relative flex flex-col items-center gap-3 p-5 rounded-3xl transition-all overflow-hidden",
              "border backdrop-blur-md",
              isSelected
                ? "border-transparent shadow-2xl"
                : "bg-card/60 border-border/30 hover:bg-card/80 hover:border-primary/20"
            )}
          >
            {/* Selected background gradient */}
            {isSelected && (
              <motion.div
                layoutId="selected-bg"
                className={cn("absolute inset-0 bg-gradient-to-br", persona.gradient)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
            
            {/* Hover glow */}
            <motion.div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              animate={{
                boxShadow: isHovered && !isSelected 
                  ? "inset 0 0 30px hsl(var(--primary) / 0.1), 0 10px 40px hsl(var(--primary) / 0.15)"
                  : isSelected
                  ? `0 20px 60px -15px ${persona.accentColor === 'destructive' ? 'hsl(var(--destructive) / 0.4)' : 
                     persona.accentColor === 'primary' ? 'hsl(var(--primary) / 0.4)' :
                     persona.accentColor === 'accent' ? 'hsl(var(--accent) / 0.4)' :
                     persona.accentColor === 'warning' ? 'hsl(var(--warning) / 0.4)' :
                     'hsl(var(--primary-light) / 0.4)'}`
                  : "0 0 0 transparent",
              }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Icon container */}
            <motion.div
              className={cn(
                "relative w-14 h-14 rounded-2xl flex items-center justify-center z-10",
                isSelected 
                  ? "bg-white/20 backdrop-blur-sm" 
                  : "bg-gradient-to-br from-muted to-muted/50"
              )}
              animate={isSelected || isHovered ? {
                y: [0, -5, 0],
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 0.5 }}
            >
              <Icon className={cn(
                "w-7 h-7 transition-colors",
                isSelected ? "text-white" : "text-muted-foreground"
              )} />
              
              {/* Sparkle effect on selected */}
              {isSelected && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <Sparkles className="w-4 h-4 text-white/80" />
                </motion.div>
              )}
            </motion.div>
            
            {/* Text content */}
            <div className={cn(
              "relative z-10 text-center",
              isSelected ? "text-white" : ""
            )}>
              <p className="font-semibold text-sm mb-0.5">
                {isBangla ? persona.nameBn : persona.name}
              </p>
              <p className={cn(
                "text-xs transition-colors",
                isSelected ? "text-white/80" : "text-muted-foreground"
              )}>
                {isBangla ? persona.descriptionBn : persona.description}
              </p>
            </div>
            
            {/* Selected checkmark */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
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