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
  Loader2,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Award,
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

interface SubjectStats {
  assessments_completed: number;
  practice_sessions: number;
  plan_tasks_completed: number;
  total_xp: number;
  mastery_score: number;
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
  "book-text": BookOpen,
  "flask-conical": FlaskConical,
  atom: Beaker,
  leaf: Dna,
  laptop: Monitor,
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
  warning: "from-warning to-orange-600",
};

const Subjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState<Record<string, SubjectProgress>>({});
  const [subjectStats, setSubjectStats] = useState<Record<string, SubjectStats>>({});
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

            // Fetch stats for each subject
            const statsMap: Record<string, SubjectStats> = {};
            
            for (const subject of subjectsData) {
              // Fetch assessments for this subject
              const { data: assessmentsData } = await supabase
                .from("assessments")
                .select("xp_earned")
                .eq("user_id", user.id)
                .eq("subject_id", subject.id);

              // Fetch study sessions for this subject
              const { data: sessionsData } = await supabase
                .from("study_sessions")
                .select("xp_earned")
                .eq("user_id", user.id)
                .eq("subject_id", subject.id);

              // Fetch completed learning plan tasks for this subject
              const { data: planTasksData } = await supabase
                .from("learning_plan_tasks")
                .select("id, plan_id, is_completed")
                .eq("subject_id", subject.id)
                .eq("is_completed", true);

              // Filter plan tasks by user (need to check plan ownership)
              const { data: userPlans } = await supabase
                .from("learning_plans")
                .select("id")
                .eq("user_id", user.id);

              const userPlanIds = new Set(userPlans?.map(p => p.id) || []);
              const userPlanTasks = planTasksData?.filter(t => userPlanIds.has(t.plan_id)) || [];

              // Fetch topic mastery for this subject
              const { data: masteryData } = await supabase
                .from("topic_mastery")
                .select("mastery_score")
                .eq("user_id", user.id)
                .eq("subject_id", subject.id);

              const assessmentsXP = assessmentsData?.reduce((sum, a) => sum + (a.xp_earned || 0), 0) || 0;
              const sessionsXP = sessionsData?.reduce((sum, s) => sum + (s.xp_earned || 0), 0) || 0;
              const avgMastery = masteryData && masteryData.length > 0
                ? Math.round(masteryData.reduce((sum, m) => sum + m.mastery_score, 0) / masteryData.length)
                : 0;

              statsMap[subject.id] = {
                assessments_completed: assessmentsData?.length || 0,
                practice_sessions: sessionsData?.length || 0,
                plan_tasks_completed: userPlanTasks.length,
                total_xp: assessmentsXP + sessionsXP,
                mastery_score: avgMastery,
              };
            }

            setSubjectStats(statsMap);
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

  // Calculate overall stats
  const totalAssessments = Object.values(subjectStats).reduce((sum, s) => sum + s.assessments_completed, 0);
  const totalPracticeSessions = Object.values(subjectStats).reduce((sum, s) => sum + s.practice_sessions, 0);
  const totalPlanTasks = Object.values(subjectStats).reduce((sum, s) => sum + s.plan_tasks_completed, 0);
  const totalXP = Object.values(subjectStats).reduce((sum, s) => sum + s.total_xp, 0);

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
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <p className="text-sm text-muted-foreground">Assessments</p>
            </div>
            <p className="text-2xl font-heading font-bold">{totalAssessments}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <p className="text-sm text-muted-foreground">Practice</p>
            </div>
            <p className="text-2xl font-heading font-bold text-primary">
              {totalPracticeSessions}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-warning" />
              <p className="text-sm text-muted-foreground">Plan Tasks</p>
            </div>
            <p className="text-2xl font-heading font-bold text-warning">
              {totalPlanTasks}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-accent" />
              <p className="text-sm text-muted-foreground">Total XP</p>
            </div>
            <p className="text-2xl font-heading font-bold text-accent">
              {totalXP.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Subject Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, index) => {
            const Icon = iconMap[subject.icon] || BookOpen;
            const gradientClass = colorMap[subject.color] || colorMap.primary;
            const subjectProgress = progress[subject.id];
            const stats = subjectStats[subject.id] || {
              assessments_completed: 0,
              practice_sessions: 0,
              plan_tasks_completed: 0,
              total_xp: 0,
              mastery_score: 0,
            };
            
            // Calculate progress based on activity
            const activityScore = Math.min(
              (stats.assessments_completed * 10) + 
              (stats.practice_sessions * 5) + 
              (stats.plan_tasks_completed * 15),
              100
            );

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                        gradientClass
                      )}
                    >
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    {stats.mastery_score > 0 && (
                      <div className="bg-success/10 text-success text-xs font-medium px-2 py-1 rounded-full">
                        {stats.mastery_score}% Mastery
                      </div>
                    )}
                  </div>

                  <h3 className="font-heading font-semibold text-lg mb-1">
                    {isBangla && subject.name_bn ? subject.name_bn : subject.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {subject.total_chapters} chapters
                  </p>

                  {/* Activity Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-success">{stats.assessments_completed}</p>
                      <p className="text-xs text-muted-foreground">Quiz</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-primary">{stats.practice_sessions}</p>
                      <p className="text-xs text-muted-foreground">Practice</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-warning">{stats.plan_tasks_completed}</p>
                      <p className="text-xs text-muted-foreground">Plans</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Activity Progress</span>
                      <span className="font-medium">{activityScore}%</span>
                    </div>
                    <Progress value={activityScore} className="h-2" />
                  </div>

                  {stats.total_xp > 0 && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">
                        {stats.total_xp.toLocaleString()} XP earned
                      </span>
                    </div>
                  )}
                </div>
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