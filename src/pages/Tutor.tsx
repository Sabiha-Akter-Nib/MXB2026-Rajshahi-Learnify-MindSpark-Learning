import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  Settings2,
  Trash2,
  Sparkles,
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
import { ChatHistory } from "@/components/tutor/ChatHistory";
import TutorBackground from "@/components/tutor/TutorBackground";
import MessageBubble from "@/components/tutor/MessageBubble";
import ThinkingIndicator from "@/components/tutor/ThinkingIndicator";
import EnhancedInputBar from "@/components/tutor/EnhancedInputBar";
import SubjectSelector from "@/components/tutor/SubjectSelector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle } from "lucide-react";

interface Attachment {
  type: "image" | "pdf";
  url: string;
  name?: string;
  base64?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  thinkingTime?: number;
  attachments?: Attachment[];
}

interface StudentInfo {
  name: string;
  class: number;
  version: string;
}

const CHAT_URL = `https://vprrgfzwaueklfnfpfrh.supabase.co/functions/v1/ai-tutor`;

const Tutor = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [persona, setPersona] = useState<PersonaType>("friendly");
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string | null>(null);
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
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
        setMessages([
          {
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
          },
        ]);
      }
    };

    fetchProfile();
  }, [user, createInitialGreeting]);

  // Only auto-scroll when user is at bottom, not when they scroll up
  const scrollToBottom = useCallback((behavior: "smooth" | "auto" = "smooth", force = false) => {
    if (chatContainerRef.current && !userScrolledUp || force) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, [userScrolledUp]);

  // Track user scroll position
  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = chatContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      // If user scrolls up more than 100px from bottom, disable auto-scroll
      setUserScrolledUp(distanceFromBottom > 100);
    }
  }, []);

  useEffect(() => {
    // Only scroll if user hasn't scrolled up
    if (!userScrolledUp) {
      scrollToBottom();
    }
  }, [messages, userScrolledUp, scrollToBottom]);

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

    // Create title based on subject and message
    let title = firstUserMessage
      ? firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? "..." : "")
      : "New Conversation";
    
    if (selectedSubjectName) {
      title = `${selectedSubjectName}: ${title}`;
    }

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
      setMessages([
        createInitialGreeting({
          full_name: studentInfo.name,
          class: studentInfo.class,
          version: studentInfo.version,
        }),
      ]);
    }
  };

  const handleDeleteCurrentChat = async () => {
    if (!currentConversationId || !user) return;

    try {
      // Delete messages first
      await supabase.from("chat_messages").delete().eq("conversation_id", currentConversationId);

      // Then delete conversation
      await supabase.from("chat_conversations").delete().eq("id", currentConversationId);

      handleNewConversation();
      toast({
        title: studentInfo?.version === "bangla" ? "মুছে ফেলা হয়েছে" : "Deleted",
        description: studentInfo?.version === "bangla" ? "চ্যাট মুছে ফেলা হয়েছে" : "Chat deleted",
      });
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const streamChat = async (userMessages: Array<{ role: string; content: string }>, attachment?: Attachment | null) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Please log in to use the AI tutor");
    }

    setThinkingStartTime(Date.now());

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
        subjectName: selectedSubjectName,
        imageBase64: attachment?.type === "image" ? attachment.base64 : undefined,
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
    const thinkingTime = thinkingStartTime ? Math.floor((Date.now() - thinkingStartTime) / 1000) : undefined;

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        thinkingTime: thinkingTime && thinkingTime > 2 ? thinkingTime : undefined,
      },
    ]);

    setThinkingStartTime(null);

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
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
            );
          }
        } catch {
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
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
            );
          }
        } catch {
          /* ignore */
        }
      }
    }

    return assistantContent;
  };

  const handleSend = async () => {
    if ((!input.trim() && !pendingAttachment) || isTyping) return;

    const attachments = pendingAttachment ? [pendingAttachment] : undefined;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      attachments,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentAttachment = pendingAttachment;
    setInput("");
    setPendingAttachment(null);
    setUserScrolledUp(false); // Reset scroll state when user sends
    setIsTyping(true);

    try {
      const conversationId = await ensureConversation(currentInput || "Image/PDF analysis");
      await saveMessage(conversationId, "user", currentInput || "[Attachment]");

      const chatHistory = messages.filter((m) => m.id !== "1").map((m) => ({ role: m.role, content: m.content }));

      // Build message content with attachment info
      let messageContent = currentInput;
      if (currentAttachment) {
        const attachmentDesc = currentAttachment.type === "image" 
          ? `[Image uploaded: ${currentAttachment.name || "image"}]\n\nPlease analyze this image carefully and help me understand the content. If it's homework, a textbook page, or a diagram, explain the concepts shown step by step.`
          : `[PDF uploaded: ${currentAttachment.name || "document.pdf"}]\n\nPlease help me understand the content of this document.`;
        messageContent = messageContent ? `${attachmentDesc}\n\n${messageContent}` : attachmentDesc;
      }

      chatHistory.push({ role: "user", content: messageContent });

      const assistantContent = await streamChat(chatHistory, currentAttachment);

      if (assistantContent) {
        await saveMessage(conversationId, "assistant", assistantContent);
        await supabase
          .from("chat_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setThinkingStartTime(null);
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

      {/* Header */}
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
                <div className="relative w-11 h-11 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background" />
                </div>

                <div>
                  <h1 className="font-heading font-bold text-lg">AI Tutor</h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-success rounded-full" />
                    {studentInfo ? `Class ${studentInfo.class} • ${isBangla ? "বাংলা" : "English"}` : "Online"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Subject Selector */}
              {studentInfo && (
                <SubjectSelector
                  userId={user.id}
                  studentClass={studentInfo.class}
                  selectedSubject={selectedSubjectId}
                  onSubjectChange={(id, name) => {
                    setSelectedSubjectId(id);
                    setSelectedSubjectName(name);
                  }}
                  isBangla={isBangla}
                />
              )}

              {user && (
                <ChatHistory
                  userId={user.id}
                  currentConversationId={currentConversationId}
                  onSelectConversation={loadConversation}
                  onNewConversation={handleNewConversation}
                  isBangla={isBangla}
                />
              )}

              {currentConversationId && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirm(true)}
                    title={isBangla ? "এই চ্যাট মুছুন" : "Delete this chat"}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main 
        ref={chatContainerRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative z-10 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                id={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                isStreaming={isTyping && index === messages.length - 1 && message.role === "assistant"}
                thinkingTime={message.thinkingTime}
                attachments={message.attachments}
                index={index}
              />
            ))}
          </AnimatePresence>

          {/* Thinking indicator */}
          <AnimatePresence>
            {isTyping && thinkingStartTime && messages[messages.length - 1]?.role === "user" && (
              <ThinkingIndicator startTime={thinkingStartTime} />
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onFileProcessed={(content, type, base64, name) => {
          setPendingAttachment({
            type,
            url: type === "image" && base64 ? `data:image/jpeg;base64,${base64}` : "",
            base64,
            name,
          });
          if (content) {
            setInput(content);
          }
          setShowUploadModal(false);
        }}
      />

      {/* Input Area */}
      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-background via-background to-transparent pt-4 px-4 pb-4">
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
                    <span className="text-sm font-medium">{isBangla ? "শিক্ষক মোড" : "Teaching Style"}</span>
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

          {/* Enhanced Input Bar */}
          <EnhancedInputBar
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
            onOpenUpload={() => setShowUploadModal(true)}
            showPersonaSelector={showPersonaSelector}
            isBangla={isBangla}
            pendingAttachment={pendingAttachment}
            onRemoveAttachment={() => setPendingAttachment(null)}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {isBangla ? "এই চ্যাট মুছে ফেলবেন?" : "Delete this chat?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBangla
                ? "এই কথোপকথন এবং এর সমস্ত মেসেজ স্থায়ীভাবে মুছে যাবে।"
                : "This conversation and all its messages will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{isBangla ? "বাতিল" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCurrentChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isBangla ? "মুছে ফেলুন" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tutor;
