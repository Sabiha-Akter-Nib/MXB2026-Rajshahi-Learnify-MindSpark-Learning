import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";
import tugiImg from "@/assets/tugi-mascot.png";

const Welcome = () => {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden px-4 py-8">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-primary-dark" />
      
      {/* Animated orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/20 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary-light/20 blur-3xl"
      />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Glass card */}
        <div
          className="rounded-3xl p-8 md:p-10 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(240,235,255,0.92) 50%, rgba(230,225,250,0.9) 100%)",
            boxShadow: "0 20px 60px rgba(100, 50, 180, 0.25), 0 0 0 1px rgba(180, 140, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          {/* Subtle purple border glow */}
          <div className="absolute inset-0 rounded-3xl border-2 border-primary-light/30 pointer-events-none" />
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center mb-5"
          >
            <img src={logoImg} alt="OddhaboshAI" className="h-20 md:h-24 object-contain" />
          </motion.div>

          {/* Tagline badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="inline-flex items-center px-5 py-2 rounded-full mb-6"
            style={{
              background: "linear-gradient(135deg, hsl(270 30% 94%) 0%, hsl(200 80% 92%) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            <span className="text-sm font-semibold tracking-wide text-primary uppercase">
              Your AI Study Companion
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <h1 className="font-heading font-bold text-xl md:text-2xl mb-3 uppercase tracking-wide"
              style={{
                background: "linear-gradient(135deg, hsl(270 60% 40%), hsl(300 50% 45%), hsl(270 55% 55%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Future Begins Here
            </h1>
            <p className="text-sm md:text-base leading-relaxed text-foreground/80 font-medium">
              স্বাগতম অধ্যবসায়-এ। এআই-এর সাহায্যে স্মার্ট শেখা, দ্রুত অগ্রগতি, আর অসাধারণ ফলাফল। আজ থেকেই শুরু হোক তোমার ভবিষ্যৎ গড়ার যাত্রা।
            </p>
          </motion.div>
        </div>

        {/* Buttons below card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 space-y-4"
        >
          <Link to="/login" className="block">
            <button
              className="w-full py-4 rounded-2xl text-lg font-bold tracking-wide text-primary-foreground transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, hsl(270 40% 55%) 0%, hsl(240 30% 50%) 100%)",
                boxShadow: "0 8px 24px rgba(100, 60, 160, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              লগ ইন
            </button>
          </Link>

          <Link to="/signup" className="block">
            <button
              className="w-full py-4 rounded-2xl text-lg font-bold tracking-wide text-primary-foreground transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, hsl(270 35% 60%) 0%, hsl(240 25% 55%) 100%)",
                boxShadow: "0 8px 24px rgba(100, 60, 160, 0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              সাইন আপ
            </button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Mascot at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mt-6 md:mt-8"
      >
        <motion.img
          src={tugiImg}
          alt="Tugi mascot"
          className="h-32 md:h-44 lg:h-52 object-contain drop-shadow-2xl"
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
};

export default Welcome;
