import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Paperclip, X, Loader2, Settings2,
  BookOpen, Brain, RefreshCw, Upload, Plus, SendHorizontal
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
  { icon: Upload, label: "Upload", labelBn: "আপলোড", prompt: "", promptBn: "", color: "text-[hsl(25,95%,55%)]", isMultimodal: true },
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
  onTogglePersona: () => void;
  onOpenUpload: () => void;
  onImageSelected?: (file: File) => void;
  showPersonaSelector: boolean;
  isBangla: boolean;
  disabled?: boolean;
  pendingAttachment?: PendingAttachment | null;
  onRemoveAttachment?: () => void;
}

const EnhancedInputBar = ({
  input, setInput, onSend, onKeyDown, isTyping, isRecording, isProcessing,
  onStartRecording, onStopRecording, onTogglePersona, onOpenUpload,
  onImageSelected, showPersonaSelector, isBangla, disabled = false,
  pendingAttachment, onRemoveAttachment,
}: EnhancedInputBarProps) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
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

  const handleQuickAction = (action: QuickAction) => {
    if (action.isMultimodal) {
      onOpenUpload();
    } else {
      setInput(isBangla ? action.promptBn : action.prompt);
      textareaRef.current?.focus();
    }
    setShowQuickActions(false);
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

      {/* Quick actions */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-2.5 flex gap-2 flex-wrap"
          >
            {quickActions.map((action, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-primary/20 transition-all text-xs font-semibold text-foreground font-heading"
              >
                <action.icon className={cn("w-3.5 h-3.5", action.color)} />
                {isBangla ? action.labelBn : action.label}
              </motion.button>
            ))}
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
            <div className="flex items-center gap-3 px-4 py-2.5 bg-destructive/5 border border-destructive/15 rounded-xl">
              <motion.div
                className="w-2 h-2 bg-destructive rounded-full"
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-destructive font-heading flex-1">
                {isBangla ? "শুনছি... কথা বলুন" : "Listening... speak now"}
              </span>
              <button
                onClick={handleVoiceToggle}
                className="text-xs font-medium text-destructive hover:underline"
              >
                {isBangla ? "থামান" : "Stop"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container */}
      <div 
        className={cn(
          "relative rounded-2xl border bg-card transition-all duration-200 overflow-hidden",
          isFocused
            ? "border-primary/25 shadow-lg shadow-primary/[0.06] ring-1 ring-primary/10"
            : "border-border/50 shadow-md"
        )}
      >
        {/* Top accent line */}
        <div 
          className={cn(
            "absolute top-0 left-4 right-4 h-[1.5px] rounded-full transition-opacity duration-300",
            isFocused ? "opacity-100" : "opacity-0"
          )}
          style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(25 95% 70%), hsl(var(--primary)))" }}
        />

        <div className="flex items-end gap-1.5 px-2.5 py-2">
          {/* Left actions */}
          <div className="flex items-center gap-0.5 pb-0.5">
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:bg-primary/6 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                showQuickActions 
                  ? "text-primary bg-primary/8" 
                  : "text-muted-foreground/60 hover:text-primary hover:bg-primary/6"
              )}
            >
              <Plus className={cn("w-4 h-4 transition-transform duration-200", showQuickActions && "rotate-45")} />
            </button>

            <button
              onClick={onTogglePersona}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                showPersonaSelector 
                  ? "text-primary bg-primary/8" 
                  : "text-muted-foreground/60 hover:text-primary hover:bg-primary/6"
              )}
            >
              <Settings2 className="w-4 h-4" />
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
            className="flex-1 bg-transparent border-none resize-none min-h-[32px] max-h-[120px] text-[13px] placeholder:text-muted-foreground/35 focus:ring-0 focus:outline-none py-1.5 font-heading text-foreground leading-relaxed"
            rows={1}
          />

          {/* Right: mic + send */}
          <div className="flex items-center gap-1.5 pb-0.5">
            {/* Mic button */}
            <button
              onClick={handleVoiceToggle}
              disabled={isProcessing || disabled || (canSend as unknown as boolean)}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200",
                isRecording
                  ? "text-destructive bg-destructive/10"
                  : canSend
                    ? "text-muted-foreground/20 cursor-default"
                    : "text-muted-foreground/50 hover:text-primary hover:bg-primary/6"
              )}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Send button */}
            <motion.button
              whileTap={canSend ? { scale: 0.9 } : {}}
              onClick={canSend ? onSend : undefined}
              disabled={!canSend}
              className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200",
                canSend
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:brightness-110"
                  : "bg-muted/40 text-muted-foreground/30"
              )}
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SendHorizontal className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedInputBar;
