import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Calculator, BookText, Atom, FlaskConical, Leaf, Globe, Laptop, Languages, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
  name_bn: string | null;
  icon: string;
  color: string;
}

interface SubjectSelectorProps {
  userId: string;
  studentClass: number;
  selectedSubject: string | null;
  onSubjectChange: (subjectId: string | null, subjectName: string | null) => void;
  isBangla?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  'book-text': BookText,
  'languages': Languages,
  'calculator': Calculator,
  'atom': Atom,
  'flask-conical': FlaskConical,
  'leaf': Leaf,
  'globe': Globe,
  'laptop': Laptop,
  'book': BookOpen,
};

// Rotating colors for subjects: magenta, pink, purple, golden
const subjectColors = [
  { from: "hsl(300, 65%, 52%)", to: "hsl(320, 60%, 60%)", shadow: "hsla(300, 65%, 52%, 0.3)", text: "hsl(300, 65%, 42%)" },
  { from: "hsl(330, 70%, 55%)", to: "hsl(345, 65%, 62%)", shadow: "hsla(330, 70%, 55%, 0.3)", text: "hsl(330, 70%, 42%)" },
  { from: "hsl(270, 60%, 55%)", to: "hsl(285, 55%, 62%)", shadow: "hsla(270, 60%, 55%, 0.3)", text: "hsl(270, 60%, 42%)" },
  { from: "hsl(42, 85%, 52%)", to: "hsl(35, 80%, 58%)", shadow: "hsla(42, 85%, 52%, 0.3)", text: "hsl(42, 85%, 38%)" },
];

const SubjectSelector = ({ userId, studentClass, selectedSubject, onSubjectChange, isBangla = false }: SubjectSelectorProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from("subjects")
        .select("id, name, name_bn, icon, color")
        .lte("min_class", studentClass)
        .gte("max_class", studentClass);
      if (data) setSubjects(data);
    };
    fetchSubjects();
  }, [studentClass]);

  const handleSelect = (subject: Subject | null) => {
    onSubjectChange(subject?.id || null, subject ? (isBangla ? subject.name_bn : subject.name) : null);
  };

  return (
    <div className="space-y-2">
      {/* All Subjects pill */}
      <div className="flex flex-wrap gap-2">
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => handleSelect(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold font-heading transition-all"
          style={!selectedSubject ? {
            background: "linear-gradient(135deg, hsl(300, 65%, 52%), hsl(270, 60%, 55%))",
            boxShadow: "0 4px 16px hsla(300, 65%, 52%, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
            color: "white",
            border: "1px solid transparent",
          } : {
            background: "linear-gradient(-45deg, rgba(254,254,254,0.9), rgba(254,254,254,0.65))",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
            color: "hsl(300, 50%, 40%)",
          }}
        >
          <BookOpen className="w-4 h-4" />
          <span>{isBangla ? "সকল বিষয়" : "All Subjects"}</span>
          {!selectedSubject && <Check className="w-3.5 h-3.5 ml-0.5" />}
        </motion.button>

        {subjects.map((subject, index) => {
          const Icon = iconMap[subject.icon] || BookOpen;
          const isSelected = selectedSubject === subject.id;
          const colorSet = subjectColors[index % subjectColors.length];

          return (
            <motion.button
              key={subject.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelect(subject)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold font-heading transition-all whitespace-nowrap"
              style={isSelected ? {
                background: `linear-gradient(135deg, ${colorSet.from}, ${colorSet.to})`,
                boxShadow: `0 4px 16px ${colorSet.shadow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                color: "white",
                border: "1px solid transparent",
              } : {
                background: "linear-gradient(-45deg, rgba(254,254,254,0.9), rgba(254,254,254,0.65))",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.5)",
                boxShadow: `0 2px 12px ${colorSet.shadow.replace('0.3', '0.1')}, inset 0 1px 0 rgba(255,255,255,0.6)`,
                color: colorSet.text,
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{isBangla ? subject.name_bn || subject.name : subject.name}</span>
              {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectSelector;
