import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface StreamingMessageProps {
  content: string;
  isComplete: boolean;
  className?: string;
}

// Parse markdown-like content into styled components - static, no framer-motion
const parseContent = (content: string): React.ReactNode[] => {
  const lines = content.split("\n");
  const result: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      result.push(<div key={lineIndex} className="h-3" />);
      return;
    }

    // Heading patterns (without # or *)
    const isHeading = /^[A-Z][^.!?]*:$/.test(trimmed) ||
      /^(Step|Example|Note|Key|Important|Why|How|What|When|Where|Think|Remember|Summary|Practice|Question|ধাপ|উদাহরণ|গুরুত্বপূর্ণ|মনে|সারাংশ)/i.test(trimmed);

    // Code/formula detection
    const isFormula = /[=+\-*/÷×±√∫∑∏∆≠≤≥<>≈∞∂πθ]/.test(trimmed) && 
      (/\d/.test(trimmed) || /[a-z]\^/i.test(trimmed));

    // Bullet points
    const isBullet = /^[•\-]\s/.test(trimmed) || /^\d+[\.\)]\s/.test(trimmed);

    // Numbered step
    const isStep = /^(Step|ধাপ)\s*\d+/i.test(trimmed);

    if (isStep) {
      result.push(
        <div
          key={lineIndex}
          className="flex items-start gap-3 mt-4 mb-2 animate-fade-in"
        >
          <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {trimmed.match(/\d+/)?.[0] || "•"}
          </div>
          <p className="font-semibold text-white pt-0.5">{trimmed.replace(/^(Step|ধাপ)\s*\d+[:\s]*/i, "")}</p>
        </div>
      );
      return;
    }

    if (isHeading) {
      result.push(
        <p
          key={lineIndex}
          className="font-semibold text-white mt-4 mb-2 first:mt-0 text-[15px] animate-fade-in"
        >
          {trimmed}
        </p>
      );
      return;
    }

    if (isFormula) {
      result.push(
        <div
          key={lineIndex}
          className="my-3 px-4 py-3 bg-white/10 rounded-xl border border-white/20 font-mono text-sm overflow-x-auto backdrop-blur-sm animate-fade-in"
        >
          <code className="text-white font-medium">{trimmed}</code>
        </div>
      );
      return;
    }

    if (isBullet) {
      result.push(
        <p
          key={lineIndex}
          className="pl-4 mb-1.5 text-white flex items-start gap-2 animate-fade-in"
        >
          <span className="text-white/70 mt-1.5 text-xs">●</span>
          <span>{trimmed.replace(/^[•\-]\s*/, "").replace(/^\d+[\.\)]\s*/, "")}</span>
        </p>
      );
      return;
    }

    // Regular paragraph
    result.push(
      <p
        key={lineIndex}
        className="mb-2 leading-relaxed text-white animate-fade-in"
      >
        {trimmed}
      </p>
    );
  });

  return result;
};

const StreamingMessage = ({ content, isComplete, className }: StreamingMessageProps) => {
  const [displayContent, setDisplayContent] = useState(content);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
    setDisplayContent(content);
  }, [content]);

  return (
    <div className={cn("prose prose-sm max-w-none font-sans", className)}>
      {parseContent(displayContent)}
      
      {/* Blinking cursor when still streaming - simple CSS animation */}
      {!isComplete && content && (
        <span className="inline-block w-2 h-4 bg-primary ml-1 rounded-sm align-middle animate-pulse" />
      )}
    </div>
  );
};

export default StreamingMessage;
