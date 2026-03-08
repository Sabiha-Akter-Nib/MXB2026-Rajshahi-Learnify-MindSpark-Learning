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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { topic, studentClass, version, count = 5, subjectName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    // Fetch curriculum content if available
    let curriculumContent = "";
    const curriculumFiles: Record<string, string> = {
      "Bangla 1st Paper|7": "bangla-1st-paper-class-7.txt",
    };
    for (const key of Object.keys(curriculumFiles)) {
      const [subj, cls] = key.split("|");
      if (parseInt(cls) === studentClass && (subjectName || topic || "").toLowerCase().includes(subj.toLowerCase())) {
        const urls = [
          `${supabaseUrl}/storage/v1/object/public/curriculum/${curriculumFiles[key]}`,
          `https://mindsparklearning.lovable.app/data/${curriculumFiles[key]}`,
        ];
        for (const url of urls) {
          try {
            const resp = await fetch(url);
            if (resp.ok) {
              const content = await resp.text();
              curriculumContent = content.length > 60000 ? content.substring(0, 60000) : content;
              break;
            }
            await resp.text();
          } catch (e) { /* try next */ }
        }
      }
    }

    const language = "Bengali/Bangla";
    const isEnglishSubject = (subjectName || topic || "").toLowerCase().includes("english") || 
                             (subjectName || topic || "").toLowerCase().includes("ইংরেজি");

    console.log(`Generating ${count} practice questions for Class ${studentClass} on: ${topic}`);

    const curriculumInfo = curriculumContent ? `
OFFICIAL NCTB TEXTBOOK CONTENT (PRIMARY SOURCE):
${curriculumContent}

CRITICAL: Generate questions ONLY from the official textbook content above.
` : "";

    const comboMCQInstruction = isEnglishSubject ? "" : `

IMPORTANT - COMBINATION MCQ PATTERN:
For at least 30-40% of questions, use the Bangladeshi "combination MCQ" format. This format presents 3 statements labeled with Roman numerals (i, ii, iii), then asks "কোনটি সঠিক?" with 4 combination options:
- ক. i ও ii
- খ. i ও iii  
- গ. ii ও iii
- ঘ. i, ii ও iii

Example:
"নিচের কোনটি সঠিক?
i. [statement 1]
ii. [statement 2]  
iii. [statement 3]

কোনটি সঠিক?
ক. i ও ii
খ. i ও iii
গ. ii ও iii
ঘ. i, ii ও iii"

The question text should include the statements. The options array should contain the 4 combinations. Make sure the statements are factually verifiable and the correct combination is accurate.
`;

    const systemPrompt = `You are an expert NCTB curriculum educator creating practice questions for Bangladeshi students.
${curriculumInfo}

STUDENT PROFILE:
- Class/Grade: ${studentClass}
- Curriculum Version: ${version === "english" ? "English Version" : "Bangla Version"}
- Topic: ${topic}

INSTRUCTIONS:
Generate exactly ${count} multiple-choice questions following these rules:

1. Questions MUST be appropriate for Class ${studentClass} level
2. Cover different Bloom's Taxonomy levels across the questions
3. Each question must have exactly 4 options
4. Only ONE correct answer per question
5. Include clear, educational explanations for each answer
6. Use ${language} for question content where appropriate
${comboMCQInstruction}

RESPONSE FORMAT (JSON only, no markdown):
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Clear explanation why this is correct.",
      "bloomLevel": "remember"
    }
  ]
}

Generate ONLY valid JSON. No markdown code blocks.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate ${count} practice questions about: ${topic}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI service unavailable");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    console.log("Raw AI response:", content.substring(0, 500));

    let questions;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleanContent);
      questions = parsed.questions || parsed;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions || [parsed];
      } else {
        throw new Error("Could not parse questions from AI response");
      }
    }

    console.log(`Successfully generated ${questions.length} questions`);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate practice error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
