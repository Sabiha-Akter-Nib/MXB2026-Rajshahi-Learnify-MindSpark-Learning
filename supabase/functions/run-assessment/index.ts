import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BLOOM_LEVELS = ["remember", "understand", "apply", "analyze", "evaluate", "create"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, subjectId, topic, bloomLevel, answers, assessmentId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    if (action === "generate") {
      // Generate assessment questions
      const { data: profile } = await supabase
        .from("profiles")
        .select("class, version")
        .eq("user_id", userId)
        .single();

      const { data: subject } = subjectId ? await supabase
        .from("subjects")
        .select("name, name_bn")
        .eq("id", subjectId)
        .single() : { data: null };

      const currentLevel = bloomLevel || "remember";
      const levelIndex = BLOOM_LEVELS.indexOf(currentLevel);
      
      const prompt = `Generate 5 assessment questions for a Class ${profile?.class || 5} student (${profile?.version || "bangla"} medium).

Subject: ${subject?.name || "General Knowledge"}
Topic: ${topic || "General"}
Bloom's Taxonomy Level: ${currentLevel.toUpperCase()}

Level expectations:
- Remember: Recall facts, definitions
- Understand: Explain concepts in own words
- Apply: Use knowledge in new situations
- Analyze: Break down into components
- Evaluate: Make judgments based on criteria
- Create: Produce new ideas/solutions

Return JSON format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why this is correct",
      "xpValue": 5
    }
  ]
}

Make questions appropriate for ${currentLevel} level. XP should be ${5 + levelIndex * 2} per question.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are an educational assessment generator following Bloom's Taxonomy. Return only valid JSON." },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!aiResponse.ok) {
        throw new Error("Failed to generate questions");
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      
      let questionsData;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        questionsData = JSON.parse(jsonMatch?.[0] || "{}");
      } catch {
        questionsData = { questions: [] };
      }

      console.log(`Generated ${questionsData.questions?.length || 0} questions at ${currentLevel} level`);

      return new Response(
        JSON.stringify({ 
          questions: questionsData.questions || [],
          bloomLevel: currentLevel,
          topic,
          subjectId
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "submit") {
      // Grade and save assessment results
      const { questions } = await req.json();
      
      let correctCount = 0;
      let totalXp = 0;
      const results: any[] = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const userAnswer = answers[i];
        const isCorrect = userAnswer === q.correctIndex;
        
        if (isCorrect) {
          correctCount++;
          totalXp += q.xpValue || 5;
        }
        
        results.push({
          question: q.question,
          userAnswer,
          correctAnswer: q.correctIndex,
          isCorrect,
          explanation: q.explanation
        });
      }

      // Save assessment
      const { data: assessment } = await supabase
        .from("assessments")
        .insert({
          user_id: userId,
          subject_id: subjectId || null,
          topic: topic || null,
          bloom_level: bloomLevel || "remember",
          total_questions: questions.length,
          correct_answers: correctCount,
          xp_earned: totalXp
        })
        .select()
        .single();

      // Update topic mastery
      if (topic) {
        const { data: existingMastery } = await supabase
          .from("topic_mastery")
          .select("*")
          .eq("user_id", userId)
          .eq("topic_name", topic)
          .single();

        if (existingMastery) {
          const newAttempts = existingMastery.attempts + questions.length;
          const newCorrect = existingMastery.correct_answers + correctCount;
          const newScore = Math.round((newCorrect / newAttempts) * 100);
          const isWeak = newScore < 60;

          await supabase
            .from("topic_mastery")
            .update({
              attempts: newAttempts,
              correct_answers: newCorrect,
              mastery_score: newScore,
              is_weak_topic: isWeak,
              last_practiced_at: new Date().toISOString(),
              bloom_level: bloomLevel
            })
            .eq("id", existingMastery.id);
        } else {
          const score = Math.round((correctCount / questions.length) * 100);
          await supabase.from("topic_mastery").insert({
            user_id: userId,
            subject_id: subjectId || null,
            topic_name: topic,
            bloom_level: bloomLevel || "remember",
            mastery_score: score,
            attempts: questions.length,
            correct_answers: correctCount,
            is_weak_topic: score < 60,
            last_practiced_at: new Date().toISOString()
          });
        }
      }

      // Update student stats with XP
      const { data: currentStats } = await supabase
        .from("student_stats")
        .select("total_xp")
        .eq("user_id", userId)
        .single();

      if (currentStats) {
        await supabase
          .from("student_stats")
          .update({ total_xp: currentStats.total_xp + totalXp })
          .eq("user_id", userId);
      }

      // Determine if student should level up
      const levelIndex = BLOOM_LEVELS.indexOf(bloomLevel || "remember");
      const passRate = correctCount / questions.length;
      const shouldLevelUp = passRate >= 0.8 && levelIndex < BLOOM_LEVELS.length - 1;
      const nextLevel = shouldLevelUp ? BLOOM_LEVELS[levelIndex + 1] : bloomLevel;

      console.log(`Assessment completed: ${correctCount}/${questions.length}, XP: ${totalXp}, Level up: ${shouldLevelUp}`);

      return new Response(
        JSON.stringify({
          results,
          score: Math.round((correctCount / questions.length) * 100),
          correctCount,
          totalQuestions: questions.length,
          xpEarned: totalXp,
          shouldLevelUp,
          nextLevel,
          assessment
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Assessment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
