import { motion } from "framer-motion";
import { BookOpen, Brain, Upload, Sparkles, Zap, Rocket, Star } from "lucide-react";
import mascotImg from "@/assets/ai-mascot-3d.png";

interface WelcomeStateProps {
  studentName?: string;
  isBangla: boolean;
  onQuickAction: (prompt: string) => void;
}

const suggestions = [
  { 
    icon: BookOpen, 
    label: "Explain a topic", 
    labelBn: "টপিক ব্যাখ্যা", 
    prompt: "Please explain in detail ", 
    promptBn: "দয়া করে বিস্তারিতভাবে ব্যাখ্যা করো ",
    gradient: "from-[hsl(245,58%,64%)] to-[hsl(260,55%,72%)]",
    shadow: "hsl(245,58%,64%)",
    emoji: "📖",
  },
  { 
    icon: Brain, 
    label: "Practice Questions", 
    labelBn: "অনুশীলন প্রশ্ন", 
    prompt: "Give me practice questions on ", 
    promptBn: "অনুশীলনের জন্য প্রশ্ন দাও ",
    gradient: "from-[hsl(340,65%,60%)] to-[hsl(0,70%,65%)]",
    shadow: "hsl(340,65%,60%)",
    emoji: "🧠",
  },
  { 
    icon: Upload, 
    label: "Analyze Image", 
    labelBn: "ছবি বিশ্লেষণ", 
    prompt: "Analyze this image and explain ", 
    promptBn: "এই ছবিটি বিশ্লেষণ করো এবং ব্যাখ্যা করো ",
    gradient: "from-[hsl(25,80%,60%)] to-[hsl(35,75%,68%)]",
    shadow: "hsl(25,80%,60%)",
    emoji: "📸",
  },
  { 
    icon: Sparkles, 
    label: "Revision Help", 
    labelBn: "রিভিশন সাহায্য", 
    prompt: "Help me revise ", 
    promptBn: "রিভিশন করতে সাহায্য করো ",
    gradient: "from-[hsl(152,60%,42%)] to-[hsl(170,55%,50%)]",
    shadow: "hsl(152,60%,42%)",
    emoji: "✨",
  },
];

const WelcomeState = ({ studentName, isBangla, onQuickAction }: WelcomeStateProps) => {
  const firstName = studentName?.split(" ")[0] || "";

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* Mascot with premium glow */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="relative mb-6"
      >
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full scale-[2]"
          style={{
            background: `radial-gradient(circle, hsla(270, 55%, 65%, 0.2) 0%, hsla(200, 80%, 70%, 0.1) 40%, transparent 70%)`,
          }}
        />
        <motion.img
          src={mascotImg}
          alt="OddhaboshAI"
          className="w-28 h-28 relative z-10 drop-shadow-2xl"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -top-2 -right-2 z-20"
        >
          <Zap className="w-6 h-6 text-warning fill-warning drop-shadow-lg" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-1 -left-2 z-20"
        >
          <Star className="w-4 h-4 text-accent fill-accent" />
        </motion.div>
      </motion.div>

      {/* Greeting — bolder, catchier */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-extrabold font-heading text-foreground mb-2 tracking-tight">
          {isBangla 
            ? `আসসালামু আলাইকুম${firstName ? `, ${firstName}` : ""}! 🚀`
            : `Assalamu Alaikum${firstName ? `, ${firstName}` : ""}! 🚀`
          }
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-md leading-relaxed">
          {isBangla
            ? "আমি অধ্যবসায় AI — তোমার নিজের AI শিক্ষক। যেকোনো বিষয়ে প্রশ্ন করো, আমি সাহায্য করবো! 💡"
            : "I'm OddhaboshAI — your personal AI tutor. Ask me anything about your NCTB curriculum! 💡"
          }
        </p>
      </motion.div>

      {/* Profile-style floating circular cards */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="grid grid-cols-2 gap-4 w-full max-w-sm"
      >
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onQuickAction(isBangla ? s.promptBn : s.prompt)}
            className="group relative flex flex-col items-center gap-3 p-5 rounded-3xl border border-border/20 bg-card/90 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            {/* Hover glow background */}
            <motion.div 
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${s.shadow} / 0.08, transparent 70%)`,
              }}
            />
            
            {/* Floating icon circle — like profile achievement badges */}
            <div 
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
              style={{ boxShadow: `0 6px 24px ${s.shadow} / 0.3` }}
            >
              <s.icon className="w-7 h-7 text-white" />
            </div>
            
            {/* Label */}
            <span className="text-xs font-bold text-foreground/80 font-heading leading-tight group-hover:text-foreground transition-colors text-center">
              {isBangla ? s.labelBn : s.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Powered by badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground/40"
      >
        <Sparkles className="w-3 h-3" />
        <span className="font-heading font-medium">Powered by NCTB Curriculum</span>
      </motion.div>
    </div>
  );
};

export default WelcomeState;
