import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, planType = "daily" } = await req.json();

    if (!userId) {
      throw new Error("User ID required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    // Fetch student profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("class, version")
      .eq("user_id", userId)
      .single();

    // Fetch weak topics
    const { data: weakTopics } = await supabase
      .from("topic_mastery")
      .select("topic_name, subject_id, bloom_level, mastery_score")
      .eq("user_id", userId)
      .eq("is_weak_topic", true)
      .order("mastery_score", { ascending: true })
      .limit(5);

    // Fetch subjects for the student's class
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name, name_bn")
      .lte("min_class", profile?.class || 1)
      .gte("max_class", profile?.class || 10);

    // Generate learning plan using AI
    const prompt = `Generate a ${planType} learning plan for a Class ${profile?.class || 5} student (${profile?.version || "bangla"} version).

Weak areas to focus on:
${weakTopics?.map(t => `- ${t.topic_name} (Mastery: ${t.mastery_score}%, Bloom Level: ${t.bloom_level})`).join("\n") || "No weak areas identified yet"}

Available subjects:
${subjects?.map(s => `- ${s.name}`).join("\n") || "General subjects"}

Create a structured plan with 3-5 tasks. Each task should:
1. Target a specific topic
2. Specify a Bloom's Taxonomy level (remember, understand, apply, analyze, evaluate, create)
3. Include estimated XP reward (5-20 based on difficulty)
4. Prioritize weak topics

Return JSON format:
{
  "tasks": [
    {
      "subject": "subject name",
      "topic": "specific topic",
      "bloomLevel": "understand",
      "targetXp": 10,
      "priority": 1,
      "description": "Brief task description"
    }
  ]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an educational AI that creates personalized learning plans following Bloom's Taxonomy. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error("Failed to generate learning plan");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let planData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      planData = JSON.parse(jsonMatch?.[0] || "{}");
    } catch {
      console.error("Failed to parse AI response:", content);
      planData = { tasks: [] };
    }

    // Create the learning plan
    const startDate = new Date();
    const endDate = new Date();
    if (planType === "weekly") {
      endDate.setDate(endDate.getDate() + 7);
    } else {
      endDate.setDate(endDate.getDate() + 1);
    }

    const { data: plan, error: planError } = await supabase
      .from("learning_plans")
      .insert({
        user_id: userId,
        plan_type: planType,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        status: "active"
      })
      .select()
      .single();

    if (planError) {
      console.error("Error creating plan:", planError);
      throw new Error("Failed to create learning plan");
    }

    // Create plan tasks
    const tasks = planData.tasks || [];
    for (const task of tasks) {
      // Find subject ID
      const subject = subjects?.find(s => 
        s.name.toLowerCase().includes(task.subject?.toLowerCase() || "")
      );

      await supabase.from("learning_plan_tasks").insert({
        plan_id: plan.id,
        subject_id: subject?.id || null,
        topic: task.topic || "General Practice",
        bloom_level: task.bloomLevel || "understand",
        target_xp: task.targetXp || 10,
        priority: task.priority || 1
      });
    }

    // Fetch the created tasks
    const { data: createdTasks } = await supabase
      .from("learning_plan_tasks")
      .select("*, subjects(name, name_bn)")
      .eq("plan_id", plan.id)
      .order("priority");

    console.log(`Generated ${planType} plan with ${createdTasks?.length || 0} tasks for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        plan, 
        tasks: createdTasks,
        message: `${planType === "daily" ? "Daily" : "Weekly"} learning plan created successfully!`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Learning plan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
