import { motion } from "framer-motion";
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

const subjects = [
  { icon: BookText, name: "Bangla 1st Paper", color: "bg-primary" },
  { icon: BookText, name: "Bangla 2nd Paper", color: "bg-primary-light" },
  { icon: Languages, name: "English 1st Paper", color: "bg-accent" },
  { icon: Languages, name: "English 2nd Paper", color: "bg-accent-light" },
  { icon: Calculator, name: "Mathematics", color: "bg-warning" },
  { icon: Atom, name: "General Science", color: "bg-success" },
  { icon: Atom, name: "Physics", color: "bg-primary" },
  { icon: FlaskConical, name: "Chemistry", color: "bg-accent" },
  { icon: Leaf, name: "Biology", color: "bg-success" },
  { icon: Calculator, name: "Higher Mathematics", color: "bg-warning" },
  { icon: Laptop, name: "ICT", color: "bg-primary" },
  { icon: Globe, name: "Bangladesh & Global Studies", color: "bg-accent" },
];

export function SubjectsSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-4">
            <BookText className="w-4 h-4" />
            Subjects
          </span>
          <h2 className="font-heading font-bold text-3xl md:text-5xl mb-4">
            Complete NCTB Coverage
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All academic subjects from Grades 1-10, aligned with the National Curriculum 
            and Textbook Board of Bangladesh.
          </p>
        </motion.div>

        {/* Subjects Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {subjects.map((subject, index) => {
            const IconComponent = subject.icon;
            return (
              <motion.div
                key={subject.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group bg-card rounded-xl p-4 border border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className={`w-10 h-10 ${subject.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="font-medium text-sm text-foreground leading-tight">
                  {subject.name}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Note about grades */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground text-sm mt-8"
        >
          Subject availability varies by grade level. Physics, Chemistry, Biology, and Higher Mathematics 
          are available for higher grades.
        </motion.p>
      </div>
    </section>
  );
}
