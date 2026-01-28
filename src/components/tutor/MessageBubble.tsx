import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, User, Copy, ThumbsUp, ThumbsDown, Clock, Brain, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import StreamingMessage from "./StreamingMessage";

interface MessageBubbleProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  thinkingTime?: number;
  attachments?: Array<{
    type: "image" | "pdf";
    url: string;
    name?: string;
  }>;
  index?: number;
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const MessageBubble = ({
  id,
  role,
  content,
  timestamp,
  isStreaming = false,
  thinkingTime,
  attachments,
  index = 0,
}: MessageBubbleProps) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      className={cn("flex gap-4 mb-8", isUser ? "justify-end" : "justify-start")}
    >
      {/* Assistant Avatar - static, no continuous animations */}
      {!isUser && (
        <div className="relative w-11 h-11 flex-shrink-0 mt-1">
          <div 
            className="w-full h-full bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-xl"
            style={{
              boxShadow: "0 8px 24px -8px hsl(var(--primary) / 0.5)"
            }}
          >
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {/* Online indicator - static */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          {/* Corner decoration */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
        </div>
      )}

      {/* Message Container */}
      <div className={cn("max-w-[85%] space-y-3", isUser && "order-first")}>
        {/* Attachments Preview */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((attachment, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className="relative rounded-xl overflow-hidden border border-border/50 shadow-lg cursor-pointer"
              >
                {attachment.type === "image" ? (
                  <img
                    src={attachment.url}
                    alt="Attachment"
                    className="max-w-[200px] max-h-[150px] object-cover"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 backdrop-blur-sm">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium truncate max-w-[150px]">{attachment.name || "Document"}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Bubble */}
        <motion.div
          className={cn(
            "rounded-3xl px-6 py-5 relative overflow-hidden",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-lg"
              : "rounded-bl-lg"
          )}
          style={
            !isUser
              ? {
                  background: "linear-gradient(135deg, rgba(80, 50, 120, 0.95) 0%, rgba(60, 40, 100, 0.9) 50%, rgba(40, 30, 80, 0.85) 100%)",
                  backdropFilter: "blur(24px)",
                  boxShadow: "0 8px 32px -8px rgba(100, 60, 150, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
                }
              : {
                  boxShadow: "0 8px 24px -8px hsl(var(--primary) / 0.4)"
                }
          }
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          {/* Glass morphism decorations for assistant */}
          {!isUser && (
            <>
              {/* Top-left glow */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-2xl" />
              {/* Bottom-right glow */}
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-blue-400/15 to-transparent rounded-full blur-xl" />
              {/* Corner decorations */}
              <div className="absolute top-3 right-3 w-2 h-2 border-r border-t border-white/20 rounded-tr" />
              <div className="absolute bottom-3 left-3 w-2 h-2 border-l border-b border-white/20 rounded-bl" />
              {/* Subtle border glow */}
              <div className="absolute inset-0 rounded-3xl rounded-bl-lg border border-white/10 pointer-events-none" />
            </>
          )}

          {/* Thinking time indicator */}
          {!isUser && thinkingTime && thinkingTime > 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs text-white/70 mb-4 pb-3 border-b border-white/10"
            >
              <Brain className="w-4 h-4" />
              <span className="font-medium">Thought for {thinkingTime}s</span>
            </motion.div>
          )}

          {/* Message Content */}
          <div className="relative z-10">
            {isUser ? (
              <div className="text-primary-foreground font-['Poppins',sans-serif]">
                {content.split("\n").map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <StreamingMessage
                content={content}
                isComplete={!isStreaming}
                className="text-white font-['Poppins',sans-serif]"
              />
            )}
          </div>

          {/* Footer with actions for assistant */}
          {!isUser && content && !isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10 relative z-10"
            >
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-white/70 hover:text-white transition-all"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </motion.button>
              <div className="flex-1" />
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  liked === true
                    ? "text-green-400 bg-green-400/20"
                    : "text-white/50 hover:text-green-400 hover:bg-green-400/10"
                )}
                onClick={() => setLiked(liked === true ? null : true)}
              >
                <ThumbsUp className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  liked === false
                    ? "text-red-400 bg-red-400/20"
                    : "text-white/50 hover:text-red-400 hover:bg-red-400/10"
                )}
                onClick={() => setLiked(liked === false ? null : false)}
              >
                <ThumbsDown className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* Timestamp */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "flex items-center gap-1.5 text-[11px] text-muted-foreground px-2",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          <Clock className="w-3 h-3" />
          <span>{formatTime(timestamp)}</span>
        </motion.div>
      </div>

      {/* User Avatar - static */}
      {isUser && (
        <div className="w-11 h-11 flex-shrink-0 mt-1">
          <div 
            className="w-full h-full bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center shadow-xl"
            style={{
              boxShadow: "0 8px 24px -8px hsl(var(--accent) / 0.4)"
            }}
          >
            <User className="w-5 h-5 text-accent-foreground" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MessageBubble;
