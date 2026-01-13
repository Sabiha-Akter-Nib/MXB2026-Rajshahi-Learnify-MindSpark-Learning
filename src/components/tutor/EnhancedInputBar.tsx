import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowUp,
  Mic, 
  MicOff, 
  Image, 
  Paperclip, 
  Sparkles, 
  X,
  Loader2,
  Settings2,
  BookOpen,
  Brain,
  RefreshCw,
  Upload,
  Plus
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
  promptBn: string;
  color: string;
  isMultimodal?: boolean;
}

const quickActions: QuickAction[] = [
  { 
    icon: BookOpen, 
    label: "Explain", 
    labelBn: "ব্যাখ্যা করো", 
    prompt: "Please explain in detail ", 
    promptBn: "দয়া করে বিস্তারিতভাবে ব্যাখ্যা করো ",
    color: "from-blue-500 to-blue-600"
  },
  { 
    icon: Brain, 
    label: "Practice", 
    labelBn: "অনুশীলন", 
    prompt: "Give me MCQ, CQ and short questions for practice on ", 
    promptBn: "অনুশীলনের জন্য MCQ, CQ এবং সংক্ষিপ্ত প্রশ্ন দাও ",
    color: "from-green-500 to-green-600"
  },
  { 
    icon: RefreshCw, 
    label: "Revision", 
    labelBn: "রিভিশন", 
    prompt: "Help me revise and summarize ", 
    promptBn: "রিভিশন এবং সারসংক্ষেপ করতে সাহায্য করো ",
    color: "from-purple-500 to-purple-600"
  },
  { 
    icon: Upload, 
    label: "Multimodal", 
    labelBn: "মাল্টিমিডিয়া", 
    prompt: "", 
    promptBn: "",
    color: "from-orange-500 to-orange-600",
    isMultimodal: true
  },
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
    if (action.isMultimodal) {
      onOpenUpload();
    } else {
      setInput(isBangla ? action.promptBn : action.prompt);
      textareaRef.current?.focus();
    }
    setShowQuickActions(false);
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
            <div className="relative inline-block group">
              <img
                src={selectedImage}
                alt="Selected"
                className="max-h-32 rounded-xl border border-border/50 shadow-lg transition-transform group-hover:scale-105"
              />
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={removeSelectedImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container */}
      <motion.div
        animate={{
          boxShadow: isFocused
            ? "0 8px 32px -8px hsl(var(--primary) / 0.25), 0 0 0 2px hsl(var(--primary) / 0.1)"
            : "0 4px 16px -4px hsl(var(--foreground) / 0.1)",
        }}
        className={cn(
          "bg-card/90 backdrop-blur-xl rounded-3xl border transition-all duration-300",
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
              "font-['Poppins',sans-serif]"
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
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 rounded-xl transition-all duration-300",
                      showQuickActions && "bg-primary/15 text-primary rotate-45"
                    )}
                  >
                    <Plus className="w-5 h-5 transition-transform" />
                  </Button>
                </motion.div>
              </PopoverTrigger>
              <PopoverContent 
                className="w-72 p-3 bg-card/95 backdrop-blur-xl border-border/50 rounded-2xl shadow-2xl" 
                align="start"
                side="top"
              >
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground px-2 pb-1">
                    {isBangla ? "দ্রুত কাজ" : "Quick Actions"}
                  </p>
                  {quickActions.map((action, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ x: 4, backgroundColor: "hsl(var(--primary) / 0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuickAction(action)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md",
                        action.color
                      )}>
                        <action.icon className="w-4 h-4 text-white" />
                      </div>
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
            <motion.div whileHover={{ scale: 1.1, y: -1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => imageInputRef.current?.click()}
                disabled={disabled}
              >
                <Image className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* File upload */}
            <motion.div whileHover={{ scale: 1.1, y: -1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={onOpenUpload}
                disabled={disabled}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Persona toggle */}
            <motion.div whileHover={{ scale: 1.1, y: -1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-xl transition-all duration-300",
                  showPersonaSelector && "bg-primary/15 text-primary shadow-lg shadow-primary/20"
                )}
                onClick={onTogglePersona}
              >
                <Settings2 className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Voice input */}
            <motion.div
              animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: isRecording ? Infinity : 0 }}
            >
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-xl transition-all duration-300",
                    isRecording && "bg-destructive/15 text-destructive shadow-lg shadow-destructive/30"
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
            </motion.div>

            {/* Send button - Round with pink-red-orange gradient */}
            <motion.button
              whileHover={canSend ? { scale: 1.1, boxShadow: "0 8px 30px -4px rgba(255, 100, 50, 0.5)" } : {}}
              whileTap={canSend ? { scale: 0.95 } : {}}
              onClick={onSend}
              disabled={!canSend}
              className={cn(
                "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                canSend
                  ? "bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 shadow-xl"
                  : "bg-muted text-muted-foreground"
              )}
              style={canSend ? {
                boxShadow: "0 4px 20px -4px rgba(255, 100, 50, 0.4)"
              } : {}}
            >
              {/* Animated glow ring */}
              {canSend && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(255, 100, 50, 0.4)",
                      "0 0 0 8px rgba(255, 100, 50, 0)",
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              
              {isTyping ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5 text-white" />
              )}
            </motion.button>
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
            className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-destructive/15 border border-destructive/30 rounded-full backdrop-blur-md shadow-lg"
          >
            <motion.div
              className="w-2.5 h-2.5 bg-destructive rounded-full"
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
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
