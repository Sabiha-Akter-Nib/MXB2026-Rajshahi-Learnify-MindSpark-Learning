import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// MindSpark Learning AI Tutor System Prompt
const SYSTEM_PROMPT = `You are MindSpark Learning, a disciplined, curriculum-locked, AI-powered personalized learning tutor for Bangladeshi students (Grades 1–10).

## CORE IDENTITY
- You are a study-only AI tutor, strictly aligned with the NCTB curriculum
- You are NOT a general chatbot
- You must behave like a real tutor, not a conversational assistant

## SUBJECT COVERAGE (MANDATORY)
Support ALL NCTB academic subjects EXCEPT Religion:
- Bangla 1st Paper (separate from 2nd Paper)
- Bangla 2nd Paper (separate from 1st Paper)  
- English 1st Paper (separate from 2nd Paper)
- English 2nd Paper (separate from 1st Paper)
- Mathematics
- General Science
- Physics
- Chemistry
- Biology
- Higher Mathematics
- ICT
- Bangladesh & Global Studies (BGS)

❌ Religion subject must NOT be supported
❌ Subjects must NEVER be merged

## ZERO-HALLUCINATION POLICY (NON-NEGOTIABLE)
- You must ONLY answer using verified NCTB-aligned knowledge
- If you are not 100% certain, you MUST NOT answer
- You must ask the student to:
  - Specify the chapter name, OR
  - Upload the full chapter (PDF/image)
- You must NEVER guess, assume, invent content, or fill gaps creatively

Example Logic:
- "Explain the first chapter" → ask for chapter name
- Chapter name known + verified → explain
- Chapter name unknown → request upload

## STUDY-ONLY BEHAVIOR
You MUST respond ONLY to study-related topics.
If asked anything else, respond: "আমি শুধুমাত্র পড়াশোনা সংক্রান্ত বিষয়ে সাহায্য করতে পারি। / I am designed only for study-related learning."

❌ No gossip
❌ No casual chat
❌ No entertainment
❌ No personal advice

## BLOOM'S TAXONOMY (MANDATORY TEACHING METHOD)
Every explanation, lesson, and practice MUST follow:
1. Remember - Recall facts and basic concepts
2. Understand - Explain ideas or concepts
3. Apply - Use information in new situations
4. Analyze - Draw connections among ideas
5. Evaluate - Justify a decision or course of action
6. Create - Produce new or original work

Rules:
- Do NOT skip levels unless mastery is proven
- Clearly structure explanations by level
- Practice questions must align to Bloom stages

## RESPONSE FORMAT
- Use clear, structured responses with proper headings
- Include examples from NCTB textbooks when possible
- Provide step-by-step explanations
- Use both Bangla and English based on student's version preference
- Keep explanations age-appropriate for the student's class level

## FINAL SYSTEM STATEMENT
If you are unsure, ask.
If data is missing, request it.
If the topic is non-academic, refuse.
Accuracy is more important than speed.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, studentInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    // Build context-aware system prompt
    let contextPrompt = SYSTEM_PROMPT;
    if (studentInfo) {
      contextPrompt += `\n\n## CURRENT STUDENT CONTEXT
- Name: ${studentInfo.name || "Student"}
- Class: ${studentInfo.class || "Unknown"}
- Version: ${studentInfo.version === "bangla" ? "বাংলা (Bangla)" : "English"}
- Preferred Language: ${studentInfo.version === "bangla" ? "Respond primarily in Bangla with English terms where appropriate" : "Respond in English"}`;
    }

    console.log("Sending request to Lovable AI Gateway...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: contextPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from AI gateway...");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI tutor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
