import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Paperclip, X, Loader2,
  BookOpen, Brain, RefreshCw, Upload, SendHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  labelBn: string;
  prompt: string;
  promptBn: string;
  color: string;
  isMultimodal?: boolean;
}

const quickActions: QuickAction[] = [
  { icon: BookOpen, label: "Explain", labelBn: "ব্যাখ্যা", prompt: "Please explain in detail ", promptBn: "দয়া করে বিস্তারিতভাবে ব্যাখ্যা করো ", color: "text-primary" },
  { icon: Brain, label: "Practice", labelBn: "অনুশীলন", prompt: "Give me MCQ, CQ and short questions for practice on ", promptBn: "অনুশীলনের জন্য MCQ, CQ এবং সংক্ষিপ্ত প্রশ্ন দাও ", color: "text-[hsl(145,63%,42%)]" },
  { icon: RefreshCw, label: "Revision", labelBn: "রিভিশন", prompt: "Help me revise and summarize ", promptBn: "রিভিশন এবং সারসংক্ষেপ করতে সাহায্য করো ", color: "text-accent" },
  { icon: Upload, label: "Upload", labelBn: "আপলোড", prompt: "", promptBn: "", color: "text-warning", isMultimodal: true },
];

interface PendingAttachment {
  type: "image" | "pdf";
  url: string;
  base64?: string;
  name?: string;
}

interface EnhancedInputBarProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isTyping: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => Promise<string | null>;
  onOpenUpload: () => void;
  onImageSelected?: (file: File) => void;
  isBangla: boolean;
  disabled?: boolean;
  pendingAttachment?: PendingAttachment | null;
  onRemoveAttachment?: () => void;
}

const EnhancedInputBar = ({
  input, setInput, onSend, onKeyDown, isTyping, isRecording, isProcessing,
  onStartRecording, onStopRecording, onOpenUpload,
  onImageSelected, isBangla, disabled = false,
  pendingAttachment, onRemoveAttachment,
}: EnhancedInputBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
  }, [input]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageSelected?.(file);
  };

  const handleRemoveAttachment = () => {
    if (imageInputRef.current) imageInputRef.current.value = "";
    onRemoveAttachment?.();
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      const text = await onStopRecording();
      if (text) setInput(input + (input ? " " : "") + text);
    } else {
      onStartRecording();
    }
  };

  const canSend = (input.trim() || pendingAttachment) && !isTyping && !disabled;

  return (
    <div className="relative">
      {/* Pending attachment preview */}
      <AnimatePresence>
        {pendingAttachment && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mb-2"
          >
            <div className="relative inline-block">
              {pendingAttachment.type === "image" && pendingAttachment.url ? (
                <img src={pendingAttachment.url} alt="Selected" className="max-h-24 rounded-xl border border-border/40 shadow-sm" />
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-muted/50 rounded-xl border border-border/30">
                  <Paperclip className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">{pendingAttachment.name || "PDF Document"}</span>
                </div>
              )}
              <button
                onClick={handleRemoveAttachment}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.04) 100%)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              <motion.div
                className="w-2.5 h-2.5 bg-destructive rounded-full"
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-destructive font-heading flex-1">
                {isBangla ? "শুনছি... কথা বলুন" : "Listening... speak now"}
              </span>
              <button onClick={handleVoiceToggle} className="text-xs font-medium text-destructive hover:underline">
                {isBangla ? "থামান" : "Stop"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input — login-inspired glow container */}
      <div className="relative">
        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-[2px] rounded-3xl pointer-events-none z-0"
          animate={{
            boxShadow: isFocused
              ? "0 0 30px hsl(270 55% 55% / 0.25), 0 0 60px hsl(270 55% 55% / 0.1), inset 0 0 0 1px hsl(270 55% 55% / 0.2)"
              : "0 0 15px hsl(270 55% 55% / 0.08), 0 0 30px hsl(270 55% 55% / 0.04)",
          }}
          transition={{ duration: 0.4 }}
          style={{
            background: isFocused
              ? "linear-gradient(135deg, hsl(270 55% 55% / 0.12) 0%, hsl(200 80% 70% / 0.08) 50%, hsl(270 55% 55% / 0.12) 100%)"
              : "transparent",
            borderRadius: "1.5rem",
          }}
        />

        <div 
          className={cn(
            "relative z-10 rounded-3xl overflow-hidden transition-all duration-300",
          )}
          style={{
            background: "linear-gradient(135deg, rgba(91,67,100,0.08) 0%, rgba(11,6,90,0.06) 100%)",
            backdropFilter: "blur(16px)",
            border: isFocused 
              ? "1.5px solid hsl(270 55% 55% / 0.3)" 
              : "1.5px solid hsl(270 20% 80% / 0.25)",
            boxShadow: isFocused
              ? "0 8px 32px hsl(270 55% 55% / 0.12), inset 0 1px 0 rgba(255,255,255,0.08)"
              : "0 4px 16px hsl(240 10% 10% / 0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Top gradient accent */}
          <div 
            className={cn(
              "absolute top-0 left-6 right-6 h-[1.5px] rounded-full transition-opacity duration-300",
              isFocused ? "opacity-100" : "opacity-30"
            )}
            style={{ background: "linear-gradient(90deg, hsl(270 55% 55%), hsl(200 80% 70%), hsl(270 55% 55%))" }}
          />

          <div className="flex items-end gap-2 px-3 py-2.5">
            {/* Left: attachment */}
            <div className="flex items-center gap-0.5 pb-1">
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={disabled}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/8 transition-all"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isBangla ? "তোমার প্রশ্ন লেখো..." : "Ask OddhaboshAI..."}
              disabled={disabled || isTyping}
              className="flex-1 bg-transparent border-none resize-none min-h-[40px] max-h-[140px] text-[14px] placeholder:text-muted-foreground/35 focus:ring-0 focus:outline-none py-2.5 font-heading text-foreground leading-relaxed"
              rows={1}
            />

            {/* Right: mic + send */}
            <div className="flex items-center gap-2 pb-1">
              {/* Mic button — highlighted with glow */}
              <motion.button
                onClick={handleVoiceToggle}
                disabled={isProcessing || disabled}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "relative h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200",
                  isRecording
                    ? "text-white"
                    : "text-muted-foreground/60 hover:text-primary"
                )}
                style={isRecording ? {
                  background: "linear-gradient(135deg, hsl(0 84% 60%) 0%, hsl(340 70% 55%) 100%)",
                  boxShadow: "0 4px 20px hsl(0 84% 60% / 0.4)",
                } : {
                  background: "hsl(270 20% 94%)",
                  boxShadow: "0 2px 8px hsl(270 55% 55% / 0.08)",
                }}
              >
                {isRecording && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{ boxShadow: ["0 0 0 0 hsl(0 84% 60% / 0.4)", "0 0 0 8px hsl(0 84% 60% / 0)", "0 0 0 0 hsl(0 84% 60% / 0)"] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                {isProcessing ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-4.5 h-4.5" />
                ) : (
                  <Mic className="w-4.5 h-4.5" />
                )}
              </motion.button>

              {/* Send button — gradient like login */}
              <motion.button
                whileTap={canSend ? { scale: 0.9 } : {}}
                whileHover={canSend ? { scale: 1.08 } : {}}
                onClick={canSend ? onSend : undefined}
                disabled={!canSend}
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200",
                  !canSend && "opacity-40"
                )}
                style={canSend ? {
                  background: "linear-gradient(135deg, hsl(270 60% 50%) 0%, hsl(200 80% 60%) 100%)",
                  boxShadow: "0 4px 20px hsl(270 55% 55% / 0.35), 0 2px 8px hsl(200 80% 70% / 0.2)",
                  color: "white",
                } : {
                  background: "hsl(240 10% 90%)",
                  color: "hsl(240 10% 60%)",
                }}
              >
                {isTyping ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <SendHorizontal className="w-4.5 h-4.5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedInputBar;
