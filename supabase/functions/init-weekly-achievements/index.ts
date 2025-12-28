import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Weekly achievement definitions
const WEEKLY_ACHIEVEMENTS = [
  {
    achievement_type: "weekly_xp",
    achievement_name: "Weekly XP Champion",
    achievement_description: "Earn 500 XP this week",
    icon: "trending-up",
    target_value: 500,
    xp_reward: 50,
  },
  {
    achievement_type: "weekly_sessions",
    achievement_name: "Consistent Learner",
    achievement_description: "Complete 5 study sessions this week",
    icon: "book-open",
    target_value: 5,
    xp_reward: 30,
  },
  {
    achievement_type: "weekly_streak",
    achievement_name: "Week Warrior",
    achievement_description: "Maintain a 7-day streak",
    icon: "flame",
    target_value: 7,
    xp_reward: 75,
  },
  {
    achievement_type: "weekly_assessments",
    achievement_name: "Quiz Master",
    achievement_description: "Complete 3 assessments this week",
    icon: "target",
    target_value: 3,
    xp_reward: 40,
  },
  {
    achievement_type: "weekly_practice",
    achievement_name: "Practice Pro",
    achievement_description: "Practice for 120 minutes this week",
    icon: "clock",
    target_value: 120,
    xp_reward: 45,
  },
];

// Get the start of the current week (Sunday)
function getWeekStart(): string {
  const now = new Date();
  // Adjust for Asia/Dhaka timezone (UTC+6)
  const dhakaOffset = 6 * 60 * 60 * 1000;
  const dhakaTime = new Date(now.getTime() + dhakaOffset);
  
  const day = dhakaTime.getUTCDay();
  const diff = dhakaTime.getUTCDate() - day;
  const weekStart = new Date(Date.UTC(dhakaTime.getUTCFullYear(), dhakaTime.getUTCMonth(), diff));
  
  return weekStart.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  console.log("init-weekly-achievements called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User authenticated:", user.id);

    const weekStart = getWeekStart();
    console.log("Current week start:", weekStart);

    // Check if achievements for this week already exist
    const { data: existingAchievements, error: fetchError } = await supabase
      .from("weekly_achievements")
      .select("achievement_type")
      .eq("user_id", user.id)
      .eq("week_start", weekStart);

    if (fetchError) {
      console.error("Error fetching existing achievements:", fetchError);
      throw fetchError;
    }

    console.log("Existing achievements count:", existingAchievements?.length || 0);

    const existingTypes = new Set(existingAchievements?.map((a) => a.achievement_type) || []);

    // Insert missing achievements for this week
    const newAchievements = WEEKLY_ACHIEVEMENTS.filter(
      (a) => !existingTypes.has(a.achievement_type)
    ).map((a) => ({
      user_id: user.id,
      week_start: weekStart,
      ...a,
    }));

    if (newAchievements.length > 0) {
      console.log("Inserting new achievements:", newAchievements.length);
      const { error: insertError } = await supabase
        .from("weekly_achievements")
        .insert(newAchievements);

      if (insertError) {
        console.error("Error inserting achievements:", insertError);
        throw insertError;
      }
    }

    // Calculate current progress for each achievement type
    const weekStartDate = new Date(weekStart);
    weekStartDate.setUTCHours(0, 0, 0, 0);

    // Get study sessions this week
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("xp_earned, duration_minutes")
      .eq("user_id", user.id)
      .gte("created_at", weekStartDate.toISOString());

    // Get assessments this week
    const { data: assessments } = await supabase
      .from("assessments")
      .select("xp_earned")
      .eq("user_id", user.id)
      .gte("created_at", weekStartDate.toISOString());

    // Get current streak
    const { data: stats } = await supabase
      .from("student_stats")
      .select("current_streak")
      .eq("user_id", user.id)
      .maybeSingle();

    // Calculate values
    const weeklyXP = 
      (sessions?.reduce((sum, s) => sum + (s.xp_earned || 0), 0) || 0) +
      (assessments?.reduce((sum, a) => sum + (a.xp_earned || 0), 0) || 0);
    const sessionCount = sessions?.length || 0;
    const assessmentCount = assessments?.length || 0;
    const studyMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
    const currentStreak = stats?.current_streak || 0;

    console.log("Weekly progress:", { weeklyXP, sessionCount, assessmentCount, studyMinutes, currentStreak });

    // Update progress for each achievement
    const progressUpdates = [
      { type: "weekly_xp", value: weeklyXP },
      { type: "weekly_sessions", value: sessionCount },
      { type: "weekly_streak", value: currentStreak },
      { type: "weekly_assessments", value: assessmentCount },
      { type: "weekly_practice", value: studyMinutes },
    ];

    for (const update of progressUpdates) {
      const achievement = WEEKLY_ACHIEVEMENTS.find((a) => a.achievement_type === update.type);
      if (!achievement) continue;

      const isCompleted = update.value >= achievement.target_value;

      const { error: updateError } = await supabase
        .from("weekly_achievements")
        .update({
          current_value: Math.min(update.value, achievement.target_value),
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .eq("achievement_type", update.type);

      if (updateError) {
        console.error(`Error updating ${update.type}:`, updateError);
      }
    }

    // Fetch final state
    const { data: finalAchievements, error: finalError } = await supabase
      .from("weekly_achievements")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .order("xp_reward", { ascending: false });

    if (finalError) {
      console.error("Error fetching final achievements:", finalError);
      throw finalError;
    }

    console.log("Returning achievements:", finalAchievements?.length || 0);

    return new Response(
      JSON.stringify({
        week_start: weekStart,
        weekly_xp: weeklyXP,
        achievements: finalAchievements,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Error in init-weekly-achievements:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
