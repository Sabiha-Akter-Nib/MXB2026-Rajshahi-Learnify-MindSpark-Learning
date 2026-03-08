import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import mascotImg from "@/assets/ai-mascot-3d.png";

interface ThinkingIndicatorProps {
  startTime: number;
}

const ThinkingIndicator = ({ startTime }: ThinkingIndicatorProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 mb-6"
    >
      {/* Avatar */}
      <div className="w-9 h-9 flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-[#EFB995]/20 to-[#6A68DF]/20 flex items-center justify-center">
        <img src={mascotImg} alt="AI" className="w-8 h-8 object-contain" />
      </div>

      {/* Thinking bubble */}
      <div className="bg-card border border-border/30 rounded-2xl rounded-bl-md px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 bg-[#6A68DF]/50 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
            <span className="w-2 h-2 bg-[#6A68DF]/50 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
            <span className="w-2 h-2 bg-[#6A68DF]/50 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
          </div>
          {elapsed >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground border-l border-border/40 pl-3"
            >
              <Sparkles className="w-3 h-3 text-[#6A68DF]" />
              <span>Thinking for {elapsed}s...</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ThinkingIndicator;
