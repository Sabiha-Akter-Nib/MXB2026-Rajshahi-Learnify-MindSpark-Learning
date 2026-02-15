import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface DailyMotivationProps {
  isBangla?: boolean;
}

const quotes = [
  {
    text: "Every expert was once a beginner. Keep going!",
    textBn: "প্রতিটি বিশেষজ্ঞ একসময় শিক্ষার্থী ছিল। চালিয়ে যাও!",
    author: "Helen Hayes",
  },
  {
    text: "Small steps every day lead to big results.",
    textBn: "প্রতিদিনের ছোট পদক্ষেপ বড় ফলাফল আনে।",
    author: "",
  },
  {
    text: "Your future self will thank you for studying today.",
    textBn: "ভবিষ্যতের তুমি আজকের পড়াশোনার জন্য কৃতজ্ঞ থাকবে।",
    author: "",
  },
  {
    text: "Consistency beats talent. Show up every day!",
    textBn: "ধারাবাহিকতা প্রতিভাকেও হারায়। প্রতিদিন চেষ্টা করো!",
    author: "",
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    textBn: "শেখার সৌন্দর্য হলো — এটা কেউ কেড়ে নিতে পারে না।",
    author: "B.B. King",
  },
  {
    text: "Education is the passport to the future.",
    textBn: "শিক্ষা হলো ভবিষ্যতের পাসপোর্ট।",
    author: "Malcolm X",
  },
  {
    text: "Don't let what you cannot do interfere with what you can do.",
    textBn: "যা পারো না, তা যেন যা পারো তার পথে বাধা না হয়।",
    author: "John Wooden",
  },
];

const DailyMotivation = ({ isBangla = false }: DailyMotivationProps) => {
  const todayIndex = new Date().getDate() % quotes.length;
  const quote = quotes[todayIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 sm:p-6 shadow-xl"
    >
      {/* Decorative gradient */}
      <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full blur-3xl pointer-events-none bg-accent/15" />
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl pointer-events-none bg-primary/10" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">
              {isBangla ? "💡 আজকের অনুপ্রেরণা" : "💡 Daily Motivation"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isBangla ? "প্রতিদিন নতুন অনুপ্রেরণা" : "Fresh inspiration every day"}
            </p>
          </div>
        </div>

        {/* Quote */}
        <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 p-4 sm:p-5">
          <p className="text-base sm:text-lg font-medium text-foreground/90 leading-relaxed italic">
            "{isBangla ? quote.textBn : quote.text}"
          </p>
          {quote.author && (
            <p className="text-sm text-muted-foreground mt-2 text-right">
              — {quote.author}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DailyMotivation;
