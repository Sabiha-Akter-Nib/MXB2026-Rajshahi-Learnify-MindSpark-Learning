import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StreakData {
  currentStreak: number;
  showStreakAnimation: boolean;
  streakIncreased: boolean;
  previousStreak: number;
}

/** Get today's date string in Asia/Dhaka timezone (YYYY-MM-DD) */
const dhakaDate = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

export const useStreakTracker = (userId: string | undefined) => {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    showStreakAnimation: false,
    streakIncreased: false,
    previousStreak: 0,
  });
  const [hasChecked, setHasChecked] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => dhakaDate(new Date()));

  // Re-check streak when BD date changes (user stays past midnight)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = dhakaDate(new Date());
      if (now !== currentDate) {
        setCurrentDate(now);
        setHasChecked(false); // force re-evaluation
      }
    }, 30_000); // check every 30s
    return () => clearInterval(interval);
  }, [currentDate]);

  useEffect(() => {
    if (!userId || hasChecked) return;

    const readStreak = async () => {
      try {
        setHasChecked(true);

        const { data: stats } = await supabase
          .from("student_stats")
          .select("current_streak, last_activity_date, longest_streak")
          .eq("user_id", userId)
          .maybeSingle();

        if (!stats) {
          setStreakData({
            currentStreak: 0,
            showStreakAnimation: false,
            streakIncreased: false,
            previousStreak: 0,
          });
          return;
        }

        const today = dhakaDate(new Date());
        const yesterday = dhakaDate(new Date(Date.now() - 86400000));

        let displayStreak = stats.current_streak;
        if (
          stats.last_activity_date &&
          stats.last_activity_date !== today &&
          stats.last_activity_date !== yesterday
        ) {
          displayStreak = 0;
        } else if (!stats.last_activity_date) {
          displayStreak = 0;
        }

        setStreakData({
          currentStreak: displayStreak,
          showStreakAnimation: false,
          streakIncreased: false,
          previousStreak: displayStreak,
        });
      } catch (error) {
        console.error("Error reading streak:", error);
      }
    };

    readStreak();
  }, [userId, hasChecked]);

  const dismissAnimation = () => {
    setStreakData((prev) => ({ ...prev, showStreakAnimation: false }));
  };

  return { ...streakData, dismissAnimation };
};

export default useStreakTracker;
