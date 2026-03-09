import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
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
import WelcomeState from "@/components/tutor/WelcomeState";
import mascotImg from "@/assets/ai-mascot-3d.png";
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
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";

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
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
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
      // AI Tutor chat: track study time but no XP
      startSession({ topic: subjectParam || undefined, trackTimeOnly: true });
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

আমি অধ্যবসায় AI Tutor। আমি Class ${data.class} এর NCTB পাঠ্যক্রম অনুযায়ী পড়াশোনায় সাহায্য করতে এসেছি।

তুমি আমাকে যা বলতে পারো:

• যেকোনো টপিক বিস্তারিতভাবে বুঝিয়ে দিতে
• অধ্যায় ভিত্তিক প্র্যাক্টিস প্রশ্ন (MCQ, CQ, SQ) দিতে
• হোমওয়ার্কে সাহায্য করতে
• পরীক্ষার প্রস্তুতিতে সহায়তা করতে

আজ কোন বিষয়ে পড়তে চাও?`
      : `Assalamu Alaikum!

I am OddhaboshAI Tutor, here to help you with your Class ${data.class} NCTB curriculum.

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
        setMessages([]);
      } else {
        setMessages([]);
      }
    };

    fetchProfile();
  }, [user, createInitialGreeting]);

  const scrollToBottom = useCallback((behavior: "smooth" | "auto" = "smooth", force = false) => {
    if (chatContainerRef.current && !userScrolledUp || force) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, [userScrolledUp]);

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = chatContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setUserScrolledUp(distanceFromBottom > 100);
    }
  }, []);

  useEffect(() => {
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

    // Generate a smart title from the message
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
    setMessages([]);
  };

  const handleDeleteCurrentChat = async () => {
    if (!currentConversationId || !user) return;

    try {
      await supabase.from("chat_messages").delete().eq("conversation_id", currentConversationId);
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

  const isBangla = studentInfo?.version === "bangla";

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
    let buffer = "";
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

    const applyDelta = (delta: string) => {
      assistantContent += delta;
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m)));
    };

    let sawDone = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const sepIndex = buffer.indexOf("\n\n");
        if (sepIndex === -1) break;

        const eventBlock = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);

        const lines = eventBlock.split("\n");
        for (const l of lines) {
          const line = l.endsWith("\r") ? l.slice(0, -1) : l;
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            sawDone = true;
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) applyDelta(delta);
          } catch {
            // ignore
          }
        }
      }

      if (sawDone) {
        // keep reading
      }
    }

    if (buffer.trim()) {
      const lines = buffer.split("\n");
      for (const l of lines) {
        const line = l.endsWith("\r") ? l.slice(0, -1) : l;
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (delta) applyDelta(delta);
        } catch {
          /* ignore */
        }
      }
    }

    if (!assistantContent.trim()) {
      const fallback = isBangla
        ? "দুঃখিত, এইবার উত্তরটি প্রদর্শনে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করো।"
        : "Sorry, the response could not be displayed this time. Please try again.";
      assistantContent = fallback;
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m)));
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
    setUserScrolledUp(false);
    setIsTyping(true);

    try {
      const conversationId = await ensureConversation(currentInput || "Image/PDF analysis");
      await saveMessage(conversationId, "user", currentInput || "[Attachment]");

      const chatHistory = messages.filter((m) => m.id !== "1").map((m) => ({ role: m.role, content: m.content }));

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

  return (
    <div className="min-h-screen flex flex-col relative">
      <TutorBackground />

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-card/80 border-b border-border/15">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/50 transition-colors" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <motion.div
                    animate={{ boxShadow: ["0 0 0 0 hsla(270,50%,75%,0)", "0 0 12px 4px hsla(270,50%,75%,0.15)", "0 0 0 0 hsla(270,50%,75%,0)"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-11 h-11 rounded-full flex items-center justify-center ring-2 ring-white/50 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, hsla(270, 50%, 90%, 0.5) 0%, hsla(320, 40%, 90%, 0.4) 50%, hsla(30, 60%, 92%, 0.4) 100%)`,
                    }}
                  >
                    <img src={mascotImg} alt="AI" className="w-10 h-10 object-contain" />
                  </motion.div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[hsl(145,63%,52%)] rounded-full border-[2.5px] border-card shadow-sm" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-heading font-bold text-base text-foreground">OddhaboshAI</h1>
                    <span className="px-1.5 py-0.5 rounded-md bg-primary/8 text-primary text-[9px] font-bold uppercase tracking-wider font-heading">Tutor</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-heading">
                    <span className="w-1.5 h-1.5 bg-[hsl(145,63%,52%)] rounded-full animate-pulse" />
                    {studentInfo ? `Class ${studentInfo.class} • ${isBangla ? "বাংলা" : "English"}` : "Online"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {user && (
                <ChatHistory
                  userId={user.id}
                  currentConversationId={currentConversationId}
                  onSelectConversation={loadConversation}
                  onNewConversation={handleNewConversation}
                  isBangla={isBangla}
                />
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
          {/* Welcome state */}
          {messages.length === 0 && !isTyping && (
            <WelcomeState
              studentName={studentInfo?.name}
              isBangla={isBangla}
              onQuickAction={(prompt) => {
                setInput(prompt);
              }}
            />
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <AnimatePresence>
              {messages.map((message, index) => {
                const lastUserIdx = messages.reduce((acc, m, i) => m.role === "user" ? i : acc, -1);
                return (
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
                    isLastUserMessage={message.role === "user" && index === lastUserIdx && !isTyping}
                    onEdit={(editedContent) => {
                      setMessages(prev => prev.slice(0, index));
                      setInput(editedContent);
                    }}
                  />
                );
              })}
            </AnimatePresence>
          )}

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
      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-background via-background to-transparent pt-3 px-4 pb-4">
        <div className="max-w-4xl mx-auto">
          {/* Subject Selector Popover — shown when toggled */}
          <AnimatePresence>
            {showSubjectSelector && studentInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 overflow-hidden"
              >
                <div className="rounded-2xl p-3 border border-border/30 shadow-lg"
                  style={{
                    background: "linear-gradient(-45deg, rgba(255,255,255,0.92), rgba(255,255,255,0.75))",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
                  }}
                >
                  <SubjectSelector
                    userId={user.id}
                    studentClass={studentInfo.class}
                    selectedSubject={selectedSubjectId}
                    onSubjectChange={(id, name) => {
                      setSelectedSubjectId(id);
                      setSelectedSubjectName(name);
                      setShowSubjectSelector(false);
                    }}
                    isBangla={isBangla}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Persona Selector */}
          <AnimatePresence>
            {showPersonaSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 overflow-hidden"
              >
                <div className="rounded-2xl p-3 border border-border/30 shadow-lg"
                  style={{
                    background: "linear-gradient(-45deg, rgba(255,255,255,0.92), rgba(255,255,255,0.75))",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
                  }}
                >
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
            onOpenUpload={() => setShowUploadModal(true)}
            isBangla={isBangla}
            pendingAttachment={pendingAttachment}
            onRemoveAttachment={() => setPendingAttachment(null)}
            onToggleSubject={() => {
              setShowSubjectSelector(!showSubjectSelector);
              setShowPersonaSelector(false);
            }}
            onTogglePersona={() => {
              setShowPersonaSelector(!showPersonaSelector);
              setShowSubjectSelector(false);
            }}
            showSubjectActive={showSubjectSelector || !!selectedSubjectId}
            showPersonaActive={showPersonaSelector}
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
