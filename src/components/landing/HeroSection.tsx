import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Brain, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background with parallax */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"
      />
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 50, repeat: Infinity, ease: "linear" },
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 60, repeat: Infinity, ease: "linear" },
            scale: { duration: 10, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-accent/10 rounded-full blur-3xl"
        />
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-[15%] p-4 bg-card rounded-2xl shadow-lg"
        >
          <BookOpen className="w-8 h-8 text-primary" />
        </motion.div>
        <motion.div
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-[10%] p-4 bg-card rounded-2xl shadow-lg"
        >
          <Brain className="w-8 h-8 text-accent" />
        </motion.div>
        <motion.div
          animate={{ y: [-5, 15, -5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 left-[20%] p-3 bg-card rounded-xl shadow-lg"
        >
          <Star className="w-6 h-6 text-warning" />
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 container mx-auto px-4 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            AI-Powered Learning for Bangladesh
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading font-bold text-4xl md:text-6xl lg:text-7xl leading-tight mb-6"
        >
          Learn Smarter with{" "}
          <span className="gradient-text">Personalized</span>
          <br />
          AI Tutoring
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Experience adaptive learning aligned with the NCTB curriculum. 
          MindSpark creates personalized study plans, tracks your progress, 
          and helps you excel in every subject from Grades 1-10.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button variant="hero" size="xl" asChild>
            <Link to="/signup" className="group">
              Start Learning Free
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="outline" size="xl" asChild>
            <Link to="/demo">Watch Demo</Link>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          {[
            { value: "10K+", label: "Active Students" },
            { value: "15+", label: "Subjects" },
            { value: "98%", label: "Success Rate" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading font-bold text-3xl md:text-4xl text-primary">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
        >
          <motion.div className="w-1 h-2 bg-primary rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
