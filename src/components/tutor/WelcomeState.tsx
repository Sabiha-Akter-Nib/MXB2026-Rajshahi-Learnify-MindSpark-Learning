import { motion } from "framer-motion";
import { BookOpen, Brain, Upload, Sparkles } from "lucide-react";
import mascotImg from "@/assets/ai-mascot-3d.png";

interface WelcomeStateProps {
  studentName?: string;
  isBangla: boolean;
  onQuickAction: (prompt: string) => void;
}

const suggestions = [
  { icon: BookOpen, label: "Explain a topic", labelBn: "একটি টপিক ব্যাখ্যা করো", prompt: "Please explain in detail ", promptBn: "দয়া করে বিস্তারিতভাবে ব্যাখ্যা করো ", color: "from-[#6A68DF] to-[#8B89E8]" },
  { icon: Brain, label: "Practice questions", labelBn: "অনুশীলন প্রশ্ন", prompt: "Give me practice questions on ", promptBn: "অনুশীলনের জন্য প্রশ্ন দাও ", color: "from-[#E87DA0] to-[#EFB995]" },
  { icon: Upload, label: "Analyze an image", labelBn: "ছবি বিশ্লেষণ", prompt: "Analyze this image and explain ", promptBn: "এই ছবিটি বিশ্লেষণ করো এবং ব্যাখ্যা করো ", color: "from-[#EFB995] to-[#F0D4B8]" },
  { icon: Sparkles, label: "Revision help", labelBn: "রিভিশন সাহায্য", prompt: "Help me revise ", promptBn: "রিভিশন করতে সাহায্য করো ", color: "from-[#58CC02] to-[#7ED957]" },
];

const WelcomeState = ({ studentName, isBangla, onQuickAction }: WelcomeStateProps) => {
  const firstName = studentName?.split(" ")[0] || "";

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Mascot with glow */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#6A68DF]/20 via-[#E87DA0]/15 to-[#EFB995]/20 blur-2xl scale-150" />
        <img src={mascotImg} alt="OddhaboshAI" className="w-28 h-28 relative z-10 drop-shadow-lg" />
      </motion.div>

      {/* Greeting */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold font-['Poppins',sans-serif] text-foreground mb-2">
          {isBangla 
            ? `আসসালামু আলাইকুম${firstName ? `, ${firstName}` : ""}! 👋`
            : `Assalamu Alaikum${firstName ? `, ${firstName}` : ""}! 👋`
          }
        </h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {isBangla
            ? "আমি অধ্যবসায় AI Tutor। আজ কী পড়তে চাও?"
            : "I'm OddhaboshAI Tutor. What would you like to learn today?"
          }
        </p>
      </motion.div>

      {/* Suggestion cards */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-3 w-full max-w-sm"
      >
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onQuickAction(isBangla ? s.promptBn : s.prompt)}
            className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 shadow-sm hover:shadow-md hover:border-[#6A68DF]/30 transition-all text-center"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-foreground/80 font-['Poppins',sans-serif] leading-tight">
              {isBangla ? s.labelBn : s.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default WelcomeState;
