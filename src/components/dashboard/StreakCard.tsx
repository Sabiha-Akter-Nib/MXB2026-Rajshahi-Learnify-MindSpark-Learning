import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import streakFlame from "@/assets/streak-flame.png";
import streakBg1 from "@/assets/streak-bg-1.png";
import streakBg2 from "@/assets/streak-bg-2.png";
import streakBg3 from "@/assets/streak-bg-3.png";
import streakBg4 from "@/assets/streak-bg-4.png";
import streakBg5 from "@/assets/streak-bg-5.png";
import streakBg6 from "@/assets/streak-bg-6.png";
import streakBg7 from "@/assets/streak-bg-7.png";
import streakBg8 from "@/assets/streak-bg-8.png";
import streakBgAngry from "@/assets/streak-bg-angry.png";
import streakBgAngry2 from "@/assets/streak-bg-angry-2.png";

const goodImages = [streakBg1, streakBg2, streakBg3, streakBg4, streakBg5, streakBg6, streakBg7, streakBg8];
const angryImages = [streakBgAngry, streakBgAngry2];

const goodComments = [
  "আরেহহহহ, আমি তো এভাবেই চেয়েছিলাম! 🎉",
  "চালিয়ে যাও! 🔥",
  "তোমাকেই তো দরকার! 💪",
  "Performance এইরকম হইতেই হবে! ⭐",
  "দারুণ! থামবে না কিন্তু! 🚀",
  "বাহ্, একদম ঝড় তুলছো! 🌟",
  "গুরু, তোমার জুড়ি নেই! 👑",
];

const badComments = [
  "এভাবে পড়ালেখা না করলে exam এ ভালো করবা? 😤",
  "কই গেলে? পড়তে বসো! 📚",
  "Streak ভেঙে গেছে! আবার শুরু করো! 😠",
  "আজকে কিচ্ছু পড়নি? চলো চলো! 🫤",
];

const DAYS_BN = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র"];

interface StreakCardProps {
  currentStreak: number;
  /** TODAY's study minutes (not all-time) */
  totalStudyMinutes: number;
  isFirstTimeUser: boolean;
  /** Active day indices this BD week: 0=Sat … 6=Fri */
  activeDaysThisWeek: Set<number>;
}

const StreakCard = ({
  currentStreak,
  totalStudyMinutes,
  isFirstTimeUser,
  activeDaysThisWeek,
}: StreakCardProps) => {
  // todayStudied = user has ≥1 min study today
  const todayStudied = totalStudyMinutes >= 1;

  // If user hasn't studied today yet → show angry (unless first-time user)
  // If streak is 0 and not studied today → angry
  const showAngry = !isFirstTimeUser && !todayStudied;

  // Effective streak: what we display
  const effectiveStreak = currentStreak;

  // If streak is broken (0), don't show any lit circles even if there were sessions this week
  const effectiveActiveDays = currentStreak === 0 && !todayStudied
    ? new Set<number>()
    : activeDaysThisWeek;

  // Pick a random image – stable per render via useMemo
  const backgroundImage = useMemo(() => {
    if (showAngry) return angryImages[Math.floor(Math.random() * angryImages.length)];
    return goodImages[Math.floor(Math.random() * goodImages.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAngry]);

  const comment = useMemo(() => {
    if (showAngry) return badComments[Math.floor(Math.random() * badComments.length)];
    return goodComments[Math.floor(Math.random() * goodComments.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAngry]);

  // Today is which day index (Sat=0)
  const todayIndex = (() => {
    const d = new Date();
    // JS: 0=Sun, 6=Sat → Bangladesh: Sat=0
    const jsDay = d.getDay(); // 0=Sun
    // Map: Sat(6)->0, Sun(0)->1, Mon(1)->2, Tue(2)->3, Wed(3)->4, Thu(4)->5, Fri(5)->6
    return jsDay === 6 ? 0 : jsDay + 1;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative w-full overflow-hidden rounded-2xl shadow-xl"
      style={{ height: "clamp(140px, 22vw, 220px)" }}
    >
      {/* Background image */}
      <img
        src={backgroundImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: showAngry
            ? "linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)"
            : "linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-5">
        {/* Top: Day circles */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {DAYS_BN.map((day, i) => {
            const isActive = effectiveActiveDays.has(i);
            const isToday = i === todayIndex;
            return (
              <motion.div
                key={day}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex flex-col items-center gap-0.5"
              >
                <span className="text-[8px] sm:text-[10px] font-bold text-white/80">
                  {day}
                </span>
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive
                      ? "bg-[hsl(45,100%,55%)] border-[hsl(45,100%,65%)] shadow-[0_0_8px_hsl(45,100%,55%)]"
                      : isToday
                        ? "border-white/60 bg-white/15"
                        : "border-white/25 bg-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Flame className="w-3 h-3 text-[hsl(20,90%,40%)]" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom: Streak count + comment */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <motion.div
              className="flex items-center gap-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span className="font-heading font-black text-4xl sm:text-5xl text-white drop-shadow-lg">
                {effectiveStreak}
              </span>
              <span className="font-heading font-bold text-base sm:text-lg text-white/90">
                Day Streak
              </span>
              {!showAngry && effectiveStreak > 0 && (
                <motion.img
                  src={streakFlame}
                  alt="🔥"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                  animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                />
              )}
            </motion.div>
            <motion.p
              className="text-xs sm:text-sm font-semibold text-white/90 mt-0.5 max-w-[260px] sm:max-w-[360px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {comment}
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StreakCard;
