import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AchievementCheck {
  userId: string;
  trigger?: "session" | "assessment" | "streak" | "xp" | "all";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, trigger = "all" }: AchievementCheck = await req.json();

    if (!userId) {
      throw new Error("User ID required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Checking achievements for user ${userId}, trigger: ${trigger}`);

    // Fetch all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from("achievements")
      .select("*");

    if (achievementsError) throw achievementsError;

    // Fetch already earned achievements
    const { data: earnedAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    const earnedIds = new Set(earnedAchievements?.map((e) => e.achievement_id) || []);

    // Fetch user progress data
    const [sessionsRes, assessmentsRes, statsRes, topicsRes, perfectScoreRes] = await Promise.all([
      supabase.from("study_sessions").select("id").eq("user_id", userId),
      supabase.from("assessments").select("id, correct_answers, total_questions").eq("user_id", userId),
      supabase.from("student_stats").select("current_streak, total_xp").eq("user_id", userId).maybeSingle(),
      supabase.from("topic_mastery").select("id, bloom_level").eq("user_id", userId),
      supabase.from("assessments")
        .select("id")
        .eq("user_id", userId)
        .filter("correct_answers", "eq", "total_questions")
        .gt("total_questions", 0),
    ]);

    const userProgress = {
      study_sessions: sessionsRes.data?.length || 0,
      assessments: assessmentsRes.data?.length || 0,
      streak_days: statsRes.data?.current_streak || 0,
      total_xp: statsRes.data?.total_xp || 0,
      topics_studied: topicsRes.data?.length || 0,
      perfect_score: perfectScoreRes.data?.length || 0,
      bloom_level: Math.max(
        ...((topicsRes.data || []).map((t) => {
          const levels = ["remember", "understand", "apply", "analyze", "evaluate", "create"];
          return levels.indexOf(t.bloom_level) + 1;
        }) || [0])
      ),
      subject_complete: 0, // Would need more complex query
    };

    console.log("User progress:", userProgress);

    // Check each achievement
    const newlyEarned: string[] = [];

    for (const achievement of achievements || []) {
      // Skip if already earned
      if (earnedIds.has(achievement.id)) continue;

      // Check if requirement is met
      let current = 0;
      switch (achievement.requirement_type) {
        case "study_sessions":
          current = userProgress.study_sessions;
          break;
        case "assessments":
          current = userProgress.assessments;
          break;
        case "streak_days":
          current = userProgress.streak_days;
          break;
        case "total_xp":
          current = userProgress.total_xp;
          break;
        case "topics_studied":
          current = userProgress.topics_studied;
          break;
        case "perfect_score":
          current = userProgress.perfect_score;
          break;
        case "bloom_level":
          current = userProgress.bloom_level;
          break;
        case "subject_complete":
          current = userProgress.subject_complete;
          break;
      }

      if (current >= achievement.requirement_value) {
        // Award the achievement
        const { error: insertError } = await supabase
          .from("user_achievements")
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
          });

        if (!insertError) {
          newlyEarned.push(achievement.name);
          console.log(`Awarded achievement: ${achievement.name}`);

          // Add XP reward to user stats
          const { data: currentStats } = await supabase
            .from("student_stats")
            .select("total_xp")
            .eq("user_id", userId)
            .maybeSingle();

          if (currentStats) {
            await supabase
              .from("student_stats")
              .update({
                total_xp: currentStats.total_xp + achievement.xp_reward,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);
          }
        } else {
          console.error(`Error awarding ${achievement.name}:`, insertError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        newlyEarned,
        count: newlyEarned.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check achievements error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});