import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, User, Copy, ThumbsUp, ThumbsDown, Clock, Brain, Check, Image as ImageIcon, FileText } from "lucide-react";
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
      className={cn("flex gap-3 mb-6", isUser ? "justify-end" : "justify-start")}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <motion.div
          className="relative w-10 h-10 flex-shrink-0 mt-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        >
          <div className="w-full h-full bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {/* Corner decoration */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background" />
        </motion.div>
      )}

      {/* Message Container */}
      <div className={cn("max-w-[85%] space-y-2", isUser && "order-first")}>
        {/* Attachments Preview */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((attachment, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-xl overflow-hidden border border-border/50 shadow-sm"
              >
                {attachment.type === "image" ? (
                  <img
                    src={attachment.url}
                    alt="Attachment"
                    className="max-w-[200px] max-h-[150px] object-cover"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm truncate max-w-[150px]">{attachment.name || "Document"}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Bubble */}
        <motion.div
          className={cn(
            "rounded-3xl px-5 py-4 relative overflow-hidden",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-lg shadow-lg shadow-primary/20"
              : "bg-card/60 backdrop-blur-xl border border-white/20 rounded-bl-lg shadow-xl"
          )}
          style={
            !isUser
              ? {
                  background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                  backdropFilter: "blur(20px)",
                }
              : undefined
          }
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.2 }}
        >
          {/* Glass morphism decorations for assistant */}
          {!isUser && (
            <>
              <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-accent/10 to-transparent rounded-full blur-xl" />
            </>
          )}

          {/* Thinking time indicator */}
          {!isUser && thinkingTime && thinkingTime > 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 pb-2 border-b border-border/30"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Thought for {thinkingTime}s</span>
            </motion.div>
          )}

          {/* Message Content */}
          <div className="relative z-10">
            {isUser ? (
              <div className="text-primary-foreground">
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
                className="text-foreground"
              />
            )}
          </div>

          {/* Footer with actions for assistant */}
          {!isUser && content && !isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30 relative z-10"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </motion.button>
              <div className="flex-1" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  liked === true
                    ? "text-success bg-success/10"
                    : "text-muted-foreground hover:text-success hover:bg-success/10"
                )}
                onClick={() => setLiked(liked === true ? null : true)}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  liked === false
                    ? "text-destructive bg-destructive/10"
                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                )}
                onClick={() => setLiked(liked === false ? null : false)}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* Timestamp */}
        <div
          className={cn(
            "flex items-center gap-1.5 text-[11px] text-muted-foreground px-2",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          <Clock className="w-3 h-3" />
          <span>{formatTime(timestamp)}</span>
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <motion.div
          className="w-10 h-10 flex-shrink-0 mt-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        >
          <div className="w-full h-full bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
            <User className="w-5 h-5 text-accent-foreground" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MessageBubble;
