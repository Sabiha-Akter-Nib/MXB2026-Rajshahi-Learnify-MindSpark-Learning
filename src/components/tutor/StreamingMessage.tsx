import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StreamingMessageProps {
  content: string;
  isComplete: boolean;
  className?: string;
}

// Parse markdown-like content into styled components
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
        <motion.div
          key={lineIndex}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-start gap-3 mt-4 mb-2"
        >
          <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {trimmed.match(/\d+/)?.[0] || "•"}
          </div>
          <p className="font-semibold text-white pt-0.5">{trimmed.replace(/^(Step|ধাপ)\s*\d+[:\s]*/i, "")}</p>
        </motion.div>
      );
      return;
    }

    if (isHeading) {
      result.push(
        <motion.p
          key={lineIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-semibold text-white mt-4 mb-2 first:mt-0 text-[15px]"
        >
          {trimmed}
        </motion.p>
      );
      return;
    }

    if (isFormula) {
      result.push(
        <motion.div
          key={lineIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="my-3 px-4 py-3 bg-white/10 rounded-xl border border-white/20 font-mono text-sm overflow-x-auto backdrop-blur-sm"
        >
          <code className="text-white font-medium">{trimmed}</code>
        </motion.div>
      );
      return;
    }

    if (isBullet) {
      result.push(
        <motion.p
          key={lineIndex}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="pl-4 mb-1.5 text-white flex items-start gap-2"
        >
          <span className="text-white/70 mt-1.5 text-xs">●</span>
          <span>{trimmed.replace(/^[•\-]\s*/, "").replace(/^\d+[\.\)]\s*/, "")}</span>
        </motion.p>
      );
      return;
    }

    // Regular paragraph with word-by-word animation
    result.push(
      <motion.p
        key={lineIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.02 }}
        className="mb-2 leading-relaxed text-white"
      >
        {trimmed}
      </motion.p>
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
      
      {/* Blinking cursor when still streaming */}
      {!isComplete && content && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="inline-block w-2 h-4 bg-primary ml-1 rounded-sm align-middle"
        />
      )}
    </div>
  );
};

export default StreamingMessage;
