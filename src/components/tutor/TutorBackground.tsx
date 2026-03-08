import { motion } from "framer-motion";

const TutorBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Base: soft warm-cool gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, 
            hsl(240, 30%, 97%) 0%,
            hsl(280, 20%, 97%) 30%,
            hsl(320, 15%, 97%) 50%,
            hsl(30, 30%, 97%) 70%,
            hsl(250, 25%, 97%) 100%
          )`,
        }}
      />

      {/* Animated purple orb top-left */}
      <motion.div
        animate={{
          x: [0, 20, -10, 0],
          y: [0, -15, 10, 0],
          scale: [1, 1.05, 0.97, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 800,
          height: 800,
          left: "-25%",
          top: "-20%",
          background: `radial-gradient(circle, hsla(250, 65%, 68%, 0.09) 0%, hsla(280, 50%, 70%, 0.04) 40%, transparent 70%)`,
          filter: "blur(80px)",
        }}
      />

      {/* Animated magenta-pink orb center-right */}
      <motion.div
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 20, -10, 0],
          scale: [1, 0.95, 1.06, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600,
          height: 600,
          right: "-12%",
          top: "25%",
          background: `radial-gradient(circle, hsla(310, 65%, 72%, 0.08) 0%, hsla(340, 50%, 75%, 0.03) 45%, transparent 70%)`,
          filter: "blur(70px)",
        }}
      />

      {/* Animated peach orb bottom-left */}
      <motion.div
        animate={{
          x: [0, 15, -20, 0],
          y: [0, -10, 15, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 700,
          height: 700,
          left: "5%",
          bottom: "-15%",
          background: `radial-gradient(circle, hsla(25, 80%, 78%, 0.08) 0%, hsla(35, 60%, 80%, 0.03) 45%, transparent 70%)`,
          filter: "blur(80px)",
        }}
      />

      {/* Small accent orb — lavender bottom-right */}
      <motion.div
        animate={{
          x: [0, -12, 8, 0],
          y: [0, 8, -12, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 400,
          height: 400,
          right: "5%",
          bottom: "10%",
          background: `radial-gradient(circle, hsla(260, 50%, 75%, 0.06) 0%, transparent 65%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(250, 50%, 60%) 0.8px, transparent 0.8px)`,
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
};

export default TutorBackground;
