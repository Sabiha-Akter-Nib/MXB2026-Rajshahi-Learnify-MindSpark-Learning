import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Send,
  Mic,
  Image,
  Upload,
  Sparkles,
  ArrowLeft,
  BookOpen,
  Brain,
  User,
  MoreVertical,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Loader2,
  MicOff,
  Settings2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVoiceInput } from "@/hooks/useVoiceInput";

import { useStudySession } from "@/hooks/useStudySession";
import { PersonaSelector, PersonaType, getPersonaPrompt } from "@/components/tutor/PersonaSelector";
import { FileUploadModal } from "@/components/tutor/FileUploadModal";
import { MultimodalInput } from "@/components/tutor/MultimodalInput";
import { ChatHistory } from "@/components/tutor/ChatHistory";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface StudentInfo {
  name: string;
  class: number;
  version: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;

// Format text by removing asterisks, hashtags and applying proper styling
const formatMessageContent = (content: string): React.ReactNode[] => {
  // Remove markdown asterisks and hashtags but keep the text
  let formattedContent = content
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Remove ***bold italic***
    .replace(/\*\*(.+?)\*\*/g, '$1')     // Remove **bold**
    .replace(/\*(.+?)\*/g, '$1')         // Remove *italic*
    .replace(/^#{1,6}\s+(.+)$/gm, '$1'); // Remove # ## ### etc. headings

  return formattedContent.split("\n").map((line, i) => {
    // Check if line is a heading (ends with colon or starts with caps)
    const isHeading = /^[A-Z][^.!?]*:$/.test(line.trim()) || 
                      /^(Step|Example|Note|Key|Important|Why|How|What|When|Where|Think|Remember|Summary|Practice|Question)/i.test(line.trim());
    
    // Check if line is a bullet point
    const isBullet = /^[\•\-]\s/.test(line.trim()) || /^\d+[\.\)]\s/.test(line.trim());
    
    if (!line.trim()) {
      return <div key={i} className="h-3" />;
    }
    
    if (isHeading) {
      return (
        <p key={i} className="font-semibold text-foreground mt-4 mb-2 first:mt-0">
          {line}
        </p>
      );
    }
    
    if (isBullet) {
      return (
        <p key={i} className="pl-4 mb-1 text-foreground/90">
          {line}
        </p>
      );
    }
    
    return (
      <p key={i} className="mb-2 leading-relaxed">
        {line}
      </p>
    );
  });
};

const Tutor = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [persona, setPersona] = useState<PersonaType>("friendly");
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMultimodal, setShowMultimodal] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isRecording, isProcessing, startRecording, stopRecording, cancelRecording } = useVoiceInput();
  const { startSession, endSession, addXP } = useStudySession();

  // Start study session when component mounts
  useEffect(() => {
    if (user) {
      const subjectParam = searchParams.get("subject");
      startSession({ topic: subjectParam || undefined });
    }
    return () => {
      endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Create initial greeting - no names, no curriculum change mention
  const createInitialGreeting = useCallback((data: { full_name: string; class: number; version: string }) => {
    const isBangla = data.version === "bangla";
    const greeting = isBangla 
      ? `আসসালামু আলাইকুম!

আমি MindSpark AI Tutor। আমি Class ${data.class} এর NCTB পাঠ্যক্রম অনুযায়ী পড়াশোনায় সাহায্য করতে এসেছি।

তুমি আমাকে যা বলতে পারো:

• যেকোনো টপিক বিস্তারিতভাবে বুঝিয়ে দিতে
• অধ্যায় ভিত্তিক প্র্যাক্টিস প্রশ্ন (MCQ, CQ, SQ) দিতে
• হোমওয়ার্কে সাহায্য করতে
• পরীক্ষার প্রস্তুতিতে সহায়তা করতে

আমি প্রতিটি উত্তর দেওয়ার আগে ওয়েব থেকে সঠিক তথ্য যাচাই করে নিই।

আজ কোন বিষয়ে পড়তে চাও?`
      : `Assalamu Alaikum!

I am MindSpark AI Tutor, here to help you with your Class ${data.class} NCTB curriculum.

Here is what I can help you with:

• Explain any topic in great detail with step-by-step breakdowns
• Provide practice questions (MCQ, CQ, SQ) based on your chapters
• Help you with your homework and assignments
• Assist with exam preparation

I verify every answer by searching the web for the most accurate information.

What would you like to study today?`;
    
    return {
      id: "1",
      role: "assistant" as const,
      content: greeting,
      timestamp: new Date(),
    };
  }, []);

  // Fetch student profile and set initial greeting
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("full_name, class, version")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        const info = {
          name: data.full_name,
          class: data.class,
          version: data.version,
        };
        setStudentInfo(info);
        setMessages([createInitialGreeting(data)]);
      } else {
        // Default greeting if no profile - no names, no curriculum change mention
        setMessages([{
          id: "1",
          role: "assistant",
          content: `Assalamu Alaikum!

I am MindSpark AI Tutor. I am here to help you learn any subject from your NCTB curriculum.

You can ask me to:
• Explain any topic in detail
• Practice with adaptive questions
• Get homework help

I verify every answer by searching the web for the most accurate information.

What would you like to learn today?`,
          timestamp: new Date(),
        }]);
      }
    };

    fetchProfile();
  }, [user, createInitialGreeting]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save messages to database
  const saveMessage = async (conversationId: string, role: "user" | "assistant", content: string) => {
    try {
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role,
        content,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  // Create or get conversation
  const ensureConversation = async (firstUserMessage?: string): Promise<string> => {
    if (currentConversationId) return currentConversationId;
    
    if (!user) throw new Error("User not authenticated");
    
    // Generate title from first message
    const title = firstUserMessage 
      ? firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? "..." : "")
      : "New Conversation";
    
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: user.id,
        title,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    setCurrentConversationId(data.id);
    return data.id;
  };

  // Load conversation messages
  const loadConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages);
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    if (studentInfo) {
      setMessages([createInitialGreeting({
        full_name: studentInfo.name,
        class: studentInfo.class,
        version: studentInfo.version,
      })]);
    }
  };

  const handleDeleteAllHistory = async () => {
    if (!user) return;
    
    const confirmMessage = studentInfo?.version === "bangla" 
      ? "তুমি কি নিশ্চিত যে সব কথোপকথন মুছে ফেলতে চাও?" 
      : "Are you sure you want to delete all chat history?";
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      // Delete all conversations for this user
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      // Reset current conversation
      setCurrentConversationId(null);
      if (studentInfo) {
        setMessages([createInitialGreeting({
          full_name: studentInfo.name,
          class: studentInfo.class,
          version: studentInfo.version,
        })]);
      }
      
      toast({
        title: studentInfo?.version === "bangla" ? "মুছে ফেলা হয়েছে" : "Deleted",
        description: studentInfo?.version === "bangla" ? "সব কথোপকথন মুছে ফেলা হয়েছে" : "All chat history deleted",
      });
    } catch (error) {
      console.error("Error deleting history:", error);
      toast({
        title: studentInfo?.version === "bangla" ? "ত্রুটি" : "Error",
        description: studentInfo?.version === "bangla" ? "মুছতে পারিনি" : "Failed to delete history",
        variant: "destructive",
      });
    }
  };

  const streamChat = async (userMessages: Array<{ role: string; content: string }>) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: userMessages,
        studentInfo: studentInfo,
        persona: getPersonaPrompt(persona),
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      }
      if (resp.status === 402) {
        throw new Error("AI credits exhausted. Please contact support.");
      }
      throw new Error(errorData.error || "Failed to get AI response");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";
    const assistantId = Date.now().toString();

    // Create initial assistant message
    setMessages(prev => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => 
              prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: assistantContent }
                  : m
              )
            );
          }
        } catch {
          // Incomplete JSON, put it back
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => 
              prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: assistantContent }
                  : m
              )
            );
          }
        } catch { /* ignore */ }
      }
    }

    return assistantContent;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      // Ensure we have a conversation
      const conversationId = await ensureConversation(currentInput);
      
      // Save user message
      await saveMessage(conversationId, "user", currentInput);

      // Build message history for context
      const chatHistory = messages
        .filter(m => m.id !== "1") // Skip initial greeting
        .map(m => ({ role: m.role, content: m.content }));
      
      chatHistory.push({ role: "user", content: currentInput });

      const assistantContent = await streamChat(chatHistory);
      
      // Save assistant response
      if (assistantContent) {
        await saveMessage(conversationId, "assistant", assistantContent);
        
        // Update conversation title and timestamp
        await supabase
          .from("chat_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading font-semibold">AI Tutor</h1>
                <p className="text-xs text-success flex items-center gap-1">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  {studentInfo ? `Class ${studentInfo.class} • ${studentInfo.version === "bangla" ? "বাংলা" : "English"}` : "Online"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <ChatHistory
                userId={user.id}
                currentConversationId={currentConversationId}
                onSelectConversation={loadConversation}
                onNewConversation={handleNewConversation}
                isBangla={studentInfo?.version === "bangla"}
              />
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDeleteAllHistory}
              title={studentInfo?.version === "bangla" ? "সব ইতিহাস মুছুন" : "Delete all history"}
            >
              <Trash2 className="w-5 h-5 text-destructive" />
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-5 py-4",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md shadow-sm"
                  )}
                >
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    message.role === "user" 
                      ? "text-primary-foreground" 
                      : "dark:prose-invert text-foreground"
                  )}>
                    {message.role === "assistant" 
                      ? formatMessageContent(message.content)
                      : message.content.split("\n").map((line, i) => (
                          <p key={i} className="mb-2 last:mb-0">{line}</p>
                        ))
                    }
                  </div>

                  {message.role === "assistant" && message.content && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(message.content)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <div className="flex-1" />
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-success">
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-accent-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && messages[messages.length - 1]?.role === "user" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onFileProcessed={(content) => {
          setInput(content);
          setShowUploadModal(false);
        }}
      />

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Persona Selector */}
          {showPersonaSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <PersonaSelector
                selected={persona}
                onSelect={(p) => {
                  setPersona(p);
                  setShowPersonaSelector(false);
                }}
                isBangla={studentInfo?.version === "bangla"}
                compact
              />
            </motion.div>
          )}
          
          {/* Multimodal Input Section */}
          {showMultimodal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <MultimodalInput
                onContentReady={(content, imageData) => {
                  if (imageData) {
                    // For now, just set the text prompt - image analysis would need backend support
                    setInput(content);
                  } else {
                    setInput(content);
                  }
                  setShowMultimodal(false);
                }}
                disabled={isTyping}
                isBangla={studentInfo?.version === "bangla"}
              />
            </motion.div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar pb-2">
            {[
              { icon: BookOpen, label: studentInfo?.version === "bangla" ? "টপিক ব্যাখ্যা" : "Explain Topic", prompt: studentInfo?.version === "bangla" ? "দয়া করে বিস্তারিতভাবে ব্যাখ্যা করো " : "Please explain in detail " },
              { icon: Brain, label: studentInfo?.version === "bangla" ? "প্র্যাক্টিস প্রশ্ন" : "Practice Questions", prompt: studentInfo?.version === "bangla" ? "এই বিষয়ে MCQ, CQ এবং সংক্ষিপ্ত প্রশ্ন দাও " : "Give me MCQ, CQ and short questions for " },
              { icon: RefreshCw, label: studentInfo?.version === "bangla" ? "রিভিশন" : "Revise Chapter", prompt: studentInfo?.version === "bangla" ? "রিভিশন করতে সাহায্য করো " : "Help me revise " },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => setInput(action.prompt)}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm font-medium hover:bg-muted/80 transition-colors whitespace-nowrap"
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </button>
            ))}
            <button
              onClick={() => setShowMultimodal(!showMultimodal)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                showMultimodal 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <Upload className="w-4 h-4" />
              {studentInfo?.version === "bangla" ? "মাল্টিমিডিয়া" : "Multimodal"}
            </button>
          </div>

          {/* Input */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={studentInfo?.version === "bangla" 
                  ? "তোমার পড়াশোনা সম্পর্কে যেকোনো প্রশ্ন করো..." 
                  : "Ask me anything about your studies..."}
                className="min-h-[52px] max-h-32 pr-24 resize-none"
                rows={1}
                disabled={isTyping}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Image className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPersonaSelector(!showPersonaSelector)}
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-8 w-8",
                    isRecording ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={async () => {
                    if (isRecording) {
                      const text = await stopRecording();
                      if (text) setInput(prev => prev + " " + text);
                    } else {
                      await startRecording();
                    }
                  }}
                  disabled={isProcessing}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button
              variant="hero"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="h-[52px] w-[52px]"
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-3">
            {studentInfo?.version === "bangla" 
              ? "MindSpark AI শুধুমাত্র পড়াশোনা সংক্রান্ত প্রশ্নের জন্য তৈরি।"
              : "MindSpark AI is designed for study-related questions only."}
            <Link to="/" className="text-primary hover:underline ml-1">
              {studentInfo?.version === "bangla" ? "আরো জানুন" : "Learn more"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tutor;
