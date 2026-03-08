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

// Magenta → Purple gradient
const GRADIENT = "linear-gradient(135deg, hsl(300, 65%, 52%) 0%, hsl(270, 60%, 55%) 50%, hsl(30, 78%, 72%) 100%)";
const GRADIENT_SHADOW = "0 4px 20px hsla(300, 65%, 52%, 0.3), 0 2px 8px hsla(270, 60%, 55%, 0.15)";

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
                background: "linear-gradient(135deg, hsla(330, 70%, 55%, 0.1) 0%, hsla(330, 70%, 55%, 0.05) 100%)",
                border: "1px solid hsla(330, 70%, 55%, 0.2)",
              }}
            >
              <motion.div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: "hsl(330, 70%, 55%)" }}
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs font-semibold font-heading flex-1" style={{ color: "hsl(330, 70%, 50%)" }}>
                {isBangla ? "শুনছি... কথা বলুন" : "Listening... speak now"}
              </span>
              <button onClick={handleVoiceToggle} className="text-xs font-medium hover:underline" style={{ color: "hsl(330, 70%, 50%)" }}>
                {isBangla ? "থামান" : "Stop"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container */}
      <div className="relative">
        {/* Outer animated glow — magenta/purple/golden */}
        <motion.div
          className="absolute -inset-[3px] rounded-3xl pointer-events-none z-0"
          animate={{
            boxShadow: isFocused
              ? "0 0 35px hsla(300, 65%, 52%, 0.3), 0 0 70px hsla(270, 60%, 55%, 0.12), 0 0 20px hsla(42, 85%, 55%, 0.1), inset 0 0 0 1px hsla(300, 65%, 52%, 0.2)"
              : "0 0 18px hsla(300, 65%, 52%, 0.08), 0 0 35px hsla(270, 60%, 55%, 0.04)",
          }}
          transition={{ duration: 0.4 }}
          style={{
            background: isFocused
              ? "linear-gradient(135deg, hsla(300, 65%, 52%, 0.12) 0%, hsla(270, 60%, 55%, 0.08) 50%, hsla(42, 85%, 55%, 0.08) 100%)"
              : "transparent",
            borderRadius: "1.5rem",
          }}
        />

        <div
          className="relative z-10 rounded-3xl overflow-hidden transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, hsla(300, 30%, 96%, 0.9) 0%, hsla(270, 20%, 97%, 0.85) 50%, #FEFEFE 100%)",
            backdropFilter: "blur(20px)",
            border: isFocused
              ? "1.5px solid hsla(300, 50%, 60%, 0.35)"
              : "1.5px solid hsla(300, 20%, 85%, 0.3)",
            boxShadow: isFocused
              ? "0 8px 32px hsla(300, 65%, 52%, 0.14), inset 0 1px 0 rgba(255,255,255,0.3)"
              : "0 4px 16px hsla(270, 20%, 50%, 0.06), inset 0 1px 0 rgba(255,255,255,0.15)",
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

          {/* Button row: Subject + Persona + Attach */}
          <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-0">
            {/* Subject button — magenta */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleSubject}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold font-heading transition-all"
              style={showSubjectActive ? {
                background: "linear-gradient(135deg, hsl(300, 65%, 52%), hsl(280, 60%, 58%))",
                boxShadow: "0 4px 16px hsla(300, 65%, 52%, 0.35)",
                color: "white",
              } : {
                background: "linear-gradient(-45deg, rgba(254,254,254,0.9), rgba(254,254,254,0.65))",
                border: "1px solid rgba(255,255,255,0.5)",
                boxShadow: "0 2px 10px hsla(300, 40%, 60%, 0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
                color: "hsl(300, 50%, 40%)",
              }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isBangla ? "বিষয়" : "Subject"}</span>
            </motion.button>

            {/* Persona button — purple */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onTogglePersona}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold font-heading transition-all"
              style={showPersonaActive ? {
                background: "linear-gradient(135deg, hsl(270, 60%, 55%), hsl(285, 55%, 60%))",
                boxShadow: "0 4px 16px hsla(270, 60%, 55%, 0.35)",
                color: "white",
              } : {
                background: "linear-gradient(-45deg, rgba(254,254,254,0.9), rgba(254,254,254,0.65))",
                border: "1px solid rgba(255,255,255,0.5)",
                boxShadow: "0 2px 10px hsla(270, 40%, 60%, 0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
                color: "hsl(270, 50%, 40%)",
              }}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{isBangla ? "শিক্ষক" : "Style"}</span>
            </motion.button>

            {/* Attach button — golden */}
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold font-heading transition-all"
              style={{
                background: "linear-gradient(-45deg, rgba(254,254,254,0.9), rgba(254,254,254,0.65))",
                border: "1px solid rgba(255,255,255,0.5)",
                boxShadow: "0 2px 10px hsla(42, 70%, 55%, 0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
                color: "hsl(42, 75%, 38%)",
              }}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>{isBangla ? "ফাইল" : "File"}</span>
            </motion.button>
          </div>

          {/* Textarea + Mic + Send row */}
          <div className="flex items-end gap-2 px-3 pt-1.5 pb-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isBangla ? "তোমার প্রশ্ন লেখো..." : "Ask OddhaboshAI..."}
              disabled={disabled || isTyping}
              className="flex-1 bg-transparent border-none resize-none min-h-[48px] max-h-[140px] text-[14px] placeholder:text-muted-foreground/35 focus:ring-0 focus:outline-none py-3 font-heading text-foreground leading-relaxed"
              rows={1}
            />

            {/* Mic button — pink gradient */}
            <motion.button
              onClick={handleVoiceToggle}
              disabled={isProcessing || disabled}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
              style={isRecording ? {
                background: "linear-gradient(135deg, hsl(340, 75%, 55%) 0%, hsl(330, 70%, 50%) 100%)",
                boxShadow: "0 4px 20px hsla(340, 75%, 55%, 0.45)",
                color: "white",
              } : {
                background: "linear-gradient(135deg, hsl(330, 70%, 55%) 0%, hsl(300, 65%, 52%) 100%)",
                boxShadow: "0 4px 20px hsla(330, 70%, 55%, 0.35)",
                color: "white",
              }}
            >
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  animate={{ boxShadow: ["0 0 0 0 hsla(340, 75%, 55%, 0.4)", "0 0 0 8px hsla(340, 75%, 55%, 0)", "0 0 0 0 hsla(340, 75%, 55%, 0)"] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </motion.button>

            {/* Send button — magenta→purple→golden gradient */}
            <motion.button
              whileTap={canSend ? { scale: 0.9 } : {}}
              whileHover={canSend ? { scale: 1.08 } : {}}
              onClick={canSend ? onSend : undefined}
              disabled={!canSend}
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0",
                !canSend && "opacity-40"
              )}
              style={canSend ? {
                background: GRADIENT,
                boxShadow: GRADIENT_SHADOW,
                color: "white",
              } : {
                background: "hsl(300 10% 90%)",
                color: "hsl(300 10% 60%)",
              }}
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <SendHorizontal className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedInputBar;
