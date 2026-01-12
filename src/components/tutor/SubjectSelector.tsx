import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, Calculator, BookText, Atom, FlaskConical, Leaf, Globe, Laptop, Languages, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

const SubjectSelector = ({ userId, studentClass, selectedSubject, onSubjectChange, isBangla = false }: SubjectSelectorProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSubjectData, setSelectedSubjectData] = useState<Subject | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from("subjects")
        .select("id, name, name_bn, icon, color")
        .lte("min_class", studentClass)
        .gte("max_class", studentClass);
      
      if (data) {
        setSubjects(data);
      }
    };

    fetchSubjects();
  }, [studentClass]);

  useEffect(() => {
    if (selectedSubject && subjects.length > 0) {
      const subject = subjects.find(s => s.id === selectedSubject);
      setSelectedSubjectData(subject || null);
    } else {
      setSelectedSubjectData(null);
    }
  }, [selectedSubject, subjects]);

  const handleSelect = (subject: Subject | null) => {
    setSelectedSubjectData(subject);
    onSubjectChange(subject?.id || null, subject ? (isBangla ? subject.name_bn : subject.name) : null);
    setIsOpen(false);
  };

  const IconComponent = selectedSubjectData ? (iconMap[selectedSubjectData.icon] || BookOpen) : BookOpen;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
            "bg-card/80 backdrop-blur-md border border-border/50 shadow-sm",
            "hover:bg-card hover:shadow-md",
            selectedSubjectData && "bg-primary/10 border-primary/30 text-primary"
          )}
        >
          <IconComponent className="w-4 h-4" />
          <span className="max-w-[100px] truncate">
            {selectedSubjectData 
              ? (isBangla ? selectedSubjectData.name_bn || selectedSubjectData.name : selectedSubjectData.name)
              : (isBangla ? "বিষয় নির্বাচন" : "Select Subject")}
          </span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-2 bg-card/95 backdrop-blur-xl border-border/50 shadow-xl rounded-2xl"
        align="start"
      >
        <div className="space-y-1">
          {/* All subjects option */}
          <motion.button
            whileHover={{ x: 2 }}
            onClick={() => handleSelect(null)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
              !selectedSubjectData ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="flex-1 font-medium">
              {isBangla ? "সকল বিষয়" : "All Subjects"}
            </span>
            {!selectedSubjectData && <Check className="w-4 h-4 text-primary" />}
          </motion.button>

          <div className="h-px bg-border/50 my-2" />

          {/* Subject list */}
          {subjects.map((subject) => {
            const Icon = iconMap[subject.icon] || BookOpen;
            const isSelected = selectedSubject === subject.id;
            
            return (
              <motion.button
                key={subject.id}
                whileHover={{ x: 2 }}
                onClick={() => handleSelect(subject)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                  isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 font-medium">
                  {isBangla ? subject.name_bn || subject.name : subject.name}
                </span>
                {isSelected && <Check className="w-4 h-4 text-primary" />}
              </motion.button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SubjectSelector;
