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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization header required");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = user.id;
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const { action, subjectId, topic, bloomLevel, answers, questions, count = 25, subjectName } = await req.json();

    // Helper: fetch curriculum content
    async function fetchCurriculumForAssessment(sName: string, studentClass: number): Promise<string> {
      const curriculumFiles: Record<string, string> = {
        "Bangla 1st Paper|7": "bangla-1st-paper-class-7.txt",
      };
      for (const key of Object.keys(curriculumFiles)) {
        const [subj, cls] = key.split("|");
        if (parseInt(cls) === studentClass && sName.toLowerCase().includes(subj.toLowerCase())) {
          const urls = [
            `${supabaseUrl}/storage/v1/object/public/curriculum/${curriculumFiles[key]}`,
            `https://mindsparklearning.lovable.app/data/${curriculumFiles[key]}`,
          ];
          for (const url of urls) {
            try {
              const resp = await fetch(url);
              if (resp.ok) {
                const content = await resp.text();
                return content.length > 60000 ? content.substring(0, 60000) : content;
              }
              await resp.text();
            } catch (e) { /* try next */ }
          }
        }
      }
      return "";
    }

    if (action === "generate") {
      const { data: profile } = await supabase.from("profiles").select("class").eq("user_id", userId).single();
      const { data: subject } = subjectId
        ? await supabase.from("subjects").select("name, name_bn").eq("id", subjectId).single()
        : { data: null };

      const sName = subject?.name || subjectName || "";
      const curriculumContent = sName ? await fetchCurriculumForAssessment(sName, profile?.class || 7) : "";
      const isEnglishSubject = sName.toLowerCase().includes("english") || sName.toLowerCase().includes("ইংরেজি");
      const questionCount = count || 25;

      const curriculumInfo = curriculumContent ? `
OFFICIAL NCTB TEXTBOOK CONTENT (PRIMARY SOURCE - ALL questions MUST be based on this):
${curriculumContent}
CRITICAL: Generate questions ONLY from the official textbook content above.
` : "";

      const comboMCQInstruction = isEnglishSubject ? "" : `

IMPORTANT - COMBINATION MCQ PATTERN:
For at least 30-40% of questions, use the Bangladeshi "combination MCQ" format with Roman numerals:
Present 3 statements (i, ii, iii), then ask "কোনটি সঠিক?" with 4 combination options:
- ক. i ও ii
- খ. i ও iii  
- গ. ii ও iii
- ঘ. i, ii ও iii

Include the statements in the question text. The options array contains the 4 combinations.
`;

      const prompt = `${curriculumInfo}Generate exactly ${questionCount} MCQ model test questions for a Class ${profile?.class || 7} student (bangla medium).

Subject: ${sName || "General Knowledge"}
Topic: ${topic || "Full syllabus model test"}

INSTRUCTIONS:
- Generate questions in Bengali language
- Mix all Bloom's Taxonomy levels across the questions
- Each question must have exactly 4 options
- Only ONE correct answer per question
- Include clear educational explanations
- Cover the topic comprehensively with variety
${comboMCQInstruction}

CRITICAL RULES:
1. All questions MUST be proper MCQ with exactly 4 options
2. DO NOT include essay/written questions
3. Explanations should be educational
4. Each question gets 1 XP for correct answer

Return JSON:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why this is correct",
      "xpValue": 1
    }
  ]
}`;

      console.log(`Generating ${questionCount} model test questions for ${sName}, topic: ${topic}`);

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: `You are an expert NCTB curriculum educator creating model test MCQ questions for Bangladeshi students. Generate ONLY proper MCQs with 4 options. Return only valid JSON.` },
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
        const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        questionsData = JSON.parse(clean);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        questionsData = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [] };
      }

      console.log(`Generated ${questionsData.questions?.length || 0} model test questions`);

      return new Response(
        JSON.stringify({ questions: questionsData.questions || [], topic, subjectId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "submit") {
      let correctCount = 0;
      let totalXp = 0;
      const results: any[] = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const userAnswer = answers[i];
        const isCorrect = userAnswer === q.correctIndex;
        if (isCorrect) { correctCount++; totalXp += 1; }
        // -0.25 negative marking for wrong
        if (userAnswer !== -1 && userAnswer !== null && userAnswer !== undefined && !isCorrect) {
          totalXp -= 0.25;
        }
        results.push({ question: q.question, userAnswer, correctAnswer: q.correctIndex, isCorrect, explanation: q.explanation });
      }

      totalXp = Math.max(0, parseFloat(totalXp.toFixed(2)));

      // Save assessment
      await supabase.from("assessments").insert({
        user_id: userId, subject_id: subjectId || null, topic: topic || null,
        bloom_level: bloomLevel || "mixed", total_questions: questions.length,
        correct_answers: correctCount, xp_earned: Math.round(totalXp),
      });

      // Update topic mastery
      if (topic) {
        const { data: existingMastery } = await supabase.from("topic_mastery")
          .select("*").eq("user_id", userId).eq("topic_name", topic).single();

        if (existingMastery) {
          const newAttempts = existingMastery.attempts + questions.length;
          const newCorrect = existingMastery.correct_answers + correctCount;
          const newScore = Math.round((newCorrect / newAttempts) * 100);
          await supabase.from("topic_mastery").update({
            attempts: newAttempts, correct_answers: newCorrect, mastery_score: newScore,
            is_weak_topic: newScore < 60, last_practiced_at: new Date().toISOString(), bloom_level: bloomLevel || "mixed"
          }).eq("id", existingMastery.id);
        } else {
          const score = Math.round((correctCount / questions.length) * 100);
          await supabase.from("topic_mastery").insert({
            user_id: userId, subject_id: subjectId || null, topic_name: topic,
            bloom_level: bloomLevel || "mixed", mastery_score: score,
            attempts: questions.length, correct_answers: correctCount,
            is_weak_topic: score < 60, last_practiced_at: new Date().toISOString()
          });
        }
      }

      // Track session
      const dhakaDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
      const today = dhakaDate(new Date());
      const { data: currentStats } = await supabase.from("student_stats").select("*").eq("user_id", userId).single();

      if (currentStats) {
        const lastActivity = currentStats.last_activity_date;
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = dhakaDate(yesterday);
        let newStreak = currentStats.current_streak;
        if (lastActivity === today) { /* keep */ }
        else if (lastActivity === yesterdayStr) { newStreak += 1; }
        else if (!lastActivity) { newStreak = 1; }
        else { newStreak = 1; }

        await supabase.from("student_stats").update({
          total_xp: currentStats.total_xp + Math.round(totalXp),
          current_streak: newStreak,
          longest_streak: Math.max(currentStats.longest_streak, newStreak),
          last_activity_date: today, updated_at: new Date().toISOString(),
        }).eq("user_id", userId);
      }

      console.log(`Model test completed: ${correctCount}/${questions.length}, XP: ${totalXp}`);

      return new Response(
        JSON.stringify({
          results, score: Math.round((correctCount / questions.length) * 100),
          correctCount, totalQuestions: questions.length, xpEarned: totalXp,
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
