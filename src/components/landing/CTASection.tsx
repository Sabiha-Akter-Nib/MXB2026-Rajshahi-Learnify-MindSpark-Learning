import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary" />
      
      {/* Animated shapes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-0 left-0 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl"
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">
              Start Today - It's Free
            </span>
          </div>

          <h2 className="font-heading font-bold text-3xl md:text-5xl text-primary-foreground mb-6">
            Ready to Transform Your Learning Journey?
          </h2>

          <p className="text-lg text-primary-foreground/80 mb-10">
            Join thousands of students across Bangladesh who are already 
            learning smarter with MindSpark's AI-powered tutoring.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="hero" 
              size="xl" 
              asChild
              className="bg-accent text-accent-foreground hover:bg-accent-light"
            >
              <Link to="/signup" className="group">
                Create Free Account
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button 
              variant="glass" 
              size="xl" 
              asChild
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/demo">Try Demo First</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex items-center justify-center gap-8 text-primary-foreground/60 text-sm">
            <span>✓ No credit card required</span>
            <span>✓ Works on any device</span>
            <span>✓ Bangla & English</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
