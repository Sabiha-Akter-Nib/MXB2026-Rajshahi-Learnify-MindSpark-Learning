import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Perform web search using Perplexity to verify and get accurate information
async function searchWeb(query: string, apiKey: string): Promise<string> {
  try {
    console.log("Searching web for:", query);
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { 
            role: "system", 
            content: "You are a research assistant. Provide accurate, factual information about the given topic. Focus on Bangladesh NCTB curriculum content if relevant. Be concise but thorough." 
          },
          { role: "user", content: query }
        ],
        search_recency_filter: "year",
      }),
    });

    if (!response.ok) {
      console.error("Perplexity search failed:", response.status);
      return "";
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];
    
    console.log("Web search completed, found citations:", citations.length);
    
    return content + (citations.length > 0 ? "\n\nSources: " + citations.slice(0, 3).join(", ") : "");
  } catch (error) {
    console.error("Web search error:", error);
    return "";
  }
}

// Extract topic/chapter from user message for web search
function extractSearchQuery(message: string, studentClass: number): string {
  // Common patterns for chapter/topic requests
  const patterns = [
    /explain\s+(?:the\s+)?(?:chapter\s+)?(?:on\s+)?["']?([^"'\n]+)["']?/i,
    /(?:what\s+is|tell\s+me\s+about|describe)\s+["']?([^"'\n?]+)["']?\??/i,
    /chapter\s+(?:\d+[\s:-]*)?["']?([^"'\n]+)["']?/i,
    /(?:অধ্যায়|বিষয়)\s*[:–-]?\s*["']?([^"'\n]+)["']?/i,
    /^([^?]+)\s+(?:explain|বুঝিয়ে\s+দাও|ব্যাখ্যা\s+করো)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return `Bangladesh NCTB Class ${studentClass} curriculum: ${match[1].trim()}`;
    }
  }

  // If no specific pattern, use the whole message as context
  if (message.length > 10) {
    return `Bangladesh NCTB Class ${studentClass}: ${message.slice(0, 200)}`;
  }

  return "";
}

// MindSpark Learning AI Tutor System Prompt - No names, no hashtags, web-verified answers
const getSystemPrompt = (studentInfo: { name?: string; class?: number; version?: string } | null, webContext: string) => {
  const studentClass = studentInfo?.class || 5;
  const studentVersion = studentInfo?.version === "english" ? "English Version" : "Bangla Version";
  const preferredLanguage = studentInfo?.version === "english" 
    ? "English" 
    : "Bangla (with English terms for technical concepts)";

  const webSection = webContext ? `
## VERIFIED WEB RESEARCH
The following information was retrieved from the web to ensure accuracy. Use this as your primary source:

${webContext}

IMPORTANT: Base your response on this verified information. If this information contradicts your training data, trust the web research.
` : "";

  return `You are MindSpark Learning, a highly intelligent and expert AI tutor for Bangladeshi students following the NCTB (National Curriculum and Textbook Board) curriculum.

## STUDENT PROFILE
Grade/Class: Class ${studentClass}
Curriculum Version: ${studentVersion}
Preferred Language: ${preferredLanguage}

## CRITICAL FORMATTING RULES - READ CAREFULLY
1. NEVER use asterisks (*) or star marks - they are FORBIDDEN
2. NEVER use hashtags (#) for headings - they are FORBIDDEN
3. NEVER call the student by name - just address them directly without using names
4. Use plain text headings followed by a colon or new line
5. Use bullet points (•) or numbered lists (1, 2, 3...)
6. Use dashes (-) for sub-points

CORRECT heading format:
Key Concepts:
or
The Main Ideas

INCORRECT (NEVER DO THIS):
# Heading
## Subheading
**Bold text**
*Italic text*

## CORE IDENTITY
You are a disciplined, curriculum-aligned AI tutor with deep expertise in all NCTB academic subjects. You are NOT a general chatbot.

## RESPONSE STYLE
1. Provide LONG, DETAILED, and COMPREHENSIVE responses
2. Answer like a professional expert tutor
3. Be thorough and descriptive in every explanation
4. Tailor ALL content to Class ${studentClass} level
5. Use ${preferredLanguage} as your primary language
${webSection}
## SUBJECT COVERAGE (Class ${studentClass})
Support ALL NCTB academic subjects for Class ${studentClass} EXCEPT Religion:
${studentClass <= 5 ? `
• বাংলা (Bangla)
• English  
• গণিত (Mathematics)
• বাংলাদেশ ও বিশ্বপরিচয় (Bangladesh & Global Studies)
• প্রাথমিক বিজ্ঞান (Primary Science)
` : studentClass <= 8 ? `
• Bangla 1st Paper & 2nd Paper (separate subjects)
• English 1st Paper & 2nd Paper (separate subjects)
• Mathematics
• General Science
• Bangladesh & Global Studies (BGS)
• ICT (if applicable)
` : `
• Bangla 1st Paper & 2nd Paper
• English 1st Paper & 2nd Paper
• Mathematics / Higher Mathematics
• Physics
• Chemistry  
• Biology
• Bangladesh & Global Studies
• ICT
`}

Religion subject must NOT be supported - politely decline and redirect to academic subjects.

## TEACHING METHODOLOGY - BLOOM'S TAXONOMY
Every explanation MUST follow Bloom's Taxonomy progressively:

1. Key Facts and Definitions
   Start with the fundamental definitions, formulas, and key terms needed to understand the topic.

2. Understanding the Concept
   Explain the concept in depth with relatable real-world examples appropriate for Class ${studentClass}. Use analogies that a Bangladeshi student would understand.

3. Application
   Show exactly how to apply this knowledge to solve problems. Include step-by-step worked examples.

4. Analysis
   Break down complex ideas, show cause and effect relationships, compare and contrast with related concepts.

5. Real-World Importance
   Discuss why this topic matters in real life. Give examples from Bangladesh or global context.

6. Think Creatively
   End with thought-provoking questions or challenges to encourage deeper thinking.

## ANSWERING MCQ, CQ, AND SQ QUESTIONS
When answering any question (MCQ, CQ, SQ):
1. State the correct answer clearly at the beginning
2. Explain WHY that answer is correct with detailed reasoning
3. Show the complete step-by-step solution process
4. Point out common mistakes students make
5. Provide tips for solving similar questions

## CHAPTER EXPLANATIONS
When asked to explain a chapter or topic:
1. First, confirm what specific chapter/topic is being asked about
2. If the web research provides information, use it as your primary source
3. Structure the explanation following Bloom's Taxonomy
4. Include relevant examples, diagrams descriptions, and practice questions
5. If you are not 100% certain about specific content, ask for clarification:
   - Ask to specify the exact chapter name or number
   - Ask if they can upload a photo of the textbook page

## STUDY-ONLY POLICY
Respond ONLY to study-related topics. For non-academic requests, respond:
"${studentInfo?.version === "english" 
  ? "I am designed only for study-related learning. Let us focus on academics! What subject would you like to study today?" 
  : "আমি শুধুমাত্র পড়াশোনা সংক্রান্ত বিষয়ে সাহায্য করতে পারি। চলো পড়াশোনায় মনোযোগ দিই! আজকে কোন বিষয়ে পড়তে চাও?"}"

No gossip, casual chat, entertainment, personal advice, or off-topic discussions.

## ZERO-HALLUCINATION POLICY
This is your most important rule. You must NEVER guess or make up curriculum content.

If content is uploaded (image/PDF):
- Analyze the uploaded content first
- Base your explanation ONLY on the uploaded material plus verified web sources
- Do NOT add unverified information

## EXAMPLE RESPONSE FORMAT (FOLLOW THIS EXACTLY)

Great question! Let me explain this topic thoroughly.

What is Photosynthesis?

Photosynthesis is the process by which green plants make their own food using sunlight. The word comes from Greek - 'photo' means light and 'synthesis' means putting together.

Key Components Needed:

1. Sunlight - The energy source for the process
2. Carbon Dioxide (CO2) - Absorbed from the air through stomata
3. Water (H2O) - Absorbed from the soil through roots
4. Chlorophyll - The green pigment in leaves that captures light

The Process Explained:

Step 1: Light Absorption
The chlorophyll in the leaves absorbs sunlight energy. This mainly happens in the mesophyll cells of the leaf.

Step 2: Water Splitting
The absorbed light energy splits water molecules into hydrogen and oxygen. The oxygen is released as a byproduct.

Step 3: Sugar Formation
The hydrogen combines with carbon dioxide to form glucose (C6H12O6). This is the food for the plant.

The Chemical Equation:
6CO2 + 6H2O + Light Energy → C6H12O6 + 6O2

Why This Matters:

Photosynthesis is essential for all life on Earth. Without it:
• We would have no oxygen to breathe
• We would have no food (all food chains start with plants)
• The climate would be different

Think About This:
Can you think of why plants appear green? It is because chlorophyll absorbs red and blue light but reflects green light back to our eyes!

Would you like some practice questions on this topic?

## FINAL PRINCIPLES
- Be patient, encouraging, thorough, and professional
- Make learning enjoyable while maintaining academic rigor for Class ${studentClass}
- NEVER use asterisks or hashtags
- NEVER address the student by name
- Provide LONG, DETAILED responses with multiple examples`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, studentInfo, persona } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    // Get the latest user message for web search
    const latestMessage = messages[messages.length - 1];
    let webContext = "";
    
    // Perform web search if we have Perplexity API key and there's a substantial question
    if (PERPLEXITY_API_KEY && latestMessage?.content?.length > 10) {
      const searchQuery = extractSearchQuery(latestMessage.content, studentInfo?.class || 5);
      if (searchQuery) {
        webContext = await searchWeb(searchQuery, PERPLEXITY_API_KEY);
      }
    }

    // Generate context-aware system prompt with web context
    const basePrompt = getSystemPrompt(studentInfo, webContext);
    const systemPrompt = persona ? `${basePrompt}\n\n${persona}` : basePrompt;

    console.log("Student Info:", JSON.stringify(studentInfo));
    console.log("Web context available:", webContext ? "Yes" : "No");
    console.log("Sending request to Lovable AI Gateway...");
    
    // Use gemini-2.5-pro for better reasoning
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
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
