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
    const { action, userId, subjectId, topic, bloomLevel, answers, assessmentId, questions, tutorContext } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    if (action === "generate") {
      // Generate assessment questions from tutor context
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
      const isBangla = profile?.version === "bangla";
      
      // Use tutor context if available
      const contextInfo = tutorContext 
        ? `Based on this AI Tutor conversation content:\n${tutorContext.slice(0, 2000)}\n\n` 
        : "";

      const prompt = `${contextInfo}Generate exactly 5 MCQ assessment questions for a Class ${profile?.class || 5} student (${profile?.version || "bangla"} medium).

${isBangla ? "IMPORTANT: Generate questions in Bengali language." : "Generate questions in English."}

Subject: ${subject?.name || "General Knowledge"}
Topic: ${topic || "Based on the conversation above"}
Bloom's Taxonomy Level: ${currentLevel.toUpperCase()}

Level expectations for MCQ format:
- Remember: Basic recall questions (What is...? Which one...? Name the...?)
- Understand: Comprehension questions (What does X mean? Which statement correctly explains...?)
- Apply: Application questions (Given this situation, what would...? Calculate...?)
- Analyze: Analysis questions (What is the relationship between...? Compare these options...?)
- Evaluate: Judgment MCQs with clear options (Which is the BEST approach? What is the MOST effective...? Which option is MOST suitable?)
- Create: Creative MCQs (Which combination would work best? What new approach...?)

CRITICAL RULES:
1. All questions MUST be multiple choice with exactly 4 options
2. DO NOT include written/essay-style questions
3. DO NOT use phrases like "আপনার উত্তরের স্বপক্ষে যুক্তি দিন" or "তোমার সিদ্ধান্তের স্বপক্ষে যুক্তি দাও" - these are essay prompts, not MCQ
4. For Evaluate level, use comparative MCQs like "Which is the BEST option?", "Which is MOST effective?", "Which would be MOST suitable?"
5. Each option must be a clear, distinct choice
6. Explanations should gently guide to the correct answer without directly saying "wrong"

Return JSON format:
{
  "questions": [
    {
      "question": "Question text as proper MCQ",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "${isBangla ? "সঠিক উত্তর হলো [উত্তর] কারণ... আরো ভালোভাবে বুঝতে এই পয়েন্টগুলো মনে রাখো..." : "The correct answer is [answer] because... To understand better, remember these points..."}",
      "xpValue": ${5 + levelIndex * 2}
    }
  ]
}`;

      console.log(`Generating ${currentLevel} level questions from tutor context: ${tutorContext ? 'Yes' : 'No'}`);

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "system", 
              content: `You are an educational assessment generator following Bloom's Taxonomy. 
CRITICAL: Generate ONLY proper MCQ questions with 4 distinct options. 
NEVER generate essay-style questions or prompts asking students to "explain", "justify", or "give reasons".
For Evaluate level, use comparative MCQs like "Which is BEST?", "Which is MOST effective?"
Return only valid JSON.` 
            },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error("AI response error:", await aiResponse.text());
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