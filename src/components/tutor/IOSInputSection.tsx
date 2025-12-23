import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  MicOff,
  Image,
  Settings2,
  Sparkles,
  BookOpen,
  Brain,
  RefreshCw,
  Upload,
  Camera,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  labelBn: string;
  prompt: string;
  promptBn: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    icon: BookOpen,
    label: "Explain",
    labelBn: "ব্যাখ্যা",
    prompt: "Please explain in detail ",
    promptBn: "দয়া করে বিস্তারিতভাবে ব্যাখ্যা করো ",
    color: "from-primary to-primary/80",
  },
  {
    icon: Brain,
    label: "Practice",
    labelBn: "প্র্যাক্টিস",
    prompt: "Give me MCQ, CQ and short questions for ",
    promptBn: "এই বিষয়ে MCQ, CQ এবং সংক্ষিপ্ত প্রশ্ন দাও ",
    color: "from-success to-success/80",
  },
  {
    icon: RefreshCw,
    label: "Revise",
    labelBn: "রিভিশন",
    prompt: "Help me revise ",
    promptBn: "রিভিশন করতে সাহায্য করো ",
    color: "from-accent to-accent/80",
  },
];

interface IOSInputSectionProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isTyping: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => Promise<string | null>;
  onTogglePersona: () => void;
  onToggleMultimodal: () => void;
  onOpenUpload: () => void;
  showPersonaSelector: boolean;
  showMultimodal: boolean;
  isBangla: boolean;
}

const IOSInputSection = ({
  input,
  setInput,
  onSend,
  onKeyDown,
  isTyping,
  isRecording,
  isProcessing,
  onStartRecording,
  onStopRecording,
  onTogglePersona,
  onToggleMultimodal,
  onOpenUpload,
  showPersonaSelector,
  showMultimodal,
  isBangla,
}: IOSInputSectionProps) => {
  const [focusedAction, setFocusedAction] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {/* Quick Actions - iOS style horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 px-1">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const isHovered = focusedAction === index;
          
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => setFocusedAction(index)}
              onHoverEnd={() => setFocusedAction(null)}
              onClick={() => setInput(isBangla ? action.promptBn : action.prompt)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all whitespace-nowrap",
                "bg-card/80 backdrop-blur-sm border border-border/50",
                "hover:border-primary/40 hover:bg-card"
              )}
            >
              {/* Hover glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{
                  boxShadow: isHovered 
                    ? "0 8px 30px -10px hsl(var(--primary) / 0.3), inset 0 0 20px hsl(var(--primary) / 0.05)"
                    : "none",
                }}
                transition={{ duration: 0.2 }}
              />
              
              <motion.div
                animate={isHovered ? { y: [0, -3, 0], scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                <Icon className="w-4 h-4 text-primary" />
              </motion.div>
              
              <span className="relative z-10">{isBangla ? action.labelBn : action.label}</span>
            </motion.button>
          );
        })}
        
        {/* Multimodal toggle */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleMultimodal}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all whitespace-nowrap",
            "border backdrop-blur-sm",
            showMultimodal
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-transparent shadow-lg shadow-primary/20"
              : "bg-card/80 border-border/50 hover:border-primary/40"
          )}
        >
          <Upload className="w-4 h-4" />
          <span>{isBangla ? "মাল্টিমিডিয়া" : "Multimodal"}</span>
        </motion.button>
      </div>

      {/* Main Input Container - iOS style */}
      <motion.div
        className={cn(
          "relative rounded-3xl backdrop-blur-md transition-all duration-300",
          "bg-card/80 border border-border/50",
          "shadow-xl shadow-primary/5"
        )}
        animate={{
          boxShadow: input.trim()
            ? "0 20px 60px -15px hsl(var(--primary) / 0.2), 0 0 40px -10px hsl(var(--primary) / 0.1)"
            : "0 10px 40px -15px hsl(var(--foreground) / 0.1)",
        }}
      >
        {/* Glow ring when focused */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          animate={{
            boxShadow: input.trim()
              ? "inset 0 0 0 1px hsl(var(--primary) / 0.3), inset 0 0 30px hsl(var(--primary) / 0.03)"
              : "inset 0 0 0 0 transparent",
          }}
          transition={{ duration: 0.3 }}
        />

        <div className="p-2">
          {/* Textarea */}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isBangla 
              ? "তোমার পড়াশোনা সম্পর্কে যেকোনো প্রশ্ন করো..." 
              : "Ask me anything about your studies..."}
            className={cn(
              "min-h-[44px] max-h-32 resize-none border-0 bg-transparent",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "text-base placeholder:text-muted-foreground/60",
              "px-2 py-1"
            )}
            rows={1}
            disabled={isTyping}
          />

          {/* Bottom toolbar - compact */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            {/* Left actions */}
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onOpenUpload}
                className={cn(
                  "p-2.5 rounded-xl transition-colors",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Image className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onTogglePersona}
                className={cn(
                  "p-2.5 rounded-xl transition-colors",
                  showPersonaSelector
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Settings2 className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={async () => {
                  if (isRecording) {
                    const text = await onStopRecording();
                    if (text) setInput(input + " " + text);
                  } else {
                    onStartRecording();
                  }
                }}
                disabled={isProcessing}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  isRecording
                    ? "text-destructive bg-destructive/10 animate-pulse"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </motion.button>
            </div>

            {/* Send button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSend}
              disabled={!input.trim() || isTyping}
              className={cn(
                "relative flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium transition-all",
                "text-sm",
                input.trim() && !isTyping
                  ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {/* Glow effect */}
              {input.trim() && !isTyping && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{
                    boxShadow: [
                      "0 0 20px hsl(var(--primary) / 0.3)",
                      "0 0 30px hsl(var(--primary) / 0.5)",
                      "0 0 20px hsl(var(--primary) / 0.3)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="relative z-10">{isBangla ? "পাঠাও" : "Send"}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default IOSInputSection;