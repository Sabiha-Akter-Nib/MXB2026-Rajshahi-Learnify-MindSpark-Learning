import { motion } from "framer-motion";
import { Brain, BookOpen, Wrench, Search, Star, Lightbulb } from "lucide-react";

interface BloomStudyTipsProps {
  isBangla?: boolean;
}

const bloomTips = [
  {
    level: "Remember",
    levelBn: "মনে রাখা",
    icon: BookOpen,
    color: "hsl(200, 70%, 50%)",
    tip: "Use flashcards & repeat key terms aloud to lock them in.",
    tipBn: "ফ্ল্যাশকার্ড ব্যবহার করো এবং মূল শব্দগুলো জোরে জোরে বলো।",
  },
  {
    level: "Understand",
    levelBn: "বোঝা",
    icon: Lightbulb,
    color: "hsl(160, 60%, 45%)",
    tip: "Explain concepts in your own words — if you can teach it, you know it.",
    tipBn: "নিজের ভাষায় ব্যাখ্যা করো — যদি শেখাতে পারো, তাহলে জানো।",
  },
  {
    level: "Apply",
    levelBn: "প্রয়োগ",
    icon: Wrench,
    color: "hsl(35, 85%, 50%)",
    tip: "Solve practice problems without looking at solutions first.",
    tipBn: "সমাধান না দেখে আগে নিজে চেষ্টা করো।",
  },
  {
    level: "Analyze",
    levelBn: "বিশ্লেষণ",
    icon: Search,
    color: "hsl(270, 55%, 55%)",
    tip: "Break down complex topics into smaller parts and find patterns.",
    tipBn: "জটিল বিষয়গুলো ছোট ছোট অংশে ভাগ করো এবং প্যাটার্ন খোঁজো।",
  },
  {
    level: "Evaluate",
    levelBn: "মূল্যায়ন",
    icon: Star,
    color: "hsl(320, 60%, 50%)",
    tip: "Compare different solutions and judge which approach works best.",
    tipBn: "বিভিন্ন সমাধান তুলনা করো এবং সেরাটি বেছে নাও।",
  },
  {
    level: "Create",
    levelBn: "সৃষ্টি",
    icon: Brain,
    color: "hsl(180, 60%, 45%)",
    tip: "Combine what you've learned to solve new, unfamiliar problems.",
    tipBn: "যা শিখেছো তা একত্রিত করে নতুন সমস্যা সমাধান করো।",
  },
];

const BloomStudyTips = ({ isBangla = false }: BloomStudyTipsProps) => {
  // Rotate tip daily
  const todayIndex = new Date().getDate() % bloomTips.length;
  const tip = bloomTips[todayIndex];
  const TipIcon = tip.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 sm:p-6 shadow-xl"
    >
      {/* Accent glow */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: tip.color }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${tip.color}20` }}
          >
            <Brain className="w-5 h-5" style={{ color: tip.color }} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">
              {isBangla ? "📚 ব্লুমের পড়ার টিপস" : "📚 Bloom's Study Tip"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isBangla ? "প্রতিদিন নতুন কৌশল" : "A new strategy every day"}
            </p>
          </div>
        </div>

        {/* Active tip */}
        <div
          className="rounded-xl p-4 border"
          style={{
            background: `linear-gradient(135deg, ${tip.color}08, ${tip.color}03)`,
            borderColor: `${tip.color}25`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `${tip.color}15` }}
            >
              <TipIcon className="w-4.5 h-4.5" style={{ color: tip.color }} />
            </div>
            <div className="min-w-0">
              <span
                className="inline-block text-xs font-bold uppercase tracking-wider mb-1 px-2 py-0.5 rounded-full"
                style={{ color: tip.color, background: `${tip.color}15` }}
              >
                {isBangla ? tip.levelBn : tip.level}
              </span>
              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                {isBangla ? tip.tipBn : tip.tip}
              </p>
            </div>
          </div>
        </div>

        {/* Mini level indicators */}
        <div className="flex items-center gap-1.5 mt-4 justify-center">
          {bloomTips.map((b, i) => (
            <div
              key={b.level}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === todayIndex ? "24px" : "8px",
                background: i === todayIndex ? b.color : `${b.color}30`,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default BloomStudyTips;
