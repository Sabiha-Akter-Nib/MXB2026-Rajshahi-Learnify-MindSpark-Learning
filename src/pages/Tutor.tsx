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
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import TutorBackground from "@/components/tutor/TutorBackground";
import IOSInputSection from "@/components/tutor/IOSInputSection";

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

const CHAT_URL = `https://vprrgfzwaueklfnfpfrh.supabase.co/functions/v1/ai-tutor`;

// Format text by removing asterisks, hashtags and applying proper styling
const formatMessageContent = (content: string): React.ReactNode[] => {
  let formattedContent = content
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+(.+)$/gm, '$1');

  return formattedContent.split("\n").map((line, i) => {
    const isHeading = /^[A-Z][^.!?]*:$/.test(line.trim()) || 
                      /^(Step|Example|Note|Key|Important|Why|How|What|When|Where|Think|Remember|Summary|Practice|Question)/i.test(line.trim());
    
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

  useEffect(() => {
    if (user) {
      const subjectParam = searchParams.get("subject");
      startSession({ topic: subjectParam || undefined });
    }
    return () => {
      endSession();
    };
  }, [user]);
  
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

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

আজ কোন বিষয়ে পড়তে চাও?`
      : `Assalamu Alaikum!

I am MindSpark AI Tutor, here to help you with your Class ${data.class} NCTB curriculum.

Here is what I can help you with:

• Explain any topic in great detail with step-by-step breakdowns
• Provide practice questions (MCQ, CQ, SQ) based on your chapters
• Help you with your homework and assignments
• Assist with exam preparation

What would you like to study today?`;
    
    return {
      id: "1",
      role: "assistant" as const,
      content: greeting,
      timestamp: new Date(),
    };
  }, []);

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
        setMessages([{
          id: "1",
          role: "assistant",
          content: `Assalamu Alaikum!

I am MindSpark AI Tutor. I am here to help you learn any subject from your NCTB curriculum.

You can ask me to:
• Explain any topic in detail
• Practice with adaptive questions
• Get homework help

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

  const ensureConversation = async (firstUserMessage?: string): Promise<string> => {
    if (currentConversationId) return currentConversationId;
    
    if (!user) throw new Error("User not authenticated");
    
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
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("user_id", user.id);
      
      if (error) throw error;
      
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
    // Get session token for authenticated request
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Please log in to use the AI tutor");
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
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
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

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
      const conversationId = await ensureConversation(currentInput);
      await saveMessage(conversationId, "user", currentInput);

      const chatHistory = messages
        .filter(m => m.id !== "1")
        .map(m => ({ role: m.role, content: m.content }));
      
      chatHistory.push({ role: "user", content: currentInput });

      const assistantContent = await streamChat(chatHistory);
      
      if (assistantContent) {
        await saveMessage(conversationId, "assistant", assistantContent);
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
        <TutorBackground />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isBangla = studentInfo?.version === "bangla";

  return (
    <div className="min-h-screen flex flex-col relative">
      <TutorBackground />
      
      {/* iOS-style Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" className="rounded-xl" asChild>
                  <Link to="/dashboard">
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </Button>
              </motion.div>
              
              <div className="flex items-center gap-3">
                <motion.div 
                  className="relative w-11 h-11 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30"
                  animate={{
                    boxShadow: [
                      "0 10px 30px -10px hsl(var(--primary) / 0.4)",
                      "0 10px 40px -10px hsl(var(--primary) / 0.6)",
                      "0 10px 30px -10px hsl(var(--primary) / 0.4)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Brain className="w-5 h-5 text-primary-foreground" />
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                <div>
                  <h1 className="font-heading font-bold text-lg">AI Tutor</h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                    {studentInfo ? `Class ${studentInfo.class} • ${isBangla ? "বাংলা" : "English"}` : "Online"}
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
                  isBangla={isBangla}
                />
              )}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteAllHistory}
                  title={isBangla ? "সব ইতিহাস মুছুন" : "Delete all history"}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <motion.div 
                    className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-primary/20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                  >
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </motion.div>
                )}

                <motion.div
                  className={cn(
                    "max-w-[85%] rounded-3xl px-5 py-4 backdrop-blur-md",
                    message.role === "user"
                      ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-lg shadow-lg shadow-primary/20"
                      : "bg-card/80 border border-border/50 rounded-bl-lg shadow-xl"
                  )}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
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
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        onClick={() => handleCopy(message.content)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </motion.button>
                      <div className="flex-1" />
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-success hover:bg-success/10 transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  )}
                </motion.div>

                {message.role === "user" && (
                  <motion.div 
                    className="w-9 h-9 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-accent/20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                  >
                    <User className="w-4 h-4 text-accent-foreground" />
                  </motion.div>
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
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-3xl rounded-bl-lg px-5 py-4 shadow-xl">
                <div className="flex gap-1.5">
                  <motion.span 
                    className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span 
                    className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.span 
                    className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  />
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

      {/* iOS-style Input Area */}
      <div className="sticky bottom-0 z-20 backdrop-blur-xl bg-background/60 border-t border-border/30 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Persona Selector */}
          <AnimatePresence>
            {showPersonaSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="bg-card/80 backdrop-blur-md rounded-3xl border border-border/50 p-4 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {isBangla ? "শিক্ষক মোড" : "Teaching Style"}
                    </span>
                  </div>
                  <PersonaSelector
                    selected={persona}
                    onSelect={(p) => {
                      setPersona(p);
                      setShowPersonaSelector(false);
                    }}
                    isBangla={isBangla}
                    compact
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Multimodal Input Section */}
          <AnimatePresence>
            {showMultimodal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="bg-card/80 backdrop-blur-md rounded-3xl border border-border/50 p-4 shadow-xl">
                  <MultimodalInput
                    onContentReady={(content, imageData) => {
                      if (imageData) {
                        setInput(content);
                      } else {
                        setInput(content);
                      }
                      setShowMultimodal(false);
                    }}
                    disabled={isTyping}
                    isBangla={isBangla}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main iOS Input */}
          <IOSInputSection
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onKeyDown={handleKeyDown}
            isTyping={isTyping}
            isRecording={isRecording}
            isProcessing={isProcessing}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onTogglePersona={() => setShowPersonaSelector(!showPersonaSelector)}
            onToggleMultimodal={() => setShowMultimodal(!showMultimodal)}
            onOpenUpload={() => setShowUploadModal(true)}
            showPersonaSelector={showPersonaSelector}
            showMultimodal={showMultimodal}
            isBangla={isBangla}
          />

          <p className="text-center text-xs text-muted-foreground mt-4">
            {isBangla 
              ? "MindSpark AI শুধুমাত্র পড়াশোনা সংক্রান্ত প্রশ্নের জন্য তৈরি।"
              : "MindSpark AI is designed for study-related questions only."}
            <Link to="/" className="text-primary hover:underline ml-1">
              {isBangla ? "আরো জানুন" : "Learn more"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tutor;