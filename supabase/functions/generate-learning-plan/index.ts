import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChapterInput {
  subjectId: string;
  subjectName: string;
  chapterName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, chapters, bloomLevel = "remember" } = await req.json();

    if (!userId) {
      throw new Error("User ID required");
    }

    if (!chapters || chapters.length === 0) {
      throw new Error("At least one chapter is required");
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

    console.log(`Generating ${bloomLevel} level plan for ${chapters.length} chapters`);

    // Generate quizzes for each chapter using AI
    const prompt = `You are an educational AI for Bangladesh NCTB curriculum.

Generate exactly 5 quiz topics for the following chapters at the "${bloomLevel}" level of Bloom's Taxonomy.

Student Class: ${profile?.class || 5}
Curriculum Version: ${profile?.version || "bangla"}

Chapters to create quizzes for:
${(chapters as ChapterInput[]).map((ch, i) => `${i + 1}. Subject: ${ch.subjectName}, Chapter: ${ch.chapterName}`).join("\n")}

Bloom's Taxonomy Level: ${bloomLevel}
- Remember: Recall facts and basic concepts
- Understand: Explain ideas or concepts
- Apply: Use information in new situations
- Analyze: Draw connections among ideas
- Evaluate: Justify a decision or course of action
- Create: Produce new or original work

For each chapter, create ONE focused quiz topic that tests the "${bloomLevel}" level.

Return ONLY valid JSON:
{
  "quizzes": [
    {
      "subjectId": "subject-uuid-here",
      "subjectName": "Subject Name",
      "topic": "Specific quiz topic from the chapter",
      "bloomLevel": "${bloomLevel}",
      "targetXp": 10
    }
  ]
}

Rules:
- Create exactly one quiz per chapter provided (up to 5 total)
- Each topic must be specific and testable
- XP should be 5-20 based on complexity
- All quizzes must be at the "${bloomLevel}" level`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an educational AI that creates quiz topics following Bloom's Taxonomy. Return only valid JSON." },
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
      planData = { quizzes: [] };
    }

    // Create the learning plan
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Default to weekly

    const { data: plan, error: planError } = await supabase
      .from("learning_plans")
      .insert({
        user_id: userId,
        plan_type: "custom",
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

    // Create plan tasks from quizzes
    const quizzes = planData.quizzes || [];
    const chaptersMap = new Map((chapters as ChapterInput[]).map(ch => [ch.subjectName.toLowerCase(), ch.subjectId]));

    for (let i = 0; i < quizzes.length; i++) {
      const quiz = quizzes[i];
      
      // Find the correct subject ID from input chapters
      const subjectId = chaptersMap.get(quiz.subjectName?.toLowerCase()) || 
                       (chapters as ChapterInput[])[i]?.subjectId || 
                       null;

      await supabase.from("learning_plan_tasks").insert({
        plan_id: plan.id,
        subject_id: subjectId,
        topic: quiz.topic || `Quiz ${i + 1}`,
        bloom_level: bloomLevel,
        target_xp: quiz.targetXp || 10,
        priority: i + 1
      });
    }

    // Fetch the created tasks
    const { data: createdTasks } = await supabase
      .from("learning_plan_tasks")
      .select("*, subjects(name, name_bn)")
      .eq("plan_id", plan.id)
      .order("priority");

    console.log(`Generated plan with ${createdTasks?.length || 0} quizzes at ${bloomLevel} level`);

    return new Response(
      JSON.stringify({ 
        plan, 
        tasks: createdTasks,
        message: `Learning plan created with ${createdTasks?.length || 0} quizzes!`
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
