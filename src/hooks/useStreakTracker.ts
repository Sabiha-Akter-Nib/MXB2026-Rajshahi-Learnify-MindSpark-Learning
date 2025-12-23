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

  useEffect(() => {
    if (!userId) return;

    const checkAndUpdateStreak = async () => {
      try {
        // Get current stats
        const { data: stats } = await supabase
          .from("student_stats")
          .select("current_streak, last_activity_date")
          .eq("user_id", userId)
          .maybeSingle();

        if (!stats) {
          // Create initial stats if not exists
          await supabase.from("student_stats").insert({
            user_id: userId,
            current_streak: 1,
            last_activity_date: new Date().toISOString().split("T")[0],
          });
          setStreakData({
            currentStreak: 1,
            showStreakAnimation: true,
            streakIncreased: true,
            previousStreak: 0,
          });
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastActivity = stats.last_activity_date 
          ? new Date(stats.last_activity_date) 
          : null;
        
        if (lastActivity) {
          lastActivity.setHours(0, 0, 0, 0);
        }

        const todayStr = today.toISOString().split("T")[0];
        const lastActivityStr = lastActivity?.toISOString().split("T")[0];

        // Check if already visited today
        if (todayStr === lastActivityStr) {
          setStreakData({
            currentStreak: stats.current_streak,
            showStreakAnimation: false,
            streakIncreased: false,
            previousStreak: stats.current_streak,
          });
          return;
        }

        // Calculate days difference
        const daysDiff = lastActivity 
          ? Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        let newStreak = stats.current_streak;
        let streakIncreased = false;

        if (daysDiff === 1) {
          // Consecutive day - increment streak!
          newStreak = stats.current_streak + 1;
          streakIncreased = true;
        } else if (daysDiff > 1) {
          // Streak broken - reset to 1
          newStreak = 1;
          streakIncreased = true; // Still show animation for new streak
        }

        // Update the database
        await supabase
          .from("student_stats")
          .update({
            current_streak: newStreak,
            last_activity_date: todayStr,
            longest_streak: Math.max(newStreak, stats.current_streak),
          })
          .eq("user_id", userId);

        setStreakData({
          currentStreak: newStreak,
          showStreakAnimation: streakIncreased,
          streakIncreased,
          previousStreak: stats.current_streak,
        });
      } catch (error) {
        console.error("Error checking streak:", error);
      }
    };

    checkAndUpdateStreak();
  }, [userId]);

  const dismissAnimation = () => {
    setStreakData(prev => ({ ...prev, showStreakAnimation: false }));
  };

  return { ...streakData, dismissAnimation };
};

export default useStreakTracker;