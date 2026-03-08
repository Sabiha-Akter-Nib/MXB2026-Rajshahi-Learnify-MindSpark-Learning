import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Perform web search using Perplexity to verify and get accurate information
async function searchWeb(query: string, apiKey: string): Promise<string> {
  try {
    console.log("Searching web for:", query);
    console.log("Using Perplexity API key:", apiKey ? `${apiKey.substring(0, 8)}...` : "NOT SET");
    
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
            content: "You are a research assistant specializing in Bangladesh NCTB curriculum. Provide accurate, factual information about the given topic. Focus on educational content relevant to Bangladeshi students. Be concise but thorough. Include specific chapter names, topics, and key concepts when available." 
          },
          { role: "user", content: query }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity search failed:", response.status, errorText);
      
      // If Perplexity fails, return empty but don't block the response
      return "";
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];
    
    console.log("Web search completed successfully, content length:", content.length);
    console.log("Citations found:", citations.length);
    
    return content + (citations.length > 0 ? "\n\nSources: " + citations.slice(0, 3).join(", ") : "");
  } catch (error) {
    console.error("Web search error:", error);
    return "";
  }
}

// Parse chapter requests like "1st chapter", "Chapter 2", "অধ্যায় ৩" and (optionally) detect subject
function parseChapterRequest(message: string): {
  chapterNumber?: number;
  subjectHint?: string;
  hasExplicitChapterTitle: boolean;
} {
  const text = message.toLowerCase();

  const subjectHints: Array<{ re: RegExp; label: string }> = [
    { re: /bangla\s*1(st)?\s*paper|বাংলা\s*১ম\s*পত্র|বাংলা\s*1ম\s*পত্র/i, label: "Bangla 1st Paper" },
    { re: /bangla\s*2(nd)?\s*paper|বাংলা\s*২য়\s*পত্র|বাংলা\s*2য়\s*পত্র/i, label: "Bangla 2nd Paper" },
    { re: /english\s*1(st)?\s*paper|ইংরেজি\s*১ম\s*পত্র/i, label: "English 1st Paper" },
    { re: /english\s*2(nd)?\s*paper|ইংরেজি\s*২য়\s*পত্র/i, label: "English 2nd Paper" },
    { re: /mathematics|math|গণিত/i, label: "Mathematics" },
    { re: /general\s*science|সাধারণ\s*বিজ্ঞান/i, label: "General Science" },
    { re: /bangladesh\s*&\s*global\s*studies|bgs|বাংলাদেশ\s*ও\s*বিশ্বপরিচয়/i, label: "Bangladesh & Global Studies" },
    { re: /ict|তথ্য\s*ও\s*যোগাযোগ\s*প্রযুক্তি/i, label: "ICT" },
    { re: /physics|পদার্থবিজ্ঞান/i, label: "Physics" },
    { re: /chemistry|রসায়ন/i, label: "Chemistry" },
    { re: /biology|জীববিজ্ঞান/i, label: "Biology" },
    { re: /higher\s*mathematics|উচ্চতর\s*গণিত/i, label: "Higher Mathematics" },
  ];

  const subjectHint = subjectHints.find((s) => s.re.test(message))?.label;

  // Detect chapter number in EN + BN
  const chapterMatch = message.match(/\bchapter\s*(\d{1,2})\b/i)
    || message.match(/\b(\d{1,2})\s*(?:st|nd|rd|th)\s*chapter\b/i)
    || message.match(/অধ্যা(?:য়|য়)\s*(\d{1,2})/i);

  const chapterNumber = chapterMatch?.[1] ? Number(chapterMatch[1]) : undefined;

  // If the message includes a quoted title or anything beyond just "chapter N", treat as explicit
  // Examples: "Chapter 2: লোকহার একুশে", "অধ্যায় ৩ — অণু পরমাণু"
  const hasExplicitChapterTitle =
    /chapter\s*\d{1,2}\s*[:–-]/i.test(message) ||
    /অধ্যা(?:য়|য়)\s*\d{1,2}\s*[:–-]/i.test(message) ||
    /chapter\s*\d{1,2}\s+\S+/i.test(message) ||
    /অধ্যা(?:য়|য়)\s*\d{1,2}\s+\S+/i.test(message);

  return { chapterNumber: Number.isFinite(chapterNumber) ? chapterNumber : undefined, subjectHint, hasExplicitChapterTitle };
}

// Fetch official NCTB curriculum content for known subject+class combinations
async function fetchCurriculumContent(
  subjectName: string | null,
  studentClass: number,
  userMessage: string
): Promise<string> {
  const curriculumFiles: Record<string, string> = {
    "Bangla 1st Paper|7": "bangla-1st-paper-class-7.txt",
  };

  const normalizedSubject = (subjectName?.trim() || "").toLowerCase();
  const msgLower = userMessage.toLowerCase();
  
  // Check both subject name AND user message for Bangla 1st Paper keywords
  const isBangla1st = (text: string) =>
    text.includes("bangla 1st") || text.includes("bangla 1st paper") ||
    text.includes("বাংলা ১ম") || text.includes("বাংলা ১ম পত্র") ||
    text.includes("সপ্তবর্ণা") || text.includes("soptoborna") ||
    text.includes("bangla first");

  let fileKey = "";
  for (const key of Object.keys(curriculumFiles)) {
    const [, cls] = key.split("|");
    if (parseInt(cls) === studentClass) {
      if (isBangla1st(normalizedSubject) || isBangla1st(msgLower)) {
        fileKey = key;
        break;
      }
    }
  }

  if (!fileKey) return "";

  const fileName = curriculumFiles[fileKey];

  try {
    // Fetch from the app's public data directory
    const appUrl = "https://mindsparklearning.lovable.app";
    const response = await fetch(`${appUrl}/data/${fileName}`);
    if (!response.ok) {
      console.error("Failed to fetch curriculum file:", response.status);
      return "";
    }

    const fullContent = await response.text();
    console.log(`Fetched curriculum content: ${fullContent.length} chars`);

    // Split into chapters by the separator
    const chapters = fullContent.split("________________").map(c => c.trim()).filter(c => c.length > 0);

    // Try to find the relevant chapter based on user message
    const messageLower = userMessage.toLowerCase();
    let relevantChapters: string[] = [];

    for (const chapter of chapters) {
      const chapterTitle = chapter.split("\n")[0]?.trim().toLowerCase() || "";
      // Check if user is asking about a specific chapter/topic
      if (chapterTitle && (
        messageLower.includes(chapterTitle.substring(0, 20).toLowerCase()) ||
        chapter.toLowerCase().includes(messageLower.substring(0, 50))
      )) {
        relevantChapters.push(chapter);
      }
    }

    // If no specific match, include the full content (truncated if too long for context)
    if (relevantChapters.length === 0) {
      // Return the full content but capped at ~80K chars to fit in context
      const maxChars = 80000;
      return fullContent.length > maxChars ? fullContent.substring(0, maxChars) : fullContent;
    }

    return relevantChapters.join("\n\n---\n\n");
  } catch (error) {
    console.error("Error fetching curriculum content:", error);
    return "";
  }
}

// Extract topic/chapter from user message for web search (best-effort)
function extractSearchQuery(message: string, studentClass: number): string {
  const { chapterNumber, subjectHint, hasExplicitChapterTitle } = parseChapterRequest(message);

  // If user only said "chapter 1/2/3" without title, do a targeted ToC lookup instead of letting the tutor guess.
  if (chapterNumber && !hasExplicitChapterTitle) {
    const subjectPart = subjectHint ? `${subjectHint} ` : "";
    return `Bangladesh NCTB Class ${studentClass} ${subjectPart}textbook table of contents chapter ${chapterNumber} title`;
  }

  // Common patterns for chapter/topic requests
  const patterns = [
    /explain\s+(?:the\s+)?(?:chapter\s+)?(?:on\s+)?["']?([^"'\n]+)["']?/i,
    /(?:what\s+is|tell\s+me\s+about|describe)\s+["']?([^"'\n?]+)["']?\??/i,
    /chapter\s+(?:\d+[\s:-]*)?["']?([^"'\n]+)["']?/i,
    /(?:অধ্যায়|অধ্যায়|বিষয়)\s*[:–-]?\s*["']?([^"'\n]+)["']?/i,
    /^([^?]+)\s+(?:explain|বুঝিয়ে\s+দাও|ব্যাখ্যা\s+করো)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const subjectPart = subjectHint ? `${subjectHint} ` : "";
      return `Bangladesh NCTB Class ${studentClass} ${subjectPart}curriculum: ${match[1].trim()}`;
    }
  }

  if (message.length > 10) {
    const subjectPart = subjectHint ? `${subjectHint} ` : "";
    return `Bangladesh NCTB Class ${studentClass} ${subjectPart}${message.slice(0, 200)}`;
  }

  return "";
}

// MindSpark Learning AI Tutor System Prompt - No names, no hashtags, web-verified answers
const getSystemPrompt = (studentInfo: { name?: string; class?: number; version?: string } | null, webContext: string, curriculumContent: string = "") => {
  const studentClass = studentInfo?.class || 5;
  const studentVersion = studentInfo?.version === "english" ? "English Version" : "Bangla Version";
  const preferredLanguage = studentInfo?.version === "english" 
    ? "English" 
    : "Bangla (with English terms for technical concepts)";

  const curriculumSection = curriculumContent ? `
## OFFICIAL NCTB TEXTBOOK CONTENT (AUTHORITATIVE SOURCE)
The following is the OFFICIAL NCTB textbook content. This is your PRIMARY and MOST AUTHORITATIVE source.
You MUST base ALL your answers on this content when the student asks about this subject.
Do NOT deviate from this content. Do NOT add information that contradicts this source.
If the student asks about a topic covered in this content, use ONLY this content as your reference.

${curriculumContent}

CRITICAL: The above textbook content is the SINGLE SOURCE OF TRUTH. All explanations, examples, MCQs, CQs, and answers MUST align with this content.
` : "";

  const webSection = webContext ? `
## VERIFIED WEB RESEARCH
The following information was retrieved from the web to ensure accuracy. Use this as a SECONDARY source (the official textbook content above takes priority):

${webContext}

IMPORTANT: If web research contradicts the official textbook content, ALWAYS trust the textbook content.
` : "";

  return `You are MindSpark Learning, a highly intelligent and expert AI tutor for Bangladeshi students following the NCTB (National Curriculum and Textbook Board) curriculum.

## STUDENT PROFILE
Grade/Class: Class ${studentClass}
Curriculum Version: ${studentVersion}
Preferred Language: ${preferredLanguage}
${curriculumSection}
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
${curriculumContent ? `
1. You ALREADY HAVE the official NCTB textbook content loaded below. Use it directly.
2. Do NOT ask the student to upload pictures or specify chapter names — you have the full textbook.
3. If they mention a chapter name, number, or any topic from the textbook, find it and explain it immediately.
4. Structure the explanation following Bloom's Taxonomy.
5. Include relevant examples, diagram descriptions, and practice questions from the textbook.
6. NEVER say "I don't have this content" — search the loaded textbook content thoroughly.
` : `
1. First, confirm what specific chapter/topic is being asked about
2. If the web research provides information, use it as your primary source
3. Structure the explanation following Bloom's Taxonomy
4. Include relevant examples, diagram descriptions, and practice questions
5. If you are not 100% certain about specific content, ask for clarification
`}

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

  // Minimal SSE helper for "ask for clarification" responses
  const sseText = (text: string) => {
    const payload = {
      id: `clarify-${Date.now()}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      choices: [{ index: 0, delta: { role: "assistant", content: text }, finish_reason: null }],
    };

    const body = `data: ${JSON.stringify(payload)}\n\n` + `data: [DONE]\n\n`;
    return new Response(body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { messages, studentInfo, persona, imageBase64, subjectName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    // Get the latest user message for web search
    const latestMessage = messages[messages.length - 1];
    let webContext = "";

    // Parse chapter request info
    const chapterReq = latestMessage?.content ? parseChapterRequest(String(latestMessage.content)) : { hasExplicitChapterTitle: true };

    // Fetch official curriculum content FIRST - if we have the textbook, no need to ask for uploads
    let curriculumContent = "";
    if (latestMessage?.content) {
      curriculumContent = await fetchCurriculumContent(
        subjectName || chapterReq.subjectHint || null,
        studentInfo?.class || 7,
        String(latestMessage.content)
      );
      if (curriculumContent) {
        console.log("Curriculum content loaded:", curriculumContent.length, "chars");
      }
    }

    // Only ask for clarification if we DON'T have curriculum content AND the chapter request is ambiguous
    if (!curriculumContent && latestMessage?.content && chapterReq?.chapterNumber && !chapterReq?.hasExplicitChapterTitle && !imageBase64) {
      if (!chapterReq.subjectHint) {
        return sseText(
          studentInfo?.version === "english"
            ? "I cannot be 100% sure which book you mean from only a chapter number. Please tell me: (1) Subject/book (e.g., Bangla 1st Paper / Mathematics), and (2) the chapter title."
            : "শুধু 'অধ্যায় ২/৩' বললে আমি কোন বই/বিষয় বুঝবো নিশ্চিত হতে পারি না। দয়া করে বলো: (১) বিষয়/বই (যেমন বাংলা ১ম পত্র/গণিত), এবং (২) অধ্যায়ের নাম।"
        );
      }
    }

    // Perform supplementary web search (secondary source)
    if (!imageBase64 && PERPLEXITY_API_KEY && latestMessage?.content?.length > 10) {
      const searchQuery = extractSearchQuery(latestMessage.content, studentInfo?.class || 5);
      if (searchQuery) {
        webContext = await searchWeb(searchQuery, PERPLEXITY_API_KEY);
      }
    }

    // Generate context-aware system prompt with web context + curriculum
    const basePrompt = getSystemPrompt(studentInfo, webContext, curriculumContent);
    const systemPrompt = persona ? `${basePrompt}\n\n${persona}` : basePrompt;

    console.log("Student Info:", JSON.stringify(studentInfo));
    console.log("Web context available:", webContext ? "Yes" : "No");
    console.log("Image attached:", imageBase64 ? "Yes" : "No");
    console.log("Sending request to Lovable AI Gateway...");
    
    // Track thinking start time for display
    const thinkingStartTime = Date.now();

    // Prepare messages with image if provided
    let apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(0, -1), // All messages except the last one
    ];

    // Handle the last message with potential image
    if (imageBase64) {
      // For vision requests, use GPT-5 with image content
      const lastUserMessage = messages[messages.length - 1];
      apiMessages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: lastUserMessage.content || "Please analyze this image and explain what you see. If it's educational content, explain the concepts thoroughly following Bloom's Taxonomy.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      });
    } else {
      apiMessages.push(messages[messages.length - 1]);
    }

    // Use GPT-5 for superior reasoning and accuracy (supports vision)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: apiMessages,
        stream: true,
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
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI service unavailable");
    }

    console.log("Streaming response from AI gateway...");

    // Return SSE stream
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("AI tutor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
