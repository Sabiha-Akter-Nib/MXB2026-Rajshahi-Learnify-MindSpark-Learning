import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Paperclip, X, Loader2, Settings2,
  BookOpen, Brain, RefreshCw, Upload, Plus, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { icon: BookOpen, label: "Explain", labelBn: "ব্যাখ্যা করো", prompt: "Please explain in detail ", promptBn: "দয়া করে বিস্তারিতভাবে ব্যাখ্যা করো ", color: "from-blue-500 to-blue-600" },
  { icon: Brain, label: "Practice", labelBn: "অনুশীলন", prompt: "Give me MCQ, CQ and short questions for practice on ", promptBn: "অনুশীলনের জন্য MCQ, CQ এবং সংক্ষিপ্ত প্রশ্ন দাও ", color: "from-green-500 to-green-600" },
  { icon: RefreshCw, label: "Revision", labelBn: "রিভিশন", prompt: "Help me revise and summarize ", promptBn: "রিভিশন এবং সারসংক্ষেপ করতে সাহায্য করো ", color: "from-purple-500 to-purple-600" },
  { icon: Upload, label: "Multimodal", labelBn: "মাল্টিমিডিয়া", prompt: "", promptBn: "", color: "from-orange-500 to-orange-600", isMultimodal: true },
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
                <img src={pendingAttachment.url} alt="Selected" className="max-h-28 rounded-xl border border-border/40 shadow-sm" />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-xl border border-border/40">
                  <Paperclip className="w-4 h-4 text-[#6A68DF]" />
                  <span className="text-sm font-medium">{pendingAttachment.name || "PDF Document"}</span>
                </div>
              )}
              <button
                onClick={handleRemoveAttachment}
                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick actions row */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-3 flex gap-2 flex-wrap"
          >
            {quickActions.map((action, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-[#6A68DF]/30 transition-all text-sm font-medium text-foreground"
              >
                <div className={cn("w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center", action.color)}>
                  <action.icon className="w-3.5 h-3.5 text-white" />
                </div>
                {isBangla ? action.labelBn : action.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container — clean, minimal like reference */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-sm flex items-end gap-2 px-3 py-2.5">
        {/* Left: attachment + quick actions */}
        <div className="flex items-center gap-0.5 pb-0.5">
          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-[#6A68DF] hover:bg-[#6A68DF]/10"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost" size="icon"
            className={cn("h-8 w-8 rounded-lg text-muted-foreground hover:text-[#6A68DF] hover:bg-[#6A68DF]/10", showQuickActions && "text-[#6A68DF] bg-[#6A68DF]/10")}
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            <Plus className={cn("w-4 h-4 transition-transform", showQuickActions && "rotate-45")} />
          </Button>

          <Button
            variant="ghost" size="icon"
            className={cn("h-8 w-8 rounded-lg text-muted-foreground hover:text-[#6A68DF] hover:bg-[#6A68DF]/10", showPersonaSelector && "text-[#6A68DF] bg-[#6A68DF]/10")}
            onClick={onTogglePersona}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={isBangla ? "মেসেজ লিখো..." : "Message"}
          disabled={disabled || isTyping}
          className="flex-1 bg-transparent border-none resize-none min-h-[24px] max-h-[120px] text-sm placeholder:text-muted-foreground/50 focus:ring-0 focus:outline-none py-1 font-['Poppins',sans-serif]"
          rows={1}
        />

        {/* Right: sparkle badge + mic/send */}
        <div className="flex items-center gap-1.5 pb-0.5">
          {/* Credit sparkle badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#6A68DF]/8 text-[#6A68DF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">AI</span>
          </div>

          {/* Mic / Send button */}
          {canSend ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSend}
              className="w-9 h-9 rounded-full bg-[#6A68DF] flex items-center justify-center shadow-md shadow-[#6A68DF]/30 hover:shadow-lg transition-shadow"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              )}
            </motion.button>
          ) : (
            <motion.button
              animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.6, repeat: isRecording ? Infinity : 0 }}
              onClick={handleVoiceToggle}
              disabled={isProcessing || disabled}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                isRecording
                  ? "bg-destructive/15 text-destructive shadow-md shadow-destructive/20"
                  : "bg-[#6A68DF] text-white shadow-md shadow-[#6A68DF]/30"
              )}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-full backdrop-blur-sm"
          >
            <motion.div
              className="w-2 h-2 bg-destructive rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-destructive">
              {isBangla ? "রেকর্ডিং..." : "Recording..."}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedInputBar;
