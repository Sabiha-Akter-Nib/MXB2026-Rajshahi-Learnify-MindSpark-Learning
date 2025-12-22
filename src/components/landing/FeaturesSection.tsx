import { motion } from "framer-motion";
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

const features = [
  {
    icon: Brain,
    title: "AI-Powered Tutor",
    description: "Get personalized explanations using Bloom's Taxonomy approach for deep understanding.",
    color: "primary",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Monitor your learning journey with detailed analytics and performance insights.",
    color: "accent",
  },
  {
    icon: BookOpen,
    title: "NCTB Curriculum",
    description: "Complete alignment with Bangladesh's national curriculum from Grades 1-10.",
    color: "success",
  },
  {
    icon: Mic,
    title: "Voice Learning",
    description: "Ask questions and get explanations through voice interaction in Bangla or English.",
    color: "warning",
  },
  {
    icon: Image,
    title: "Image Recognition",
    description: "Upload homework photos or textbook pages for instant AI-powered help.",
    color: "primary",
  },
  {
    icon: Wifi,
    title: "Works Offline",
    description: "Continue learning even without internet. Your progress syncs when you're back online.",
    color: "accent",
  },
  {
    icon: Globe2,
    title: "Bilingual Support",
    description: "Switch seamlessly between Bangla and English interfaces and content.",
    color: "success",
  },
  {
    icon: Sparkles,
    title: "Adaptive Practice",
    description: "Questions that adapt to your level—challenging enough to grow, never overwhelming.",
    color: "warning",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function FeaturesSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent font-medium text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Features
          </span>
          <h2 className="font-heading font-bold text-3xl md:text-5xl mb-4">
            Everything You Need to Excel
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            MindSpark combines cutting-edge AI with proven educational methods 
            to create the ultimate learning experience.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative bg-card rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-border/50 card-hover"
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                    feature.color === "primary"
                      ? "bg-primary/10 text-primary"
                      : feature.color === "accent"
                      ? "bg-accent/10 text-accent"
                      : feature.color === "success"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  <IconComponent className="w-6 h-6" />
                </div>

                {/* Content */}
                <h3 className="font-heading font-semibold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover accent */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity ${
                    feature.color === "primary"
                      ? "bg-primary"
                      : feature.color === "accent"
                      ? "bg-accent"
                      : feature.color === "success"
                      ? "bg-success"
                      : "bg-warning"
                  }`}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
