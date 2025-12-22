import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, subjectId, durationMinutes, xpEarned, topic, bloomLevel } = await req.json();

    if (!userId) {
      throw new Error("User ID required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Recording study session for user ${userId}: ${durationMinutes} mins, ${xpEarned} XP`);

    // 1. Insert study session
    const { error: sessionError } = await supabase
      .from("study_sessions")
      .insert({
        user_id: userId,
        subject_id: subjectId || null,
        duration_minutes: durationMinutes || 0,
        xp_earned: xpEarned || 0,
        topic: topic || null,
        bloom_level: bloomLevel || null,
      });

    if (sessionError) {
      console.error("Session insert error:", sessionError);
      throw sessionError;
    }

    // 2. Update student stats
    const today = new Date().toISOString().split("T")[0];
    
    // Get current stats
    const { data: currentStats } = await supabase
      .from("student_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (currentStats) {
      const lastActivity = currentStats.last_activity_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = currentStats.current_streak;
      
      // Calculate streak
      if (lastActivity === today) {
        // Already studied today, keep streak
      } else if (lastActivity === yesterdayStr) {
        // Studied yesterday, increment streak
        newStreak += 1;
      } else if (!lastActivity) {
        // First time studying
        newStreak = 1;
      } else {
        // Streak broken, start fresh
        newStreak = 1;
      }

      const longestStreak = Math.max(currentStats.longest_streak, newStreak);

      const { error: updateError } = await supabase
        .from("student_stats")
        .update({
          total_xp: currentStats.total_xp + (xpEarned || 0),
          total_study_minutes: currentStats.total_study_minutes + (durationMinutes || 0),
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Stats update error:", updateError);
        throw updateError;
      }

      console.log(`Updated stats: streak=${newStreak}, total_xp=${currentStats.total_xp + (xpEarned || 0)}`);
    }

    // 3. Update subject progress if subject provided
    if (subjectId) {
      const { data: progress } = await supabase
        .from("student_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("subject_id", subjectId)
        .maybeSingle();

      if (progress) {
        await supabase
          .from("student_progress")
          .update({
            xp_earned: progress.xp_earned + (xpEarned || 0),
            last_studied_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", progress.id);
      } else {
        await supabase
          .from("student_progress")
          .insert({
            user_id: userId,
            subject_id: subjectId,
            xp_earned: xpEarned || 0,
            last_studied_at: new Date().toISOString(),
          });
      }
    }

    // 4. Check for new achievements
    try {
      const achievementResponse = await fetch(
        `${supabaseUrl}/functions/v1/check-achievements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ userId, trigger: "session" }),
        }
      );
      const achievementData = await achievementResponse.json();
      if (achievementData.newlyEarned?.length > 0) {
        console.log(`New achievements unlocked: ${achievementData.newlyEarned.join(", ")}`);
      }
    } catch (achievementError) {
      console.error("Achievement check error:", achievementError);
      // Don't fail the whole request if achievement check fails
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Track session error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
