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

    const checkAndUpdateStreak = async () => {
      try {
        setHasChecked(true);
        
        // Get current stats
        const { data: stats } = await supabase
          .from("student_stats")
          .select("current_streak, last_activity_date")
          .eq("user_id", userId)
          .maybeSingle();

        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        if (!stats) {
          // Create initial stats if not exists - first day = streak of 1
          await supabase.from("student_stats").insert({
            user_id: userId,
            current_streak: 1,
            last_activity_date: todayStr,
          });
          setStreakData({
            currentStreak: 1,
            showStreakAnimation: true,
            streakIncreased: true,
            previousStreak: 0,
          });
          return;
        }

        const lastActivityStr = stats.last_activity_date;

        // If already visited today, just return current streak (no animation)
        if (todayStr === lastActivityStr) {
          setStreakData({
            currentStreak: stats.current_streak,
            showStreakAnimation: false,
            streakIncreased: false,
            previousStreak: stats.current_streak,
          });
          return;
        }

        // Calculate the actual streak based on consecutive activity days
        const calculatedStreak = await calculateActualStreak(userId, todayStr);
        
        const previousStreak = stats.current_streak;
        const increased = calculatedStreak > previousStreak;

        // Update the database with correct streak
        await supabase
          .from("student_stats")
          .update({
            current_streak: calculatedStreak,
            last_activity_date: todayStr,
            longest_streak: Math.max(calculatedStreak, stats.current_streak || 0),
          })
          .eq("user_id", userId);

        setStreakData({
          currentStreak: calculatedStreak,
          showStreakAnimation: increased,
          streakIncreased: increased,
          previousStreak,
        });
      } catch (error) {
        console.error("Error checking streak:", error);
      }
    };

    checkAndUpdateStreak();
  }, [userId, hasChecked]);

  const dismissAnimation = () => {
    setStreakData(prev => ({ ...prev, showStreakAnimation: false }));
  };

  return { ...streakData, dismissAnimation };
};

// Calculate actual consecutive days streak based on activity history
async function calculateActualStreak(userId: string, todayStr: string): Promise<number> {
  try {
    // Get all unique activity dates from study_sessions and assessments
    const [sessionsResult, assessmentsResult] = await Promise.all([
      supabase
        .from("study_sessions")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("assessments")
        .select("completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false }),
    ]);

    // Collect all unique activity dates
    const activityDates = new Set<string>();
    
    // Add today as an activity date (user is visiting/active today)
    activityDates.add(todayStr);

    // Add dates from study sessions
    sessionsResult.data?.forEach(session => {
      const date = new Date(session.created_at).toISOString().split("T")[0];
      activityDates.add(date);
    });

    // Add dates from assessments
    assessmentsResult.data?.forEach(assessment => {
      const date = new Date(assessment.completed_at).toISOString().split("T")[0];
      activityDates.add(date);
    });

    // Convert to sorted array (oldest first for easier iteration)
    const sortedDates = Array.from(activityDates).sort();
    
    if (sortedDates.length === 0) {
      return 1; // First day
    }

    // Find the longest consecutive streak ending today
    let streak = 1;
    const today = new Date(todayStr);
    
    // Start from today and work backwards
    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday
    
    while (true) {
      const checkDateStr = checkDate.toISOString().split("T")[0];
      
      if (activityDates.has(checkDateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1); // Move to previous day
      } else {
        // Gap found, streak ends
        break;
      }
    }

    return Math.max(streak, 1);
  } catch (error) {
    console.error("Error calculating streak:", error);
    return 1;
  }
}

export default useStreakTracker;