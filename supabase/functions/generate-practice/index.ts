import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, studentClass, version, count = 5 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    const language = version === "english" ? "English" : "Bengali/Bangla";

    console.log(`Generating ${count} practice questions for Class ${studentClass} on: ${topic}`);

    const systemPrompt = `You are an expert NCTB curriculum educator creating practice questions for Bangladeshi students.

STUDENT PROFILE:
- Class/Grade: ${studentClass}
- Curriculum Version: ${version === "english" ? "English Version" : "Bangla Version"}
- Topic: ${topic}

INSTRUCTIONS:
Generate exactly ${count} multiple-choice questions following these rules:

1. Questions MUST be appropriate for Class ${studentClass} level
2. Cover different Bloom's Taxonomy levels:
   - 2 questions at "remember" level (basic facts/definitions)
   - 2 questions at "understand" level (explain concepts)
   - 1 question at "apply" or "analyze" level (use knowledge)

3. Each question must have exactly 4 options (A, B, C, D)
4. Only ONE correct answer per question
5. Include clear, educational explanations for each answer
6. Use ${language} for question content where appropriate

RESPONSE FORMAT (JSON only, no markdown):
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Clear explanation why option A is correct and why others are wrong.",
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
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI service unavailable");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("Raw AI response:", content.substring(0, 500));

    // Parse JSON from response
    let questions;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      const parsed = JSON.parse(cleanContent);
      questions = parsed.questions || parsed;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Fallback: try to extract JSON from response
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
