import { cn } from "@/lib/utils";

interface StreamingMessageProps {
  content: string;
  isComplete: boolean;
  className?: string;
}

const StreamingMessage = ({ content, isComplete, className }: StreamingMessageProps) => {
  return (
    <div className={cn("relative max-w-none", className)}>
      {/*
        Fail-safe rendering:
        - Always visible text (no prose overrides)
        - Preserves newlines with whitespace-pre-wrap
        - Avoids per-line animated wrappers that can appear as flicker on some devices
      */}
      <div className="whitespace-pre-wrap break-words leading-relaxed">
        {content}
        {!isComplete && content ? (
          <span className="inline-block w-2 h-4 bg-primary ml-1 rounded-sm align-middle animate-pulse" />
        ) : null}
      </div>
    </div>
  );
};

export default StreamingMessage;
