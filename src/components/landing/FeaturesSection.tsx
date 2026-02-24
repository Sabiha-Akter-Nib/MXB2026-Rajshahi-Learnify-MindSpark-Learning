import { useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  Brain, 
  BarChart3, 
  BookOpen, 
  Mic, 
  Image, 
  Wifi, 
  Globe2, 
  Sparkles 
} from "lucide-react";
import { ScrollAnimatedBackground } from "./ScrollAnimatedBackground";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Tutor",
    description: "Get personalized explanations using Bloom's Taxonomy approach for deep understanding.",
    color: "primary",
    glowColor: "shadow-neon",
    animation: "tilt-left",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Monitor your learning journey with detailed analytics and performance insights.",
    color: "accent",
    glowColor: "shadow-neon-accent",
    animation: "drift-right",
  },
  {
    icon: BookOpen,
    title: "NCTB Curriculum",
    description: "Complete alignment with Bangladesh's national curriculum from Grades 1-10.",
    color: "success",
    glowColor: "shadow-glow",
    animation: "tilt-right",
  },
  {
    icon: Mic,
    title: "Voice Learning",
    description: "Ask questions and get explanations through voice interaction in Bangla or English.",
    color: "warning",
    glowColor: "shadow-accent",
    animation: "drift-left",
  },
  {
    icon: Image,
    title: "Image Recognition",
    description: "Upload homework photos or textbook pages for instant AI-powered help.",
    color: "primary",
    glowColor: "shadow-neon",
    animation: "tilt-left",
  },
  {
    icon: Wifi,
    title: "Works Offline",
    description: "Continue learning even without internet. Your progress syncs when you're back online.",
    color: "accent",
    glowColor: "shadow-neon-accent",
    animation: "drift-right",
  },
  {
    icon: Globe2,
    title: "Bilingual Support",
    description: "Switch seamlessly between Bangla and English interfaces and content.",
    color: "success",
    glowColor: "shadow-glow",
    animation: "tilt-right",
  },
  {
    icon: Sparkles,
    title: "Adaptive Practice",
    description: "Questions that adapt to your level—challenging enough to grow, never overwhelming.",
    color: "warning",
    glowColor: "shadow-accent",
    animation: "drift-left",
  },
  {
    icon: Brain,
    title: "Future You Snapshot™",
    description: "See where your learning is heading with AI-powered mastery projections and confidence forecasts.",
    color: "primary",
    glowColor: "shadow-neon",
    animation: "tilt-left",
  },
  {
    icon: BarChart3,
    title: "Blind Spot Mirror™",
    description: "Uncover hidden weaknesses before exams—topics that look strong but haven't been stress-tested.",
    color: "accent",
    glowColor: "shadow-neon-accent",
    animation: "drift-right",
  },
  {
    icon: Globe2,
    title: "Knowledge Autopsy™",
    description: "Trace exactly where understanding faded with timeline-based learning breakdown analysis.",
    color: "success",
    glowColor: "shadow-glow",
    animation: "tilt-right",
  },
  {
    icon: Sparkles,
    title: "Weekly Achievements",
    description: "Earn XP through weekly challenges that reset every Sunday—fresh goals, fresh motivation.",
    color: "warning",
    glowColor: "shadow-accent",
    animation: "drift-left",
  },
];

// Subtle Rotate Card Component
function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Reduced rotation values for subtle effect (was 15, now 4)
  const springConfig = { stiffness: 400, damping: 30 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), springConfig);
  // Subtle horizontal movement
  const translateX = useSpring(useTransform(x, [-0.5, 0.5], [-3, 3]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const IconComponent = feature.icon;
  
  const colorClasses = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20 hover:border-primary/40",
      glow: "group-hover:shadow-neon",
      gradient: "from-primary/20 to-primary-light/5",
    },
    accent: {
      bg: "bg-accent/10",
      text: "text-accent",
      border: "border-accent/20 hover:border-accent/40",
      glow: "group-hover:shadow-neon-accent",
      gradient: "from-accent/20 to-accent-light/5",
    },
    success: {
      bg: "bg-success/10",
      text: "text-success",
      border: "border-success/20 hover:border-success/40",
      glow: "group-hover:shadow-glow",
      gradient: "from-success/20 to-primary-light/5",
    },
    warning: {
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning/20 hover:border-warning/40",
      glow: "group-hover:shadow-accent",
      gradient: "from-warning/20 to-accent-light/5",
    },
  };

  const colors = colorClasses[feature.color as keyof typeof colorClasses];

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        x: translateX,
        transformStyle: "preserve-3d",
      }}
      className={`group relative cursor-pointer`}
    >
      {/* Glow effect on hover */}
      <motion.div
        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
        transition={{ duration: 0.3 }}
        className={`absolute inset-0 rounded-3xl bg-gradient-radial ${colors.gradient} blur-2xl -z-10`}
      />
      
      <div className={`relative glass-card p-8 rounded-3xl border ${colors.border} ${colors.glow} transition-all duration-500 overflow-hidden h-full`}>
        {/* Animated background gradient */}
        <motion.div
          animate={{ 
            rotate: isHovered ? 180 : 0,
            scale: isHovered ? 1.5 : 1,
          }}
          transition={{ duration: 0.8 }}
          className={`absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-conic ${colors.gradient} opacity-20 blur-3xl`}
        />
        
        {/* Content */}
        <div className="relative z-10" style={{ transform: "translateZ(40px)" }}>
          {/* Icon */}
          <motion.div
            animate={{ 
              scale: isHovered ? 1.1 : 1,
              rotate: isHovered ? [0, -5, 5, 0] : 0,
            }}
            transition={{ 
              scale: { duration: 0.3 },
              rotate: { duration: 0.5 },
            }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors.bg} ${colors.text} backdrop-blur-sm`}
          >
            <IconComponent className="w-7 h-7" />
          </motion.div>

          {/* Title */}
          <h3 className="font-heading font-semibold text-xl mb-3 text-foreground">
            {feature.title}
          </h3>
          
          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">
            {feature.description}
          </p>
        </div>

        {/* Hover line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute bottom-0 left-0 right-0 h-1 ${colors.bg} origin-left`}
        />
      </div>
    </motion.div>
  );
}

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-32 relative overflow-hidden">
      {/* Scroll-animated background */}
      <ScrollAnimatedBackground variant="features" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 glass-card text-accent font-medium text-sm mb-6"
          >
            <Sparkles className="w-4 h-4 animate-pulse-soft" />
            Features
            <Sparkles className="w-4 h-4 animate-pulse-soft" />
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-heading font-bold text-4xl md:text-6xl lg:text-7xl mb-6"
          >
            Everything You Need to{" "}
            <span className="shimmer-text">Excel</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            OddhaboshAI combines cutting-edge AI with proven educational methods 
            to create the ultimate learning experience.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
