import { useState, useRef, useEffect } from "react";
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

const Tutor = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [persona, setPersona] = useState<PersonaType>("friendly");
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMultimodal, setShowMultimodal] = useState(false);
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
        
        // Set personalized greeting based on student info
        const isBangla = data.version === "bangla";
        const greeting = isBangla 
          ? `আসসালামু আলাইকুম, ${data.full_name}! 👋\n\nআমি তোমার MindSpark AI Tutor। আমি তোমাকে Class ${data.class} এর NCTB পাঠ্যক্রম অনুযায়ী পড়াশোনায় সাহায্য করতে এসেছি।\n\nতুমি আমাকে:\n• যেকোনো টপিক বুঝিয়ে দিতে বলতে পারো\n• অধ্যায় ভিত্তিক প্র্যাক্টিস প্রশ্ন চাইতে পারো\n• হোমওয়ার্কে সাহায্য নিতে পারো\n\n🔍 আমি ওয়েব থেকে তোমার ক্লাসের জন্য উপযুক্ত প্রশ্ন খুঁজে আনতে পারি!\n\nআজ কী পড়তে চাও?`
          : `Hello, ${data.full_name}! 👋\n\nI'm your MindSpark AI Tutor. I'm here to help you with your Class ${data.class} NCTB curriculum.\n\nYou can ask me to:\n• Explain any topic in detail\n• Provide chapter-based practice questions\n• Help with your homework\n\n🔍 I can search the web to find relevant practice questions for your grade!\n\nWhat would you like to study today?`;
        
        setMessages([{
          id: "1",
          role: "assistant",
          content: greeting,
          timestamp: new Date(),
        }]);
      } else {
        // Default greeting if no profile
        setMessages([{
          id: "1",
          role: "assistant",
          content: "আসসালামু আলাইকুম! I'm your MindSpark AI Tutor. I'm here to help you learn any subject from your NCTB curriculum.\n\nYou can:\n• Ask me to explain any topic\n• Practice with adaptive questions\n• Get homework help\n\nWhat would you like to learn today?",
          timestamp: new Date(),
        }]);
      }
    };

    fetchProfile();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Build message history for context
      const chatHistory = messages
        .filter(m => m.id !== "1") // Skip initial greeting
        .map(m => ({ role: m.role, content: m.content }));
      
      chatHistory.push({ role: "user", content: currentInput });

      await streamChat(chatHistory);
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
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
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
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  )}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {message.content.split("\n").map((line, i) => (
                      <p key={i} className={cn(
                        "mb-2 last:mb-0",
                        message.role === "user" ? "text-primary-foreground" : "text-foreground"
                      )}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {message.role === "assistant" && message.content && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
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
                  <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
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
              { icon: BookOpen, label: "Explain Topic", prompt: "Please explain " },
              { icon: Brain, label: "Practice Questions", prompt: "Give me practice questions for " },
              { icon: RefreshCw, label: "Revise Chapter", prompt: "Help me revise " },
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
                placeholder="Ask me anything about your studies..."
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
            MindSpark AI is designed for study-related questions only. 
            <Link to="/" className="text-primary hover:underline ml-1">Learn more</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tutor;
