import { motion } from "framer-motion";
import { BookOpen, Brain, Upload, Sparkles, Zap, Star } from "lucide-react";
import mascotImg from "@/assets/ai-mascot-3d.png";

interface WelcomeStateProps {
  studentName?: string;
  isBangla: boolean;
  onQuickAction: (prompt: string) => void;
}

const suggestions = [
  {
    icon: BookOpen,
    label: "Explain",
    labelBn: "ব্যাখ্যা",
    prompt: "Please explain in detail ",
    promptBn: "দয়া করে বিস্তারিতভাবে ব্যাখ্যা করো ",
    gradient: "from-[hsl(245,58%,64%)] to-[hsl(260,55%,72%)]",
    shadow: "hsla(245,58%,64%,0.35)",
    emoji: "📖",
  },
  {
    icon: Brain,
    label: "Practice",
    labelBn: "অনুশীলন",
    prompt: "Give me practice questions on ",
    promptBn: "অনুশীলনের জন্য প্রশ্ন দাও ",
    gradient: "from-[hsl(340,65%,60%)] to-[hsl(0,70%,65%)]",
    shadow: "hsla(340,65%,60%,0.35)",
    emoji: "🧠",
  },
  {
    icon: Upload,
    label: "Analyze",
    labelBn: "বিশ্লেষণ",
    prompt: "Analyze this image and explain ",
    promptBn: "এই ছবিটি বিশ্লেষণ করো এবং ব্যাখ্যা করো ",
    gradient: "from-[hsl(25,80%,60%)] to-[hsl(35,75%,68%)]",
    shadow: "hsla(25,80%,60%,0.35)",
    emoji: "📸",
  },
  {
    icon: Sparkles,
    label: "Revision",
    labelBn: "রিভিশন",
    prompt: "Help me revise ",
    promptBn: "রিভিশন করতে সাহায্য করো ",
    gradient: "from-[hsl(152,60%,42%)] to-[hsl(170,55%,50%)]",
    shadow: "hsla(152,60%,42%,0.35)",
    emoji: "✨",
  },
];

const WelcomeState = ({ studentName, isBangla, onQuickAction }: WelcomeStateProps) => {
  const firstName = studentName?.split(" ")[0] || "";

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
            background: `radial-gradient(circle, hsla(270, 55%, 65%, 0.25) 0%, hsla(200, 80%, 70%, 0.12) 40%, transparent 70%)`,
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

      {/* Greeting — catchy, compact */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-5"
      >
        <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-foreground mb-1 tracking-tight">
          {isBangla
            ? `আসসালামু আলাইকুম${firstName ? `, ${firstName}` : ""}! 🚀`
            : `Hey${firstName ? ` ${firstName}` : ""}! Let's Learn 🚀`}
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-xs leading-relaxed mx-auto">
          {isBangla
            ? "যেকোনো বিষয়ে প্রশ্ন করো, আমি সাহায্য করবো! 💡"
            : "Your AI tutor is ready. Ask anything! 💡"}
        </p>
      </motion.div>

      {/* 4 Glass Cards — like profile streak/rank/xp/exams */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="grid grid-cols-4 gap-2.5 w-full max-w-sm"
      >
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.08, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.08, y: -6 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => onQuickAction(isBangla ? s.promptBn : s.prompt)}
            className="group relative flex flex-col items-center gap-2 p-3 rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(-45deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.6) 100%)",
              backdropFilter: "blur(20px) saturate(1.4)",
              WebkitBackdropFilter: "blur(20px) saturate(1.4)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: `0 4px 20px ${s.shadow}, inset 0 1px 0 rgba(255,255,255,0.6)`,
            }}
          >
            {/* Gradient icon circle */}
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
            >
              <s.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>

            <span className="text-[10px] sm:text-[11px] font-bold text-foreground/80 font-heading leading-tight text-center">
              {isBangla ? s.labelBn : s.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default WelcomeState;
