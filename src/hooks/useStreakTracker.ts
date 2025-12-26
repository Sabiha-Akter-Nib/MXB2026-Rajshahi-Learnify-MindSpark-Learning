import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const toLocalDateString = (date: Date) => {
  // Streak is Bangladesh-specific; use Asia/Dhaka day boundaries to avoid UTC/local mismatches
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

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
          .select("current_streak, last_activity_date, longest_streak")
          .eq("user_id", userId)
          .maybeSingle();

        const today = new Date();
        const todayStr = toLocalDateString(today);

        if (!stats) {
          // Create initial stats if not exists - first day = streak of 1
          await supabase.from("student_stats").insert({
            user_id: userId,
            current_streak: 1,
            longest_streak: 1,
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
        const previousStreak = stats.current_streak;

        // If already visited today, just return current streak (no animation)
        if (todayStr === lastActivityStr) {
          setStreakData({
            currentStreak: previousStreak,
            showStreakAnimation: false,
            streakIncreased: false,
            previousStreak,
          });
          return;
        }

        // Daily-visit streak logic (same rule as track-session, but triggered by opening Dashboard)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = toLocalDateString(yesterday);

        let newStreak = 1;
        if (!lastActivityStr) {
          newStreak = 1;
        } else if (lastActivityStr === yesterdayStr) {
          newStreak = Math.max(previousStreak + 1, 1);
        } else {
          newStreak = 1;
        }

        const increased = newStreak > previousStreak;

        // Update the database with correct streak
        await supabase
          .from("student_stats")
          .update({
            current_streak: newStreak,
            last_activity_date: todayStr,
            longest_streak: Math.max(stats.longest_streak || 0, newStreak),
          })
          .eq("user_id", userId);

        setStreakData({
          currentStreak: newStreak,
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
      const date = toLocalDateString(new Date(session.created_at));
      activityDates.add(date);
    });

    // Add dates from assessments
    assessmentsResult.data?.forEach(assessment => {
      const date = toLocalDateString(new Date(assessment.completed_at));
      activityDates.add(date);
    });

    // Convert to sorted array (oldest first for easier iteration)
    const sortedDates = Array.from(activityDates).sort();
    
    if (sortedDates.length === 0) {
      return 1; // First day
    }

    // Find the longest consecutive streak ending today
    let streak = 1;

    // Start from today and work backwards
    let checkDate = new Date(todayStr);
    checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday

    while (true) {
      const checkDateStr = toLocalDateString(checkDate);
      
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