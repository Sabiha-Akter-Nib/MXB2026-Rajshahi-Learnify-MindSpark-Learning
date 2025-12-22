import { useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  Calculator, 
  BookText, 
  Atom, 
  FlaskConical, 
  Leaf, 
  Globe, 
  Laptop,
  Languages
} from "lucide-react";
import { ScrollAnimatedBackground } from "./ScrollAnimatedBackground";

const subjects = [
  { icon: BookText, name: "Bangla 1st Paper", color: "primary", delay: 0 },
  { icon: BookText, name: "Bangla 2nd Paper", color: "primary-light", delay: 0.05 },
  { icon: Languages, name: "English 1st Paper", color: "accent", delay: 0.1 },
  { icon: Languages, name: "English 2nd Paper", color: "accent-light", delay: 0.15 },
  { icon: Calculator, name: "Mathematics", color: "warning", delay: 0.2 },
  { icon: Atom, name: "General Science", color: "success", delay: 0.25 },
  { icon: Atom, name: "Physics", color: "primary", delay: 0.3 },
  { icon: FlaskConical, name: "Chemistry", color: "accent", delay: 0.35 },
  { icon: Leaf, name: "Biology", color: "success", delay: 0.4 },
  { icon: Calculator, name: "Higher Mathematics", color: "warning", delay: 0.45 },
  { icon: Laptop, name: "ICT", color: "primary", delay: 0.5 },
  { icon: Globe, name: "Bangladesh & Global Studies", color: "accent", delay: 0.55 },
];

// Magnetic subject card
function SubjectCard({ subject, index }: { subject: typeof subjects[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { stiffness: 400, damping: 25 };
  const moveX = useSpring(x, springConfig);
  const moveY = useSpring(y, springConfig);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), springConfig);

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

  const IconComponent = subject.icon;
  
  const colorMap: Record<string, { bg: string; text: string; glow: string; gradient: string }> = {
    "primary": { 
      bg: "bg-primary", 
      text: "text-primary-foreground",
      glow: "shadow-neon",
      gradient: "from-primary to-primary-light",
    },
    "primary-light": { 
      bg: "bg-primary-light", 
      text: "text-primary-foreground",
      glow: "shadow-glow",
      gradient: "from-primary-light to-primary",
    },
    "accent": { 
      bg: "bg-accent", 
      text: "text-accent-foreground",
      glow: "shadow-neon-accent",
      gradient: "from-accent to-accent-light",
    },
    "accent-light": { 
      bg: "bg-accent-light", 
      text: "text-accent-foreground",
      glow: "shadow-accent",
      gradient: "from-accent-light to-accent",
    },
    "warning": { 
      bg: "bg-warning", 
      text: "text-warning-foreground",
      glow: "shadow-accent-lg",
      gradient: "from-warning to-accent",
    },
    "success": { 
      bg: "bg-success", 
      text: "text-success-foreground",
      glow: "shadow-glow-lg",
      gradient: "from-success to-primary-light",
    },
  };

  const colors = colorMap[subject.color] || colorMap["primary"];

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ 
        duration: 0.5, 
        delay: subject.delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        x: moveX,
        y: moveY,
        transformStyle: "preserve-3d",
      }}
      className="relative cursor-pointer"
    >
      {/* Glow effect */}
      <motion.div
        animate={{ 
          opacity: isHovered ? 0.6 : 0,
          scale: isHovered ? 1.2 : 1,
        }}
        transition={{ duration: 0.3 }}
        className={`absolute inset-0 bg-gradient-radial ${colors.gradient} rounded-2xl blur-xl -z-10`}
      />

      <motion.div 
        animate={{ 
          scale: isHovered ? 1.02 : 1,
          y: isHovered ? -4 : 0,
        }}
        transition={{ duration: 0.2 }}
        className={`glass-card p-5 rounded-2xl border border-white/20 ${isHovered ? colors.glow : ''} transition-shadow duration-300`}
      >
        {/* Icon container */}
        <motion.div 
          animate={{ 
            rotate: isHovered ? [0, -8, 8, 0] : 0,
            scale: isHovered ? 1.15 : 1,
          }}
          transition={{ duration: 0.4 }}
          className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}
          style={{ transform: "translateZ(30px)" }}
        >
          <IconComponent className={`w-6 h-6 ${colors.text}`} />
        </motion.div>
        
        {/* Subject name */}
        <p 
          className="font-medium text-sm text-foreground leading-tight"
          style={{ transform: "translateZ(20px)" }}
        >
          {subject.name}
        </p>

        {/* Hover indicator */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: isHovered ? "100%" : 0 }}
          transition={{ duration: 0.3 }}
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${colors.gradient} rounded-b-2xl`}
        />
      </motion.div>
    </motion.div>
  );
}

export function SubjectsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-32 relative overflow-hidden bg-background">
      {/* Scroll-animated background */}
      <ScrollAnimatedBackground variant="subjects" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 glass-card text-primary font-medium text-sm mb-6"
          >
            <BookText className="w-4 h-4 animate-bounce-subtle" />
            Subjects
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-heading font-bold text-4xl md:text-6xl mb-6"
          >
            Complete{" "}
            <span className="gradient-text">NCTB</span>{" "}
            Coverage
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            All academic subjects from Grades 1-10, aligned with the National Curriculum 
            and Textbook Board of Bangladesh.
          </motion.p>
        </motion.div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {subjects.map((subject, index) => (
            <SubjectCard key={subject.name} subject={subject} index={index} />
          ))}
        </div>

        {/* Note about grades */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center text-muted-foreground text-sm mt-12 glass-card inline-block mx-auto px-6 py-3 rounded-full"
        >
          Subject availability varies by grade level. Physics, Chemistry, Biology, and Higher Mathematics 
          are available for higher grades.
        </motion.p>
      </div>
    </section>
  );
}
