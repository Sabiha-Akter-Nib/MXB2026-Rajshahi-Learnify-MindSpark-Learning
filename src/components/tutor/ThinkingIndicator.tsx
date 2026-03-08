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
      className="flex gap-3 mb-5"
    >
      {/* Avatar */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-9 h-9 flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center shadow-md"
        style={{
          background: `linear-gradient(135deg, hsla(270, 50%, 85%, 0.4) 0%, hsla(320, 40%, 85%, 0.3) 50%, hsla(30, 60%, 88%, 0.3) 100%)`,
        }}
      >
        <img src={mascotImg} alt="AI" className="w-8 h-8 object-contain" />
      </motion.div>

      {/* Thinking bubble */}
      <div className="bg-card border border-border/25 rounded-2xl rounded-bl-md px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-primary/40"
                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              />
            ))}
          </div>
          {elapsed >= 2 && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground border-l border-border/30 pl-3"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="font-heading font-medium">Thinking for {elapsed}s...</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ThinkingIndicator;
