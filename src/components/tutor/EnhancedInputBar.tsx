import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Paperclip, X, Loader2,
  SendHorizontal, BookOpen, Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  onToggleSubject?: () => void;
  onTogglePersona?: () => void;
  showSubjectActive?: boolean;
  showPersonaActive?: boolean;
}

const GRADIENT = "linear-gradient(135deg, hsl(270 60% 50%) 0%, hsl(200 80% 60%) 100%)";
const GRADIENT_SHADOW = "0 4px 20px hsl(270 55% 55% / 0.35), 0 2px 8px hsl(200 80% 70% / 0.2)";

const EnhancedInputBar = ({
  input, setInput, onSend, onKeyDown, isTyping, isRecording, isProcessing,
  onStartRecording, onStopRecording, onOpenUpload,
  onImageSelected, isBangla, disabled = false,
  pendingAttachment, onRemoveAttachment,
  onToggleSubject, onTogglePersona,
  showSubjectActive, showPersonaActive,
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

      {/* Main input container */}
      <div className="relative">
        {/* Outer animated glow */}
        <motion.div
          className="absolute -inset-[3px] rounded-3xl pointer-events-none z-0"
          animate={{
            boxShadow: isFocused
              ? "0 0 35px hsl(270 55% 55% / 0.3), 0 0 70px hsl(200 80% 60% / 0.12), inset 0 0 0 1px hsl(270 55% 55% / 0.25)"
              : "0 0 18px hsl(270 55% 55% / 0.1), 0 0 35px hsl(200 80% 60% / 0.05)",
          }}
          transition={{ duration: 0.4 }}
          style={{
            background: isFocused
              ? "linear-gradient(135deg, hsl(270 55% 55% / 0.15) 0%, hsl(200 80% 60% / 0.1) 50%, hsl(270 55% 55% / 0.15) 100%)"
              : "transparent",
            borderRadius: "1.5rem",
          }}
        />

        <div
          className="relative z-10 rounded-3xl overflow-hidden transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, rgba(91,67,100,0.07) 0%, rgba(11,6,90,0.05) 100%)",
            backdropFilter: "blur(16px)",
            border: isFocused
              ? "1.5px solid hsl(270 55% 55% / 0.35)"
              : "1.5px solid hsl(270 20% 80% / 0.25)",
            boxShadow: isFocused
              ? "0 8px 32px hsl(270 55% 55% / 0.14), inset 0 1px 0 rgba(255,255,255,0.1)"
              : "0 4px 16px hsl(240 10% 10% / 0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Top gradient accent line */}
          <div
            className={cn(
              "absolute top-0 left-4 right-4 h-[2px] rounded-full transition-opacity duration-300",
              isFocused ? "opacity-100" : "opacity-25"
            )}
            style={{ background: GRADIENT }}
          />

          {/* Button row: Subject + Persona + Attach — inside bar */}
          <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-0">
            {/* Subject button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleSubject}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold font-heading transition-all",
                showSubjectActive
                  ? "text-white shadow-md"
                  : "text-muted-foreground/70 hover:text-foreground bg-muted/40 hover:bg-muted/60"
              )}
              style={showSubjectActive ? {
                background: GRADIENT,
                boxShadow: GRADIENT_SHADOW,
              } : undefined}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isBangla ? "বিষয়" : "Subject"}</span>
            </motion.button>

            {/* Persona button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onTogglePersona}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold font-heading transition-all",
                showPersonaActive
                  ? "text-white shadow-md"
                  : "text-muted-foreground/70 hover:text-foreground bg-muted/40 hover:bg-muted/60"
              )}
              style={showPersonaActive ? {
                background: GRADIENT,
                boxShadow: GRADIENT_SHADOW,
              } : undefined}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{isBangla ? "শিক্ষক" : "Style"}</span>
            </motion.button>

            {/* Attach button */}
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold font-heading text-muted-foreground/70 hover:text-foreground bg-muted/40 hover:bg-muted/60 transition-all"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>{isBangla ? "ফাইল" : "File"}</span>
            </motion.button>
          </div>

          {/* Textarea + Mic + Send row */}
          <div className="flex items-end gap-2 px-3 pt-1.5 pb-2.5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isBangla ? "তোমার প্রশ্ন লেখো..." : "Ask OddhaboshAI..."}
              disabled={disabled || isTyping}
              className="flex-1 bg-transparent border-none resize-none min-h-[44px] max-h-[140px] text-[14px] placeholder:text-muted-foreground/35 focus:ring-0 focus:outline-none py-2.5 font-heading text-foreground leading-relaxed"
              rows={1}
            />

            {/* Mic button — gradient style */}
            <motion.button
              onClick={handleVoiceToggle}
              disabled={isProcessing || disabled}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
              style={isRecording ? {
                background: "linear-gradient(135deg, hsl(0 84% 60%) 0%, hsl(340 70% 55%) 100%)",
                boxShadow: "0 4px 20px hsl(0 84% 60% / 0.4)",
                color: "white",
              } : {
                background: GRADIENT,
                boxShadow: GRADIENT_SHADOW,
                color: "white",
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

            {/* Send button — gradient */}
            <motion.button
              whileTap={canSend ? { scale: 0.9 } : {}}
              whileHover={canSend ? { scale: 1.08 } : {}}
              onClick={canSend ? onSend : undefined}
              disabled={!canSend}
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0",
                !canSend && "opacity-40"
              )}
              style={canSend ? {
                background: GRADIENT,
                boxShadow: GRADIENT_SHADOW,
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
  );
};

export default EnhancedInputBar;
