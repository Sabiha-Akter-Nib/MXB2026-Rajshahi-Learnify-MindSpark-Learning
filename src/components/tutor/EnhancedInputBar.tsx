import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Paperclip, X, Loader2, Settings2,
  BookOpen, Brain, RefreshCw, Upload, Plus, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  labelBn: string;
  prompt: string;
  promptBn: string;
  gradient: string;
  isMultimodal?: boolean;
}

const quickActions: QuickAction[] = [
  { icon: BookOpen, label: "Explain", labelBn: "ব্যাখ্যা করো", prompt: "Please explain in detail ", promptBn: "দয়া করে বিস্তারিতভাবে ব্যাখ্যা করো ", gradient: "from-primary to-primary-light" },
  { icon: Brain, label: "Practice", labelBn: "অনুশীলন", prompt: "Give me MCQ, CQ and short questions for practice on ", promptBn: "অনুশীলনের জন্য MCQ, CQ এবং সংক্ষিপ্ত প্রশ্ন দাও ", gradient: "from-success to-[hsl(var(--success)/0.7)]" },
  { icon: RefreshCw, label: "Revision", labelBn: "রিভিশন", prompt: "Help me revise and summarize ", promptBn: "রিভিশন এবং সারসংক্ষেপ করতে সাহায্য করো ", gradient: "from-accent to-accent-light" },
  { icon: Upload, label: "Multimodal", labelBn: "মাল্টিমিডিয়া", prompt: "", promptBn: "", gradient: "from-warning to-[hsl(var(--warning)/0.7)]", isMultimodal: true },
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-3"
          >
            <div className="relative inline-block">
              {pendingAttachment.type === "image" && pendingAttachment.url ? (
                <img src={pendingAttachment.url} alt="Selected" className="max-h-28 rounded-2xl border-2 border-primary/20 shadow-md" />
              ) : (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-secondary/60 rounded-2xl border border-primary/15">
                  <Paperclip className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{pendingAttachment.name || "PDF Document"}</span>
                </div>
              )}
              <button
                onClick={handleRemoveAttachment}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick actions row */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-3 flex gap-2.5 flex-wrap"
          >
            {quickActions.map((action, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-card border border-border/40 shadow-md hover:shadow-lg hover:border-primary/25 transition-all duration-250 text-sm font-semibold text-foreground font-heading"
              >
                <div className={cn("w-7 h-7 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm", action.gradient)}>
                  <action.icon className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                {isBangla ? action.labelBn : action.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container — Peach-accented glass card */}
      <motion.div 
        className={cn(
          "relative rounded-[1.25rem] border transition-all duration-300 overflow-hidden",
          isFocused || input.trim()
            ? "border-primary/30 shadow-xl shadow-primary/[0.08]"
            : "border-border/40 shadow-lg shadow-foreground/[0.04]"
        )}
        animate={{
          borderColor: isFocused 
            ? "hsl(270 60% 40% / 0.3)" 
            : "hsl(240 10% 88% / 0.4)",
        }}
      >
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-secondary/30 pointer-events-none" />
        
        {/* Peach accent stripe at top */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[hsl(25,95%,70%)] to-accent"
          animate={{ opacity: isFocused || input.trim() ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative flex items-end gap-2 px-3 py-2.5">
          {/* Left action buttons */}
          <div className="flex items-center gap-0.5 pb-1">
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all duration-200"
            >
              <Paperclip className="w-[18px] h-[18px]" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200",
                showQuickActions 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/8"
              )}
            >
              <Plus className={cn("w-[18px] h-[18px] transition-transform duration-300", showQuickActions && "rotate-45")} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onTogglePersona}
              className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200",
                showPersonaSelector 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/8"
              )}
            >
              <Settings2 className="w-[18px] h-[18px]" />
            </motion.button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isBangla ? "মেসেজ লিখো..." : "Message OddhaboshAI..."}
            disabled={disabled || isTyping}
            className="flex-1 bg-transparent border-none resize-none min-h-[28px] max-h-[120px] text-sm placeholder:text-muted-foreground/40 focus:ring-0 focus:outline-none py-1.5 font-heading text-foreground"
            rows={1}
          />

          {/* Right: AI badge + send/mic */}
          <div className="flex items-center gap-2 pb-1">
            {/* AI sparkle badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-primary/8 to-[hsl(25,95%,70%)/0.08] border border-primary/10">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold font-heading text-primary tracking-wide">AI</span>
            </div>

            {/* Send / Mic button */}
            {canSend ? (
              <motion.button
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.08 }}
                onClick={onSend}
                className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary to-[hsl(25,95%,70%)] flex items-center justify-center shadow-lg shadow-primary/35 hover:shadow-xl hover:shadow-primary/45 transition-all duration-300"
              >
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: [
                      "0 0 12px hsl(270 60% 40% / 0.3)",
                      "0 0 20px hsl(270 60% 40% / 0.5)",
                      "0 0 12px hsl(270 60% 40% / 0.3)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {isTyping ? (
                  <Loader2 className="w-4.5 h-4.5 text-primary-foreground animate-spin" />
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                )}
              </motion.button>
            ) : (
              <motion.button
                animate={isRecording ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.7, repeat: isRecording ? Infinity : 0 }}
                onClick={handleVoiceToggle}
                disabled={isProcessing || disabled}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isRecording
                    ? "bg-destructive/15 text-destructive shadow-lg shadow-destructive/25 border border-destructive/20"
                    : "bg-gradient-to-br from-primary to-[hsl(25,95%,70%)] text-primary-foreground shadow-lg shadow-primary/30"
                )}
              >
                {isProcessing ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-4.5 h-4.5" />
                ) : (
                  <Mic className="w-4.5 h-4.5" />
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 bg-card border border-destructive/20 rounded-full shadow-lg backdrop-blur-md"
          >
            <motion.div
              className="w-2.5 h-2.5 bg-destructive rounded-full"
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm font-semibold text-destructive font-heading">
              {isBangla ? "রেকর্ডিং..." : "Recording..."}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedInputBar;
