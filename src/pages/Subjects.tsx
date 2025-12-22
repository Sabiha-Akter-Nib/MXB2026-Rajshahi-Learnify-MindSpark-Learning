import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  Beaker,
  Globe,
  Languages,
  Monitor,
  FlaskConical,
  Dna,
  ChevronRight,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
  name_bn: string | null;
  icon: string;
  color: string;
  total_chapters: number;
  min_class: number;
  max_class: number;
}

interface SubjectProgress {
  subject_id: string;
  chapters_completed: number;
  current_chapter: number;
  xp_earned: number;
  last_studied_at: string | null;
}

interface Profile {
  class: number;
  version: string;
}

const iconMap: Record<string, React.ElementType> = {
  book: BookOpen,
  calculator: Calculator,
  flask: Beaker,
  globe: Globe,
  languages: Languages,
  monitor: Monitor,
  beaker: FlaskConical,
  dna: Dna,
};

const colorMap: Record<string, string> = {
  primary: "from-primary to-primary-dark",
  accent: "from-accent to-warning",
  success: "from-success to-emerald-600",
  destructive: "from-destructive to-red-700",
  blue: "from-blue-500 to-blue-700",
  purple: "from-purple-500 to-purple-700",
  teal: "from-teal-500 to-teal-700",
  orange: "from-orange-500 to-orange-700",
};

const Subjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState<Record<string, SubjectProgress>>({});
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("class, version")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);

          // Fetch subjects for student's class
          const { data: subjectsData } = await supabase
            .from("subjects")
            .select("*")
            .lte("min_class", profileData.class)
            .gte("max_class", profileData.class)
            .order("name");

          if (subjectsData) {
            setSubjects(subjectsData);
          }

          // Fetch progress
          const { data: progressData } = await supabase
            .from("student_progress")
            .select("*")
            .eq("user_id", user.id);

          if (progressData) {
            const progressMap: Record<string, SubjectProgress> = {};
            progressData.forEach((p) => {
              progressMap[p.subject_id] = p;
            });
            setProgress(progressMap);
          }
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isBangla = profile?.version === "bangla";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border z-30 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-heading font-semibold text-lg">
              {isBangla ? "বিষয়সমূহ" : "My Subjects"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Class {profile?.class} • {subjects.length} subjects
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Total Subjects</p>
            <p className="text-2xl font-heading font-bold">{subjects.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-heading font-bold text-primary">
              {Object.keys(progress).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Chapters Done</p>
            <p className="text-2xl font-heading font-bold text-success">
              {Object.values(progress).reduce((acc, p) => acc + p.chapters_completed, 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Total XP</p>
            <p className="text-2xl font-heading font-bold text-accent">
              {Object.values(progress).reduce((acc, p) => acc + p.xp_earned, 0)}
            </p>
          </div>
        </motion.div>

        {/* Subject Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, index) => {
            const Icon = iconMap[subject.icon] || BookOpen;
            const gradientClass = colorMap[subject.color] || colorMap.primary;
            const subjectProgress = progress[subject.id];
            const progressPercent = subjectProgress
              ? (subjectProgress.chapters_completed / subject.total_chapters) * 100
              : 0;

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/tutor?subject=${encodeURIComponent(subject.name)}`}
                  className="block group"
                >
                  <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                          gradientClass
                        )}
                      >
                        <Icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>

                    <h3 className="font-heading font-semibold text-lg mb-1">
                      {isBangla && subject.name_bn ? subject.name_bn : subject.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {subject.total_chapters} chapters
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {subjectProgress?.chapters_completed || 0}/{subject.total_chapters}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>

                    {subjectProgress && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                        <TrendingUp className="w-4 h-4 text-success" />
                        <span className="text-sm font-medium text-success">
                          {subjectProgress.xp_earned} XP earned
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {subjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-lg mb-2">
              No subjects found
            </h3>
            <p className="text-muted-foreground">
              Subjects for your class will appear here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Subjects;
