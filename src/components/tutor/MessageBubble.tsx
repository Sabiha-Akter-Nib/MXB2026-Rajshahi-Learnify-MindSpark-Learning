import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, ThumbsUp, ThumbsDown, Clock, Brain, Check, FileText, Sparkles, Pencil } from "lucide-react";
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
  isLastUserMessage?: boolean;
  onEdit?: (content: string) => void;
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const AttachmentList = ({ attachments }: { attachments: MessageBubbleProps["attachments"] }) => {
  if (!attachments || attachments.length === 0) return null;
  return (
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
  );
};

const UserBubble = ({ content, timestamp, attachments, isLastUserMessage, onEdit, index = 0 }: Omit<MessageBubbleProps, "id" | "role">) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ delay: index * 0.02, duration: 0.35, ease: "easeOut" }}
    className="flex justify-end mb-5 group"
  >
    <div className="max-w-[80%] space-y-1">
      <AttachmentList attachments={attachments} />
      {/* User bubble — magenta/pink/purple gradient */}
      <div
        className="rounded-2xl rounded-br-md px-5 py-4 font-heading"
        style={{
          background: "linear-gradient(135deg, hsla(300, 40%, 96%, 1) 0%, hsla(330, 35%, 96%, 1) 50%, hsla(270, 30%, 96%, 1) 100%)",
          border: "1px solid hsla(300, 30%, 88%, 0.6)",
          boxShadow: "0 2px 12px hsla(300, 40%, 60%, 0.08)",
        }}
      >
        <div className="text-sm leading-relaxed text-foreground">
          {content.split("\n").map((line, i) => (
            <p key={i} className="mb-1.5 last:mb-0">{line}</p>
          ))}
        </div>
      </div>
      {/* Timestamp + edit */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 px-1 justify-end">
        {isLastUserMessage && onEdit && (
          <button
            onClick={() => onEdit(content)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/8 transition-all opacity-0 group-hover:opacity-100"
          >
            <Pencil className="w-3 h-3" />
            <span className="text-[10px] font-medium">Edit</span>
          </button>
        )}
        <Clock className="w-3 h-3" />
        <span>{formatTime(timestamp)}</span>
      </div>
    </div>
  </motion.div>
);

const AIBubble = ({ content, timestamp, isStreaming = false, thinkingTime, attachments, index = 0 }: Omit<MessageBubbleProps, "id" | "role" | "isLastUserMessage" | "onEdit">) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: "Copied!", description: "Message copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

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

      <div className="flex-1 min-w-0 max-w-[85%]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-bold text-foreground/70 font-heading">OddhaboshAI</span>
          <span className="text-[10px] text-muted-foreground/60">{formatTime(timestamp)}</span>
        </div>

        {thinkingTime && thinkingTime > 2 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium font-heading">Thought for {thinkingTime}s</span>
            <Sparkles className="w-3 h-3 text-primary/50" />
          </div>
        )}

        <AttachmentList attachments={attachments} />

        {/* AI bubble — subtle gradient */}
        <div
          className="rounded-2xl rounded-bl-md px-5 py-4 shadow-sm font-heading"
          style={{
            background: "linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(270 20% 98%) 50%, hsl(200 30% 97%) 100%)",
            border: "1px solid hsl(270 20% 92%)",
          }}
        >
          <StreamingMessage
            content={content}
            isComplete={!isStreaming}
            className="text-sm text-foreground leading-relaxed"
          />
        </div>

        {/* Actions */}
        {content && !isStreaming && (
          <div className="flex items-center gap-1 mt-2.5">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <div className="flex-1" />
            <button
              className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                liked === true ? "text-success bg-success/10" : "text-muted-foreground hover:text-success hover:bg-success/8"
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

const MessageBubble = (props: MessageBubbleProps) => {
  if (props.role === "user") {
    return <UserBubble {...props} />;
  }
  return <AIBubble {...props} />;
};

export default MessageBubble;
