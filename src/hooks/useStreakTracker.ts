import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StreakData {
  currentStreak: number;
  showStreakAnimation: boolean;
  streakIncreased: boolean;
  previousStreak: number;
}

export const useStreakTracker = (userId: string | undefined) => {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    showStreakAnimation: false,
    streakIncreased: false,
    previousStreak: 0,
  });
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!userId || hasChecked) return;

    const readStreak = async () => {
      try {
        setHasChecked(true);

        // Read-only: just fetch current stats without modifying streak.
        // Streak is only updated by track-session edge function after ≥1min study.
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

        setStreakData({
          currentStreak: stats.current_streak,
          showStreakAnimation: false,
          streakIncreased: false,
          previousStreak: stats.current_streak,
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
