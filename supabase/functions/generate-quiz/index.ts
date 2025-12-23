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

    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { chapterName, subjectName, bloomLevel, subjectId } = await req.json();

    console.log(`Generating quiz for chapter: ${chapterName}, subject: ${subjectName}, level: ${bloomLevel}`);

    if (!chapterName || !bloomLevel) {
      throw new Error("Missing required fields: chapterName and bloomLevel");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    // Get user profile for class and version using authenticated user
    let studentClass = 5;
    let version = "bangla";
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("class, version")
      .eq("user_id", user.id)
      .single();
    
    if (profile) {
      studentClass = profile.class || 5;
      version = profile.version || "bangla";
    }

    const isBangla = version === "bangla";
    const BLOOM_LEVELS = ["remember", "understand", "apply", "analyze", "evaluate", "create"];
    const levelIndex = BLOOM_LEVELS.indexOf(bloomLevel);

    // Create prompt to search and generate questions about the chapter
    const prompt = `You are an expert educational content creator for Bangladeshi NCTB curriculum.

Search your knowledge for the chapter "${chapterName}" from the subject "${subjectName || 'General'}" for Class ${studentClass} students.

Generate exactly 5 MCQ (Multiple Choice Questions) at the "${bloomLevel.toUpperCase()}" level of Bloom's Taxonomy.

${isBangla ? "IMPORTANT: Generate questions in Bengali language based on NCTB Bangla version curriculum." : "Generate questions in English based on NCTB English version curriculum."}

Bloom's Taxonomy Level Guide for MCQs:
- Remember: Basic recall (What is...? Which one is...? Name the...)
- Understand: Comprehension (What does X mean? Which statement explains...?)
- Apply: Application (Given this situation, what would...? Calculate...?)
- Analyze: Analysis (What is the relationship between...? Compare...)
- Evaluate: Judgment (Which is the BEST approach? Which is MOST effective?)
- Create: Synthesis (Which combination would work best? What new approach...?)

CRITICAL RULES:
1. Questions MUST be relevant to "${chapterName}" from NCTB curriculum
2. Each question must have exactly 4 options
3. Only ONE correct answer per question
4. Explanations should be educational and help students learn
5. Questions should be appropriate for Class ${studentClass} level
6. DO NOT ask essay-style questions - only MCQ format

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "${isBangla ? "সঠিক উত্তর হলো... কারণ..." : "The correct answer is... because..."}",
      "xpValue": ${5 + levelIndex * 2}
    }
  ],
  "chapterSummary": "Brief summary of the chapter content used to generate questions"
}`;

    console.log("Calling Lovable AI to generate quiz questions...");

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
            content: `You are an educational assessment expert for NCTB Bangladesh curriculum. 
Generate accurate, curriculum-aligned MCQ questions. 
Search your knowledge thoroughly for the chapter content before generating questions.
Return only valid JSON format.` 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI response error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Failed to generate quiz questions");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response received, parsing JSON...");

    let quizData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      quizData = JSON.parse(jsonMatch?.[0] || "{}");
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      quizData = { questions: [] };
    }

    const questions = quizData.questions || [];
    console.log(`Generated ${questions.length} quiz questions for ${chapterName} at ${bloomLevel} level`);

    return new Response(
      JSON.stringify({ 
        questions,
        chapterName,
        subjectName,
        subjectId,
        bloomLevel,
        chapterSummary: quizData.chapterSummary || ""
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Generate quiz error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
