import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
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
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  bloomLevel?: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "আসসালামু আলাইকুম! I'm your MindSpark AI Tutor. I'm here to help you learn any subject from your NCTB curriculum.\n\nYou can:\n• Ask me to explain any topic\n• Upload a photo of your homework\n• Practice with adaptive questions\n\nWhat would you like to learn today?",
    timestamp: new Date(),
  },
];

const Tutor = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(input),
        timestamp: new Date(),
        bloomLevel: "Understanding",
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (question: string): string => {
    // Mock responses based on keywords
    if (question.toLowerCase().includes("quadratic") || question.toLowerCase().includes("equation")) {
      return `Great question! Let me explain **Quadratic Equations** step by step.\n\n**📚 What is a Quadratic Equation?**\n\nA quadratic equation is a polynomial equation of degree 2, which means the highest power of the variable is 2.\n\n**Standard Form:** ax² + bx + c = 0\n\nWhere:\n- a, b, c are constants (a ≠ 0)\n- x is the variable\n\n**🔍 Example:**\nx² + 5x + 6 = 0\n\nHere, a = 1, b = 5, c = 6\n\n**💡 Methods to Solve:**\n1. Factorization\n2. Completing the Square\n3. Quadratic Formula\n\nWould you like me to show you how to solve this example using any of these methods?`;
    }
    
    if (question.toLowerCase().includes("photosynthesis")) {
      return `Excellent choice! Let's learn about **Photosynthesis** 🌱\n\n**📚 Definition:**\nPhotosynthesis is the process by which green plants make their own food using sunlight, carbon dioxide, and water.\n\n**⚡ The Equation:**\n6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂\n\n**🔬 Key Components:**\n• **Chlorophyll** - Green pigment that captures light\n• **Stomata** - Tiny pores for gas exchange\n• **Chloroplasts** - Where the magic happens!\n\n**📍 Two Stages:**\n1. **Light Reaction** - In thylakoids\n2. **Dark Reaction** - In stroma (Calvin Cycle)\n\nShall I explain either stage in more detail, or would you like some practice questions?`;
    }

    return `I understand you're asking about "${question}".\n\nTo give you the most accurate information aligned with your NCTB curriculum, could you please:\n\n1. **Specify the subject** (e.g., Mathematics, Science, Bangla)\n2. **Tell me the chapter name** or topic from your textbook\n3. Or **upload a photo** of the relevant page from your textbook\n\nThis helps me ensure I'm teaching you exactly what's in your syllabus! 📚`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
                  Online
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
                  {message.bloomLevel && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded-full font-medium">
                        {message.bloomLevel}
                      </span>
                    </div>
                  )}
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {message.content.split("\n").map((line, i) => (
                      <p key={i} className={cn(
                        "mb-2 last:mb-0",
                        message.role === "user" ? "text-primary-foreground" : "text-foreground"
                      )}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
                        <Volume2 className="w-3 h-3 mr-1" />
                        Listen
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
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
          {isTyping && (
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

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Quick Actions */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar pb-2">
            {[
              { icon: BookOpen, label: "Explain Topic" },
              { icon: Brain, label: "Practice Questions" },
              { icon: RefreshCw, label: "Revise Chapter" },
            ].map((action) => (
              <button
                key={action.label}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm font-medium hover:bg-muted/80 transition-colors whitespace-nowrap"
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </button>
            ))}
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
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Image className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Upload className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="hero"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-[52px] w-[52px]"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-3">
            MindSpark AI is designed for study-related questions only. 
            <Link to="/guidelines" className="text-primary hover:underline ml-1">Learn more</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tutor;
