import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";

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
      {/* Avatar - static, no animation */}
      <div className="w-10 h-10 flex-shrink-0">
        <div className="w-full h-full bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>

      {/* Thinking bubble */}
      <div className="bg-card/60 backdrop-blur-xl border border-white/20 rounded-3xl rounded-bl-lg px-5 py-4 shadow-xl relative overflow-hidden">
        {/* Glass decorations - static */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-accent/10 to-transparent rounded-full blur-xl" />

        <div className="relative z-10 flex items-center gap-3">
          {/* Simple CSS-only dots animation */}
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
            <span className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
            <span className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
          </div>

          {/* Elapsed time */}
          {elapsed >= 2 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground border-l border-border/50 pl-3 ml-1"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Thinking for {elapsed}s...</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ThinkingIndicator;
