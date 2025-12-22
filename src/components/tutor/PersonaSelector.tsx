import { motion } from "framer-motion";
import { GraduationCap, Heart, Beaker, Zap, ListOrdered } from "lucide-react";
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
  color: string;
}

const personas: Persona[] = [
  {
    id: "strict",
    name: "Strict Teacher",
    nameBn: "কঠোর শিক্ষক",
    icon: GraduationCap,
    description: "Formal, focused, academic approach",
    color: "bg-destructive/10 text-destructive border-destructive/30",
  },
  {
    id: "friendly",
    name: "Friendly Mentor",
    nameBn: "বন্ধু মেন্টর",
    icon: Heart,
    description: "Warm, encouraging, supportive",
    color: "bg-success/10 text-success border-success/30",
  },
  {
    id: "scientist",
    name: "Concept Scientist",
    nameBn: "বিজ্ঞানী",
    icon: Beaker,
    description: "Curious, experimental, deep dive",
    color: "bg-primary/10 text-primary border-primary/30",
  },
  {
    id: "revision",
    name: "Fast Revision",
    nameBn: "দ্রুত রিভিশন",
    icon: Zap,
    description: "Quick points, key facts only",
    color: "bg-accent/10 text-accent border-accent/30",
  },
  {
    id: "stepbystep",
    name: "Step-by-Step",
    nameBn: "ধাপে ধাপে",
    icon: ListOrdered,
    description: "Detailed, patient, thorough",
    color: "bg-secondary text-secondary-foreground border-secondary-foreground/30",
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
  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {personas.map((persona) => {
          const Icon = persona.icon;
          const isSelected = selected === persona.id;
          return (
            <motion.button
              key={persona.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(persona.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all whitespace-nowrap",
                isSelected
                  ? persona.color
                  : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {isBangla ? persona.nameBn : persona.name}
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {personas.map((persona) => {
        const Icon = persona.icon;
        const isSelected = selected === persona.id;
        return (
          <motion.button
            key={persona.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(persona.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              isSelected
                ? `${persona.color} border-current shadow-md`
                : "bg-card border-border hover:border-muted-foreground/30"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isSelected ? "bg-current/10" : "bg-muted"
              )}
            >
              <Icon className={cn("w-5 h-5", isSelected ? "" : "text-muted-foreground")} />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">
                {isBangla ? persona.nameBn : persona.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {persona.description}
              </p>
            </div>
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
