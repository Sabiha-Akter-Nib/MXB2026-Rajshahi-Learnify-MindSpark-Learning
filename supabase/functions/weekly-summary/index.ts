import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getWeekStart(now: Date): string {
  const d = new Date(now);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const weekStart = getWeekStart(now);

    // Check for cached summary this week
    const { data: cached } = await supabase
      .from("weekly_summaries")
      .select("summary, stats")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({ summary: cached.summary, stats: cached.stats, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, class, version")
      .eq("user_id", user.id)
      .maybeSingle();

    const weekStartISO = new Date(weekStart).toISOString();

    // Study sessions this week
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("duration_minutes, xp_earned, topic, bloom_level, created_at")
      .eq("user_id", user.id)
      .gte("created_at", weekStartISO);

    // Assessments this week
    const { data: assessments } = await supabase
      .from("assessments")
      .select("correct_answers, total_questions, xp_earned, topic, bloom_level")
      .eq("user_id", user.id)
      .gte("completed_at", weekStartISO);

    // Student stats
    const { data: stats } = await supabase
      .from("student_stats")
      .select("current_streak, total_xp, total_study_minutes")
      .eq("user_id", user.id)
      .maybeSingle();

    // Weak topics
    const { data: weakTopics } = await supabase
      .from("topic_mastery")
      .select("topic_name, mastery_score")
      .eq("user_id", user.id)
      .eq("is_weak_topic", true)
      .limit(5);

    // Compile stats
    const totalStudyMins = (sessions || []).reduce((s, x) => s + (x.duration_minutes || 0), 0);
    const totalXPEarned = (sessions || []).reduce((s, x) => s + (x.xp_earned || 0), 0) +
      (assessments || []).reduce((s, x) => s + (x.xp_earned || 0), 0);
    const examsTaken = (assessments || []).length;
    const totalCorrect = (assessments || []).reduce((s, x) => s + (x.correct_answers || 0), 0);
    const totalQuestions = (assessments || []).reduce((s, x) => s + (x.total_questions || 0), 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const topicsStudied = [...new Set((sessions || []).map((s) => s.topic).filter(Boolean))];
    const weakTopicNames = (weakTopics || []).map((t) => t.topic_name);

    const isBangla = profile?.version === "bangla";

    const studentName = profile?.full_name || "Student";
    const systemPrompt = `You are OddhaboshAI, a friendly and encouraging AI tutor for Bangladeshi students. 
Generate a concise weekly performance summary (3-5 sentences max) for the student.
IMPORTANT: Address the student by their name "${studentName}" at the start of the summary.
Be specific with numbers. Be encouraging but honest. If performance is low, gently motivate.
${isBangla ? "Respond ENTIRELY in Bangla (Bengali script). Use the student's name as-is." : "Respond ENTIRELY in English."}
Do NOT use markdown formatting. Just plain text with emoji.`;

    const userPrompt = `Student: ${profile?.full_name || "Student"}, Class ${profile?.class || "?"} (${profile?.version || "bangla"} version)
Weekly Stats:
- Study time: ${totalStudyMins} minutes (${Math.round(totalStudyMins / 60 * 10) / 10} hours)
- XP earned this week: ${totalXPEarned}
- Current streak: ${stats?.current_streak || 0} days
- Exams taken: ${examsTaken}
- Exam accuracy: ${accuracy}% (${totalCorrect}/${totalQuestions})
- Topics studied: ${topicsStudied.length > 0 ? topicsStudied.join(", ") : "None"}
- Weak topics: ${weakTopicNames.length > 0 ? weakTopicNames.join(", ") : "None identified"}
- Total XP (all time): ${stats?.total_xp || 0}

Generate a brief, personalized weekly performance summary.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Failed to generate summary" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || "Unable to generate summary at this time.";

    const summaryStats = {
      studyMinutes: totalStudyMins,
      xpEarned: totalXPEarned,
      examsTaken,
      accuracy,
      streak: stats?.current_streak || 0,
    };

    // Save to DB using service role (bypasses RLS for upsert)
    await supabaseAdmin
      .from("weekly_summaries")
      .upsert({
        user_id: user.id,
        week_start: weekStart,
        summary,
        stats: summaryStats,
      }, { onConflict: "user_id,week_start" });

    return new Response(
      JSON.stringify({ summary, stats: summaryStats, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("weekly-summary error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
