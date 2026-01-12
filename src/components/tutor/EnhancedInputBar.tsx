import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Mic, 
  MicOff, 
  Image, 
  Paperclip, 
  Sparkles, 
  X,
  Loader2,
  Camera,
  FileText,
  ChevronUp,
  Settings2,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  labelBn: string;
  prompt: string;
}

const quickActions: QuickAction[] = [
  { icon: Sparkles, label: "Explain this topic", labelBn: "এটি ব্যাখ্যা করো", prompt: "Explain " },
  { icon: BookOpen, label: "Practice questions", labelBn: "অনুশীলন প্রশ্ন", prompt: "Give me practice questions on " },
  { icon: FileText, label: "Summarize chapter", labelBn: "সারাংশ দাও", prompt: "Summarize " },
];

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
}

const EnhancedInputBar = ({
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
  onOpenUpload,
  onImageSelected,
  showPersonaSelector,
  isBangla,
  disabled = false,
}: EnhancedInputBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelected?.(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      const text = await onStopRecording();
      if (text) {
        setInput(input + (input ? " " : "") + text);
      }
    } else {
      onStartRecording();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInput(action.prompt);
    setShowQuickActions(false);
    textareaRef.current?.focus();
  };

  const canSend = (input.trim() || selectedImage) && !isTyping && !disabled;

  return (
    <div className="relative">
      {/* Selected image preview */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="relative inline-block">
              <img
                src={selectedImage}
                alt="Selected"
                className="max-h-32 rounded-xl border border-border/50 shadow-lg"
              />
              <button
                onClick={removeSelectedImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container */}
      <motion.div
        animate={{
          boxShadow: isFocused
            ? "0 8px 32px -8px hsl(var(--primary) / 0.2)"
            : "0 4px 16px -4px hsl(var(--foreground) / 0.1)",
        }}
        className={cn(
          "bg-card/80 backdrop-blur-xl rounded-3xl border transition-all duration-300",
          isFocused ? "border-primary/50" : "border-border/50",
          "shadow-lg"
        )}
      >
        {/* Textarea */}
        <div className="px-4 pt-4 pb-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isBangla ? "তোমার প্রশ্ন লিখো..." : "Type your question..."}
            disabled={disabled || isTyping}
            className={cn(
              "w-full bg-transparent border-none resize-none min-h-[24px] max-h-[150px]",
              "text-base placeholder:text-muted-foreground/60",
              "focus:ring-0 focus:outline-none p-0",
              "font-sans"
            )}
            rows={1}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* Left actions */}
          <div className="flex items-center gap-1">
            {/* Quick actions */}
            <Popover open={showQuickActions} onOpenChange={setShowQuickActions}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-xl transition-colors",
                    showQuickActions && "bg-primary/10 text-primary"
                  )}
                >
                  <ChevronUp className={cn("w-4 h-4 transition-transform", showQuickActions && "rotate-180")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-64 p-2 bg-card/95 backdrop-blur-xl border-border/50 rounded-2xl shadow-xl" 
                align="start"
                side="top"
              >
                <div className="space-y-1">
                  {quickActions.map((action, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ x: 2 }}
                      onClick={() => handleQuickAction(action)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-muted/50 transition-colors"
                    >
                      <action.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        {isBangla ? action.labelBn : action.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Image upload */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled}
            >
              <Image className="w-4 h-4" />
            </Button>

            {/* File upload */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={onOpenUpload}
              disabled={disabled}
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            {/* Persona toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-xl transition-colors",
                showPersonaSelector && "bg-primary/10 text-primary"
              )}
              onClick={onTogglePersona}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Voice input */}
            <motion.div
              animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: isRecording ? Infinity : 0 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-xl transition-all",
                  isRecording && "bg-destructive/10 text-destructive"
                )}
                onClick={handleVoiceToggle}
                disabled={isProcessing || disabled}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            </motion.div>

            {/* Send button */}
            <motion.div
              whileHover={canSend ? { scale: 1.05 } : {}}
              whileTap={canSend ? { scale: 0.95 } : {}}
            >
              <Button
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-xl transition-all",
                  canSend
                    ? "bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/30"
                    : "bg-muted text-muted-foreground"
                )}
                onClick={onSend}
                disabled={!canSend}
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/30 rounded-full"
          >
            <motion.div
              className="w-2 h-2 bg-destructive rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-destructive">
              {isBangla ? "রেকর্ডিং হচ্ছে..." : "Recording..."}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedInputBar;
