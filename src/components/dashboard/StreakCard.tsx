import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Droplets } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import tugiHappy from "@/assets/tugi-streak-happy.png";
import tugiSad from "@/assets/tugi-streak-sad.png";

interface StreakCardProps {
  currentStreak: number;
  totalStudyMinutes: number;
  isFirstTimeUser: boolean;
  userId: string | undefined;
}

const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

const StreakCard = ({
  currentStreak,
  totalStudyMinutes,
  isFirstTimeUser,
  userId,
}: StreakCardProps) => {
  const [activeDates, setActiveDates] = useState<Set<number>>(new Set());

  const todayStudied = totalStudyMinutes >= 1;
  const showAngry = !isFirstTimeUser && !todayStudied && currentStreak === 0;

  // Fetch activity dates for current month
  useEffect(() => {
    if (!userId) return;
    const fetchMonthActivity = async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const [{ data: sessions }, { data: assessments }] = await Promise.all([
        supabase
          .from("study_sessions")
          .select("created_at, duration_minutes")
          .eq("user_id", userId)
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString()),
        supabase
          .from("assessments")
          .select("completed_at")
          .eq("user_id", userId)
          .gte("completed_at", monthStart.toISOString())
          .lte("completed_at", monthEnd.toISOString()),
      ]);

      const dates = new Set<number>();
      sessions?.forEach((s) => {
        if (s.duration_minutes >= 1) {
          dates.add(new Date(s.created_at).getDate());
        }
      });
      assessments?.forEach((a) => {
        dates.add(new Date(a.completed_at).getDate());
      });
      setActiveDates(dates);
    };
    fetchMonthActivity();
  }, [userId, totalStudyMinutes]);

  // Calendar data for current month
  const calendarData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    // Fill leading empty cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill trailing empty cells
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return { weeks, today, daysInMonth };
  }, []);

  const { weeks, today } = calendarData;

  // Find the last active date before today for "latest streak milestone"
  const latestStreakStart = useMemo(() => {
    if (currentStreak <= 0) return null;
    // The streak start day
    const startDate = today - currentStreak + 1;
    return startDate > 0 ? startDate : 1;
  }, [currentStreak, today]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative w-full overflow-hidden rounded-3xl"
      style={{
        background: showAngry
          ? "linear-gradient(145deg, #9B8EC4 0%, #7B68AE 50%, #9078C0 100%)"
          : "linear-gradient(145deg, #C5F5C0 0%, #A8EDAC 50%, #D4F7D0 100%)",
        minHeight: "180px",
      }}
    >
      <div className="relative z-10 flex h-full" style={{ minHeight: "180px" }}>
        {/* Left: Calendar */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-x-1 mb-1">
            {DAY_HEADERS.map((d, i) => (
              <span
                key={i}
                className="text-center text-[9px] sm:text-[11px] font-bold"
                style={{
                  color: showAngry ? "rgba(255,255,255,0.5)" : "rgba(80,120,80,0.5)",
                }}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-x-1 gap-y-0.5">
              {week.map((day, di) => {
                if (day === null) {
                  return <div key={di} className="w-full aspect-square" />;
                }

                const isActive = activeDates.has(day);
                const isToday = day === today;
                const isPast = day < today;
                const isStreakStart = day === latestStreakStart;

                // Determine styling
                let bgColor = "transparent";
                let textColor = showAngry ? "rgba(255,255,255,0.35)" : "rgba(80,120,80,0.4)";
                let borderRadius = "6px";
                let border = "none";
                let fontWeight = "500";

                if (isActive && isPast) {
                  // Active day - golden yellow pill
                  bgColor = showAngry
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(230,195,90,0.35)";
                  textColor = showAngry ? "#FFD54F" : "#B8860B";
                  fontWeight = "700";
                  borderRadius = "8px";
                }

                if (isToday) {
                  // Today - special circle marker
                  bgColor = showAngry
                    ? "rgba(100,100,100,0.5)"
                    : "rgba(100,160,255,0.3)";
                  textColor = showAngry ? "#BDBDBD" : "#4A90D9";
                  borderRadius = "50%";
                  border = showAngry
                    ? "2px solid rgba(150,150,150,0.5)"
                    : "2px solid rgba(100,160,255,0.5)";
                  fontWeight = "800";
                }

                if (isActive && isToday) {
                  bgColor = showAngry
                    ? "rgba(100,100,100,0.5)"
                    : "rgba(100,160,255,0.4)";
                  textColor = showAngry ? "#FFD54F" : "#2E7D32";
                  border = showAngry
                    ? "2px solid rgba(150,150,150,0.5)"
                    : "2px solid rgba(100,160,255,0.6)";
                }

                // Streak milestone (first day of current streak)
                if (isStreakStart && !isToday) {
                  bgColor = showAngry
                    ? "rgba(255,152,0,0.3)"
                    : "rgba(255,152,0,0.4)";
                  textColor = showAngry ? "#FFB74D" : "#E65100";
                  borderRadius = "50%";
                  fontWeight = "800";
                }

                // Future days that aren't active
                if (!isPast && !isToday) {
                  textColor = showAngry ? "rgba(255,255,255,0.25)" : "rgba(80,120,80,0.35)";
                }

                return (
                  <div
                    key={di}
                    className="w-full aspect-square flex items-center justify-center relative"
                  >
                    <div
                      className="w-[85%] h-[85%] flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: bgColor,
                        borderRadius,
                        border,
                      }}
                    >
                      <span
                        className="text-[9px] sm:text-[11px] leading-none"
                        style={{ color: textColor, fontWeight, fontFamily: "Poppins, sans-serif" }}
                      >
                        {day}
                      </span>
                    </div>
                    {/* Sad face for missed days in angry mode */}
                    {showAngry && isPast && !isActive && !isToday && (
                      <Droplets
                        className="absolute -bottom-0.5 -right-0.5 opacity-30"
                        size={7}
                        color="#9E9E9E"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right: Streak count + Mascot */}
        <div className="w-[42%] sm:w-[40%] flex flex-col items-center justify-center p-2 sm:p-3 relative">
          {/* Streak icon + number */}
          <div className="flex items-center gap-1 mb-1">
            {showAngry ? (
              <Droplets
                size={24}
                className="sm:w-7 sm:h-7"
                style={{ color: "rgba(255,255,255,0.4)" }}
              />
            ) : (
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Flame
                  size={28}
                  className="sm:w-8 sm:h-8"
                  style={{ color: "#FF8F00", fill: "#FFB300" }}
                />
              </motion.div>
            )}
            <span
              className="text-3xl sm:text-4xl leading-none"
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                color: showAngry ? "rgba(255,255,255,0.4)" : "#FF8F00",
                letterSpacing: "-1px",
              }}
            >
              {currentStreak}
            </span>
          </div>

          {/* "Practice now?" for angry state */}
          {showAngry && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] sm:text-xs font-semibold mb-1"
              style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Poppins, sans-serif" }}
            >
              Practice now?
            </motion.p>
          )}

          {/* Mascot */}
          <motion.img
            src={showAngry ? tugiSad : tugiHappy}
            alt="Tugi"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default StreakCard;
