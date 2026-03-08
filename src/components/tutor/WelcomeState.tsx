import { motion } from "framer-motion";
import { BookOpen, Brain, Upload, Sparkles, Zap } from "lucide-react";
import mascotImg from "@/assets/ai-mascot-3d.png";

interface WelcomeStateProps {
  studentName?: string;
  isBangla: boolean;
  onQuickAction: (prompt: string) => void;
}

const suggestions = [
  { icon: BookOpen, label: "Explain a topic", labelBn: "একটি টপিক ব্যাখ্যা করো", prompt: "Please explain in detail ", promptBn: "দয়া করে বিস্তারিতভাবে ব্যাখ্যা করো ", gradient: "from-[hsl(245,58%,64%)] to-[hsl(260,55%,72%)]", bg: "bg-[hsl(245,58%,64%)]/8", iconColor: "text-[hsl(245,58%,64%)]" },
  { icon: Brain, label: "Practice questions", labelBn: "অনুশীলন প্রশ্ন", prompt: "Give me practice questions on ", promptBn: "অনুশীলনের জন্য প্রশ্ন দাও ", gradient: "from-[hsl(340,65%,65%)] to-[hsl(20,75%,72%)]", bg: "bg-[hsl(340,65%,65%)]/8", iconColor: "text-[hsl(340,65%,65%)]" },
  { icon: Upload, label: "Analyze an image", labelBn: "ছবি বিশ্লেষণ", prompt: "Analyze this image and explain ", promptBn: "এই ছবিটি বিশ্লেষণ করো এবং ব্যাখ্যা করো ", gradient: "from-[hsl(25,80%,72%)] to-[hsl(35,75%,78%)]", bg: "bg-[hsl(25,80%,72%)]/8", iconColor: "text-[hsl(25,80%,72%)]" },
  { icon: Sparkles, label: "Revision help", labelBn: "রিভিশন সাহায্য", prompt: "Help me revise ", promptBn: "রিভিশন করতে সাহায্য করো ", gradient: "from-[hsl(145,63%,42%)] to-[hsl(130,50%,55%)]", bg: "bg-[hsl(145,63%,42%)]/8", iconColor: "text-[hsl(145,63%,42%)]" },
];

const WelcomeState = ({ studentName, isBangla, onQuickAction }: WelcomeStateProps) => {
  const firstName = studentName?.split(" ")[0] || "";

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      {/* Mascot with animated glow rings */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="relative mb-4"
      >
        {/* Outer glow ring */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full scale-[1.6]"
          style={{
            background: `radial-gradient(circle, hsla(270, 50%, 75%, 0.15) 0%, hsla(320, 50%, 75%, 0.08) 40%, transparent 70%)`,
          }}
        />
        {/* Inner glow ring */}
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute inset-0 rounded-full scale-125"
          style={{
            background: `radial-gradient(circle, hsla(250, 55%, 70%, 0.2) 0%, hsla(310, 45%, 72%, 0.1) 50%, transparent 70%)`,
          }}
        />
        {/* Mascot */}
        <motion.img
          src={mascotImg}
          alt="OddhaboshAI"
          className="w-24 h-24 relative z-10 drop-shadow-xl"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Sparkle accent */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1 -right-1 z-20"
        >
          <Zap className="w-5 h-5 text-[hsl(25,80%,72%)] fill-[hsl(25,80%,72%)]" />
        </motion.div>
      </motion.div>

      {/* Greeting */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground mb-2.5 tracking-tight">
          {isBangla 
            ? `আসসালামু আলাইকুম${firstName ? `, ${firstName}` : ""}! 👋`
            : `Assalamu Alaikum${firstName ? `, ${firstName}` : ""}! 👋`
          }
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-md leading-relaxed">
          {isBangla
            ? "আমি অধ্যবসায় AI Tutor। আজ কী পড়তে চাও?"
            : "I'm OddhaboshAI Tutor. What would you like to learn today?"
          }
        </p>
      </motion.div>

      {/* Suggestion cards — glass-style */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="grid grid-cols-2 gap-3.5 w-full max-w-sm"
      >
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onQuickAction(isBangla ? s.promptBn : s.prompt)}
            className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/90 backdrop-blur-sm border border-border/30 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 text-center"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-foreground/75 font-heading leading-tight group-hover:text-foreground/90 transition-colors">
              {isBangla ? s.labelBn : s.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Powered by badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-10 flex items-center gap-1.5 text-[11px] text-muted-foreground/50"
      >
        <Sparkles className="w-3 h-3" />
        <span className="font-heading">Powered by NCTB Curriculum</span>
      </motion.div>
    </div>
  );
};

export default WelcomeState;
