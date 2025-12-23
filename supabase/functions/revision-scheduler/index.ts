import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SM-2 Spaced Repetition Algorithm
function calculateNextReview(
  quality: number, // 0-5 rating of recall quality
  repetitionCount: number,
  easeFactor: number,
  intervalDays: number
): { nextInterval: number; newEaseFactor: number; newRepCount: number } {
  // quality: 0-2 = fail, 3 = hard, 4 = good, 5 = easy
  
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum ease factor

  let newRepCount = repetitionCount;
  let nextInterval: number;

  if (quality < 3) {
    // Failed - reset
    newRepCount = 0;
    nextInterval = 1;
  } else {
    newRepCount += 1;
    if (newRepCount === 1) {
      nextInterval = 1;
    } else if (newRepCount === 2) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(intervalDays * newEaseFactor);
    }
  }

  return { nextInterval, newEaseFactor, newRepCount };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate user from JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const { action, revisionId, quality } = await req.json();

    if (action === "generate") {
      // Get weak topics that need revision scheduling
      const { data: weakTopics } = await supabase
        .from("topic_mastery")
        .select("id, topic_name, subject_id, mastery_score, last_practiced_at")
        .eq("user_id", userId)
        .eq("is_weak_topic", true);

      if (!weakTopics || weakTopics.length === 0) {
        return new Response(
          JSON.stringify({ message: "No weak topics to schedule", revisions: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check existing schedules
      const { data: existingSchedules } = await supabase
        .from("revision_schedule")
        .select("topic_mastery_id")
        .eq("user_id", userId)
        .eq("is_completed", false);

      const scheduledTopicIds = new Set(existingSchedules?.map(s => s.topic_mastery_id) || []);

      // Create new revision schedules for unscheduled weak topics
      const newSchedules = [];
      for (const topic of weakTopics) {
        if (!scheduledTopicIds.has(topic.id)) {
          // Calculate initial review date based on mastery score
          // Lower mastery = sooner review
          const daysUntilReview = Math.max(1, Math.floor(topic.mastery_score / 20));
          const nextReviewDate = new Date();
          nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilReview);

          newSchedules.push({
            user_id: userId,
            topic_mastery_id: topic.id,
            subject_id: topic.subject_id,
            topic_name: topic.topic_name,
            next_review_date: nextReviewDate.toISOString().split("T")[0],
            review_interval_days: daysUntilReview,
            ease_factor: 2.5,
            repetition_count: 0,
          });
        }
      }

      if (newSchedules.length > 0) {
        await supabase.from("revision_schedule").insert(newSchedules);
      }

      // Fetch all active revisions
      const { data: revisions } = await supabase
        .from("revision_schedule")
        .select("*, subjects(name, name_bn)")
        .eq("user_id", userId)
        .eq("is_completed", false)
        .order("next_review_date", { ascending: true });

      console.log(`Generated ${newSchedules.length} new revision schedules, total active: ${revisions?.length || 0}`);

      return new Response(
        JSON.stringify({ revisions: revisions || [], newCount: newSchedules.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "complete") {
      // Mark revision as completed and schedule next review
      const { data: revision } = await supabase
        .from("revision_schedule")
        .select("*")
        .eq("id", revisionId)
        .eq("user_id", userId)
        .single();

      if (!revision) {
        throw new Error("Revision not found");
      }

      const { nextInterval, newEaseFactor, newRepCount } = calculateNextReview(
        quality || 4, // Default to "good"
        revision.repetition_count,
        parseFloat(revision.ease_factor),
        revision.review_interval_days
      );

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

      // Update the revision schedule
      await supabase
        .from("revision_schedule")
        .update({
          next_review_date: nextReviewDate.toISOString().split("T")[0],
          review_interval_days: nextInterval,
          ease_factor: newEaseFactor,
          repetition_count: newRepCount,
          is_completed: quality < 3 ? false : true, // Only mark complete if passed
          completed_at: quality >= 3 ? new Date().toISOString() : null,
        })
        .eq("id", revisionId);

      // If quality was good (3+), create a new revision for the next interval
      if (quality >= 3) {
        await supabase.from("revision_schedule").insert({
          user_id: userId,
          topic_mastery_id: revision.topic_mastery_id,
          subject_id: revision.subject_id,
          topic_name: revision.topic_name,
          next_review_date: nextReviewDate.toISOString().split("T")[0],
          review_interval_days: nextInterval,
          ease_factor: newEaseFactor,
          repetition_count: newRepCount,
        });
      }

      console.log(`Revision ${revisionId} completed with quality ${quality}, next review in ${nextInterval} days`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          nextReviewDate: nextReviewDate.toISOString().split("T")[0],
          nextInterval 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "getDueToday") {
      const today = new Date().toISOString().split("T")[0];
      
      const { data: dueRevisions } = await supabase
        .from("revision_schedule")
        .select("*, subjects(name, name_bn)")
        .eq("user_id", userId)
        .eq("is_completed", false)
        .lte("next_review_date", today)
        .order("next_review_date", { ascending: true });

      return new Response(
        JSON.stringify({ revisions: dueRevisions || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Revision scheduler error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
