import { motion } from "framer-motion";
import { BookOpen, Brain, Upload, Sparkles, Zap, Star } from "lucide-react";
import mascotImg from "@/assets/ai-mascot-3d.png";

interface WelcomeStateProps {
  studentName?: string;
  isBangla: boolean;
  onQuickAction: (prompt: string) => void;
}

// Colors: magenta, pink, purple, golden on #FEFEFE glass
const suggestions = [
  {
    icon: BookOpen,
    label: "Explain",
    labelBn: "ব্যাখ্যা",
    prompt: "Please explain in detail ",
    promptBn: "দয়া করে বিস্তারিতভাবে ব্যাখ্যা করো ",
    gradientFrom: "hsl(280, 65%, 55%)",
    gradientTo: "hsl(300, 60%, 65%)",
    shadow: "hsla(280, 65%, 55%, 0.4)",
    textColor: "hsl(280, 65%, 45%)",
  },
  {
    icon: Brain,
    label: "Practice",
    labelBn: "অনুশীলন",
    prompt: "Give me practice questions on ",
    promptBn: "অনুশীলনের জন্য প্রশ্ন দাও ",
    gradientFrom: "hsl(330, 70%, 55%)",
    gradientTo: "hsl(345, 65%, 65%)",
    shadow: "hsla(330, 70%, 55%, 0.4)",
    textColor: "hsl(330, 70%, 45%)",
  },
  {
    icon: Upload,
    label: "Analyze",
    labelBn: "বিশ্লেষণ",
    prompt: "Analyze this image and explain ",
    promptBn: "এই ছবিটি বিশ্লেষণ করো এবং ব্যাখ্যা করো ",
    gradientFrom: "hsl(265, 58%, 52%)",
    gradientTo: "hsl(285, 55%, 62%)",
    shadow: "hsla(265, 58%, 52%, 0.4)",
    textColor: "hsl(265, 58%, 42%)",
  },
  {
    icon: Sparkles,
    label: "Revision",
    labelBn: "রিভিশন",
    prompt: "Help me revise ",
    promptBn: "রিভিশন করতে সাহায্য করো ",
    gradientFrom: "hsl(30, 78%, 68%)",
    gradientTo: "hsl(25, 72%, 76%)",
    shadow: "hsla(30, 78%, 68%, 0.4)",
    textColor: "hsl(30, 70%, 42%)",
  },
];

const WelcomeState = ({ studentName, isBangla, onQuickAction }: WelcomeStateProps) => {
  const displayName = studentName || "";

  return (
    <div className="flex flex-col items-center justify-center px-4 h-full">
      {/* Mascot — EXTRA LARGE */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="relative mb-4"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full scale-[2.5]"
          style={{
            background: `radial-gradient(circle, hsla(300, 55%, 65%, 0.2) 0%, hsla(270, 60%, 70%, 0.12) 40%, transparent 70%)`,
          }}
        />
        <motion.img
          src={mascotImg}
          alt="OddhaboshAI"
          className="w-48 h-48 sm:w-56 sm:h-56 relative z-10 drop-shadow-2xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -top-3 -right-3 z-20"
        >
          <Zap className="w-8 h-8 text-warning fill-warning drop-shadow-lg" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-2 -left-3 z-20"
        >
          <Star className="w-6 h-6 text-accent fill-accent" />
        </motion.div>
      </motion.div>

      {/* Greeting */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-5"
      >
        <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-foreground mb-1 tracking-tight">
          {isBangla
            ? `হ্যালো${firstName ? `, ${firstName}` : ""}! 🚀`
            : `Hello${firstName ? `, ${firstName}` : ""}! Let's Learn 🚀`}
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-xs leading-relaxed mx-auto">
          {isBangla
            ? "যেকোনো বিষয়ে প্রশ্ন করো, আমি সাহায্য করবো! 💡"
            : "Your AI tutor is ready. Ask anything! 💡"}
        </p>
      </motion.div>

      {/* 4 Glass Cards — BIGGER with magenta/pink/purple/golden */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="grid grid-cols-4 gap-2.5 w-full max-w-md"
      >
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.08, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.06, y: -5 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => onQuickAction(isBangla ? s.promptBn : s.prompt)}
            className="group relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(-45deg, rgba(254,254,254,0.92) 0%, rgba(254,254,254,0.7) 100%)",
              backdropFilter: "blur(24px) saturate(1.5)",
              WebkitBackdropFilter: "blur(24px) saturate(1.5)",
              border: "1.5px solid rgba(255,255,255,0.6)",
              boxShadow: `0 6px 24px ${s.shadow}, 0 2px 6px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)`,
            }}
          >
            {/* Gradient icon */}
            <motion.div
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})`,
                boxShadow: `0 6px 24px ${s.shadow}`,
              }}
            >
              <s.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </motion.div>

            <span
              className="text-xs sm:text-sm font-extrabold font-heading leading-tight text-center"
              style={{ color: s.textColor }}
            >
              {isBangla ? s.labelBn : s.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default WelcomeState;
