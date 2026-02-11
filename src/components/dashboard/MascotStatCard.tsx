import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import statXpBg from "@/assets/stat-xp-bg.png";
import statGoalBg from "@/assets/stat-goal-bg.png";
import statStudyBg from "@/assets/stat-study-bg.png";

type CardType = "xp" | "goal" | "study";

interface MascotStatCardProps {
  type: CardType;
  value: string | number;
  suffix?: string;
  index: number;
}

const cardConfig: Record<
  CardType,
  { bg: string; label: string; labelBn: string }
> = {
  xp: { bg: statXpBg, label: "Weekly XP", labelBn: "সাপ্তাহিক XP" },
  goal: { bg: statGoalBg, label: "Weekly Goal", labelBn: "সাপ্তাহিক লক্ষ্য" },
  study: { bg: statStudyBg, label: "Today's Study", labelBn: "আজকের পড়া" },
};

/* ---------- Performance-based comments ---------- */

const xpComments = {
  great: [
    "দারুণ XP! চালিয়ে যাও! 🔥",
    "XP মেশিন! থামবে না! ⚡",
    "রকস্টার পারফরম্যান্স! 🌟",
  ],
  good: [
    "ভালো চলছে, আরেকটু পুশ করো! 💪",
    "XP বাড়ছে, চালিয়ে যাও! 📈",
  ],
  bad: [
    "XP কম হচ্ছে, পড়তে বসো! 😤",
    "আরও XP দরকার, শুরু করো! 📚",
  ],
};

const goalComments = {
  great: [
    "গোল পূরণ! চ্যাম্পিয়ন! 🏆",
    "টার্গেট হিট! অসাধারণ! 🎯",
  ],
  good: [
    "প্রায় হয়ে গেছে, আর একটু! 🏃",
    "গোলের কাছাকাছি, থামো না! 💫",
  ],
  bad: [
    "গোল অনেক বাকি! শুরু করো! 😠",
    "টার্গেট মিস হচ্ছে, তাড়াতাড়ি! ⏰",
  ],
};

const studyComments = {
  great: [
    "চমৎকার সময় দিচ্ছো! 🎉",
    "দারুণ ফোকাস! বাহ্! 🧠",
  ],
  good: [
    "ভালো, আরেকটু সময় দাও! ⏳",
    "চলছে, আর একটু পড়ো! 📖",
  ],
  bad: [
    "আজ কিছু পড়নি? শুরু করো! 😤",
    "সময় নষ্ট করো না, পড়ো! 📕",
  ],
};

function getComment(type: CardType, value: number | string): string {
  let level: "great" | "good" | "bad";

  if (type === "xp") {
    const v = typeof value === "number" ? value : 0;
    level = v >= 300 ? "great" : v >= 100 ? "good" : "bad";
    const pool = xpComments[level];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (type === "goal") {
    const v = typeof value === "number" ? value : parseInt(String(value)) || 0;
    level = v >= 80 ? "great" : v >= 40 ? "good" : "bad";
    const pool = goalComments[level];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // study — value is like "0h 0m" or "1h 30m"
  const str = String(value);
  const hMatch = str.match(/(\d+)h/);
  const mMatch = str.match(/(\d+)m/);
  const totalMin = (parseInt(hMatch?.[1] || "0") * 60) + parseInt(mMatch?.[1] || "0");
  level = totalMin >= 30 ? "great" : totalMin >= 5 ? "good" : "bad";
  const pool = studyComments[level];
  return pool[Math.floor(Math.random() * pool.length)];
}

const MascotStatCard = ({ type, value, suffix = "", index }: MascotStatCardProps) => {
  const config = cardConfig[type];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const comment = useMemo(() => getComment(type, value), [type, value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative w-full overflow-hidden rounded-2xl shadow-xl group cursor-default"
      style={{ height: "clamp(110px, 18vw, 170px)" }}
    >
      {/* Background image */}
      <img
        src={config.bg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-2.5 sm:p-4">
        {/* Label */}
        <motion.p
          className="text-[9px] sm:text-xs font-bold text-white/80 uppercase tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.08 }}
        >
          {config.label}
        </motion.p>

        {/* Value + Comment */}
        <div>
          <motion.div
            className="font-heading font-black text-2xl sm:text-4xl text-white drop-shadow-lg leading-none"
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.35 + index * 0.08 }}
          >
            {value}
            {suffix && <span className="text-lg sm:text-2xl ml-0.5">{suffix}</span>}
          </motion.div>
          <motion.p
            className="text-[8px] sm:text-[11px] font-semibold text-white/85 mt-0.5 line-clamp-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.08 }}
          >
            {comment}
          </motion.p>
        </div>
      </div>

      {/* Subtle shimmer on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
          }}
        />
      </div>
    </motion.div>
  );
};

export default MascotStatCard;
