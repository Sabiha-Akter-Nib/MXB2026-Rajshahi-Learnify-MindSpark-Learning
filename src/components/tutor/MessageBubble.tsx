import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, ThumbsUp, ThumbsDown, Clock, Brain, Check, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import StreamingMessage from "./StreamingMessage";
import mascotImg from "@/assets/ai-mascot-3d.png";

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
    toast({ title: "Copied!", description: "Message copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === "user";

  // ── USER BUBBLE ──
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: index * 0.02, duration: 0.35, ease: "easeOut" }}
        className="flex justify-end mb-5"
      >
        <div className="max-w-[80%] space-y-1">
          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 justify-end">
              {attachments.map((attachment, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border/30 shadow-sm">
                  {attachment.type === "image" ? (
                    <img src={attachment.url} alt="Attachment" className="max-w-[200px] max-h-[150px] object-cover" />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-muted/40">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium truncate max-w-[150px]">{attachment.name || "Document"}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* User bubble */}
          <div className="rounded-2xl rounded-br-md px-5 py-4 bg-primary/8 text-foreground border border-primary/10 font-heading">
            <div className="text-sm leading-relaxed">
              {content.split("\n").map((line, i) => (
                <p key={i} className="mb-1.5 last:mb-0">{line}</p>
              ))}
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 px-1 justify-end">
            <Clock className="w-3 h-3" />
            <span>{formatTime(timestamp)}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── AI MESSAGE (no bubble) ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.02, duration: 0.35, ease: "easeOut" }}
      className="flex gap-3 mb-5"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shadow-md"
          style={{
            background: `linear-gradient(135deg, hsla(270, 50%, 85%, 0.4) 0%, hsla(320, 40%, 85%, 0.3) 50%, hsla(30, 60%, 88%, 0.3) 100%)`,
          }}
        >
          <img src={mascotImg} alt="AI" className="w-8 h-8 object-contain" />
        </motion.div>
      </div>

      {/* Content area — no bubble */}
      <div className="flex-1 min-w-0">
        {/* Name + time header */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] text-muted-foreground/60">{formatTime(timestamp)}</span>
          <span className="text-xs font-bold text-foreground/70 font-heading">OddhaboshAI</span>
        </div>

        {/* Thinking time */}
        {thinkingTime && thinkingTime > 2 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium font-heading">Thought for {thinkingTime}s</span>
            <Sparkles className="w-3 h-3 text-primary/50" />
          </div>
        )}

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((attachment, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border/30 shadow-sm">
                {attachment.type === "image" ? (
                  <img src={attachment.url} alt="Attachment" className="max-w-[200px] max-h-[150px] object-cover" />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted/40">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium truncate max-w-[150px]">{attachment.name || "Document"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message text — plain, no bubble */}
        <div className="font-heading">
          <StreamingMessage
            content={content}
            isComplete={!isStreaming}
            className="text-sm text-foreground"
          />
        </div>

        {/* Actions */}
        {content && !isStreaming && (
          <div className="flex items-center gap-1 mt-2.5">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[hsl(145,63%,42%)]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <div className="flex-1" />
            <button
              className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                liked === true ? "text-[hsl(145,63%,42%)] bg-[hsl(145,63%,42%)]/10" : "text-muted-foreground hover:text-[hsl(145,63%,42%)] hover:bg-[hsl(145,63%,42%)]/8"
              )}
              onClick={() => setLiked(liked === true ? null : true)}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                liked === false ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/8"
              )}
              onClick={() => setLiked(liked === false ? null : false)}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
