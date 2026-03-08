import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, ThumbsUp, ThumbsDown, Clock, Brain, Check, FileText } from "lucide-react";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      className={cn("flex gap-3 mb-6", isUser ? "justify-end" : "justify-start")}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-1">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#EFB995]/20 to-[#6A68DF]/20 flex items-center justify-center shadow-sm">
            <img src={mascotImg} alt="AI" className="w-8 h-8 object-contain" />
          </div>
        </div>
      )}

      {/* Message Container */}
      <div className={cn("max-w-[80%] space-y-1.5", isUser && "order-first")}>
        {/* Label & timestamp for AI */}
        {!isUser && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] text-muted-foreground">{formatTime(timestamp)}</span>
            <span className="text-xs font-semibold text-foreground/80 font-['Poppins',sans-serif]">OddhaboshAI</span>
          </div>
        )}

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((attachment, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border/40 shadow-sm">
                {attachment.type === "image" ? (
                  <img src={attachment.url} alt="Attachment" className="max-w-[200px] max-h-[150px] object-cover" />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted/50">
                    <FileText className="w-5 h-5 text-[#6A68DF]" />
                    <span className="text-sm font-medium truncate max-w-[150px]">{attachment.name || "Document"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-5 py-4 relative font-['Poppins',sans-serif]",
            isUser
              ? "bg-[#F0EFF5] text-[#2E2C2D] rounded-br-md"
              : "bg-card text-foreground rounded-bl-md border border-border/30 shadow-sm"
          )}
        >
          {/* Thinking time indicator */}
          {!isUser && thinkingTime && thinkingTime > 2 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 pb-2 border-b border-border/30">
              <Brain className="w-3.5 h-3.5 text-[#6A68DF]" />
              <span className="font-medium">Thought for {thinkingTime}s</span>
            </div>
          )}

          {/* Content */}
          {isUser ? (
            <div className="text-sm leading-relaxed">
              {content.split("\n").map((line, i) => (
                <p key={i} className="mb-1.5 last:mb-0">{line}</p>
              ))}
            </div>
          ) : (
            <StreamingMessage
              content={content}
              isComplete={!isStreaming}
              className="text-sm text-foreground"
            />
          )}

          {/* Actions for assistant */}
          {!isUser && content && !isStreaming && (
            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border/20">
              <button
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <div className="flex-1" />
              <button
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  liked === true ? "text-green-500 bg-green-50" : "text-muted-foreground hover:text-green-500 hover:bg-green-50"
                )}
                onClick={() => setLiked(liked === true ? null : true)}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  liked === false ? "text-red-500 bg-red-50" : "text-muted-foreground hover:text-red-500 hover:bg-red-50"
                )}
                onClick={() => setLiked(liked === false ? null : false)}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Timestamp for user */}
        {isUser && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground px-1 justify-end">
            <Clock className="w-3 h-3" />
            <span>{formatTime(timestamp)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
